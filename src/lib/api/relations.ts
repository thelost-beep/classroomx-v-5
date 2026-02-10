import { supabase } from '@/lib/supabase'

export interface BestieRelation {
    id: string
    user_id: string
    bestie_id: string
    status: 'pending' | 'accepted'
    created_at: string
}

// Send a bestie request
export async function sendBestieRequest(userId: string, targetUserId: string) {
    const { data, error } = await supabase
        .from('besties')
        .insert({
            user_id: userId,
            bestie_id: targetUserId,
            status: 'pending'
        })
        .select()
        .single()

    if (error) {
        if (error.code === '23505') return null
        throw error
    }
    return data
}

// Accept a bestie request
export async function acceptBestieRequest(currentUserId: string, fromUserId: string) {
    const { data, error } = await supabase
        .from('besties')
        .update({ status: 'accepted' })
        .eq('user_id', fromUserId)
        .eq('bestie_id', currentUserId)
        .eq('status', 'pending')
        .select()
        .single()

    if (error) throw error
    return data
}

// Remove/Decline bestie by user IDs
export async function removeBestie(userId: string, targetUserId: string) {
    const { error } = await supabase
        .from('besties')
        .delete()
        .or(`and(user_id.eq.${userId},bestie_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},bestie_id.eq.${userId})`)

    if (error) throw error
}

// Get status between current user and target user
export async function getBestieStatus(currentUserId: string, targetUserId: string): Promise<string> {
    const { data, error } = await supabase
        .from('besties')
        .select('*')
        .or(`and(user_id.eq.${currentUserId},bestie_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},bestie_id.eq.${currentUserId})`)
        .maybeSingle()

    if (error) throw error
    if (!data) return 'none'
    if (data.status === 'accepted') return 'accepted'
    if (data.status === 'pending') {
        // If current user sent it, it's pending; if other user sent it, it's incoming
        return data.user_id === currentUserId ? 'pending' : 'incoming'
    }
    return 'none'
}

// Get all accepted besties for a profile
export async function getProfileBesties(profileId: string) {
    const { data, error } = await supabase
        .from('besties')
        .select(`
            id,
            created_at,
            user_id,
            bestie_id,
            status
        `)
        .eq('status', 'accepted')
        .or(`user_id.eq.${profileId},bestie_id.eq.${profileId}`)

    if (error) throw error
    return data || []
}
