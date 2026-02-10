import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('⚠️  Missing Supabase environment variables!')
    console.log('Please create a .env file with:')
    console.log('VITE_SUPABASE_URL=your-project-url')
    console.log('VITE_SUPABASE_ANON_KEY=your-anon-key')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
})

// Database Types
export interface Profile {
    id: string
    name: string
    email: string
    bio: string | null
    status: string | null
    location: string | null
    avatar_url: string | null
    banner_url: string | null
    role: 'student' | 'teacher' | 'admin'
    is_profile_complete: boolean
    created_at: string
}

export interface Post {
    id: string
    user_id: string
    caption: string | null
    type: 'media' | 'text'
    is_collab: boolean
    is_anonymous: boolean
    created_at: string
    profiles?: Profile
    post_media?: PostMedia[]
    likes?: Like[]
    comments?: Comment[]
    _count?: {
        likes: number
        comments: number
    }
}

export interface PostMedia {
    id: string
    post_id: string
    media_url: string
    media_type: 'image' | 'video'
    order_index: number
}

export interface Like {
    id: string
    post_id: string
    user_id: string
    created_at: string
}

export interface Comment {
    id: string
    post_id: string
    user_id: string
    content: string
    created_at: string
    profiles?: Profile
}

export interface Story {
    id: string
    user_id: string
    media_url: string
    media_type: 'image' | 'video'
    expires_at: string
    created_at: string
    profiles?: Profile
}

export interface Confession {
    id: string
    content: string
    media_url: string | null
    created_at: string
    is_approved: boolean
}

export interface Chat {
    id: string
    type: 'class' | 'group' | 'dm'
    name: string | null
    created_at: string
    chat_members?: ChatMember[]
    messages?: Message[]
    last_message?: Message
}

export interface ChatMember {
    chat_id: string
    user_id: string
    profiles?: Profile
}

export interface Message {
    id: string
    chat_id: string
    sender_id: string
    content: string | null
    media_url: string | null
    created_at: string
    profiles?: Profile
    extra_data?: any
}

export interface Notification {
    id: string
    user_id: string
    type: string
    message: string
    is_read: boolean
    created_at: string
    related_id: string | null
    priority?: 'high' | 'medium' | 'low'
    action_url?: string | null
}

export interface Bestie {
    id: string
    user_id: string
    bestie_id: string
    created_at: string
}
