import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, MapPin, FileText, Upload } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button, Input, Textarea, Avatar } from '@/components/ui'
import { toast } from '@/hooks/useToast'
import './ProfileSetup.css'

export function ProfileSetup() {
    const { profile, updateProfile } = useAuth()
    const [name, setName] = useState(profile?.name || '')
    const [bio, setBio] = useState(profile?.bio || '')
    const [status, setStatus] = useState(profile?.status || '')
    const [location, setLocation] = useState(profile?.location || '')
    const [avatar, setAvatar] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || '')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Avatar must be less than 5MB')
                return
            }
            setAvatar(file)
            setAvatarPreview(URL.createObjectURL(file))
        }
    }

    const uploadAvatar = async () => {
        if (!avatar || !profile) return null

        const fileExt = avatar.name.split('.').pop()
        const fileName = `${profile.id}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatar)

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return null
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        return data.publicUrl
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            toast.error('Please enter your name')
            return
        }

        setLoading(true)

        try {
            let avatarUrl = profile?.avatar_url

            if (avatar) {
                const uploadedUrl = await uploadAvatar()
                if (uploadedUrl) {
                    avatarUrl = uploadedUrl
                } else {
                    toast.error('Failed to upload avatar')
                    setLoading(false)
                    return
                }
            }

            const { error } = await updateProfile({
                name,
                bio,
                status,
                location,
                avatar_url: avatarUrl,
                is_profile_complete: true,
            })

            if (error) {
                toast.error(error.message || 'Failed to update profile')
            } else {
                toast.success('Profile setup complete!')
                navigate('/home')
            }
        } catch (err) {
            toast.error('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="profile-setup">
            <div className="profile-setup-container">
                <div className="profile-setup-header">
                    <h1>Complete Your Profile</h1>
                    <p>Let your classmates know who you are</p>
                </div>

                <form onSubmit={handleSubmit} className="profile-setup-form">
                    <div className="avatar-upload">
                        <Avatar
                            src={avatarPreview}
                            fallback={name}
                            size="xl"
                        />
                        <label htmlFor="avatar-input" className="avatar-upload-button">
                            <Upload size={16} />
                            <span>Upload Photo</span>
                            <input
                                id="avatar-input"
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>

                    <Input
                        label="Full Name"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        icon={<User size={18} />}
                        required
                        fullWidth
                    />

                    <Input
                        label="Status"
                        placeholder="What's on your mind?"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        icon={<FileText size={18} />}
                        fullWidth
                    />

                    <Input
                        label="Location"
                        placeholder="Where are you from?"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        icon={<MapPin size={18} />}
                        fullWidth
                    />

                    <Textarea
                        label="Bio"
                        placeholder="Tell us about yourself..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        fullWidth
                        rows={4}
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        loading={loading}
                    >
                        Complete Setup
                    </Button>
                </form>
            </div>
        </div>
    )
}
