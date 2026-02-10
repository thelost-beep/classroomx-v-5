import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Moon, Sun, Bell, Lock, LogOut, User, MapPin, Activity, Camera } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { Input, Textarea, Button, Avatar as CustomAvatar } from '@/components/ui'
import { uploadAvatar, uploadBanner } from '@/lib/api/profiles'
import { toast } from '@/hooks/useToast'
import './Settings.css'

export function Settings() {
    const { profile, setProfile, signOut } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState(true)

    // Profile Editing State
    const [name, setName] = useState('')
    const [bio, setBio] = useState('')
    const [status, setStatus] = useState('')
    const [location, setLocation] = useState('')
    const [saving, setSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        if (profile) {
            setName(profile.name || '')
            setBio(profile.bio || '')
            setStatus(profile.status || '')
            setLocation(profile.location || '')
        }
    }, [profile])

    // Check for changes to enable save button
    useEffect(() => {
        if (!profile) return
        const changed =
            name !== profile.name ||
            bio !== (profile.bio || '') ||
            status !== (profile.status || '') ||
            location !== (profile.location || '')

        setHasChanges(changed)
    }, [name, bio, status, location, profile])

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        if (!event.target.files || event.target.files.length === 0 || !profile) return

        const file = event.target.files[0]
        try {
            setSaving(true)
            if (type === 'avatar') {
                await uploadAvatar(profile.id, file)
            } else {
                await uploadBanner(profile.id, file)
            }

            // Update local state by refetching or manually patching
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', profile.id)
                .single()

            if (data) setProfile(data)
            toast.success(`${type === 'avatar' ? 'Profile picture' : 'Banner'} updated!`)

        } catch (error) {
            console.error('Error uploading image:', error)
            toast.error('Failed to upload image')
        } finally {
            setSaving(false)
        }
    }

    const handleSaveProfile = async () => {
        if (!profile) return
        setSaving(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    name: name.trim(),
                    bio: bio.trim(),
                    status: status.trim(),
                    location: location.trim()
                })
                .eq('id', profile.id)
                .select()
                .single()

            if (error) throw error

            setProfile(data)
            toast.success('Profile updated successfully!')
            setHasChanges(false)
        } catch (error) {
            console.error('Error updating profile:', error)
            toast.error('Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    const handleLogout = async () => {
        if (confirm('Are you sure you want to logout?')) {
            await signOut()
            navigate('/login')
        }
    }

    return (
        <div className="settings-page">
            <div className="settings-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={24} />
                </button>
                <h1>Settings</h1>
                {hasChanges && (
                    <Button
                        size="sm"
                        onClick={handleSaveProfile}
                        loading={saving}
                        className="save-profile-btn"
                    >
                        Save
                    </Button>
                )}
            </div>

            <div className="settings-header-banner">
                {profile?.banner_url ? (
                    <img src={profile.banner_url} alt="Banner" className="settings-banner-img" />
                ) : (
                    <div className="settings-banner-placeholder" />
                )}
                <div className="banner-edit-overlay" onClick={() => document.getElementById('banner-upload')?.click()}>
                    <Camera size={24} />
                    <span>Change Banner</span>
                </div>
                <input
                    id="banner-upload"
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'banner')}
                />
            </div>

            <div className="settings-avatar-wrapper">
                <div className="settings-avatar-container" onClick={() => document.getElementById('avatar-upload')?.click()}>
                    <CustomAvatar
                        src={profile?.avatar_url}
                        fallback={profile?.name}
                        size="xl"
                    />
                    <div className="avatar-edit-overlay">
                        <Camera size={20} />
                    </div>
                </div>
                <input
                    id="avatar-upload"
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'avatar')}
                />
            </div>

            <div className="settings-content">

                {/* PROFILE IDENTITY SECTION */}
                <div className="settings-section">
                    <h2>Identity & Bio</h2>
                    <div className="settings-form-group">
                        <Input
                            label="Display Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            icon={<User size={16} />}
                            fullWidth
                        />
                        <Input
                            label="Current Status"
                            placeholder="What are you doing right now?"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            icon={<Activity size={16} />}
                            fullWidth
                        />
                        <Input
                            label="Location"
                            placeholder="City, Country"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            icon={<MapPin size={16} />}
                            fullWidth
                        />
                        <Textarea
                            label="About You"
                            placeholder="Tell your story..."
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <div className="settings-section">
                    <h2>Appearance</h2>
                    <div className="settings-item" onClick={toggleTheme}>
                        {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                        <div className="settings-item-content">
                            <span className="settings-item-label">Theme</span>
                            <span className="settings-item-value">
                                {theme === 'dark' ? 'Dark' : 'Light'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <h2>Notifications</h2>
                    <div
                        className="settings-item"
                        onClick={() => setNotifications(!notifications)}
                    >
                        <Bell size={20} />
                        <div className="settings-item-content">
                            <span className="settings-item-label">Push Notifications</span>
                            <span className="settings-item-value">
                                {notifications ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <h2>Privacy & Security</h2>
                    <div className="settings-item" onClick={() => navigate('/change-password')}>
                        <Lock size={20} />
                        <div className="settings-item-content">
                            <span className="settings-item-label">Change Password</span>
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <h2>Account</h2>
                    <div className="settings-item settings-item-danger" onClick={handleLogout}>
                        <LogOut size={20} />
                        <div className="settings-item-content">
                            <span className="settings-item-label">Logout</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
