import React, { useState } from 'react'
import { Mail, Lock, BookOpen } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Input } from '@/components/ui'
import { toast } from '@/hooks/useToast'
import './SplitLanding.css'

export function SplitLanding() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await signIn(email, password)

            if (error) {
                toast.error(error.message || 'Invalid email or password')
            } else {
                toast.success('Welcome back!')
                // Navigation will be handled by route protection
            }
        } catch (err) {
            toast.error('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="split-landing">
            <div className="split-brand">
                <div className="brand-content">
                    <div className="brand-icon">
                        <BookOpen size={48} strokeWidth={1.5} />
                    </div>
                    <h1 className="brand-title">ClassroomX</h1>
                    <p className="brand-subtitle">Your Private Class Social Network</p>
                    <div className="brand-features">
                        <div className="feature-item">
                            <div className="feature-dot" />
                            <span>Stay Connected</span>
                        </div>
                        <div className="feature-item">
                            <div className="feature-dot" />
                            <span>Share Moments</span>
                        </div>
                        <div className="feature-item">
                            <div className="feature-dot" />
                            <span>Chat Instantly</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="split-login">
                <div className="login-content">
                    <div className="login-header">
                        <h2>Welcome Back</h2>
                        <p>Sign in to continue to ClassroomX</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <Input
                            type="email"
                            label="Email"
                            placeholder="firstname@classroomx.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={<Mail size={18} />}
                            required
                            fullWidth
                            autoComplete="email"
                        />

                        <Input
                            type="password"
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={<Lock size={18} />}
                            required
                            fullWidth
                            autoComplete="current-password"
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            fullWidth
                            loading={loading}
                        >
                            Sign In
                        </Button>
                    </form>

                    <p className="login-footer">
                        Don't have access? Contact your class admin.
                    </p>
                </div>
            </div>
        </div>
    )
}
