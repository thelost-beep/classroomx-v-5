import React from 'react'
import './Skeleton.css'

interface SkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular'
    width?: string | number
    height?: string | number
    className?: string
}

export function Skeleton({
    variant = 'text',
    width,
    height,
    className = '',
}: SkeletonProps) {
    const style: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    }

    return (
        <div
            className={`skeleton skeleton-${variant} ${className}`}
            style={style}
            aria-busy="true"
            aria-label="Loading..."
        />
    )
}

// Preset skeleton components for common use cases
export function SkeletonPost() {
    return (
        <div className="skeleton-post">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Skeleton variant="circular" width={40} height={40} />
                <div style={{ flex: 1 }}>
                    <Skeleton width="40%" height={16} />
                    <Skeleton width="30%" height={12} />
                </div>
            </div>
            <Skeleton width="100%" height={400} />
            <div style={{ marginTop: '12px' }}>
                <Skeleton width="60%" height={14} />
                <Skeleton width="80%" height={14} />
            </div>
        </div>
    )
}

export function SkeletonChat() {
    return (
        <div className="skeleton-chat">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px' }}>
                <Skeleton variant="circular" width={48} height={48} />
                <div style={{ flex: 1 }}>
                    <Skeleton width="50%" height={18} />
                    <Skeleton width="70%" height={14} />
                </div>
            </div>
        </div>
    )
}
