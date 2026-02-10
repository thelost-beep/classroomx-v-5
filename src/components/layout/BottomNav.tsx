import { NavLink } from 'react-router-dom'
import { Home, Compass, PlusCircle, MessageCircle, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import './BottomNav.css'

export function BottomNav() {
    const { profile } = useAuth()

    const navItems = [
        { to: '/home', icon: Home, label: 'Home' },
        { to: '/explore', icon: Compass, label: 'Explore' },
        { to: '/create', icon: PlusCircle, label: 'Create' },
        { to: '/chats', icon: MessageCircle, label: 'Chats' },
        { to: `/profile/${profile?.id}`, icon: User, label: 'Profile' },
    ]

    return (
        <nav className="bottom-nav">
            <div className="bottom-nav-container">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'nav-item-active' : ''}`
                        }
                    >
                        <item.icon size={24} />
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}
