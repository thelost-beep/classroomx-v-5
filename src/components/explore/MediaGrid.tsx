import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import './MediaGrid.css'

interface MediaItem {
    id: string
    media_url: string
    media_type: 'image' | 'video'
    post_id: string
}

export function MediaGrid() {
    const navigate = useNavigate()
    const [media, setMedia] = useState<MediaItem[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)

    useEffect(() => {
        fetchMedia()
    }, [])

    const fetchMedia = async () => {
        try {
            setLoading(true)
            // Join with posts to get creation date for sorting
            const { data, error } = await supabase
                .from('post_media')
                .select(`
                    id, 
                    media_url, 
                    media_type, 
                    post_id,
                    posts (created_at)
                `)
                .order('created_at', { foreignTable: 'posts', ascending: false })
                .limit(50)

            if (error) throw error
            setMedia((data as any) || [])
        } catch (error) {
            console.error('Error fetching media:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="media-grid">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="media-grid-item skeleton" />
                ))}
            </div>
        )
    }

    if (media.length === 0) {
        return (
            <div className="media-grid-empty">
                <p>No media yet</p>
            </div>
        )
    }

    return (
        <>
            <div className="media-grid">
                {media.map((item) => (
                    <div
                        key={item.id}
                        className="media-grid-item"
                        onClick={() => navigate(`/post/${item.post_id}`)}
                    >
                        <img
                            src={item.media_url}
                            alt="Post media"
                            className="media-grid-image"
                        />
                    </div>
                ))}
            </div>

            {selectedMedia && (
                <div className="media-modal" onClick={() => setSelectedMedia(null)}>
                    <button
                        className="media-modal-close"
                        onClick={() => setSelectedMedia(null)}
                    >
                        <X size={24} />
                    </button>
                    <div className="media-modal-content" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={selectedMedia.media_url}
                            alt="Full size"
                            className="media-modal-image"
                        />
                    </div>
                </div>
            )}
        </>
    )
}
