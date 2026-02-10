import { useState, useEffect } from 'react'
import { getComments, addComment, deleteComment } from '@/lib/api/posts'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from './useToast'

interface Comment {
    id: string
    post_id: string
    user_id: string
    content: string
    created_at: string
    profiles: {
        id: string
        name: string
        avatar_url: string | null
    }
}

export function useComments(postId: string) {
    const { profile } = useAuth()
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const fetchComments = async () => {
        try {
            const data = await getComments(postId)
            setComments(data)
        } catch (error) {
            console.error('Error fetching comments:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (postId) {
            fetchComments()
        }
    }, [postId])

    const addNewComment = async (content: string) => {
        if (!profile || !content.trim()) return

        setSubmitting(true)
        try {
            const newComment = await addComment(postId, profile.id, content.trim())
            setComments(prev => [...prev, newComment])
            return true
        } catch (error) {
            console.error('Error adding comment:', error)
            toast.error('Failed to add comment')
            return false
        } finally {
            setSubmitting(false)
        }
    }

    const removeComment = async (commentId: string) => {
        try {
            await deleteComment(commentId)
            setComments(prev => prev.filter(c => c.id !== commentId))
            toast.success('Comment deleted')
        } catch (error) {
            console.error('Error deleting comment:', error)
            toast.error('Failed to delete comment')
        }
    }

    return {
        comments,
        loading,
        submitting,
        addComment: addNewComment,
        deleteComment: removeComment,
        refreshComments: fetchComments
    }
}
