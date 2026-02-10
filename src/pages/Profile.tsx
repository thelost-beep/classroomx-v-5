import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Grid, AlignLeft, Settings, Camera, UserPlus, UserCheck, Clock, HeartHandshake, Shield, Share2 } from 'lucide-react'
import { getProfile } from '@/lib/api/profiles'
import { getUserPosts } from '@/lib/api/posts'
import { getBestieStatus, sendBestieRequest, acceptBestieRequest, removeBestie, getProfileBesties } from '@/lib/api/relations'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Avatar, Skeleton } from '@/components/ui'
import { ShareModal } from '@/components/ui/ShareModal'
import { toast } from '@/hooks/useToast'
import './Profile.css'

type Tab = 'posts' | 'thoughts'

export function Profile() {
    const { userId } = useParams()
    const navigate = useNavigate()
    const { profile: currentUser, loading: isAuthLoading } = useAuth()

    const [profile, setProfile] = useState<any>(null)
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [activeTab, setActiveTab] = useState<Tab>('posts')
    const [showShareModal, setShowShareModal] = useState(false)
    const [bestieStatus, setBestieStatus] = useState<'none' | 'pending' | 'accepted' | 'incoming'>('none')
    const [bestieCount, setBestieCount] = useState(0)
    const [postCount, setPostCount] = useState(0)

    const isOwnProfile = currentUser?.id === userId

    useEffect(() => {
        if (!userId) {
            setLoading(false)
            return
        }

        const init = async () => {
            setLoading(true)
            setNotFound(false)
            try {
                await Promise.all([
                    loadProfile(),
                    loadPosts(),
                    loadBestieCount()
                ])
            } catch (err) {
                console.error('Error in profile init:', err)
            } finally {
                setLoading(false)
            }
        }

        init()
    }, [userId])

    // Wait for currentUser to load bestie status
    useEffect(() => {
        if (userId && currentUser?.id && !isOwnProfile) {
            loadBestieStatus()
        }
    }, [userId, currentUser?.id, isOwnProfile])

    const loadProfile = async () => {
        if (!userId) return
        try {
            const data = await getProfile(userId)
            if (!data) {
                setNotFound(true)
            } else {
                setProfile(data)
            }
        } catch (error) {
            console.error('Error loading profile:', error)
            setNotFound(true)
        }
    }

    const loadPosts = async () => {
        if (!userId) return
        try {
            const data = await getUserPosts(userId)
            setPosts(data || [])
            setPostCount(data?.length || 0)
        } catch (error) {
            console.error('Error loading posts:', error)
        }
    }

    const loadBestieStatus = async () => {
        if (!currentUser?.id || !userId || isOwnProfile) return
        try {
            const status = await getBestieStatus(currentUser.id, userId)
            setBestieStatus(status as any)
        } catch (error) {
            console.error('Error loading bestie status:', error)
        }
    }

    const loadBestieCount = async () => {
        if (!userId) return
        try {
            const besties = await getProfileBesties(userId)
            setBestieCount(besties?.length || 0)
        } catch (error) {
            console.error('Error loading besties:', error)
        }
    }

    // Real-time updates
    useEffect(() => {
        if (!userId) return

        const profileSub = supabase
            .channel(`profile:${userId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${userId}`
            }, (payload: any) => {
                setProfile(payload.new)
            })
            .subscribe()

        let bestieSub: any = null
        if (currentUser) {
            bestieSub = supabase
                .channel(`bestie_status:${userId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'besties'
                }, () => {
                    loadBestieStatus()
                    loadBestieCount()
                })
                .subscribe()
        }

        return () => {
            profileSub.unsubscribe()
            if (bestieSub) bestieSub.unsubscribe()
        }
    }, [userId, currentUser?.id])

    const handleBestieAction = async () => {
        if (!currentUser || !userId) return
        try {
            switch (bestieStatus) {
                case 'none':
                    await sendBestieRequest(currentUser.id, userId)
                    setBestieStatus('pending')
                    toast.success('Bestie request sent! 💫')
                    break
                case 'incoming':
                    await acceptBestieRequest(currentUser.id, userId)
                    setBestieStatus('accepted')
                    setBestieCount(prev => prev + 1)
                    toast.success('You are now besties! 🎉')
                    break
                case 'accepted':
                    if (window.confirm('Remove this person as your bestie?')) {
                        await removeBestie(currentUser.id, userId)
                        setBestieStatus('none')
                        setBestieCount(prev => Math.max(0, prev - 1))
                        toast.success('Bestie removed')
                    }
                    break
            }
        } catch (error) {
            console.error('Error with bestie action:', error)
            toast.error('Something went wrong')
        }
    }

    const getBestieButtonConfig = () => {
        switch (bestieStatus) {
            case 'none':
                return { icon: <UserPlus size={16} />, text: 'Send Bestie Request', className: 'bestie-btn-default' }
            case 'pending':
                return { icon: <Clock size={16} />, text: 'Request Pending', className: 'bestie-btn-pending' }
            case 'incoming':
                return { icon: <HeartHandshake size={16} />, text: 'Accept Request', className: 'bestie-btn-accept' }
            case 'accepted':
                return { icon: <UserCheck size={16} />, text: 'Besties ✨', className: 'bestie-btn-accepted' }
        }
    }

    // Filter posts by tab
    const mediaPosts = posts.filter(p => p.post_media && p.post_media.length > 0)
    const textPosts = posts.filter(p => !p.post_media || p.post_media.length === 0)

    if (loading || isAuthLoading) {
        return (
            <div className="profile-page">
                <Skeleton className="profile-banner-skeleton" />
                <Skeleton className="profile-avatar-skeleton" />
                <Skeleton className="profile-name-skeleton" />
            </div>
        )
    }

    if (notFound || !profile) {
        return (
            <div className="profile-page">
                <div className="profile-not-found">
                    <h2>User not found</h2>
                    <p>This profile doesn't exist or has been deleted.</p>
                </div>
            </div>
        )
    }

    const bestieBtn = getBestieButtonConfig()

    return (
        <div className="profile-page">
            {/* Banner */}
            <div className="profile-banner">
                {profile.banner_url ? (
                    <img src={profile.banner_url} alt="Banner" className="banner-image" />
                ) : (
                    <div className="banner-placeholder" />
                )}
                {isOwnProfile && (
                    <button className="banner-edit-btn" onClick={() => navigate('/edit-profile')}>
                        <Camera size={16} />
                    </button>
                )}
            </div>

            {/* Profile Header */}
            <div className="profile-header">
                <div className="profile-avatar-container">
                    <Avatar src={profile.avatar_url} fallback={profile.name} size="xl" />
                    {bestieStatus === 'accepted' && !isOwnProfile && (
                        <div className="bestie-badge" title="Besties">✨</div>
                    )}
                </div>

                <div className="profile-info">
                    <div className="profile-name-row">
                        <h1 className="profile-name">
                            {profile?.name}
                            {profile?.role === 'admin' && (
                                <span className="admin-badge-icon" title="Verified Admin">
                                    <Shield size={16} />
                                </span>
                            )}
                        </h1>
                        {isOwnProfile && currentUser?.role === 'admin' && (
                            <button
                                className="admin-access-btn"
                                onClick={() => navigate('/admin')}
                                title="Access Admin Dashboard"
                            >
                                <Settings size={14} /> Admin Dash
                            </button>
                        )}
                    </div>

                    {profile.activity && (
                        <p className="profile-activity">🎯 {profile.activity}</p>
                    )}

                    {profile.bio && <p className="profile-bio">{profile.bio}</p>}

                    {profile.location && (
                        <p className="profile-location">📍 {profile.location}</p>
                    )}

                    {/* Stats */}
                    <div className="profile-stats">
                        <div className="stat-item">
                            <span className="stat-value">{postCount || 0}</span>
                            <span className="stat-label">Posts</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{bestieCount || 0}</span>
                            <span className="stat-label">Besties</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="profile-actions">
                        {isOwnProfile ? (
                            <>
                                <button className="profile-edit-btn" onClick={() => navigate('/edit-profile')}>
                                    Edit Profile
                                </button>
                                <button className="profile-settings-btn" onClick={() => navigate('/settings')}>
                                    <Settings size={18} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button className={`bestie-btn ${bestieBtn.className}`} onClick={handleBestieAction} disabled={bestieStatus === 'pending'}>
                                    {bestieBtn.icon}
                                    <span>{bestieBtn.text}</span>
                                </button>
                                <button className="profile-message-btn" onClick={() => navigate(`/chats`)}>
                                    Message
                                </button>
                                <button className="profile-action-secondary" onClick={() => setShowShareModal(true)}>
                                    <Share2 size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                postId={profile.id} // Reusing ShareModal for profile sharing
                isProfile={true}
            />

            {/* Tabs */}
            <div className="profile-tabs">
                <button
                    className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('posts')}
                >
                    <Grid size={18} />
                    <span>Posts</span>
                </button>
                <button
                    className={`profile-tab ${activeTab === 'thoughts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('thoughts')}
                >
                    <AlignLeft size={18} />
                    <span>Thoughts</span>
                </button>
            </div>

            {/* Tab Content */}
            <div className="profile-content">
                {activeTab === 'posts' ? (
                    <div className="posts-grid">
                        {mediaPosts.length === 0 ? (
                            <div className="empty-tab">
                                <Grid size={40} strokeWidth={1} />
                                <p>No media posts yet</p>
                            </div>
                        ) : (
                            mediaPosts.map((post) => (
                                <div key={post.id} className="grid-post-item" onClick={() => navigate(`/post/${post.id}`)}>
                                    <img
                                        src={post.post_media?.[0]?.media_url}
                                        alt=""
                                        className="grid-post-img"
                                    />
                                    {post.post_media?.length > 1 && (
                                        <div className="multi-indicator">
                                            <Grid size={14} />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="thoughts-list">
                        {textPosts.length === 0 ? (
                            <div className="empty-tab">
                                <AlignLeft size={40} strokeWidth={1} />
                                <p>No thoughts shared yet</p>
                            </div>
                        ) : (
                            textPosts.map((post) => (
                                <div key={post.id} className="thought-item" onClick={() => navigate(`/post/${post.id}`)}>
                                    <p className="thought-text">{post.caption}</p>
                                    <div className="thought-meta">
                                        <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                        <span>·</span>
                                        <span>{post._count?.comments || 0} comments</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
