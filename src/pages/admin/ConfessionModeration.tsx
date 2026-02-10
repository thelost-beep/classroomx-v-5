import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { getConfessions, approveConfession, deleteConfession } from '@/lib/api/admin'
import { Button } from '@/components/ui'
import { toast } from '@/hooks/useToast'
import './ConfessionModeration.css'

interface Confession {
    id: string
    content: string
    is_approved: boolean
    created_at: string
}

export function ConfessionModeration() {
    const [confessions, setConfessions] = useState<Confession[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchConfessions()
    }, [])

    const fetchConfessions = async () => {
        try {
            const data = await getConfessions(true)
            setConfessions(data.filter(c => !c.is_approved))
        } catch (error) {
            console.error('Error fetching confessions:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (id: string) => {
        try {
            await approveConfession(id)
            setConfessions(confessions.filter(c => c.id !== id))
            toast.success('Confession approved')
        } catch (error) {
            toast.error('Failed to approve')
        }
    }

    const handleReject = async (id: string) => {
        try {
            await deleteConfession(id)
            setConfessions(confessions.filter(c => c.id !== id))
            toast.success('Confession rejected')
        } catch (error) {
            toast.error('Failed to reject')
        }
    }

    return (
        <div className="confession-moderation">
            <div className="admin-header">
                <h1>Moderate Confessions</h1>
                <p>{confessions.length} pending approval</p>
            </div>

            {loading ? (
                <div className="loading">Loading...</div>
            ) : confessions.length === 0 ? (
                <div className="empty-state">No confessions pending approval</div>
            ) : (
                <div className="confession-list">
                    {confessions.map((confession) => (
                        <div key={confession.id} className="confession-item">
                            <p className="confession-content">{confession.content}</p>
                            <span className="confession-date">
                                {new Date(confession.created_at).toLocaleDateString()}
                            </span>
                            <div className="confession-actions">
                                <Button
                                    variant="secondary"
                                    onClick={() => handleReject(confession.id)}
                                >
                                    <X size={18} />
                                    Reject
                                </Button>
                                <Button onClick={() => handleApprove(confession.id)}>
                                    <Check size={18} />
                                    Approve
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
