import './Avatar.css'

interface AvatarProps {
    src?: string | null
    alt?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    fallback?: string
    online?: boolean
    className?: string
}

export function Avatar({
    src,
    alt = 'Avatar',
    size = 'md',
    fallback,
    online,
    className = '',
}: AvatarProps) {
    const getInitials = (name?: string) => {
        if (!name) return '?'
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const initials = fallback ? getInitials(fallback) : 'U'

    return (
        <div className={`avatar avatar-${size} ${className}`}>
            {src ? (
                <img src={src} alt={alt} className="avatar-img" />
            ) : (
                <div className="avatar-fallback">{initials}</div>
            )}
            {online !== undefined && (
                <span
                    className={`avatar-status ${online ? 'avatar-online' : 'avatar-offline'}`}
                    aria-label={online ? 'Online' : 'Offline'}
                />
            )}
        </div>
    )
}
