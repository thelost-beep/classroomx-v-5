import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Image as ImageIcon, X, Type, Ghost, Search, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Profile } from '@/lib/supabase'
import { Button, Textarea, MediaCarousel, Input, Avatar } from '@/components/ui'
import { toast } from '@/hooks/useToast'
import './Create.css'

type PostType = 'post' | 'text' | 'confession'

export function Create() {
    const { profile } = useAuth()
    const [postType, setPostType] = useState<PostType>('post')
    const [caption, setCaption] = useState('')
    const [media, setMedia] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [isAnonymous, setIsAnonymous] = useState(true)
    const [collaborators, setCollaborators] = useState<Profile[]>([])
    const [userSearch, setUserSearch] = useState('')
    const [searchResults, setSearchResults] = useState<Profile[]>([])
    const [aspectRatio, setAspectRatio] = useState('1/1')
    const navigate = useNavigate()

    const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length + media.length > 10) {
            toast.error('Maximum 10 media files allowed')
            return
        }

        const newMedia = [...media, ...files]
        const newPreviews = files.map((file) => URL.createObjectURL(file))

        setMedia(newMedia)
        setPreviews([...previews, ...newPreviews])
    }

    const removeMedia = (index: number) => {
        const newMedia = media.filter((_, i) => i !== index)
        const newPreviews = previews.filter((_, i) => i !== index)
        setMedia(newMedia)
        setPreviews(newPreviews)
    }

    const handleSearchUsers = async (query: string) => {
        setUserSearch(query)
        if (query.trim().length < 2) {
            setSearchResults([])
            return
        }

        const { data } = await supabase
            .from('profiles')
            .select('*')
            .ilike('name', `%${query}%`)
            .neq('id', profile?.id)
            .limit(5)

        setSearchResults((data as any) || [])
    }

    const addCollaborator = (user: Profile) => {
        if (!collaborators.find(c => c.id === user.id)) {
            setCollaborators([...collaborators, user])
        }
        setUserSearch('')
        setSearchResults([])
    }

    const removeCollaborator = (userId: string) => {
        setCollaborators(collaborators.filter(c => c.id !== userId))
    }

    const uploadMedia = async (file: File, postId: string, index: number) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${postId}-${index}.${fileExt}`
        const filePath = `posts/${fileName}`

        const { error } = await supabase.storage.from('posts').upload(filePath, file)

        if (error) throw error

        const { data } = supabase.storage.from('posts').getPublicUrl(filePath)
        return data.publicUrl
    }

    const handleSubmit = async () => {
        if (!caption.trim() && media.length === 0) {
            toast.error('Please add a caption or media')
            return
        }

        setLoading(true)

        try {
            // 1. Create content based on type
            const postTypeToSave = postType === 'post' ? (media.length > 0 ? 'media' : 'text') : 'text'

            if (postType === 'confession') {
                const { error: postError } = await supabase
                    .from('posts')
                    .insert({
                        user_id: profile?.id,
                        caption,
                        type: 'confession',
                        is_anonymous: true,
                        is_approved: true, // Everyone can see immediately
                        is_collab: false
                    })
                    .select()
                    .single()

                if (postError) throw postError

                toast.success('Confession submitted for moderation!')
                navigate('/home')
                return
            }

            // Standard Post or Text Post
            const { data: post, error: postError } = await supabase
                .from('posts')
                .insert({
                    user_id: profile?.id,
                    caption,
                    type: postTypeToSave,
                    is_collab: collaborators.length > 0,
                })
                .select()
                .single()

            if (postError) throw postError

            // 2. Add Collaborators if any
            if (collaborators.length > 0) {
                const collabInvites = collaborators.map(c => ({
                    post_id: post.id,
                    user_id: c.id,
                    status: 'pending'
                }))
                await supabase.from('post_collaborations').insert(collabInvites)
            }

            // 3. Upload media if any
            if (media.length > 0 && postType === 'post') {
                for (let i = 0; i < media.length; i++) {
                    const mediaUrl = await uploadMedia(media[i], post.id, i)

                    await supabase.from('post_media').insert({
                        post_id: post.id,
                        media_url: mediaUrl,
                        media_type: media[i].type.startsWith('image') ? 'image' : 'video',
                        order_index: i,
                    })
                }
            }

            toast.success('Post created successfully!')
            navigate('/home')
        } catch (error) {
            console.error('Error creating post:', error)
            toast.error('Failed to create post')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="create-page">
            <div className="create-header">
                <h1>Create</h1>
            </div>

            <div className="create-content">
                <div className="create-tabs">
                    <Button
                        variant={postType === 'post' ? 'primary' : 'secondary'}
                        onClick={() => setPostType('post')}
                        className="tab-btn"
                    >
                        <ImageIcon size={18} />
                        <span>Gallery Post</span>
                    </Button>
                    <Button
                        variant={postType === 'text' ? 'primary' : 'secondary'}
                        onClick={() => setPostType('text')}
                        className="tab-btn"
                    >
                        <Type size={18} />
                        <span>Text Post</span>
                    </Button>
                    <Button
                        variant={postType === 'confession' ? 'primary' : 'secondary'}
                        onClick={() => setPostType('confession')}
                        className="tab-btn"
                    >
                        <Ghost size={18} />
                        <span>Confession</span>
                    </Button>
                </div>

                {postType === 'confession' && (
                    <div className="confession-options-card premium-accent">
                        <div className="opt-info">
                            <span className="opt-title highlight">Post Anonymously</span>
                            <p className="opt-desc text-contrast">Your name and profile will be hidden from everyone.</p>
                        </div>
                        <label className="switch toggle-large">
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                )}

                <Textarea
                    placeholder={
                        postType === 'confession'
                            ? "Share your secret anonymously..."
                            : (postType === 'text' ? "What's happening?" : "Compose your caption...")
                    }
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    fullWidth
                    rows={postType === 'text' ? 4 : 6}
                />

                {postType === 'post' && (
                    <>
                        {previews.length > 0 && (
                            <div className="media-previews-container">
                                <div className="aspect-ratio-selector">
                                    <Button
                                        variant={aspectRatio === '1/1' ? 'primary' : 'secondary'}
                                        size="sm"
                                        onClick={() => setAspectRatio('1/1')}
                                        className="ratio-btn-premium"
                                    >
                                        1:1
                                    </Button>
                                    <Button
                                        variant={aspectRatio === '4/5' ? 'primary' : 'secondary'}
                                        size="sm"
                                        onClick={() => setAspectRatio('4/5')}
                                        className="ratio-btn-premium"
                                    >
                                        4:5
                                    </Button>
                                    <Button
                                        variant={aspectRatio === '16/9' ? 'primary' : 'secondary'}
                                        size="sm"
                                        onClick={() => setAspectRatio('16/9')}
                                        className="ratio-btn-premium"
                                    >
                                        16:9
                                    </Button>
                                </div>
                                <MediaCarousel
                                    media={previews.map(p => ({ media_url: p, media_type: 'image' }))}
                                />
                                <div className="media-previews-grid">
                                    {previews.map((preview, index) => (
                                        <div key={index} className="preview-item">
                                            <img src={preview} alt={`Preview ${index + 1}`} style={{ aspectRatio }} />
                                            <button
                                                onClick={() => removeMedia(index)}
                                                className="remove-btn"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <label htmlFor="media-input" className="media-upload-btn">
                            <ImageIcon size={20} />
                            <span>Add Photos/Videos</span>
                            <input
                                id="media-input"
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                onChange={handleMediaChange}
                                style={{ display: 'none' }}
                            />
                        </label>

                        <div className="tagging-section-card">
                            <div className="card-header">
                                <UserPlus size={18} />
                                <span>Tag/Collaborate with Friends</span>
                            </div>

                            {collaborators.length > 0 && (
                                <div className="tagged-users-list">
                                    {collaborators.map(user => (
                                        <div key={user.id} className="tagged-user-pill">
                                            <Avatar src={user.avatar_url} fallback={user.name} size="sm" />
                                            <span>{user.name}</span>
                                            <button onClick={() => removeCollaborator(user.id)} className="remove-tag-btn">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="search-input-wrapper">
                                <Input
                                    placeholder="Search friends by name..."
                                    value={userSearch}
                                    onChange={(e) => handleSearchUsers(e.target.value)}
                                    icon={<Search size={16} />}
                                    fullWidth
                                />

                                {searchResults.length > 0 && (
                                    <div className="users-lookup-results">
                                        {searchResults.map(user => (
                                            <div
                                                key={user.id}
                                                className="lookup-item"
                                                onClick={() => addCollaborator(user)}
                                            >
                                                <Avatar src={user.avatar_url} fallback={user.name} size="sm" />
                                                <div className="lookup-info">
                                                    <span className="lookup-name">{user.name}</span>
                                                    <span className="lookup-handle">@{user.name?.toLowerCase().replace(/\s/g, '')}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                <Button
                    onClick={handleSubmit}
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading}
                >
                    {postType === 'confession' ? 'Submit Confession' : 'Share Post'}
                </Button>
            </div>
        </div>
    )
}
