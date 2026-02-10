import { useState } from 'react'
import { X, Image, Bell, Search, LogOut, Edit2, ChevronRight, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { sendSystemMessage } from '@/lib/api/chat'
import { toast } from '@/hooks/useToast'
import { useAuth } from '@/contexts/AuthContext'
import './ChatInfo.css'

interface ChatInfoProps {
    chat: any
    members: any[]
    onClose: () => void
    onUpdate: () => void
}

export function ChatInfo({ chat, members, onClose, onUpdate }: ChatInfoProps) {
    const navigate = useNavigate()
    const { profile } = useAuth()
    const [editingNicknameId, setEditingNicknameId] = useState<string | null>(null)
    const [nickname, setNickname] = useState('')
    const [editingName, setEditingName] = useState(false)
    const [newName, setNewName] = useState(chat?.name || '')

    // Resolve specific identity info
    const otherMember = chat?.type === 'dm' ? members.find(m => m.user_id !== profile?.id) : null
    const displayProfile = otherMember?.profiles || chat

    const handleUpdateName = async () => {
        if (!newName.trim() || !chat?.id || !profile) return
        try {
            const { error } = await supabase
                .from('chats')
                .update({ name: newName.trim() })
                .eq('id', chat.id)

            if (error) throw error

            // Generate System Message
            await sendSystemMessage(chat.id, `${profile.name} changed the group name to "${newName.trim()}"`)

            toast.success('Group name updated!')
            setEditingName(false)
            onUpdate()
        } catch (error) {
            console.error('Error updating group name:', error)
            toast.error('Failed to update name')
        }
    }

    const handleUpdateNickname = async (targetUserId: string) => {
        if (!chat?.id || !profile) return
        try {
            const { error } = await supabase
                .from('chat_members')
                .update({ nickname: nickname.trim() || null })
                .eq('chat_id', chat.id)
                .eq('user_id', targetUserId)

            if (error) throw error

            // Resolve Target Member Name for the message
            const targetMember = members.find(m => m.user_id === targetUserId)
            const targetName = targetMember?.profiles?.name || 'User'

            const systemContent = nickname.trim()
                ? `${profile.name} changed ${targetName}'s nickname to "${nickname.trim()}"`
                : `${profile.name} cleared ${targetName}'s nickname`

            await sendSystemMessage(chat.id, systemContent)

            toast.success('Nickname updated!')
            setEditingNicknameId(null)
            onUpdate()
        } catch (error) {
            console.error('Error updating nickname:', error)
            toast.error('Failed to update nickname')
        }
    }

    const handleLeaveChat = async () => {
        if (!chat?.id || !profile?.id) return
        if (!window.confirm('Are you sure you want to leave this chat?')) return

        try {
            const { error } = await supabase
                .from('chat_members')
                .delete()
                .eq('chat_id', chat.id)
                .eq('user_id', profile.id)

            if (error) throw error
            toast.success('You left the chat')
            navigate('/chats')
        } catch (error) {
            console.error('Error leaving chat:', error)
            toast.error('Failed to leave chat')
        }
    }

    if (!chat) return null

    return (
        <div className="chat-info-sidebar">
            <header className="info-header">
                <button onClick={onClose} className="close-trigger" aria-label="Close sidebar">
                    <X size={24} />
                </button>
                <h3>{chat.type === 'dm' ? 'Profile Details' : 'Chat Details'}</h3>
            </header>

            <div className="info-scroll-area">
                <section className="info-hero">
                    <div className="hero-avatar-wrapper">
                        <Avatar
                            src={displayProfile?.avatar_url || chat?.avatar_url}
                            fallback={displayProfile?.name || chat?.name || 'Chat'}
                            size="xl"
                        />
                    </div>

                    <div className="hero-details">
                        {editingName ? (
                            <div className="title-edit-mode">
                                <input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    autoFocus
                                    className="title-input"
                                />
                                <div className="edit-options">
                                    <button onClick={() => setEditingName(false)} className="btn-cancel">Cancel</button>
                                    <button onClick={handleUpdateName} className="btn-save">Save</button>
                                </div>
                            </div>
                        ) : (
                            <div className="title-display">
                                <h2>{otherMember?.nickname || displayProfile?.name || chat?.name || 'Unknown User'}</h2>
                                {(chat.type === 'group' || chat.type === 'class') && (
                                    <button onClick={() => setEditingName(true)} className="edit-trigger">
                                        <Edit2 size={16} />
                                    </button>
                                )}
                            </div>
                        )}
                        <span className="subtitle">
                            {chat.type === 'dm' ? 'Direct Message' : `${members.length} members`}
                        </span>
                    </div>
                </section>

                <nav className="quick-actions">
                    <button className="action-tile">
                        <Search size={22} />
                        <span>Search</span>
                    </button>
                    <button className="action-tile">
                        <Bell size={22} />
                        <span>Mute</span>
                    </button>
                    <button className="action-tile">
                        <Image size={22} />
                        <span>Media</span>
                    </button>
                </nav>

                <div className="info-divider" />

                <section className="members-listing">
                    <div className="section-header">
                        <h4>{chat.type === 'dm' ? 'Participant' : 'Group Members'}</h4>
                        {chat.type !== 'dm' && <button className="btn-add-member"><Plus size={16} /> Add</button>}
                    </div>

                    <div className="members-list">
                        {members.map(member => {
                            const isMe = member.user_id === profile?.id
                            const mProfile = member.profiles
                            const isEditing = editingNicknameId === member.user_id

                            return (
                                <div key={member.user_id} className="member-card">
                                    <div className="member-meta" onClick={() => navigate(`/profile/${member.user_id}`)}>
                                        <Avatar src={mProfile?.avatar_url} fallback={mProfile?.name} size="md" />
                                        <div className="member-names">
                                            <span className="real-name">{mProfile?.name || 'User'} {isMe && '(You)'}</span>
                                            {member.nickname && <span className="nickname-tag">"{member.nickname}"</span>}
                                        </div>
                                        <ChevronRight size={18} className="arrow-icon" />
                                    </div>

                                    {!isMe && (
                                        <div className="nickname-control">
                                            {isEditing ? (
                                                <div className="nickname-edit-panel">
                                                    <input
                                                        value={nickname}
                                                        onChange={(e) => setNickname(e.target.value)}
                                                        placeholder="Enter nickname..."
                                                        autoFocus
                                                    />
                                                    <div className="edit-btns">
                                                        <button onClick={() => setEditingNicknameId(null)}>Cancel</button>
                                                        <button onClick={() => handleUpdateNickname(member.user_id)} className="btn-save-nick">Save</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    className="btn-trigger-nickname"
                                                    onClick={() => {
                                                        setEditingNicknameId(member.user_id)
                                                        setNickname(member.nickname || '')
                                                    }}
                                                >
                                                    {member.nickname ? 'Change Nickname' : 'Set Nickname'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </section>

                <div className="info-divider" />

                <section className="danger-zone">
                    <button onClick={handleLeaveChat} className="btn-leave">
                        <LogOut size={20} />
                        <span>Leave Conversation</span>
                    </button>
                </section>
            </div>
        </div>
    )
}
