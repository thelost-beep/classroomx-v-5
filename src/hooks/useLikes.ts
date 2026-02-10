import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { likePost, unlikePost, checkIfLiked, getLikeCount } from '@/lib/api/posts'

export function useLikes(postId: string) {
    const { profile } = useAuth()
    const [isLiked, setIsLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!profile || !postId) return

        Promise.all([
            checkIfLiked(postId, profile.id),
            getLikeCount(postId)
        ]).then(([liked, count]) => {
            setIsLiked(liked)
            setLikeCount(count)
            setLoading(false)
        })
    }, [postId, profile])

    const toggleLike = async () => {
        if (!profile) return

        // Optimistic update
        const previousLiked = isLiked
        const previousCount = likeCount

        setIsLiked(!isLiked)
        setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)

        try {
            if (isLiked) {
                await unlikePost(postId, profile.id)
            } else {
                await likePost(postId, profile.id)
            }
        } catch (error) {
            // Revert on error
            setIsLiked(previousLiked)
            setLikeCount(previousCount)
            console.error('Error toggling like:', error)
        }
    }

    return {
        isLiked,
        likeCount,
        loading,
        toggleLike
    }
}
