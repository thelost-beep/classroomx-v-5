import { useState } from 'react'
import { format } from 'date-fns'
import { Check, CheckCheck, Reply, Clock, X } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { MessageInfo } from './MessageInfo'
import { useNavigate } from 'react-router-dom'
import './MessageItem.css'

interface MessageItemProps {
    message: any
    isOwn: boolean
    showAvatar: boolean
    showSenderName: boolean
    onReaction?: (emoji: string) => void
    onReply?: () => void
}

export function MessageItem({ message, isOwn, showAvatar, showSenderName, onReaction, onReply }: MessageItemProps) {
    const navigate = useNavigate()
    const [showInfo, setShowInfo] = useState(false)
    const [showActions, setShowActions] = useState(false)

    // Parse real status from message data
    const isRead = message.read_at != null
    const isDelivered = message.delivered_at != null || true // fallback: if sent, it's delivered

    const handleDoubleTap = () => {
        if (onReaction) onReaction('❤️')
    }

    const handleTickClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        setShowInfo(true)
    }

    const handleSharedContentClick = () => {
        if (message.type === 'post' && message.extra_data?.post_id) {
            navigate(`/post/${message.extra_data.post_id}`)
        } else if (message.type === 'profile' && message.extra_data?.user_id) {
            navigate(`/profile/${message.extra_data.user_id}`)
        }
    }

    if (message.type === 'system') {
        return (
            <div className="message-system">
                <span className="system-text">{message.content}</span>
            </div>
        )
    }

    const isPending = message.status === 'pending'
    const isError = message.status === 'error'

    return (
        <div
            className={`message-item ${isOwn ? 'own' : 'other'} ${showAvatar ? 'has-avatar' : ''} ${isPending ? 'pending' : ''} ${isError ? 'error' : ''}`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {!isOwn && showAvatar && (
                <div className="message-avatar">
                    {message.profiles?.avatar_url ? (
                        <img src={message.profiles.avatar_url} alt={message.profiles.name} />
                    ) : (
                        <div className="avatar-fallback">{message.profiles?.name?.[0]}</div>
                    )}
                </div>
            )}

            <div className="message-content-wrapper">
                {!isOwn && showSenderName && (
                    <span className="sender-name">{message.profiles?.name || 'Unknown'}</span>
                )}

                <div
                    className="message-bubble"
                    onDoubleClick={handleDoubleTap}
                >
                    {/* Reply reference */}
                    {message.reply_to_id && message.reply_content && (
                        <div className="reply-reference">
                            <span className="reply-ref-text">{message.reply_content}</span>
                        </div>
                    )}

                    {/* Media content */}
                    {message.type === 'image' && message.media_url ? (
                        <div className="message-media-container">
                            <img src={message.media_url} alt="Shared content" className="message-image" />
                            {message.content && <p className="message-caption">{message.content}</p>}
                        </div>
                    ) : message.type === 'post' ? (
                        <div
                            className="shared-content-preview post-preview clickable"
                            onClick={handleSharedContentClick}
                        >
                            {message.extra_data?.thumbnail && <img src={message.extra_data.thumbnail} alt="" />}
                            <div className="preview-meta">
                                <span className="preview-label">Shared Post</span>
                                <p className="preview-title">{message.content || 'View Post'}</p>
                            </div>
                        </div>
                    ) : message.type === 'profile' ? (
                        <div
                            className="shared-content-preview profile-preview clickable"
                            onClick={handleSharedContentClick}
                        >
                            <Avatar src={message.extra_data?.avatar} fallback={message.content} size="sm" />
                            <div className="preview-meta">
                                <span className="preview-label">Shared Profile</span>
                                <p className="preview-title">{message.content || 'View Profile'}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="message-text">{message.content}</p>
                    )}

                    <div className="message-meta">
                        <span className="message-time">
                            {format(new Date(message.created_at), 'HH:mm')}
                        </span>
                        {isOwn && (
                            <div className="message-status-wrapper">
                                {isPending ? (
                                    <Clock size={12} className="status-pending-icon" />
                                ) : isError ? (
                                    <X size={12} className="status-error-icon" />
                                ) : (
                                    <span
                                        className={`message-status ${isRead ? 'status-read' : isDelivered ? 'status-delivered' : 'status-sent'}`}
                                        onClick={handleTickClick}
                                        title="Click for message info"
                                    >
                                        {isRead ? (
                                            <CheckCheck size={14} className="tick-read" />
                                        ) : isDelivered ? (
                                            <CheckCheck size={14} className="tick-delivered" />
                                        ) : (
                                            <Check size={14} className="tick-sent" />
                                        )}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Reactions Layer */}
                    {message.message_reactions && message.message_reactions.length > 0 && (
                        <div className="reactions-container">
                            {message.message_reactions.map((r: any, i: number) => (
                                <span key={i} className="reaction-emoji">{r.emoji}</span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Hover Actions */}
                {showActions && !isPending && !isError && (
                    <div className={`message-hover-actions ${isOwn ? 'own' : 'other'}`}>
                        {onReply && (
                            <button className="hover-action-btn" onClick={onReply} title="Reply">
                                <Reply size={14} />
                            </button>
                        )}
                        <div className="reaction-picker-mini">
                            {['❤️', '😂', '🔥', '😮', '😢', '👍'].map(emoji => (
                                <button
                                    key={emoji}
                                    className="emoji-btn"
                                    onClick={() => onReaction?.(emoji)}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {showInfo && <MessageInfo message={message} onClose={() => setShowInfo(false)} />}
            </div>
        </div>
    )
}
