import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Edit2, Trash2, Flag, Link, Bookmark, EyeOff } from 'lucide-react'
import { toast } from '@/hooks/useToast'
import './PostOptions.css'

interface PostOptionsProps {
    isOwner: boolean
    onEdit?: () => void
    onDelete?: () => void
    onReport?: () => void
    onSave?: () => void
    onHide?: () => void
    postUrl: string
    isSaved?: boolean
}

export function PostOptions({ isOwner, onEdit, onDelete, onReport, onSave, onHide, postUrl, isSaved }: PostOptionsProps) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleCopyLink = () => {
        const fullUrl = `${window.location.origin}${postUrl}`
        navigator.clipboard.writeText(fullUrl)
        toast.success('Link copied to clipboard!')
        setIsOpen(false)
    }

    return (
        <div className="post-options-container" ref={menuRef}>
            <button
                className="post-options-trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Post options"
            >
                <MoreVertical size={20} />
            </button>

            {isOpen && (
                <div className="post-options-menu">
                    {isOwner ? (
                        <>
                            <button className="menu-item" onClick={() => { onEdit?.(); setIsOpen(false); }}>
                                <Edit2 size={18} />
                                <span>Edit Post</span>
                            </button>
                            <button className="menu-item delete" onClick={() => { onDelete?.(); setIsOpen(false); }}>
                                <Trash2 size={18} />
                                <span>Delete Post</span>
                            </button>
                        </>
                    ) : (
                        <button className="menu-item" onClick={() => { onReport?.(); setIsOpen(false); }}>
                            <Flag size={18} />
                            <span>Report Inappropriate</span>
                        </button>
                    )}
                    <button className="menu-item" onClick={() => { onSave?.(); setIsOpen(false); }}>
                        <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                        <span>{isSaved ? 'Unsave Post' : 'Save Post'}</span>
                    </button>
                    {!isOwner && (
                        <button className="menu-item" onClick={() => { onHide?.(); setIsOpen(false); }}>
                            <EyeOff size={18} />
                            <span>Hide Post</span>
                        </button>
                    )}
                    <button className="menu-item" onClick={handleCopyLink}>
                        <Link size={18} />
                        <span>Copy Link</span>
                    </button>
                </div>
            )}
        </div>
    )
}
