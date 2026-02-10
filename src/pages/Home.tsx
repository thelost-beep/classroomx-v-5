import { useEffect, useState } from 'react'
import { supabase, Post } from '@/lib/supabase'
import { SkeletonPost, Button } from '@/components/ui'
import { PostCard } from '@/components/feed/PostCard'
import { StoryRow } from '@/components/stories/StoryRow'
import { toast } from '@/hooks/useToast'
import './Home.css'

export function Home() {
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPosts()

        // Safety timeout - if it takes more than 10s, stop loading and show whatever we have
        const timer = setTimeout(() => {
            if (loading) {
                setLoading(false)
                console.warn('Feed load timed out')
            }
        }, 10000)

        return () => clearTimeout(timer)
    }, [])

    const fetchPosts = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    id,
                    user_id,
                    caption,
                    type,
                    is_collab,
                    is_anonymous,
                    created_at,
                    profiles:user_id (id, name, avatar_url),
                    post_media (id, media_url, media_type),
                    likes (count),
                    comments (count)
                `)
                .order('created_at', { ascending: false })
                .limit(20)

            if (error) {
                console.error('Database error fetching posts:', error)
                toast.error('Failed to load feed. Please try refreshing.')
                throw error
            }
            setPosts((data as any) || [])
        } catch (error) {
            console.error('Error in fetchPosts:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="home-page">
            <div className="home-header">
                <h1>ClassroomX</h1>
            </div>

            <StoryRow />

            <div className="feed">
                {loading ? (
                    <>
                        <SkeletonPost />
                        <SkeletonPost />
                        <SkeletonPost />
                    </>
                ) : posts.length === 0 ? (
                    <div className="empty-state">
                        <p>No posts yet. Be the first to share something!</p>
                        <Button onClick={fetchPosts} variant="secondary" size="sm" className="mt-4">
                            Retry
                        </Button>
                    </div>
                ) : (
                    posts.map((post) => <PostCard key={post.id} post={post} onHide={(id) => setPosts(prev => prev.filter(p => p.id !== id))} />)
                )}
            </div>
        </div>
    )
}
