import { useState, useRef } from 'react'
import { X, Plus, Search } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { createStory, uploadStoryMedia } from '@/lib/api/stories'
import { Button } from '@/components/ui'
import { toast } from '@/hooks/useToast'
import { Avatar } from '@/components/ui'
import './StoryUpload.css'

interface StoryUploadProps {
    onClose: () => void
    onSuccess?: () => void
}

export function StoryUpload({ onClose, onSuccess }: StoryUploadProps) {
    const { profile } = useAuth()
    const [preview, setPreview] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [taggedUsers, setTaggedUsers] = useState<any[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSearch = async (query: string) => {
        setSearchQuery(query)
        if (query.trim().length < 2) {
            setSearchResults([])
            return
        }

        const { data } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .ilike('name', `%${query}%`)
            .limit(5)
        setSearchResults(data || [])
    }

    const toggleTag = (user: any) => {
        setTaggedUsers(prev => {
            const isTagged = prev.find(u => u.id === user.id)
            if (isTagged) return prev.filter(u => u.id !== user.id)
            return [...prev, user]
        })
        setSearchQuery('')
        setSearchResults([])
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
            toast.error('Please select an image or video')
            return
        }

        setFile(selectedFile)
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreview(reader.result as string)
        }
        reader.readAsDataURL(selectedFile)
    }

    const handleUpload = async () => {
        if (!file || !profile) return

        setUploading(true)
        try {
            const mediaUrl = await uploadStoryMedia(file)
            const mediaType = file.type.startsWith('image/') ? 'image' : 'video'
            const story: any = await createStory(profile.id, mediaUrl, mediaType)

            // Save tags
            if (taggedUsers.length > 0) {
                const tagObjects = taggedUsers.map(user => ({
                    story_id: story.id,
                    user_id: user.id
                }))
                await supabase.from('story_tags').insert(tagObjects)
            }

            toast.success('Story uploaded!')
            onSuccess?.()
            onClose()
        } catch (error) {
            console.error('Error uploading story:', error)
            toast.error('Failed to upload story')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="story-upload-modal" onClick={onClose}>
            <div className="story-upload-content" onClick={(e) => e.stopPropagation()}>
                <button className="story-upload-close" onClick={onClose}>
                    <X size={24} />
                </button>

                {!preview ? (
                    <div className="story-upload-empty">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                        <button
                            className="story-upload-select-btn"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Plus size={48} />
                            <span>Add Story</span>
                        </button>
                    </div>
                ) : (
                    <div className="story-upload-preview">
                        <div className="preview-container">
                            {file?.type.startsWith('image/') ? (
                                <img src={preview} alt="Story preview" className="story-preview-media" />
                            ) : (
                                <video src={preview} className="story-preview-media" controls />
                            )}
                        </div>

                        <div className="story-tagging-ui">
                            <div className="tagged-users-list">
                                {taggedUsers.map(user => (
                                    <div key={user.id} className="tagged-user-chip" onClick={() => toggleTag(user)}>
                                        <Avatar src={user.avatar_url} size="sm" />
                                        <span>{user.name}</span>
                                        <X size={12} />
                                    </div>
                                ))}
                            </div>

                            <div className="tag-search-container">
                                <Search size={16} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Tag friends..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                                {searchResults.length > 0 && (
                                    <div className="tag-results">
                                        {searchResults.map(user => (
                                            <div key={user.id} className="tag-result-item" onClick={() => toggleTag(user)}>
                                                <Avatar src={user.avatar_url} size="sm" />
                                                <span>{user.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="story-upload-actions">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setPreview(null)
                                    setFile(null)
                                    setTaggedUsers([])
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpload}
                                loading={uploading}
                                disabled={uploading}
                            >
                                Share Story
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
