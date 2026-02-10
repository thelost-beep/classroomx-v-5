import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { uploadChatMedia, markMessagesRead } from '../lib/api/chat'
import { useAuth } from '../contexts/AuthContext'

export function useMessages(chatId: string | null) {
    const { profile } = useAuth()
    const [messages, setMessages] = useState<any[]>([])
    const [chat, setChat] = useState<any>(null)
    const [identity, setIdentity] = useState<{
        name: string;
        avatar: string | null;
        id: string | null;
        type: 'dm' | 'group' | 'class';
        isResolved: boolean;
    }>({
        name: 'Chat Room',
        avatar: null,
        id: null,
        type: 'dm',
        isResolved: false
    })
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [typingUsers, setTypingUsers] = useState<string[]>([])

    const channelRef = useRef<any>(null)
    const typingTimeoutRef = useRef<any>(null)

    // Identity Resolution - HIGH PRIORITY
    useEffect(() => {
        if (!chatId || !profile) return

        const resolveIdentity = async () => {
            try {
                // 1. Get Basic Chat Info
                const { data: chatData, error: chatError } = await supabase
                    .from('chats')
                    .select('*')
                    .eq('id', chatId)
                    .single()

                if (chatError || !chatData) throw chatError
                setChat(chatData)

                if (chatData.type === 'dm') {
                    // DM IDENTITY PATH - Find the other person
                    const { data: memberData } = await supabase
                        .from('chat_members')
                        .select('user_id, nickname')
                        .eq('chat_id', chatId)
                        .neq('user_id', profile.id)
                        .maybeSingle()

                    if (memberData) {
                        // Resolve Profile Data directly for maximum reliability
                        const { data: profileData } = await supabase
                            .from('profiles')
                            .select('name, avatar_url')
                            .eq('id', memberData.user_id)
                            .maybeSingle()

                        setIdentity({
                            name: memberData.nickname || profileData?.name || 'Friend',
                            avatar: profileData?.avatar_url || null,
                            id: memberData.user_id,
                            type: 'dm',
                            isResolved: true
                        })
                    } else {
                        setIdentity(prev => ({ ...prev, name: 'Direct Message', isResolved: true }))
                    }
                } else {
                    // GROUP/CLASS IDENTITY PATH
                    setIdentity({
                        name: chatData.name || (chatData.type === 'class' ? 'Class 10' : 'Group Chat'),
                        avatar: chatData.avatar_url || null,
                        id: chatId,
                        type: chatData.type,
                        isResolved: true
                    })
                }
            } catch (err) {
                console.error('Identity Resolution Failed:', err)
                setIdentity(prev => ({ ...prev, name: 'Conversation', isResolved: true }))
            }
        }

        resolveIdentity()
        if (profile) markAsRead(profile.id)
    }, [chatId, profile?.id])

    // Messages & Real-time Flow
    useEffect(() => {
        if (!chatId) return

        fetchMessages()

        const dbChannel = supabase
            .channel(`chat:${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${chatId}`
                },
                (payload) => {
                    handleMessageChange(payload)
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'message_reactions'
                },
                () => {
                    fetchMessages()
                }
            )
            .subscribe()

        const presenceChannel = supabase.channel(`presence:${chatId}`)
        let isSubscribed = true

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                if (!isSubscribed) return
                const state = presenceChannel.presenceState()
                const onlineUsers = Object.values(state).flat().map((p: any) => p.user_id)
                const othersOnline = onlineUsers.filter(id => id !== profile?.id)
                setTypingUsers(othersOnline)
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED' && profile && isSubscribed) {
                    await presenceChannel.track({ user_id: profile.id, name: profile.name })
                }
            })

        channelRef.current = presenceChannel

        return () => {
            isSubscribed = false
            if (dbChannel) {
                supabase.removeChannel(dbChannel).catch(() => { })
            }
            if (presenceChannel) {
                supabase.removeChannel(presenceChannel).catch(() => { })
            }
        }
    }, [chatId, profile?.id])

    const fetchMessages = async () => {
        if (!chatId) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    profiles:sender_id (id, name, avatar_url),
                    message_reactions (id, emoji, user_id)
                `)
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true })

            if (error) throw error
            setMessages(data || [])
        } catch (error) {
            console.error('Messages Fetch Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleMessageChange = async (payload: any) => {
        if (payload.eventType === 'INSERT') {
            const newMessage = payload.new

            setMessages(prev => {
                // 1. Check if this is a message WE sent (optimistic)
                const isSentByMe = newMessage.sender_id === profile?.id
                if (isSentByMe) {
                    // Try to find the optimistic message
                    // We match by content and proximity in time, or custom client_id if we added it
                    // For now, content + sender_id + status==='sending'
                    const optimisticIndex = prev.findIndex(m =>
                        m.status === 'sending' &&
                        m.content === newMessage.content &&
                        m.sender_id === newMessage.sender_id
                    )

                    if (optimisticIndex > -1) {
                        const updatedMessages = [...prev]
                        // Transition the optimistic message to authoritative
                        updatedMessages[optimisticIndex] = {
                            ...updatedMessages[optimisticIndex],
                            ...newMessage,
                            status: 'sent' // Confirmed by server
                        }
                        return updatedMessages
                    }
                }

                // 2. If it's from someone else or we couldn't match, we MUST fetch profile data
                // We can't do async inside setState, so we'll return prev and handle fetch outside
                // OR better: we handle the fetch BEFORE calling setMessages for foreign messages
                return prev // Placeholder, we handle below
            })

            // IF it's not our message, fetch the full details (profiles) and THEN add it
            if (newMessage.sender_id !== profile?.id) {
                const { data: fullMessage } = await supabase
                    .from('messages')
                    .select(`
                        *,
                        profiles:sender_id (id, name, avatar_url),
                        message_reactions (id, emoji, user_id)
                    `)
                    .eq('id', newMessage.id)
                    .single()

                if (fullMessage) {
                    setMessages(prev => {
                        // Avoid duplicates
                        if (prev.some(m => m.id === fullMessage.id)) return prev
                        return [...prev, fullMessage]
                    })
                    markAsRead(newMessage.sender_id)
                }
            } else {
                // It IS our message, we already handled optimistic update above.
                // But if optimistic update failed (e.g. different window), we might want to append.
                // For now, let's rely on the optimistic check above or a full refresh.
                // Actually, if we didn't match optimistic, we should append it (with our own profile)
                setMessages(prev => {
                    if (prev.some(m => m.id === newMessage.id || (m.extra_data?.client_id && m.extra_data.client_id === newMessage.extra_data?.client_id))) return prev

                    // If we are the sender, we already have our profile
                    return [...prev, { ...newMessage, profiles: profile, status: 'sent' }]
                })
            }
        } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(msg =>
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            ))
        }
    }

    const sendMessage = async (senderId: string, content: string, extra?: any) => {
        if (!chatId || !content.trim()) return false

        const clientId = `client-${Date.now()}`
        const optimisticMessage: any = {
            id: clientId, // Temporary ID
            chat_id: chatId,
            sender_id: senderId,
            content: content.trim(),
            created_at: new Date().toISOString(),
            status: 'sending',
            profiles: profile,
            message_reactions: [],
            reply_to_id: extra?.parentId || null,
            type: 'text'
        }

        // 1. UI First: Show immediately
        setMessages(prev => [...prev, optimisticMessage])
        setSending(true)

        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    chat_id: chatId,
                    sender_id: senderId,
                    content: content.trim(),
                    reply_to_id: extra?.parentId || null,
                    type: 'text',
                    extra_data: { client_id: clientId } // Track for reconciliation
                })
            // .select() // Removed .select()
            // .single() // Removed .single()

            if (error) throw error

            // Note: handleMessageChange will catch the INSERT and update the UI.
            // We don't manually replace here to avoid race conditions.
            return true
        } catch (error) {
            console.error('Error sending message:', error)
            // Update local message to error state
            setMessages(prev => prev.map(m =>
                m.id === clientId ? { ...m, status: 'error' } : m
            ))
            return false
        } finally {
            setSending(false)
        }
    }

    const sendMediaMessage = async (senderId: string, file: File, caption?: string) => {
        if (!chatId) return false

        const clientId = `client-${Date.now()}`
        const previewUrl = URL.createObjectURL(file) // local preview

        const optimisticMessage: any = {
            id: clientId,
            chat_id: chatId,
            sender_id: senderId,
            content: caption || null,
            media_url: previewUrl,
            created_at: new Date().toISOString(),
            status: 'sending',
            profiles: profile,
            message_reactions: [],
            type: 'image'
        }

        setMessages(prev => [...prev, optimisticMessage])
        setSending(true)

        try {
            const publicUrl = await uploadChatMedia(file)
            const { error } = await supabase
                .from('messages')
                .insert({
                    chat_id: chatId,
                    sender_id: senderId,
                    content: caption || null,
                    media_url: publicUrl,
                    type: 'image',
                    extra_data: { client_id: clientId }
                })
            if (error) throw error
            return true
        } catch (error) {
            console.error('Error sending media message:', error)
            setMessages(prev => prev.map(m =>
                m.id === clientId ? { ...m, status: 'error' } : m
            ))
            return false
        } finally {
            setSending(false)
            URL.revokeObjectURL(previewUrl)
        }
    }

    const markAsRead = async (userId: string) => {
        if (!chatId) return
        try {
            await markMessagesRead(chatId, userId)
        } catch (error) {
            console.error('Error marking messages as read:', error)
        }
    }

    const addReaction = async (messageId: string, emoji: string, userId: string) => {
        // Optimistic Update
        const tempReaction = { id: `temp-react-${Date.now()}`, emoji, user_id: userId, message_id: messageId }

        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                return {
                    ...msg,
                    message_reactions: [...(msg.message_reactions || []), tempReaction]
                }
            }
            return msg
        }))

        try {
            const { error } = await supabase
                .from('message_reactions')
                .insert({ message_id: messageId, user_id: userId, emoji })

            if (error) throw error
        } catch (error) {
            console.error('Error adding reaction:', error)
            // Rollback optimistic reaction
            setMessages(prev => prev.map(msg => {
                if (msg.id === messageId) {
                    return {
                        ...msg,
                        message_reactions: (msg.message_reactions || []).filter((r: any) => r.id !== tempReaction.id)
                    }
                }
                return msg
            }))
        }
    }

    const setTyping = async (isTyping: boolean) => {
        if (!channelRef.current || !chatId || !profile) return
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

        if (isTyping) {
            await channelRef.current.track({ user_id: profile.id, name: profile.name })
            typingTimeoutRef.current = setTimeout(() => {
                channelRef.current.untrack()
            }, 3000)
        } else {
            channelRef.current.untrack()
        }
    }

    return {
        messages,
        chat,
        identity,
        loading,
        sending,
        sendMessage,
        sendMediaMessage,
        markAsRead,
        addReaction,
        typingUsers,
        setTyping,
        refreshMessages: fetchMessages
    }
}
