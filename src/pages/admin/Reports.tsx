import { useState, useEffect } from 'react'
import { getReports, resolveReport, deleteReportedContent } from '@/lib/api/reports'
import { formatDistanceToNow } from 'date-fns'
import { toast } from '@/hooks/useToast'
import { Check, Trash2, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './Reports.css'

export function Reports() {
    const [reports, setReports] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetchReports()
    }, [])

    const fetchReports = async () => {
        try {
            setLoading(true)
            const data = await getReports()
            setReports(data || [])
        } catch (error) {
            console.error('Error fetching reports:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleResolve = async (id: string) => {
        try {
            await resolveReport(id)
            toast.success('Report resolved')
            fetchReports()
        } catch (error) {
            toast.error('Failed to resolve report')
        }
    }

    const handleDeleteContent = async (type: string, id: string, reportId: string) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return
        try {
            await deleteReportedContent(type, id)
            await resolveReport(reportId)
            toast.success('Content deleted and report resolved')
            fetchReports()
        } catch (error) {
            toast.error('Failed to delete content')
        }
    }

    return (
        <div className="admin-reports">
            <header className="reports-header">
                <h1>Reported Content</h1>
            </header>

            <div className="reports-container">
                {loading ? (
                    <div className="loading">Loading reports...</div>
                ) : reports.length === 0 ? (
                    <div className="empty">No reports found</div>
                ) : (
                    <div className="reports-grid">
                        {reports.map((report) => (
                            <div key={report.id} className={`report-card ${report.status}`}>
                                <div className="report-main">
                                    <div className="report-badge">{report.target_type}</div>
                                    <p className="report-reason">"{report.reason}"</p>
                                    <div className="report-meta">
                                        <span>By: {report.reporter?.name}</span>
                                        <span>•</span>
                                        <span>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
                                    </div>
                                </div>
                                <div className="report-actions">
                                    {report.status === 'pending' && (
                                        <button
                                            className="action-btn resolve"
                                            onClick={() => handleResolve(report.id)}
                                            title="Mark as Resolved"
                                        >
                                            <Check size={18} />
                                        </button>
                                    )}
                                    <button
                                        className="action-btn view"
                                        onClick={() => {
                                            if (report.target_type === 'post') navigate(`/post/${report.target_id}`)
                                            else toast.info('View not implemented for this type yet')
                                        }}
                                        title="View Content"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    <button
                                        className="action-btn delete"
                                        onClick={() => handleDeleteContent(report.target_type, report.target_id, report.id)}
                                        title={`Delete ${report.target_type}`}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
