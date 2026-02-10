import { useState, useEffect } from 'react'
import { X, Check, CheckCheck } from 'lucide-react'
import { format } from 'date-fns'
import { getMessageStatusDetails } from '@/lib/api/chat'
import { Avatar } from '@/components/ui'
import './MessageInfo.css'

interface MessageInfoProps {
    message: any
    onClose: () => void
}

export function MessageInfo({ message, onClose }: MessageInfoProps) {
    const [statusDetails, setStatusDetails] = useState<any[]>([])

    useEffect(() => {
        fetchStatusDetails()
    }, [message.id])

    const fetchStatusDetails = async () => {
        try {
            const data = await getMessageStatusDetails(message.id)
            setStatusDetails(data)
        } catch (error) {
            console.error('Error fetching message status:', error)
        }
    }

    return (
        <div className="message-info-overlay" onClick={onClose}>
            <div className="message-info-card" onClick={(e) => e.stopPropagation()}>
                <div className="message-info-header">
                    <h3>Message Info</h3>
                    <button onClick={onClose} className="info-close-btn"><X size={20} /></button>
                </div>

                <div className="message-preview">
                    {message.type === 'image' && message.media_url ? (
                        <img src={message.media_url} alt="" className="info-preview-img" />
                    ) : (
                        <p>{message.content}</p>
                    )}
                    <span className="timestamp">{format(new Date(message.created_at), 'h:mm a')}</span>
                </div>

                <div className="read-receipts-list">
                    {/* Read Section */}
                    <div className="receipt-section">
                        <div className="receipt-section-header">
                            <CheckCheck size={16} className="tick-read" />
                            <span>Read</span>
                        </div>
                        {message.read_at ? (
                            <div className="receipt-item">
                                <span className="receipt-time">{format(new Date(message.read_at), 'MMM d, h:mm a')}</span>
                            </div>
                        ) : statusDetails.filter(s => s.read_at).length > 0 ? (
                            statusDetails.filter(s => s.read_at).map((status: any) => (
                                <div key={status.id} className="receipt-item">
                                    <Avatar
                                        src={status.profiles?.avatar_url}
                                        fallback={status.profiles?.name}
                                        size="sm"
                                    />
                                    <div className="receipt-details">
                                        <span className="receipt-name">{status.profiles?.name}</span>
                                        <span className="receipt-time">{format(new Date(status.read_at), 'MMM d, h:mm a')}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <span className="receipt-empty">Not yet read</span>
                        )}
                    </div>

                    {/* Delivered Section */}
                    <div className="receipt-section">
                        <div className="receipt-section-header">
                            <CheckCheck size={16} className="tick-delivered" />
                            <span>Delivered</span>
                        </div>
                        <div className="receipt-item">
                            <span className="receipt-time">
                                {message.delivered_at
                                    ? format(new Date(message.delivered_at), 'MMM d, h:mm a')
                                    : format(new Date(message.created_at), 'MMM d, h:mm a')
                                }
                            </span>
                        </div>
                        {statusDetails.filter(s => s.delivered_at && !s.read_at).map((status: any) => (
                            <div key={status.id} className="receipt-item">
                                <Avatar
                                    src={status.profiles?.avatar_url}
                                    fallback={status.profiles?.name}
                                    size="sm"
                                />
                                <div className="receipt-details">
                                    <span className="receipt-name">{status.profiles?.name}</span>
                                    <span className="receipt-time">{format(new Date(status.delivered_at), 'MMM d, h:mm a')}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Sent Section */}
                    <div className="receipt-section">
                        <div className="receipt-section-header">
                            <Check size={16} className="tick-sent" />
                            <span>Sent</span>
                        </div>
                        <div className="receipt-item">
                            <span className="receipt-time">{format(new Date(message.created_at), 'MMM d, h:mm a')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
