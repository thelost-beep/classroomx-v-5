import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, FileText, AlertTriangle, MessageSquare } from 'lucide-react'
import { getAdminStats } from '@/lib/api/admin'
import './Dashboard.css'

export function Dashboard() {
    const [stats, setStats] = useState({
        posts: 0,
        users: 0,
        confessions: 0,
        pendingReports: 0
    })

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const data = await getAdminStats()
            setStats(data)
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <h1>Admin Dashboard</h1>
            </div>

            <div className="admin-stats">
                <div className="stat-card">
                    <Users size={32} />
                    <div className="stat-info">
                        <span className="stat-value">{stats.users}</span>
                        <span className="stat-label">Total Users</span>
                    </div>
                </div>

                <div className="stat-card">
                    <FileText size={32} />
                    <div className="stat-info">
                        <span className="stat-value">{stats.posts}</span>
                        <span className="stat-label">Total Posts</span>
                    </div>
                </div>

                <div className="stat-card">
                    <MessageSquare size={32} />
                    <div className="stat-info">
                        <span className="stat-value">{stats.confessions}</span>
                        <span className="stat-label">Confessions</span>
                    </div>
                </div>

                <div className="stat-card stat-card-warning">
                    <AlertTriangle size={32} />
                    <div className="stat-info">
                        <span className="stat-value">{stats.pendingReports}</span>
                        <span className="stat-label">Pending Reports</span>
                    </div>
                </div>
            </div>

            <div className="admin-actions">
                <Link to="/admin/users" className="admin-action-btn">
                    <Users size={24} />
                    <span>Manage Users</span>
                </Link>

                <Link to="/admin/confessions" className="admin-action-btn">
                    <MessageSquare size={24} />
                    <span>Moderate Confessions</span>
                </Link>

                <Link to="/admin/reports" className="admin-action-btn">
                    <AlertTriangle size={24} />
                    <span>View Reports</span>
                </Link>

                <Link to="/admin/broadcast" className="admin-action-btn">
                    <FileText size={24} />
                    <span>Send Broadcast</span>
                </Link>
            </div>
        </div>
    )
}
