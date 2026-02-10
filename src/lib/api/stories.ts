import { supabase } from '../supabase'

// =====================================================
// STORIES API
// =====================================================

export async function getStories() {
    const { data, error } = await supabase
        .from('stories')
        .select(`
      *,
      profiles:user_id (
        id,
        name,
        avatar_url
      )
    `)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
}

export async function createStory(userId: string, mediaUrl: string, mediaType: 'image' | 'video') {
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const { data, error } = await supabase
        .from('stories')
        .insert({
            user_id: userId,
            media_url: mediaUrl,
            media_type: mediaType,
            expires_at: expiresAt.toISOString()
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

export async function markStoryAsSeen(storyId: string, userId: string) {
    const { data: story } = await supabase
        .from('stories')
        .select('seen_by')
        .eq('id', storyId)
        .single()

    if (story) {
        const seenBy = story.seen_by || []
        if (!seenBy.includes(userId)) {
            await supabase
                .from('stories')
                .update({ seen_by: [...seenBy, userId] })
                .eq('id', storyId)
        }
    }
}

export async function uploadStoryMedia(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('stories').getPublicUrl(filePath)
    return data.publicUrl
}
