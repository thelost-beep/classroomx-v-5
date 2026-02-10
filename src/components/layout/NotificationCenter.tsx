import { useState, useEffect, useRef } from 'react'
import { Bell, Check, X, UserPlus, Heart, MessageCircle, AtSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Notification as DbNotification } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui'
import { toast } from '@/hooks/useToast'
import './NotificationCenter.css'

export function NotificationCenter() {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState<DbNotification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (profile) {
            fetchNotifications()
            subscribeToNotifications()
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [profile])

    const fetchNotifications = async () => {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', profile?.id)
            .order('created_at', { ascending: false })
            .limit(20)

        if (data) {
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.is_read).length)
        }
    }

    const subscribeToNotifications = () => {
        const subscription = supabase
            .channel(`notifications:${profile?.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${profile?.id}`
            }, (payload) => {
                setNotifications(prev => [payload.new as DbNotification, ...prev].slice(0, 20))
                setUnreadCount(count => count + 1)
                toast.success('New notification received!')
            })
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)

        if (!error) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
            setUnreadCount(count => Math.max(0, count - 1))
        }
    }

    const handleInviteResponse = async (notification: DbNotification, status: 'accepted' | 'rejected') => {
        try {
            // Find the collaboration entry
            const { data: collab } = await supabase
                .from('post_collaborations')
                .select('id')
                .eq('post_id', notification.related_id)
                .eq('user_id', profile?.id)
                .single()

            if (!collab) throw new Error('Collaboration invite not found')

            const { data: success, error } = await supabase.rpc('respond_to_collaboration', {
                collab_id: collab.id,
                new_status: status
            })

            if (error) throw error

            if (success) {
                toast.success(`Collaboration invite ${status}!`)
                markAsRead(notification.id)
            }
        } catch (error) {
            console.error('Error responding to invite:', error)
            toast.error('Failed to respond to invite')
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'mention': return <AtSign className="notif-icon mention" size={18} />
            case 'collaboration_invite': return <UserPlus className="notif-icon collab" size={18} />
            case 'like': return <Heart className="notif-icon like" size={18} />
            case 'comment': return <MessageCircle className="notif-icon comment" size={18} />
            case 'chat_message': return <MessageCircle className="notif-icon mention" size={18} />
            default: return <Bell className="notif-icon default" size={18} />
        }
    }

    return (
        <div className="notification-center-container" ref={dropdownRef}>
            <button className="notif-trigger-btn" onClick={() => setIsOpen(!isOpen)}>
                <Bell size={24} />
                {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="notif-dropdown">
                    <div className="notif-dropdown-header">
                        <h3>Notifications</h3>
                        {Notification.permission === 'default' && (
                            <button
                                onClick={async () => {
                                    const result = await Notification.requestPermission()
                                    if (result === 'granted') {
                                        toast.success('Notifications enabled!')
                                    }
                                }}
                                className="enable-notif-btn"
                            >
                                <Bell size={12} /> Enable
                            </button>
                        )}
                        {unreadCount > 0 && <button onClick={() => fetchNotifications()} className="refresh-btn">Refresh</button>}
                    </div>
                    <div className="notif-list">
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <div key={notif.id} className={`notif-item ${!notif.is_read ? 'unread' : ''}`}>
                                    <div className="notif-content-wrapper">
                                        {getIcon(notif.type)}
                                        <div className="notif-text-info" onClick={() => {
                                            if (notif.action_url) {
                                                navigate(notif.action_url)
                                                setIsOpen(false)
                                            }
                                        }}>
                                            <p className="notif-title">{(notif as any).title || notif.message}</p>
                                            <p className="notif-message">{notif.message}</p>
                                            <span className="notif-time">{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>

                                    {notif.type === 'collaboration_invite' && !notif.is_read && (
                                        <div className="notif-actions">
                                            <Button variant="primary" size="sm" onClick={() => handleInviteResponse(notif, 'accepted')}>
                                                <Check size={14} /> Accept
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleInviteResponse(notif, 'rejected')}>
                                                <X size={14} /> Reject
                                            </Button>
                                        </div>
                                    )}
                                    {!notif.is_read && notif.type !== 'collaboration_invite' && (
                                        <button className="mark-read-dot" onClick={() => markAsRead(notif.id)} />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="empty-notifs">No notifications yet</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
