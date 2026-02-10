import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { searchProfiles } from '@/lib/api/profiles'
import { findOrCreateDM } from '@/lib/api/chat'
import { Avatar, Skeleton } from '@/components/ui'
import { toast } from '@/hooks/useToast'
import './CreateChat.css'

export function CreateChat() {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                handleSearch()
            } else {
                setResults([])
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [searchQuery])

    const handleSearch = async () => {
        setLoading(true)
        try {
            const users = await searchProfiles(searchQuery)
            // Filter out self
            setResults(users.filter(u => u.id !== profile?.id))
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleStartChat = async (targetUserId: string) => {
        if (!profile) return
        try {
            const chat = await findOrCreateDM(profile.id, targetUserId)
            navigate(`/chats/${chat.id}`)
        } catch (error) {
            console.error('Create DM error:', error)
            toast.error('Failed to start conversation')
        }
    }

    return (
        <div className="create-chat-page">
            <div className="create-chat-header">
                <button onClick={() => navigate('/chats')} className="back-btn">
                    <ArrowLeft size={24} />
                </button>
                <h2>New Message</h2>
            </div>

            <div className="search-container">
                <div className="search-bar">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search for students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            <div className="search-results">
                {loading ? (
                    <div className="results-loading">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="result-skeleton">
                                <Skeleton className="avatar-skeleton" />
                                <div className="text-skeleton">
                                    <Skeleton className="header-skeleton" />
                                    <Skeleton className="sub-skeleton" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : results.length > 0 ? (
                    <div className="results-list">
                        {results.map(user => (
                            <div
                                key={user.id}
                                className="search-result-item"
                                onClick={() => handleStartChat(user.id)}
                            >
                                <Avatar src={user.avatar_url} fallback={user.name} size="md" />
                                <div className="result-info">
                                    <span className="user-name">{user.name}</span>
                                    <p className="user-subtitle">Tap to message</p>
                                </div>
                                <User className="user-icon" size={18} />
                            </div>
                        ))}
                    </div>
                ) : searchQuery.length >= 2 ? (
                    <div className="results-empty">
                        <User size={48} className="empty-icon" />
                        <p>No students found for "{searchQuery}"</p>
                    </div>
                ) : (
                    <div className="start-typing">
                        <p>Type at least 2 characters to search</p>
                    </div>
                )}
            </div>
        </div>
    )
}
