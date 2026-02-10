import { supabase } from '../supabase'

export async function getProfile(userId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    if (error) throw error
    return data
}

export async function updateProfile(userId: string, updates: Record<string, any>) {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const filePath = `avatars/${userId}_${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('media').getPublicUrl(filePath)

    // Update profile with new avatar URL
    await updateProfile(userId, { avatar_url: data.publicUrl })

    return data.publicUrl
}

export async function uploadBanner(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const filePath = `banners/${userId}_${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('media').getPublicUrl(filePath)

    // Update profile with new banner URL
    await updateProfile(userId, { banner_url: data.publicUrl })

    return data.publicUrl
}

export async function searchProfiles(query: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .ilike('name', `%${query}%`)
        .limit(10)

    if (error) throw error
    return data
}
