import { supabase } from '@/lib/supabase'

export async function getMessages(chatId: string) {
    const { data, error } = await supabase
        .from('messages')
        .select(`
            *,
            profiles:sender_id(id, name, avatar_url),
            message_reactions(id, emoji, user_id)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

    if (error) throw error
    return data
}

export async function sendMessage(chatId: string, senderId: string, content: string, mediaUrl?: string, extraData?: any) {
    const { error } = await supabase
        .from('messages')
        .insert({
            chat_id: chatId,
            sender_id: senderId,
            content,
            media_url: mediaUrl,
            type: mediaUrl ? 'image' : 'text',
            extra_data: extraData
        })

    if (error) throw error
}

export async function sendSystemMessage(chatId: string, content: string) {
    const { error } = await supabase
        .from('messages')
        .insert({
            chat_id: chatId,
            sender_id: null,
            content,
            type: 'system'
        })

    if (error) throw error
}

export async function createChat(type: 'dm' | 'group', name: string | null, memberIds: string[]) {
    const { data: chatData, error: chatError } = await supabase
        .rpc('create_new_chat', {
            p_type: type,
            p_name: name,
            p_member_ids: memberIds
        })

    if (chatError) throw chatError
    return chatData
}

export async function getChats(userId: string) {
    const { data, error } = await supabase
        .from('chat_members')
        .select(`
            chat_id,
            nickname,
            last_read_at,
            chats (
                id,
                name,
                type,
                created_at,
                last_message_at,
                last_message_preview,
                members:chat_members (
                    user_id,
                    nickname,
                    profiles:user_id (id, name, avatar_url)
                )
            )
        `)
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false, foreignTable: 'chats' })

    if (error) throw error
    return data.map((item: any) => ({
        ...item.chats,
        my_nickname: item.nickname,
        last_read_at: item.last_read_at
    }))
}

export async function getClassChat() {
    const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('type', 'class')
        .limit(1)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching class chat:', error)
        return null
    }

    if (data) return data

    const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({ type: 'class', name: 'Class 10' })
        .select()
        .single()

    if (createError) {
        console.error('Error creating class chat:', createError)
        return null
    }

    return newChat
}

// Upload media for chat
export async function uploadChatMedia(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
    const filePath = `chat-media/${fileName}`

    const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

    if (uploadError) throw uploadError

    const { data } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

    return data.publicUrl
}

// Mark messages as read using server-side precision
export async function markMessagesRead(chatId: string, userId: string) {
    const { error } = await supabase.rpc('mark_chat_as_read', {
        v_chat_id: chatId,
        v_user_id: userId
    })

    if (error) {
        console.error('Error in mark_chat_as_read RPC:', error)
        // Fallback to manual update if RPC fails (e.g. not migrated yet)
        await supabase
            .from('chat_members')
            .update({ last_read_at: new Date().toISOString() })
            .eq('chat_id', chatId)
            .eq('user_id', userId)
    }
}

// Get message status details for a specific message
export async function getMessageStatusDetails(messageId: string) {
    const { data, error } = await supabase
        .from('message_status')
        .select(`
            *,
            profiles:user_id(id, name, avatar_url)
        `)
        .eq('message_id', messageId)

    if (error) throw error
    return data || []
}

export async function findOrCreateDM(currentUserId: string, targetUserId: string) {
    // Check if DM exists
    const { data: existing, error: findError } = await supabase
        .rpc('find_common_chats', { user1: currentUserId, user2: targetUserId })

    if (findError) {
        console.error('Error finding common chats:', findError)
    }

    if (existing && existing.length > 0) {
        // Find the DM among common chats
        const existingDM = existing.find((c: any) => c.chat_type === 'dm')
        if (existingDM) {
            const { data: dmChat } = await supabase
                .from('chats')
                .select('*')
                .eq('id', existingDM.chat_id)
                .single()

            if (dmChat) return dmChat
        }
    }

    // Create new DM
    return createChat('dm', null, [currentUserId, targetUserId])
}
