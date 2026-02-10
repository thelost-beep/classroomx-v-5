import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Share2, X, Check } from 'lucide-react'
import { Post, supabase } from '@/lib/supabase'
import { updatePost, deletePost } from '@/lib/api/posts'
import { Avatar, MediaCarousel } from '@/components/ui'
import { useLikes } from '@/hooks/useLikes'
import { useAuth } from '@/contexts/AuthContext'
import { CommentSection } from './CommentSection'
import { PostOptions } from './PostOptions'
import { ShareModal } from '@/components/ui/ShareModal'
import { LikesListModal } from '@/components/ui/LikesListModal'
import { useReporting } from '@/hooks/useReporting'
import { toast } from '@/hooks/useToast'
import { formatDistanceToNow } from 'date-fns'
import './PostCard.css'

interface PostCardProps {
    post: Post
    onHide?: (postId: string) => void
}

export function PostCard({ post, onHide }: PostCardProps) {
    const navigate = useNavigate()
    const { profile: currentUser } = useAuth()
    const { report } = useReporting()

    const profile = post.profiles
    const mediaItems = post.post_media || []
    const { isLiked, likeCount, toggleLike } = useLikes(post.id)

    const [commentCount, setCommentCount] = useState(post._count?.comments || 0)
    const [isLikesModalOpen, setIsLikesModalOpen] = useState(false)
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [showHeart, setShowHeart] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editCaption, setEditCaption] = useState(post.caption || '')
    const [displayCaption, setDisplayCaption] = useState(post.caption || '')
    const [showComments, setShowComments] = useState(false)
    const [collaborators, setCollaborators] = useState<any[]>([])
    const [isSaved, setIsSaved] = useState(false)
    const [isHidden, setIsHidden] = useState(false)
    const lastTap = useRef<number>(0)

    useEffect(() => {
        if (post.is_collab) {
            fetchCollaborators()
        }
        if (currentUser) {
            checkSavedStatus()
        }
    }, [post.id, currentUser?.id])

    const checkSavedStatus = async () => {
        if (!currentUser) return
        const { data } = await supabase
            .from('saved_posts')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('post_id', post.id)
            .maybeSingle()
        setIsSaved(!!data)
    }

    const fetchCollaborators = async () => {
        const { data } = await supabase
            .from('post_collaborations')
            .select('user_id, profiles(id, name, avatar_url)')
            .eq('post_id', post.id)
            .eq('status', 'accepted')

        if (data) setCollaborators(data)
    }

    const handleDoubleTap = () => {
        const now = Date.now()
        const DOUBLE_PRESS_DELAY = 300
        if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
            if (!isLiked) {
                toggleLike()
            }
            setShowHeart(true)
            setTimeout(() => setShowHeart(false), 800)
        }
        lastTap.current = now
    }

    const handleReport = async () => {
        const reason = window.prompt('Please provide a reason for reporting this post:')
        if (reason) {
            await report('post', post.id, reason)
        }
    }

    const handleEdit = () => {
        setIsEditing(true)
    }

    const handleSave = async () => {
        if (!currentUser) return
        try {
            if (isSaved) {
                await supabase
                    .from('saved_posts')
                    .delete()
                    .eq('user_id', currentUser.id)
                    .eq('post_id', post.id)
                setIsSaved(false)
                toast.success('Post unsaved')
            } else {
                await supabase
                    .from('saved_posts')
                    .insert({ user_id: currentUser.id, post_id: post.id })
                setIsSaved(true)
                toast.success('Post saved!')
            }
        } catch (error) {
            console.error('Error saving post:', error)
            toast.error('Failed to save post')
        }
    }

    const handleHide = async () => {
        if (!currentUser) return
        try {
            await supabase
                .from('hidden_posts')
                .insert({ user_id: currentUser.id, post_id: post.id })
            setIsHidden(true)
            onHide?.(post.id)
            toast.success('Post hidden from your feed')
        } catch (error) {
            console.error('Error hiding post:', error)
            toast.error('Failed to hide post')
        }
    }

    const handleSaveEdit = async () => {
        try {
            await updatePost(post.id, editCaption)
            setDisplayCaption(editCaption)
            setIsEditing(false)
            toast.success('Post updated')
        } catch (error) {
            console.error('Error updating post:', error)
            toast.error('Failed to update post')
        }
    }

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await deletePost(post.id)
                window.location.reload()
            } catch (error) {
                console.error('Error deleting post:', error)
            }
        }
    }

    if (isHidden) return null

    return (
        <article className={`post-card ${post.is_anonymous ? 'is-anonymous' : ''}`}>
            <div className="post-header">
                <Link to={`/profile/${post.user_id}`} className="post-user-info-wrapper">
                    <div className="post-avatar-click-fix" onClick={(e) => {
                        e.preventDefault();
                        if (!post.is_anonymous) navigate(`/profile/${post.user_id}`);
                    }}>
                        <Avatar
                            src={post.is_anonymous ? undefined : profile?.avatar_url}
                            fallback={post.is_anonymous ? '?' : profile?.name}
                            size="md"
                        />
                    </div>
                    <div className="post-user-info">
                        <div className="collab-name-wrapper">
                            <h3 className="post-username" onClick={() => !post.is_anonymous && navigate(`/profile/${post.profiles?.id}`)}>
                                {post.is_anonymous ? 'Anonymous' : (profile?.name || 'Unknown')}
                            </h3>
                            {collaborators.length > 0 && !post.is_anonymous && (
                                <>
                                    <span className="and-text">and</span>
                                    {collaborators.map((c, idx) => (
                                        <span
                                            key={c.user_id}
                                            className="post-username"
                                            onClick={() => navigate(`/profile/${c.user_id}`)}
                                        >
                                            {c.profiles.name}{idx < collaborators.length - 1 ? ', ' : ''}
                                        </span>
                                    ))}
                                </>
                            )}
                        </div>
                        <span className="post-time">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                    </div>
                </Link>

                <PostOptions
                    isOwner={currentUser?.id === post.user_id}
                    postUrl={`/post/${post.id}`}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onReport={handleReport}
                    onSave={handleSave}
                    onHide={handleHide}
                    isSaved={isSaved}
                />
            </div>

            {mediaItems.length > 0 && (
                <div className="post-media" onClick={handleDoubleTap}>
                    <MediaCarousel media={mediaItems} />
                    {showHeart && (
                        <div className="heart-overlay heart-pulse">
                            <Heart size={80} fill="white" />
                        </div>
                    )}
                </div>
            )}

            {isEditing ? (
                <div className="post-edit-container">
                    <textarea
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        className="post-edit-input"
                        placeholder="Write a caption..."
                    />
                    <div className="post-edit-actions">
                        <button className="edit-action-btn cancel" onClick={() => setIsEditing(false)}>
                            <X size={16} />
                            <span>Cancel</span>
                        </button>
                        <button className="edit-action-btn save" onClick={handleSaveEdit}>
                            <Check size={16} />
                            <span>Save</span>
                        </button>
                    </div>
                </div>
            ) : displayCaption && (
                <div className="post-caption">
                    <p>{displayCaption}</p>
                </div>
            )}

            <div className="post-actions">
                <div className="like-group">
                    <button
                        onClick={toggleLike}
                        className={`action-btn ${isLiked ? 'action-btn-liked' : ''}`}
                    >
                        <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        className="like-count-btn"
                        onClick={() => setIsLikesModalOpen(true)}
                        disabled={likeCount === 0}
                    >
                        {likeCount}
                    </button>
                </div>
                <button className="action-btn" onClick={() => setShowComments(!showComments)}>
                    <MessageCircle size={24} />
                    <span>{commentCount}</span>
                </button>
                <button className="action-btn" onClick={() => setIsShareModalOpen(true)}>
                    <Share2 size={24} />
                </button>
            </div>

            {showComments && (
                <CommentSection
                    postId={post.id}
                    initialCount={post._count?.comments || 0}
                    isFullyExpanded={true}
                    onCountChange={setCommentCount}
                    onCollapse={() => setShowComments(false)}
                />
            )}
            <LikesListModal
                postId={post.id}
                isOpen={isLikesModalOpen}
                onClose={() => setIsLikesModalOpen(false)}
            />
            <ShareModal
                postId={post.id}
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
            />
        </article>
    )
}
