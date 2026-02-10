import { useState } from 'react'
import { Copy, Share, Send } from 'lucide-react'
import { Modal, Avatar } from '@/components/ui'
import { toast } from '@/hooks/useToast'
import { getChats } from '@/lib/api/chat'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import './ShareModal.css'

interface ShareModalProps {
    postId: string
    isOpen: boolean
    onClose: () => void
    isProfile?: boolean
}

export function ShareModal({ postId, isOpen, onClose, isProfile }: ShareModalProps) {
    const { profile: currentUser } = useAuth()
    const shareUrl = `${window.location.origin}/${isProfile ? 'u' : 'post'}/${postId}`
    const [sendingInChat, setSendingInChat] = useState<string | null>(null) // Stores chatId being sent to
    const [recentChats, setRecentChats] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [showChatPicker, setShowChatPicker] = useState(false)
    const [sentChats, setSentChats] = useState<string[]>([]) // Track which chats shared successfully

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl)
        toast.success(`${isProfile ? 'Profile' : 'Post'} link copied!`)
        onClose()
    }

    const loadRecentChats = async () => {
        if (!currentUser) return
        try {
            const chats = await getChats(currentUser.id)
            // Resolve names for DMs
            const resolvedChats = chats.map(chat => {
                if (chat.type === 'dm') {
                    const otherMember = chat.members?.find((m: any) => m.user_id !== currentUser.id)
                    return {
                        ...chat,
                        displayName: otherMember?.nickname || otherMember?.profiles?.name || 'Direct Message',
                        displayAvatar: otherMember?.profiles?.avatar_url
                    }
                }
                return {
                    ...chat,
                    displayName: chat.name || (chat.type === 'class' ? 'Class Chat' : 'Group Chat'),
                    displayAvatar: chat.avatar_url
                }
            })
            setRecentChats(resolvedChats)
            setShowChatPicker(true)
        } catch (error) {
            console.error('Error loading chats:', error)
            toast.error('Failed to load chats')
        }
    }

    const filteredChats = recentChats.filter(chat =>
        chat.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSendToChat = async (chatId: string) => {
        if (sentChats.includes(chatId)) return
        setSendingInChat(chatId)
        try {
            if (isProfile) {
                const { data: sharedProfile } = await supabase
                    .from('profiles')
                    .select('name, avatar_url')
                    .eq('id', postId)
                    .single()

                const { error: sendError } = await supabase.from('messages').insert({
                    chat_id: chatId,
                    sender_id: currentUser?.id,
                    content: sharedProfile?.name || 'Shared a profile',
                    type: 'profile',
                    extra_data: {
                        user_id: postId,
                        avatar: sharedProfile?.avatar_url
                    }
                })
                if (sendError) throw sendError
            } else {
                const { data: post } = await supabase
                    .from('posts')
                    .select('caption, post_media(media_url)')
                    .eq('id', postId)
                    .single()

                const { error: sendError } = await supabase.from('messages').insert({
                    chat_id: chatId,
                    sender_id: currentUser?.id,
                    content: post?.caption || 'Shared a post',
                    type: 'post',
                    extra_data: {
                        post_id: postId,
                        thumbnail: post?.post_media?.[0]?.media_url
                    }
                })
                if (sendError) throw sendError
            }

            setSentChats(prev => [...prev, chatId])
            toast.success('Shared!')
        } catch (error) {
            console.error('Error sending to chat:', error)
            toast.error('Failed to send')
        } finally {
            setSendingInChat(null)
        }
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Check out this ${isProfile ? 'profile' : 'post'} on ClassroomX`,
                    text: isProfile ? 'Check out this profile!' : 'Found this cool post!',
                    url: shareUrl
                })
                onClose()
            } catch (error) {
                console.log('Error sharing:', error)
            }
        } else {
            handleCopy()
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={showChatPicker ? "Send to Chat" : `Share ${isProfile ? 'Profile' : 'Post'}`}>
            {!showChatPicker ? (
                <div className="share-options">
                    <button className="share-option-btn" onClick={handleCopy}>
                        <div className="icon-wrapper copy"><Copy size={24} /></div>
                        <span>Copy Link</span>
                    </button>

                    <button className="share-option-btn" onClick={handleShare}>
                        <div className="icon-wrapper share"><Share size={24} /></div>
                        <span>Share via...</span>
                    </button>

                    <button className="share-option-btn" onClick={loadRecentChats}>
                        <div className="icon-wrapper send"><Send size={24} /></div>
                        <span>Send in Chat</span>
                    </button>
                </div>
            ) : (
                <div className="chat-picker-container">
                    <div className="chat-search">
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="chat-picker-list">
                        {filteredChats.map(chat => (
                            <div key={chat.id} className="chat-picker-row">
                                <button
                                    className={`chat-picker-item ${sentChats.includes(chat.id) ? 'sent' : ''}`}
                                    disabled={sendingInChat !== null || sentChats.includes(chat.id)}
                                    onClick={() => handleSendToChat(chat.id)}
                                >
                                    <Avatar src={chat.displayAvatar} fallback={chat.displayName} size="sm" />
                                    <span>{chat.displayName}</span>
                                    {sendingInChat === chat.id && <div className="sending-spinner" />}
                                    {sentChats.includes(chat.id) && <div className="sent-indicator">✓</div>}
                                </button>
                            </div>
                        ))}
                        {filteredChats.length === 0 && <p className="empty-picker">No chats found.</p>}
                    </div>
                    <button className="btn-back-picker" onClick={() => setShowChatPicker(false)}>Back</button>
                </div>
            )}

            {!showChatPicker && (
                <div className="share-link-preview">
                    <input type="text" value={shareUrl} readOnly />
                    <button onClick={handleCopy}>Copy</button>
                </div>
            )}
        </Modal>
    )
}
