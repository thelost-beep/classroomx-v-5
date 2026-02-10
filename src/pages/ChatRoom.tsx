import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, X, Info, Paperclip, Plus, Image as ImageIcon, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useMessages } from '@/hooks/useMessages'
import { Avatar } from '@/components/ui'
import { MessageItem } from '@/components/chat/MessageItem'
import { ChatInfo } from '@/components/chat/ChatInfo'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'
import './ChatRoom.css'

export function ChatRoom() {
    const { chatId } = useParams()
    const { profile } = useAuth()
    const navigate = useNavigate()

    // One Authoritative Source of Truth
    const {
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
        setTyping
    } = useMessages(chatId || null)

    const [messageText, setMessageText] = useState('')
    const [replyTo, setReplyTo] = useState<any>(null)
    const [mentionSearch, setMentionSearch] = useState('')
    const [showMentions, setShowMentions] = useState(false)
    const [members, setMembers] = useState<any[]>([])
    const [showInfo, setShowInfo] = useState(false)
    const [mediaPreview, setMediaPreview] = useState<{ file: File; url: string } | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const actionMenuRef = useRef<HTMLDivElement>(null)
    const [showActions, setShowActions] = useState(false)

    // Online status using the ONE authoritative identity ID
    const isOnline = identity.id ? typingUsers.includes(identity.id) : false

    useEffect(() => {
        scrollToBottom()
        if (chatId) fetchMembers()
    }, [messages, chatId])

    // Mark messages as read when chat opens
    useEffect(() => {
        if (chatId && profile) {
            markAsRead(profile.id)
        }
    }, [chatId, profile?.id, messages.length])

    const fetchMembers = async () => {
        if (!chatId) return
        const { data } = await supabase
            .from('chat_members')
            .select(`
                *,
                profiles:user_id (id, name, avatar_url)
            `)
            .eq('chat_id', chatId)

        if (data) setMembers(data)
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const val = e.target.value
        setMessageText(val)

        const mentionMatch = val.match(/@(\w*)$/)
        if (mentionMatch) {
            setMentionSearch(mentionMatch[1])
            setShowMentions(true)
        } else {
            setShowMentions(false)
        }
    }

    const insertMention = (name: string) => {
        const newVal = messageText.replace(/@(\w*)$/, `@${name} `)
        setMessageText(newVal)
        setShowMentions(false)
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile || (!messageText.trim() && !mediaPreview)) return

        try {
            if (mediaPreview) {
                const success = await sendMediaMessage(profile.id, mediaPreview.file, messageText)
                if (success) {
                    setMessageText('')
                    setMediaPreview(null)
                    setReplyTo(null)
                }
            } else {
                const success = await sendMessage(profile.id, messageText, {
                    parentId: replyTo?.id
                })
                if (success) {
                    setMessageText('')
                    setReplyTo(null)
                }
            }
        } catch (error) {
            console.error('ChatRoom HandleSend Error:', error)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            toast.error('Only images and videos are supported')
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be under 10MB')
            return
        }

        const previewUrl = URL.createObjectURL(file)
        setMediaPreview({ file, url: previewUrl })
    }

    const cancelMediaPreview = () => {
        if (mediaPreview) {
            URL.revokeObjectURL(mediaPreview.url)
            setMediaPreview(null)
        }
    }

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [messageText])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
                setShowActions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="chat-room-container">
            <div className="chat-room">
                <div className="chat-room-header">
                    <button onClick={() => navigate('/chats')} className="back-btn">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="header-info" onClick={() => setShowInfo(!showInfo)}>
                        <Avatar src={identity.avatar} fallback={identity.name} size="sm" />
                        <div className="header-text">
                            <h2>{identity.name}</h2>
                            {identity.type !== 'class' && (
                                <span className={`online-status ${isOnline ? 'active' : ''}`}>
                                    {isOnline ? 'Online' : 'Offline'}
                                </span>
                            )}
                        </div>
                    </div>
                    <button className="chat-info-btn" onClick={() => setShowInfo(!showInfo)} title="Chat Info">
                        <Info size={22} />
                    </button>
                </div>

                <div className="chat-room-messages">
                    {loading ? (
                        <div className="chat-loading">Loading messages...</div>
                    ) : messages.length === 0 ? (
                        <div className="chat-empty">No messages yet. Start the conversation!</div>
                    ) : (
                        messages.map((message) => (
                            <MessageItem
                                key={message.id}
                                message={message}
                                isOwn={message.sender_id === profile?.id}
                                showAvatar={chat?.type !== 'dm'}
                                showSenderName={chat?.type !== 'dm'}
                                onReaction={(emoji) => profile?.id && addReaction(message.id, emoji, profile.id)}
                                onReply={() => setReplyTo(message)}
                            />
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {showMentions && (
                    <div className="mentions-dropdown">
                        {members
                            .filter(m => m.profiles?.name?.toLowerCase().includes(mentionSearch.toLowerCase()))
                            .slice(0, 5)
                            .map(member => (
                                <div
                                    key={member.user_id}
                                    className="mention-item"
                                    onClick={() => insertMention(member.profiles?.name)}
                                >
                                    <Avatar src={member.profiles?.avatar_url} fallback={member.profiles?.name} size="sm" />
                                    <span>{member.profiles?.name}</span>
                                </div>
                            ))
                        }
                    </div>
                )}

                {replyTo && (
                    <div className="active-reply-bar">
                        <div className="reply-info">
                            <span className="reply-label">Replying to {replyTo.profiles?.name}</span>
                            <p className="reply-excerpt">{replyTo.content}</p>
                        </div>
                        <button onClick={() => setReplyTo(null)} className="cancel-reply">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {mediaPreview && (
                    <div className="media-preview-bar">
                        <div className="media-preview-content">
                            <img src={mediaPreview.url} alt="Preview" className="media-preview-img" />
                            <span className="media-preview-name">{mediaPreview.file.name}</span>
                        </div>
                        <button onClick={cancelMediaPreview} className="media-preview-cancel">
                            <X size={18} />
                        </button>
                    </div>
                )}

                {typingUsers.length > 0 && chat?.type !== 'dm' && (
                    <div className="typing-banner">
                        <div className="typing-dots">
                            <span></span><span></span><span></span>
                        </div>
                        Someone is typing...
                    </div>
                )}

                <div className="chat-room-input-container">
                    <form onSubmit={handleSend} className="chat-room-input">
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />

                        <div className="action-hub-wrapper" ref={actionMenuRef}>
                            <button
                                type="button"
                                className={`action-hub-btn ${showActions ? 'active' : ''}`}
                                onClick={() => setShowActions(!showActions)}
                            >
                                <Plus size={24} />
                            </button>

                            {showActions && (
                                <div className="action-menu-dropdown">
                                    <button type="button" onClick={() => { fileInputRef.current?.click(); setShowActions(false); }}>
                                        <ImageIcon size={18} />
                                        <span>Photos & Videos</span>
                                    </button>
                                    <button type="button" onClick={() => { setShowActions(false); }}>
                                        <Paperclip size={18} />
                                        <span>Share Post</span>
                                    </button>
                                    <button type="button" onClick={() => { setShowActions(false); }}>
                                        <User size={18} />
                                        <span>Share Profile</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <textarea
                            ref={textareaRef}
                            value={messageText}
                            onChange={(e) => {
                                handleInputChange(e)
                                setTyping(e.target.value.length > 0)
                            }}
                            onBlur={() => setTyping(false)}
                            placeholder={mediaPreview ? "Add a caption..." : "Type a message..."}
                            className="message-textarea"
                            disabled={sending}
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend(e as any)
                                }
                            }}
                        />

                        <button
                            type="submit"
                            className="send-btn"
                            disabled={(!messageText.trim() && !mediaPreview) || sending}
                            aria-label="Send message"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>

            {showInfo && chat && (
                <ChatInfo
                    chat={chat}
                    members={members}
                    onClose={() => setShowInfo(false)}
                    onUpdate={() => fetchMembers()}
                />
            )}
        </div>
    )
}
