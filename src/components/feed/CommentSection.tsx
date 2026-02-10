import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui'
import { useComments } from '@/hooks/useComments'
import { useAuth } from '@/contexts/AuthContext'
import { Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import './CommentSection.css'

interface CommentSectionProps {
    postId: string
    initialCount?: number
    expandId?: string
    isFullyExpanded?: boolean
    onCountChange?: (count: number) => void
    onCollapse?: () => void
}

export function CommentSection({
    postId,
    initialCount = 0,
    expandId,
    isFullyExpanded = false,
    onCountChange,
    onCollapse
}: CommentSectionProps) {
    const { profile } = useAuth()
    const { comments, loading, submitting, addComment, deleteComment } = useComments(postId)
    const [isExpanded, setIsExpanded] = useState(isFullyExpanded)
    const [newComment, setNewComment] = useState('')

    useEffect(() => {
        setIsExpanded(isFullyExpanded)
    }, [isFullyExpanded])

    useEffect(() => {
        if (!loading && onCountChange) {
            onCountChange(comments.length)
        }
    }, [comments.length, loading, onCountChange])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim()) return

        const success = await addComment(newComment)
        if (success) {
            setNewComment('')
        }
    }

    const commentCount = comments.length || initialCount

    if (!isExpanded) {
        return (
            <button
                id={expandId}
                onClick={() => setIsExpanded(true)}
                className="comment-expand-btn"
            >
                {commentCount === 0
                    ? 'Add a comment...'
                    : `View ${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`}
            </button>
        )
    }

    return (
        <div className="comment-section">
            <div className="comment-header">
                <h4>Comments ({commentCount})</h4>
                <button
                    onClick={() => {
                        setIsExpanded(false)
                        onCollapse?.()
                    }}
                    className="comment-collapse-btn"
                >
                    Collapse
                </button>
            </div>

            <div className="comment-list">
                {loading ? (
                    <div className="comment-loading">Loading comments...</div>
                ) : comments.length === 0 ? (
                    <div className="comment-empty">No comments yet. Be the first!</div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                            <Link to={`/profile/${comment.user_id}`}>
                                <Avatar
                                    src={comment.profiles.avatar_url}
                                    fallback={comment.profiles.name}
                                    size="sm"
                                />
                            </Link>
                            <div className="comment-content">
                                <div className="comment-header-info">
                                    <Link to={`/profile/${comment.user_id}`} className="comment-author">
                                        {comment.profiles.name}
                                    </Link>
                                    <span className="comment-time">
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="comment-text">{comment.content}</p>
                            </div>
                            {profile?.id === comment.user_id && (
                                <button
                                    onClick={() => deleteComment(comment.id)}
                                    className="comment-delete-btn"
                                    aria-label="Delete comment"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="comment-input-form">
                <Avatar
                    src={profile?.avatar_url}
                    fallback={profile?.name}
                    size="sm"
                />
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="comment-input"
                    disabled={submitting}
                />
                <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className="comment-submit-btn"
                >
                    {submitting ? 'Posting...' : 'Post'}
                </button>
            </form>
        </div>
    )
}
