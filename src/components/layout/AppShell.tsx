import { BottomNav } from './BottomNav'
import { NotificationCenter } from './NotificationCenter'
import { useNotifications } from '@/hooks/useNotifications'
import './AppShell.css'

interface AppShellProps {
    children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
    useNotifications() // Initialize device notifications listener

    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="header-left">
                    <NotificationCenter />
                    <span className="app-logo">ClassroomX</span>
                </div>
                <div className="header-right">
                    {/* Potential Search or User Profile icon */}
                </div>
            </header>
            <main className="app-main">{children}</main>
            <BottomNav />
        </div>
    )
}
