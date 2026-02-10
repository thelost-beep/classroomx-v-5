import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Avatar } from './Avatar'
import './LikesListModal.css'

interface LikeUser {
    profiles: {
        id: string
        name: string
        avatar_url: string | null
    }
}

interface LikesListModalProps {
    postId: string
    isOpen: boolean
    onClose: () => void
}

export function LikesListModal({ postId, isOpen, onClose }: LikesListModalProps) {
    const [likes, setLikes] = useState<LikeUser[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isOpen && postId) {
            fetchLikes()
        }
    }, [isOpen, postId])

    const fetchLikes = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('likes')
                .select(`
                    profiles:user_id (id, name, avatar_url)
                `)
                .eq('post_id', postId)

            if (error) throw error
            setLikes((data as any) || [])
        } catch (error) {
            console.error('Error fetching likes:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Likes</h3>
                    <button onClick={onClose} className="modal-close-btn">
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    {loading ? (
                        <div className="modal-loading">Loading...</div>
                    ) : likes.length === 0 ? (
                        <div className="modal-empty">No likes yet</div>
                    ) : (
                        <div className="likes-list">
                            {likes.map((like, index) => (
                                <div key={index} className="like-item">
                                    <Avatar
                                        src={like.profiles.avatar_url}
                                        fallback={like.profiles.name}
                                        size="md"
                                    />
                                    <span className="like-user-name">{like.profiles.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
