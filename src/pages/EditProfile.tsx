import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getProfile, updateProfile, uploadAvatar, uploadBanner } from '@/lib/api/profiles'
import { Avatar, Button, Input, Textarea } from '@/components/ui'
import { toast } from '@/hooks/useToast'
import './EditProfile.css'

export function EditProfile() {
    const navigate = useNavigate()
    const { profile: currentUser } = useAuth()

    const [name, setName] = useState('')
    const [bio, setBio] = useState('')
    const [status, setStatus] = useState('')
    const [location, setLocation] = useState('')
    const [activity, setActivity] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [bannerUrl, setBannerUrl] = useState('')
    const [saving, setSaving] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [uploadingBanner, setUploadingBanner] = useState(false)

    const avatarInputRef = useRef<HTMLInputElement>(null)
    const bannerInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (currentUser?.id) loadProfileData()
    }, [currentUser?.id])

    const loadProfileData = async () => {
        try {
            const data = await getProfile(currentUser!.id)
            setName(data.name || '')
            setBio(data.bio || '')
            setStatus(data.status || '')
            setLocation(data.location || '')
            setActivity(data.activity || '')
            setAvatarUrl(data.avatar_url || '')
            setBannerUrl(data.banner_url || '')
        } catch (error) {
            console.error('Error loading profile:', error)
        }
    }

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !currentUser) return

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be under 5MB')
            return
        }

        setUploadingAvatar(true)
        try {
            const url = await uploadAvatar(currentUser.id, file)
            setAvatarUrl(url)
            toast.success('Avatar updated!')
        } catch (error) {
            console.error('Error uploading avatar:', error)
            toast.error('Failed to upload avatar')
        } finally {
            setUploadingAvatar(false)
        }
    }

    const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !currentUser) return

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image must be under 10MB')
            return
        }

        setUploadingBanner(true)
        try {
            const url = await uploadBanner(currentUser.id, file)
            setBannerUrl(url)
            toast.success('Banner updated!')
        } catch (error) {
            console.error('Error uploading banner:', error)
            toast.error('Failed to upload banner')
        } finally {
            setUploadingBanner(false)
        }
    }

    const handleSave = async () => {
        if (!currentUser) return

        setSaving(true)
        try {
            await updateProfile(currentUser.id, {
                name: name.trim(),
                bio: bio.trim(),
                status: status.trim(),
                location: location.trim(),
                activity: activity.trim()
            })
            toast.success('Profile updated!')
            navigate(`/profile/${currentUser.id}`)
        } catch (error) {
            console.error('Error updating profile:', error)
            toast.error('Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="edit-profile-page">
            <div className="edit-profile-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={24} />
                </button>
                <h2>Edit Profile</h2>
                <Button onClick={handleSave} disabled={saving} size="sm" className="save-profile-btn">
                    {saving ? <Loader2 size={16} className="spinner" /> : 'Save'}
                </Button>
            </div>

            {/* Banner Upload */}
            <div className="edit-banner-section" onClick={() => bannerInputRef.current?.click()}>
                {bannerUrl ? (
                    <img src={bannerUrl} alt="Banner" className="edit-banner-img" />
                ) : (
                    <div className="edit-banner-placeholder" />
                )}
                <div className="banner-overlay">
                    {uploadingBanner ? (
                        <Loader2 size={24} className="spinner" />
                    ) : (
                        <>
                            <Camera size={24} />
                            <span>Change Banner</span>
                        </>
                    )}
                </div>
                <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerChange} style={{ display: 'none' }} />
            </div>

            {/* Avatar Upload */}
            <div className="edit-avatar-section">
                <div className="edit-avatar-wrapper" onClick={() => avatarInputRef.current?.click()}>
                    <Avatar src={avatarUrl} fallback={name} size="xl" />
                    <div className="avatar-overlay">
                        {uploadingAvatar ? (
                            <Loader2 size={20} className="spinner" />
                        ) : (
                            <Camera size={20} />
                        )}
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </div>
            </div>

            {/* Form Fields */}
            <div className="edit-form">
                <div className="edit-field">
                    <label>Display Name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>

                <div className="edit-field">
                    <label>Bio</label>
                    <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} />
                </div>

                <div className="edit-field">
                    <label>Current Activity</label>
                    <Input
                        value={activity}
                        onChange={(e) => setActivity(e.target.value)}
                        placeholder="What are you up to? (e.g., Studying for finals 📚)"
                    />
                </div>

                <div className="edit-field">
                    <label>Status</label>
                    <Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Set a status" />
                </div>

                <div className="edit-field">
                    <label>Location</label>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Your location" />
                </div>
            </div>
        </div>
    )
}
