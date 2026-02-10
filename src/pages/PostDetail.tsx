import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { PostCard } from '@/components/feed/PostCard'
import { SkeletonPost, Button } from '@/components/ui'
import { ChevronLeft } from 'lucide-react'
import './PostDetail.css'

export function PostDetail() {
    const { postId } = useParams()
    const navigate = useNavigate()
    const [post, setPost] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (postId) {
            fetchPost()
        }
    }, [postId])

    const fetchPost = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    id,
                    user_id,
                    caption,
                    type,
                    created_at,
                    profiles:user_id (id, name, avatar_url),
                    post_media (*),
                    _count:comments (count)
                `)
                .eq('id', postId)
                .single()

            if (error) throw error
            setPost(data)
        } catch (error) {
            console.error('Error fetching post:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="post-detail-page">
            <header className="detail-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ChevronLeft size={24} />
                </button>
                <h1>Post</h1>
            </header>
            <SkeletonPost />
        </div>
    )

    if (!post) return (
        <div className="post-detail-page">
            <header className="detail-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ChevronLeft size={24} />
                </button>
                <h1>Post not found</h1>
            </header>
            <div className="error-state">
                <p>This post might have been deleted or is unavailable.</p>
                <Button onClick={() => navigate('/home')}>Return Home</Button>
            </div>
        </div>
    )

    return (
        <div className="post-detail-page">
            <header className="detail-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ChevronLeft size={24} />
                </button>
                <h1>Post</h1>
            </header>

            <div className="detail-content">
                <PostCard post={post} />
            </div>
        </div>
    )
}
