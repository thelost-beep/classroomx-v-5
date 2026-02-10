import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, LogIn, BookOpen, Sparkles, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui'
import './LandingPage.css'

export function LandingPage() {
    const navigate = useNavigate()
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            // For iOS or if the prompt isn't ready, show instructions
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            if (isIOS) {
                alert('To install: tap the Share icon below, then "Add to Home Screen"');
            } else {
                alert('App installation is not available or already installed. Check your browser menu.');
            }
            return
        }
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        console.log(`User response to the install prompt: ${outcome}`)
        setDeferredPrompt(null)
    }

    const handleLoginClick = () => {
        navigate('/login')
    }

    return (
        <div className="landing-container">
            {/* Floating Background Photos */}
            <div className="floating-photos">
                <div className="photo-item p1"><img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=400" alt="Students" /></div>
                <div className="photo-item p2"><img src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=400" alt="Graduation" /></div>
                <div className="photo-item p3"><img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=400" alt="Classroom" /></div>
                <div className="photo-item p4"><img src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&q=80&w=400" alt="School Life" /></div>
                <div className="photo-item p5"><img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=400" alt="Collaboration" /></div>
            </div>

            <div className="landing-overlay" />

            <main className="landing-content">
                <div className="hero-section">
                    <div className="app-logo-wrapper">
                        <BookOpen size={64} className="app-logo-icon" />
                        <div className="logo-glow" />
                    </div>

                    <h1 className="hero-title">
                        Classroom<span className="accent">X</span>
                    </h1>

                    <p className="hero-subtitle">
                        A private space for our school memories & conversations
                    </p>

                    <div className="cta-container">
                        <Button
                            variant="primary"
                            size="lg"
                            className="btn-download"
                            onClick={handleInstallClick}
                        >
                            <Download size={20} className="btn-icon" />
                            Download the App
                        </Button>

                        <button
                            className="btn-login-secondary"
                            onClick={handleLoginClick}
                        >
                            <LogIn size={18} className="btn-icon" />
                            Login to ClassroomX
                        </button>
                    </div>

                    <div className="install-hint">
                        <Smartphone size={14} />
                        <span>Best experienced as a mobile app</span>
                    </div>
                </div>

                <footer className="landing-footer">
                    <div className="feature-badges">
                        <span className="badge"><Sparkles size={14} /> Memories</span>
                        <span className="badge"><Sparkles size={14} /> Private</span>
                        <span className="badge"><Sparkles size={14} /> Safe</span>
                    </div>
                </footer>
            </main>
        </div>
    )
}
