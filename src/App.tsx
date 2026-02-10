import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastContainer } from './components/ui'
import { LandingPage } from './pages/auth/LandingPage'
import { SplitLanding } from './pages/auth/SplitLanding'
import { ForcePasswordChange } from './pages/auth/ForcePasswordChange'
import { ProfileSetup } from './pages/auth/ProfileSetup'
import { AppShell } from './components/layout/AppShell'
import { Home } from './pages/Home'
import { Explore } from './pages/Explore'
import { Create } from './pages/Create'
import { Chats } from './pages/Chats'
import { ChatRoom } from './pages/ChatRoom'
import { CreateChat } from './pages/CreateChat'
import { Profile } from './pages/Profile'
import { EditProfile } from './pages/EditProfile'
import { Settings } from './pages/Settings'
import { ChangePassword } from './pages/ChangePassword'
import { Notifications } from './pages/Notifications'
import { Dashboard } from './pages/admin/Dashboard'
import { ConfessionModeration } from './pages/admin/ConfessionModeration'
import { Broadcast } from './pages/admin/Broadcast'
import { Reports } from './pages/admin/Reports'
import { Users } from './pages/admin/Users'
import { PostDetail } from './pages/PostDetail'
import './styles/globals.css'

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, profile, loading } = useAuth()

    if (loading) {
        return <div className="loading-screen">Loading...</div>
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    // Check for password change
    if (user.user_metadata?.needs_password_change) {
        return <Navigate to="/force-password" replace />
    }

    // Allow access to children if profile is still loading but session is valid
    if (profile && !profile.is_profile_complete) {
        return <Navigate to="/setup-profile" replace />
    }

    return <>{children}</>
}

// Auth-only Route (redirects to home if already authenticated)
function AuthRoute({ children }: { children: React.ReactNode }) {
    const { user, profile, loading } = useAuth()

    if (loading) {
        return <div className="loading-screen">Loading...</div>
    }

    if (user) {
        if (user.user_metadata?.needs_password_change) {
            return <Navigate to="/force-password" replace />
        }
        if (profile && !profile.is_profile_complete) {
            return <Navigate to="/setup-profile" replace />
        }
        return <Navigate to="/home" replace />
    }

    return <>{children}</>
}

// Admin-only Route
function AdminRoute({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth()

    if (loading) {
        return <div className="loading-screen">Loading...</div>
    }

    if (profile?.role !== 'admin') {
        return <Navigate to="/home" replace />
    }

    return <>{children}</>
}

function AppRoutes() {
    return (
        <Routes>
            {/* Public Entry */}
            <Route
                path="/"
                element={
                    <AuthRoute>
                        <LandingPage />
                    </AuthRoute>
                }
            />

            {/* Auth Routes */}
            <Route
                path="/login"
                element={
                    <AuthRoute>
                        <SplitLanding />
                    </AuthRoute>
                }
            />
            <Route path="/force-password" element={<ForcePasswordChange />} />
            <Route path="/setup-profile" element={<ProfileSetup />} />

            {/* Protected Routes */}
            <Route
                path="/*"
                element={
                    <ProtectedRoute>
                        <AppShell>
                            <Routes>
                                <Route path="/home" element={<Home />} />
                                <Route path="/explore" element={<Explore />} />
                                <Route path="/create" element={<Create />} />
                                <Route path="/chats" element={<Chats />} />
                                <Route path="/chats/:chatId" element={<ChatRoom />} />
                                <Route path="/create-chat" element={<CreateChat />} />
                                <Route path="/notifications" element={<Notifications />} />
                                <Route path="/profile/:userId" element={<Profile />} />
                                <Route path="/post/:postId" element={<PostDetail />} />
                                <Route path="/edit-profile" element={<EditProfile />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="/change-password" element={<ChangePassword />} />

                                {/* Admin Routes - Strictly Guarded */}
                                <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
                                <Route path="/admin/confessions" element={<AdminRoute><ConfessionModeration /></AdminRoute>} />
                                <Route path="/admin/reports" element={<AdminRoute><Reports /></AdminRoute>} />
                                <Route path="/admin/users" element={<AdminRoute><Users /></AdminRoute>} />
                                <Route path="/admin/broadcast" element={<AdminRoute><Broadcast /></AdminRoute>} />

                                <Route path="/" element={<Navigate to="/home" replace />} />
                            </Routes>
                        </AppShell>
                    </ProtectedRoute>
                }
            />
        </Routes>
    )
}

function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <AppRoutes />
                    <ToastContainer />
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    )
}

export default App
