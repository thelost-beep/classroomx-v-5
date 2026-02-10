import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, Profile } from '@/lib/supabase'

interface AuthContextType {
    user: User | null
    profile: Profile | null
    session: Session | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: any }>
    signOut: () => Promise<void>
    updatePassword: (newPassword: string) => Promise<{ error: any }>
    updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>
    refreshProfile: () => Promise<void>
    setProfile: React.Dispatch<React.SetStateAction<Profile | null>>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) throw error
            setProfile(data)
        } catch (error) {
            console.error('Error fetching profile:', error)
            setProfile(null)
        }
    }

    useEffect(() => {
        let mounted = true
        let initializing = false

        const handleAuthStateChange = async (session: Session | null) => {
            if (!mounted || initializing) return
            initializing = true

            try {
                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user) {
                    // Fetch profile if user exists
                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single()

                    if (mounted) {
                        if (profileError) {
                            console.error('Error fetching profile:', profileError)
                            setProfile(null)
                        } else {
                            setProfile(profileData)
                        }
                    }
                } else {
                    if (mounted) setProfile(null)
                }
            } catch (error) {
                console.error('Auth handler error:', error)
            } finally {
                if (mounted) {
                    setLoading(false)
                    initializing = false
                }
            }
        }

        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleAuthStateChange(session)
        })

        // Listener for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth event:', event)
            if (event === 'SIGNED_OUT') {
                if (mounted) {
                    setSession(null)
                    setUser(null)
                    setProfile(null)
                    setLoading(false)
                }
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                handleAuthStateChange(session)
            }
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        return { error }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
    }

    const updatePassword = async (newPassword: string) => {
        try {
            // 1. Update the password and user metadata
            const { data, error } = await supabase.auth.updateUser({
                password: newPassword,
                data: { needs_password_change: false }
            })

            if (error) return { error }

            if (data.user) {
                // 2. Refresh session immediately to get updated JWT with new metadata
                const { data: { session: newSession } } = await supabase.auth.getSession()

                if (newSession) {
                    setSession(newSession)
                    setUser(newSession.user)
                    // 3. Force profile refresh to ensure is_profile_complete is checked correctly later
                    await fetchProfile(newSession.user.id)
                }
            }

            return { error: null }
        } catch (error) {
            console.error('Password update error:', error)
            return { error }
        }
    }

    const updateProfile = async (updates: Partial<Profile>) => {
        if (!user) return { error: new Error('No user') }

        const { error } = await supabase
            .from('profiles')
            .update({
                ...updates,
                // Ensure profile is marked complete if this is the final setup step
                is_profile_complete: updates.is_profile_complete ?? true
            })
            .eq('id', user.id)

        if (!error) {
            await fetchProfile(user.id)
        }

        return { error }
    }

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id)
        }
    }

    const value = {
        user,
        profile,
        session,
        loading,
        signIn,
        signOut,
        updatePassword,
        updateProfile,
        refreshProfile,
        setProfile,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
