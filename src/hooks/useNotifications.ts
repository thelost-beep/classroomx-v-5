import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/useToast'

export function useNotifications() {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const lastNotatedId = useRef<string | null>(null)

    useEffect(() => {
        if (!profile) return

        // 1. Request Browser Permission - MOVED TO MANUAL TRIGGER
        // if ('Notification' in window && Notification.permission === 'default') {
        //    Notification.requestPermission()
        // }

        // 2. Subscribe to Notifications
        const channel = supabase
            .channel(`device_notifications:${profile.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${profile.id}`
                },
                (payload) => {
                    const newNotif = payload.new as any

                    // Avoid double alerts
                    if (lastNotatedId.current === newNotif.id) return
                    lastNotatedId.current = newNotif.id

                    // 1. Browser Notification (Device)
                    if (Notification.permission === 'granted' && document.hidden) {
                        try {
                            const n = new Notification(newNotif.title || 'ClassroomX', {
                                body: newNotif.message,
                                icon: '/pwa-192x192.png', // Ensure this exists or use fallback
                                tag: newNotif.id,
                                data: { url: newNotif.action_url || '/notifications' }
                            })

                            n.onclick = (e: any) => {
                                window.focus()
                                const url = e.target.data.url
                                if (url) {
                                    navigate(url)
                                }
                                n.close()
                            }
                        } catch (err) {
                            console.error('Error showing browser notification:', err)
                        }
                    }

                    // 2. In-App Toast
                    if (!document.hidden) {
                        toast.success(newNotif.message || 'New notification!')
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel).catch(() => { })
        }
    }, [profile?.id])

    const requestPermission = async () => {
        if ('Notification' in window) {
            return await Notification.requestPermission()
        }
        return 'denied'
    }

    return { requestPermission }
}
