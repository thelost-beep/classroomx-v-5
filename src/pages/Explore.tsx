import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Users, FileText } from 'lucide-react'
import { supabase, Profile, Confession } from '@/lib/supabase'
import { Input, Avatar, Button } from '@/components/ui'
import { MediaGrid } from '@/components/explore/MediaGrid'
import './Explore.css'

type Tab = 'media' | 'people' | 'confessions'

export function Explore() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<Tab>('media')
    const [searchQuery, setSearchQuery] = useState('')
    const [people, setPeople] = useState<Profile[]>([])
    const [confessions, setConfessions] = useState<Confession[]>([])

    useEffect(() => {
        if (activeTab === 'people') {
            fetchPeople()
        } else if (activeTab === 'confessions') {
            fetchConfessions()
        }
    }, [activeTab])

    const fetchPeople = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, status')
            .order('name')
        setPeople((data as any) || [])
    }

    const fetchConfessions = async () => {
        const { data } = await supabase
            .from('posts')
            .select('*')
            .eq('type', 'confession')
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
        setConfessions(data as any || [])
    }

    const filteredPeople = people.filter((person) =>
        person.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="explore-page">
            <div className="explore-header">
                <div className="explore-title-row">
                    <h1>Explore</h1>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate('/create')}
                    >
                        <Users size={18} style={{ marginRight: '8px' }} />
                        Official Upload
                    </Button>
                </div>
                <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search size={18} />}
                    fullWidth
                />
            </div>

            <div className="explore-tabs">
                <button
                    onClick={() => setActiveTab('media')}
                    className={`tab ${activeTab === 'media' ? 'tab-active' : ''}`}
                >
                    <FileText size={20} />
                    <span>Media</span>
                </button>
                <button
                    onClick={() => setActiveTab('people')}
                    className={`tab ${activeTab === 'people' ? 'tab-active' : ''}`}
                >
                    <Users size={20} />
                    <span>People</span>
                </button>
                <button
                    onClick={() => setActiveTab('confessions')}
                    className={`tab ${activeTab === 'confessions' ? 'tab-active' : ''}`}
                >
                    <FileText size={20} />
                    <span>Confessions</span>
                </button>
            </div>

            <div className="explore-content">
                {activeTab === 'media' && (
                    <MediaGrid />
                )}

                {activeTab === 'people' && (
                    <div className="people-grid">
                        {filteredPeople.map((person) => (
                            <div key={person.id} className="person-card-enhanced">
                                <Link to={`/profile/${person.id}`} className="person-avatar-link">
                                    <Avatar
                                        src={person.avatar_url}
                                        fallback={person.name}
                                        size="sm"
                                    />
                                </Link>
                                <div className="person-info-enhanced">
                                    <h3>{person.name}</h3>
                                    <p className="person-status-text">{person.status || 'No status'}</p>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => navigate(`/profile/${person.id}`)}
                                        fullWidth
                                    >
                                        View Profile
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {filteredPeople.length === 0 && (
                            <div className="empty-state">No people found</div>
                        )}
                    </div>
                )}

                {activeTab === 'confessions' && (
                    <div className="confessions-list">
                        {confessions.map((confession) => (
                            <div key={confession.id} className="confession-card">
                                <p>{confession.content}</p>
                                <span className="confession-time">
                                    {new Date(confession.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
