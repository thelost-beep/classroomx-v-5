import { useState, useEffect } from 'react'
import { X, MessageCircle, Eye, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui'
import { formatDistanceToNow } from 'date-fns'
import { findOrCreateDM, sendMessage } from '@/lib/api/chat'
import './StoryViewer.css'

interface StoryComment {
    id: string
    user_id: string
    content: string
    pos_x: number
    pos_y: number
    profiles: { name: string, avatar_url: string | null }
}

interface StoryView {
    user_id: string
    viewed_at: string
    profiles: { name: string, avatar_url: string | null }
}

interface Story {
    id: string
    user_id: string
    media_url: string
    media_type: 'image' | 'video'
    created_at: string
    profiles: {
        id: string
        name: string
        avatar_url: string | null
    }
}

interface StoryViewerProps {
    stories: Story[]
    initialIndex?: number
    onClose: () => void
}

export function StoryViewer({ stories, initialIndex = 0, onClose }: StoryViewerProps) {
    const { profile: currentUser } = useAuth()
    const [currentIndex, setCurrentIndex] = useState(initialIndex)
    const [progress, setProgress] = useState(0)
    const [comments, setComments] = useState<StoryComment[]>([])
    const [views, setViews] = useState<StoryView[]>([])
    const [showViewerList, setShowViewerList] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [newComment, setNewComment] = useState('')

    const currentStory = stories[currentIndex]
    const isOwner = currentUser?.id === currentStory?.user_id

    // 1. Progress & Auto-advance
    useEffect(() => {
        if (!currentStory || isPaused) return

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    handleNext()
                    return 0
                }
                return prev + 1.5 // ~6.6 seconds per story
            })
        }, 100)

        return () => clearInterval(interval)
    }, [currentIndex, isPaused, currentStory])

    // 2. Fetch Comments & Views + Realtime
    useEffect(() => {
        if (!currentStory) return

        const fetchData = async () => {
            const { data: commentsData } = await supabase
                .from('story_comments')
                .select('*, profiles:user_id(name, avatar_url)')
                .eq('story_id', currentStory.id)
            setComments(commentsData || [])

            if (currentUser && !isOwner) {
                await supabase.from('story_views').upsert({
                    story_id: currentStory.id,
                    user_id: currentUser.id
                })
            }

            if (isOwner) {
                const { data: viewsData } = await supabase
                    .from('story_views')
                    .select('*, profiles:user_id(name, avatar_url)')
                    .eq('story_id', currentStory.id)
                setViews(viewsData || [])
            }
        }

        fetchData()

        const commentChannel = supabase.channel(`story_comments:${currentStory.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'story_comments',
                filter: `story_id=eq.${currentStory.id}`
            }, async (payload) => {
                const { data } = await supabase
                    .from('profiles')
                    .select('name, avatar_url')
                    .eq('id', payload.new.user_id)
                    .single()
                const commentWithProfile = { ...payload.new, profiles: data }
                setComments(prev => [...prev, commentWithProfile as any])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(commentChannel)
        }
    }, [currentStory?.id, currentUser?.id, isOwner])

    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1)
            setProgress(0)
        } else {
            onClose()
        }
    }

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
            setProgress(0)
        }
    }

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() || !currentUser) return

        const commentObj = {
            story_id: currentStory.id,
            user_id: currentUser.id,
            content: newComment.trim(),
            pos_x: Math.random() * 0.6 + 0.2,
            pos_y: Math.random() * 0.4 + 0.3
        }

        const commentText = newComment.trim()
        setNewComment('')

        await supabase.from('story_comments').insert(commentObj)

        if (currentUser.id !== currentStory.user_id) {
            try {
                const chat = await findOrCreateDM(currentUser.id, currentStory.user_id)
                if (chat) {
                    await sendMessage(chat.id, currentUser.id, `Replied to your story: "${commentText}"`, undefined, { storyId: currentStory.id })
                }
            } catch (err) {
                console.error('Error sending story reply to DM:', err)
            }
        }
    }

    const handleDeleteStory = async () => {
        if (!window.confirm('Delete this story?')) return
        const { error } = await supabase.from('stories').delete().eq('id', currentStory.id)
        if (!error) handleNext()
    }

    if (!currentStory) return null

    return (
        <div className="story-viewer" onClick={onClose}>
            <div className="story-viewer-content" onClick={(e) => e.stopPropagation()}>
                {/* Progress Indicators */}
                <div className="story-progress-bar">
                    {stories.map((_, index) => (
                        <div key={index} className="story-progress-segment">
                            <div
                                className="story-progress-fill"
                                style={{
                                    width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="story-header">
                    <Avatar src={currentStory.profiles.avatar_url} fallback={currentStory.profiles.name} size="md" />
                    <div className="story-user-info">
                        <h3>{currentStory.profiles.name}</h3>
                        <span>{formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}</span>
                    </div>
                    <div className="story-header-actions">
                        {isOwner && (
                            <button className="story-action-icon" onClick={handleDeleteStory}>
                                <Trash2 size={20} />
                            </button>
                        )}
                        <button className="story-close-btn" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Media */}
                <div className="story-media-container" onMouseDown={() => setIsPaused(true)} onMouseUp={() => setIsPaused(false)}>
                    {currentStory.media_type === 'image' ? (
                        <img src={currentStory.media_url} alt="Story" className="story-media" />
                    ) : (
                        <video src={currentStory.media_url} className="story-media" autoPlay muted playsInline />
                    )}

                    {/* Floating Comments Overlay */}
                    <div className="story-comments-overlay">
                        {comments.map((comment) => (
                            <div
                                key={comment.id}
                                className="floating-bubble"
                                style={{
                                    left: `${comment.pos_x * 100}%`,
                                    top: `${comment.pos_y * 100}%`
                                }}
                            >
                                <Avatar src={comment.profiles.avatar_url} size="sm" />
                                <span>{comment.content}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation Areas */}
                <div className="story-nav-touch">
                    <div className="nav-touch-left" onClick={handlePrevious} />
                    <div className="nav-touch-right" onClick={handleNext} />
                </div>

                {/* Footer Controls */}
                <div className="story-footer">
                    {isOwner ? (
                        <div className="story-owner-stats" onClick={() => setShowViewerList(true)}>
                            <Eye size={20} />
                            <span>{views.length} views</span>
                        </div>
                    ) : (
                        <form className="story-comment-input" onSubmit={handleAddComment}>
                            <input
                                type="text"
                                placeholder="Reply to story..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onFocus={() => setIsPaused(true)}
                                onBlur={() => setIsPaused(false)}
                            />
                            <button type="submit">
                                <MessageCircle size={20} />
                            </button>
                        </form>
                    )}
                </div>

                {/* Viewer List Bottom Sheet */}
                {showViewerList && (
                    <div className="viewer-list-overlay" onClick={() => setShowViewerList(false)}>
                        <div className="viewer-list-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-handle" />
                            <div className="modal-header">
                                <h2>Viewers ({views.length})</h2>
                                <button onClick={() => setShowViewerList(false)}><X size={20} /></button>
                            </div>
                            <div className="viewer-list-items">
                                {views.map(view => (
                                    <div key={view.user_id} className="viewer-item">
                                        <Avatar src={view.profiles.avatar_url} size="sm" />
                                        <div className="viewer-user">
                                            <span className="viewer-name">{view.profiles.name}</span>
                                            <span className="viewer-time">{formatDistanceToNow(new Date(view.viewed_at), { addSuffix: true })}</span>
                                        </div>
                                    </div>
                                ))}
                                {views.length === 0 && <p className="no-viewers">No views yet</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
