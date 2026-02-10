import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/useToast'
import './ChangePassword.css'

export function ChangePassword() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (passwords.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwords.newPassword
            })

            if (error) throw error

            toast.success('Password updated successfully')
            navigate('/settings')
        } catch (error: any) {
            console.error('Error updating password:', error)
            toast.error(error.message || 'Failed to update password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="change-password-page">
            <header className="page-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={24} />
                </button>
                <h1>Change Password</h1>
                <div style={{ width: 24 }} />
            </header>

            <form onSubmit={handleSubmit} className="change-password-form">
                <div className="form-group">
                    <label>New Password</label>
                    <div className="input-wrapper">
                        <Lock size={18} className="input-icon" />
                        <input
                            type="password"
                            value={passwords.newPassword}
                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                            placeholder="Min. 6 characters"
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Confirm New Password</label>
                    <div className="input-wrapper">
                        <Lock size={18} className="input-icon" />
                        <input
                            type="password"
                            value={passwords.confirmPassword}
                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                            placeholder="Repeat new password"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading || !passwords.newPassword}
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Updating...</span>
                        </>
                    ) : (
                        <span>Update Password</span>
                    )}
                </button>
            </form>
        </div>
    )
}
