import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellOff, ArrowLeft, MessageSquare, AtSign, Share2, Info, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Skeleton } from '@/components/ui'
import { formatDistanceToNow } from 'date-fns'
import './Notifications.css'

interface Notification {
    id: string
    type: string
    title: string
    message: string
    related_id: string | null
    is_read: boolean
    created_at: string
    priority: 'high' | 'medium' | 'low'
    action_url: string | null
}

export function Notifications() {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!profile) return
        fetchNotifications()

        const channel = supabase
            .channel(`notifications:${profile.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${profile.id}`
            }, (payload) => {
                setNotifications(prev => [payload.new as Notification, ...prev])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [profile?.id])

    const fetchNotifications = async () => {
        if (!profile) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setNotifications(data || [])
        } catch (err) {
            console.error('Error fetching notifications:', err)
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (id: string) => {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id)

            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            ))
        } catch (err) {
            console.error('Error marking notification as read:', err)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'mention': return <AtSign size={18} className="icon-mention" />
            case 'comment': return <MessageSquare size={18} className="icon-comment" />
            case 'collaboration_invite': return <Share2 size={18} className="icon-collab" />
            case 'broadcast': return <Bell size={18} className="icon-broadcast" />
            case 'chat_message': return <MessageSquare size={18} className="icon-comment" />
            default: return <Info size={18} />
        }
    }

    const handleNotificationClick = (n: Notification) => {
        if (!n.is_read) markAsRead(n.id)
        if (n.action_url) {
            navigate(n.action_url)
        }
    }

    return (
        <div className="notifications-page">
            <header className="notifications-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h1>Notifications</h1>
            </header>

            <div className="notifications-content">
                {loading ? (
                    <div className="notifications-loading">
                        <Skeleton className="notif-skeleton" />
                        <Skeleton className="notif-skeleton" />
                        <Skeleton className="notif-skeleton" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="empty-notifications">
                        <div className="empty-icon-wrapper">
                            <BellOff size={48} />
                        </div>
                        <h3>No notifications yet</h3>
                        <p>When someone mentions you or sends an alert, it will appear here.</p>
                    </div>
                ) : (
                    <div className="notifications-list">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`notification-item ${!n.is_read ? 'unread' : ''} priority-${n.priority}`}
                                onClick={() => handleNotificationClick(n)}
                            >
                                <div className="notif-icon-container">
                                    {getIcon(n.type)}
                                </div>
                                <div className="notif-details">
                                    <h4 className="notif-title">{n.title}</h4>
                                    <p className="notif-message">{n.message}</p>
                                    <span className="notif-time">
                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                {!n.is_read && <div className="unread-indicator" />}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
