import { supabase } from '../supabase'

// =====================================================
// POSTS API
// =====================================================

export async function likePost(postId: string, userId: string) {
    const { data, error } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: userId })
        .select()
        .single()

    if (error) throw error
    return data
}

export async function unlikePost(postId: string, userId: string) {
    const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)

    if (error) throw error
}

export async function checkIfLiked(postId: string, userId: string) {
    const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
}

export async function getLikeCount(postId: string) {
    const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)

    if (error) throw error
    return count || 0
}

// =====================================================
// COMMENTS API
// =====================================================

export async function getComments(postId: string) {
    const { data, error } = await supabase
        .from('comments')
        .select(`
      *,
      profiles:user_id (
        id,
        name,
        avatar_url
      )
    `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
}

export async function addComment(postId: string, userId: string, content: string) {
    const { data, error } = await supabase
        .from('comments')
        .insert({
            post_id: postId,
            user_id: userId,
            content
        })
        .select(`
      *,
      profiles:user_id (
        id,
        name,
        avatar_url
      )
    `)
        .single()

    if (error) throw error
    return data
}

export async function deleteComment(commentId: string) {
    const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

    if (error) throw error
}

export async function getCommentCount(postId: string) {
    const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)

    if (error) throw error
    return count || 0
}

export async function getUserPosts(userId: string) {
    const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            profiles:user_id (id, name, avatar_url),
            post_media (*),
            _count:comments (count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

export async function updatePost(postId: string, caption: string) {
    const { data, error } = await supabase
        .from('posts')
        .update({ caption, updated_at: new Date().toISOString() })
        .eq('id', postId)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function deletePost(postId: string) {
    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

    if (error) throw error
    return true
}
