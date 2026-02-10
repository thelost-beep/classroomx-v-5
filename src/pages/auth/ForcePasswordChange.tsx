import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Input } from '@/components/ui'
import { toast } from '@/hooks/useToast'
import './ForcePasswordChange.css'

export function ForcePasswordChange() {
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const { updatePassword } = useAuth()
    const navigate = useNavigate()

    const validatePassword = () => {
        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters long')
            return false
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match')
            return false
        }
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validatePassword()) return

        setLoading(true)

        try {
            const { error } = await updatePassword(newPassword)

            if (error) {
                toast.error(error.message || 'Failed to update password')
            } else {
                toast.success('Password updated successfully!')
                // Navigate immediately - AuthContext state updates will trigger re-render
                // and ProtectedRoute will handle the flow
                navigate('/setup-profile', { replace: true })
            }
        } catch (err) {
            toast.error('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="force-password">
            <div className="force-password-container">
                <div className="force-password-header">
                    <div className="lock-icon">
                        <Lock size={32} />
                    </div>
                    <h1>Change Your Password</h1>
                    <p>
                        For security, you must change your password before continuing.
                        Choose a strong, unique password.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="force-password-form">
                    <div className="password-input-wrapper">
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            label="New Password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            icon={<Lock size={18} />}
                            required
                            fullWidth
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="password-toggle"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <Input
                        type={showPassword ? 'text' : 'password'}
                        label="Confirm Password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        icon={<Lock size={18} />}
                        required
                        fullWidth
                        autoComplete="new-password"
                    />

                    <div className="password-requirements">
                        <p className="requirements-title">Password Requirements:</p>
                        <ul>
                            <li className={newPassword.length >= 8 ? 'valid' : ''}>
                                At least 8 characters
                            </li>
                            <li className={newPassword === confirmPassword && newPassword ? 'valid' : ''}>
                                Passwords match
                            </li>
                        </ul>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        loading={loading}
                    >
                        Continue
                    </Button>
                </form>
            </div>
        </div>
    )
}
