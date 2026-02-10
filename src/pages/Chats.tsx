import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getChats, getClassChat } from '@/lib/api/chat'
import { supabase } from '@/lib/supabase'
import { Avatar, Skeleton } from '@/components/ui'
import './Chats.css'

interface Chat {
    id: string
    type: string
    name: string | null
    created_at: string
    last_message_at: string
    last_message_preview: string | null
    last_read_at?: string
    members?: any[]
}

export function Chats() {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const [chats, setChats] = useState<Chat[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!profile) return

        fetchChats()

        // Real-time inbox updates
        const channel = supabase
            .channel('inbox_updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'chats'
            }, () => {
                fetchChats()
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages'
            }, () => {
                fetchChats()
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'chat_members',
                filter: `user_id=eq.${profile.id}`
            }, () => {
                fetchChats()
            })
            .subscribe()

        return () => {
            if (channel) {
                supabase.removeChannel(channel).catch(() => { })
            }
        }
    }, [profile?.id])

    const fetchChats = async () => {
        if (!profile) return

        try {
            const data = await getChats(profile.id)
            // Ensure class chat exists (can be handled on backend ideally, but keeping parity)
            const classChat = await getClassChat()

            // Merge and de-duplicate if class chat is already in data
            const allChats = data.some(c => c.id === classChat?.id)
                ? data
                : (classChat ? [classChat, ...data] : data)

            setChats(allChats)
        } catch (error) {
            console.error('Error fetching chats:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatChatTime = (dateStr: string) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))

        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        if (days === 1) return 'Yesterday'
        if (days < 7) return date.toLocaleDateString([], { weekday: 'short' })
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }

    const getIdentity = (chat: any) => {
        if (chat.type === 'class') return { name: 'Class 10', avatar: null }
        if (chat.type === 'dm') {
            const otherMember = chat.members?.find((m: any) => m.user_id !== profile?.id)
            const p = otherMember?.profiles
            return {
                name: otherMember?.nickname || p?.name || 'Student',
                avatar: p?.avatar_url
            }
        }
        return { name: chat.name || 'Group Chat', avatar: chat.avatar_url }
    }

    return (
        <div className="chats-page">
            <div className="chats-header">
                <h1>Chats</h1>
                <button className="new-chat-btn" aria-label="New chat" onClick={() => navigate('/create-chat')}>
                    <Plus size={20} />
                </button>
            </div>

            <div className="chats-content">
                {loading ? (
                    <div className="chats-loading-grid">
                        <Skeleton className="chat-skeleton" />
                        <Skeleton className="chat-skeleton" />
                        <Skeleton className="chat-skeleton" />
                    </div>
                ) : chats.length === 0 ? (
                    <div className="empty-state">
                        <p>No chats yet. Start a conversation!</p>
                    </div>
                ) : (
                    <div className="chats-list">
                        {chats.map((chat) => {
                            const identity = getIdentity(chat)
                            const isUnread = chat.last_message_at && (!chat.last_read_at || new Date(chat.last_message_at) > new Date(chat.last_read_at))

                            return (
                                <div
                                    key={chat.id}
                                    className={`chat-item ${isUnread ? 'unread' : ''}`}
                                    onClick={() => navigate(`/chats/${chat.id}`)}
                                >
                                    <div className="chat-avatar-wrapper">
                                        <Avatar
                                            src={identity.avatar}
                                            fallback={identity.name}
                                            size="lg"
                                            className="chat-avatar"
                                        />
                                        {isUnread && <div className="unread-dot"></div>}
                                    </div>
                                    <div className="chat-item-content">
                                        <div className="chat-item-top">
                                            <h3 className="chat-name">{identity.name}</h3>
                                            <span className="chat-time">{formatChatTime(chat.last_message_at)}</span>
                                        </div>
                                        <div className="chat-item-bottom">
                                            <p className="chat-preview">
                                                {chat.last_message_preview || 'Tap to open chat'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
