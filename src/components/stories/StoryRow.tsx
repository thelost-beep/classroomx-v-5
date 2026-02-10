import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { getStories } from '@/lib/api/stories'
import { Avatar } from '@/components/ui'
import { StoryUpload } from './StoryUpload'
import { StoryViewer } from './StoryViewer'
import './StoryRow.css'

interface Story {
    id: string
    user_id: string
    media_url: string
    media_type: 'image' | 'video'
    created_at: string
    expires_at: string
    seen_by: string[]
    profiles: {
        id: string
        name: string
        avatar_url: string | null
    }
}

export function StoryRow() {
    const [stories, setStories] = useState<Story[]>([])
    const [showUpload, setShowUpload] = useState(false)
    const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null)

    useEffect(() => {
        fetchStories()
    }, [])

    const fetchStories = async () => {
        try {
            const data = await getStories()
            setStories(data)
        } catch (error) {
            console.error('Error fetching stories:', error)
        }
    }

    // Group stories by user
    const groupedStories = stories.reduce((acc, story) => {
        const userId = story.user_id
        if (!acc[userId]) {
            acc[userId] = []
        }
        acc[userId].push(story)
        return acc
    }, {} as Record<string, Story[]>)

    const storyUsers = Object.keys(groupedStories)

    return (
        <>
            <div className="story-row">
                <button className="story-item story-add" onClick={() => setShowUpload(true)}>
                    <div className="story-avatar-container">
                        <Plus size={24} />
                    </div>
                    <span className="story-username">Add Story</span>
                </button>

                {storyUsers.map((userId) => {
                    const userStories = groupedStories[userId]
                    const firstStory = userStories[0]

                    return (
                        <button
                            key={userId}
                            className="story-item"
                            onClick={() => setSelectedStoryIndex(stories.indexOf(firstStory))}
                        >
                            <div className="story-avatar-container">
                                <Avatar
                                    src={firstStory.profiles.avatar_url}
                                    fallback={firstStory.profiles.name}
                                    size="lg"
                                />
                                <div className="story-ring" />
                            </div>
                            <span className="story-username">{firstStory.profiles.name}</span>
                        </button>
                    )
                })}
            </div>

            {showUpload && (
                <StoryUpload
                    onClose={() => setShowUpload(false)}
                    onSuccess={() => {
                        fetchStories()
                    }}
                />
            )}

            {selectedStoryIndex !== null && (
                <StoryViewer
                    stories={stories}
                    initialIndex={selectedStoryIndex}
                    onClose={() => setSelectedStoryIndex(null)}
                />
            )}
        </>
    )
}
