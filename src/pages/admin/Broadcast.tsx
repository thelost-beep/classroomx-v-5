import { useState } from 'react'
import { Send } from 'lucide-react'
import { createBroadcast } from '@/lib/api/admin'
import { Input, Textarea, Button } from '@/components/ui'
import { toast } from '@/hooks/useToast'
import './Broadcast.css'

export function Broadcast() {
    const [title, setTitle] = useState('')
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !message.trim()) {
            toast.error('Please fill all fields')
            return
        }

        setSending(true)
        try {
            await createBroadcast(title.trim(), message.trim())
            toast.success('Broadcast sent to all users!')
            setTitle('')
            setMessage('')
        } catch (error) {
            console.error('Error sending broadcast:', error)
            toast.error('Failed to send broadcast')
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="broadcast-page">
            <div className="admin-header">
                <h1>Send Broadcast Notification</h1>
                <p>Send a message to all users</p>
            </div>

            <form onSubmit={handleSend} className="broadcast-form">
                <Input
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Notification title"
                    fullWidth
                />

                <Textarea
                    label="Message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Your message here..."
                    rows={6}
                />

                <Button
                    type="submit"
                    loading={sending}
                    disabled={sending || !title.trim() || !message.trim()}
                    fullWidth
                >
                    <Send size={18} />
                    Send to All Users
                </Button>
            </form>
        </div>
    )
}
