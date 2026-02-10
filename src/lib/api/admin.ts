import { supabase } from '../supabase'

export async function getAllUsers() {
    const { data, error } = await supabase.rpc('get_all_users')
    if (error) throw error
    return data
}

export async function adminUpdateUserRole(userId: string, newRole: 'student' | 'teacher' | 'admin') {
    const { data, error } = await supabase.rpc('admin_update_user_role', {
        target_user_id: userId,
        new_role: newRole
    })
    if (error) throw error
    return data
}

export async function adminDeletePost(postId: string) {
    const { data, error } = await supabase.rpc('admin_delete_post', {
        post_id: postId
    })
    if (error) throw error
    return data
}

export async function getAdminStats() {
    const { data: posts } = await supabase.from('posts').select('id', { count: 'exact' })
    const { data: users } = await supabase.from('profiles').select('id', { count: 'exact' })
    const { data: confessions } = await supabase.from('confessions').select('id', { count: 'exact' })
    const { data: reports } = await supabase.from('reports').select('id', { count: 'exact' }).eq('status', 'pending')

    return {
        posts: posts?.length || 0,
        users: users?.length || 0,
        confessions: confessions?.length || 0,
        pendingReports: reports?.length || 0
    }
}
export async function getConfessions(onlyPending = false) {
    let query = supabase.from('confessions').select('*')
    if (onlyPending) {
        query = query.eq('is_approved', false)
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data
}

export async function approveConfession(id: string) {
    const { data, error } = await supabase
        .from('confessions')
        .update({ is_approved: true })
        .eq('id', id)
    if (error) throw error
    return data
}

export async function deleteConfession(id: string) {
    const { error } = await supabase.from('confessions').delete().eq('id', id)
    if (error) throw error
    return true
}

export async function createBroadcast(title: string, message: string) {
    // This typically involves inserting into a notifications table or calling an RPC
    const { data, error } = await supabase.rpc('send_broadcast_notification', {
        title,
        message
    })
    if (error) throw error
    return data
}

export async function adminCreateUser(email: string, name: string, role: string) {
    const { data, error } = await supabase.rpc('admin_create_profile', {
        user_email: email,
        user_name: name,
        user_role: role
    })
    if (error) throw error
    return data
}
