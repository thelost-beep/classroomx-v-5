import React, { ButtonHTMLAttributes, forwardRef } from 'react'
import './Button.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    fullWidth?: boolean
    loading?: boolean
    children: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            fullWidth = false,
            loading = false,
            disabled,
            children,
            className = '',
            ...props
        },
        ref
    ) => {
        const classes = [
            'btn',
            `btn-${variant}`,
            `btn-${size}`,
            fullWidth && 'btn-full',
            loading && 'btn-loading',
            className,
        ]
            .filter(Boolean)
            .join(' ')

        return (
            <button
                ref={ref}
                className={classes}
                disabled={disabled || loading}
                {...props}
            >
                {loading && (
                    <span className="btn-spinner" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle
                                cx="8"
                                cy="8"
                                r="6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeDasharray="30"
                                strokeDashoffset="0"
                            >
                                <animateTransform
                                    attributeName="transform"
                                    type="rotate"
                                    from="0 8 8"
                                    to="360 8 8"
                                    dur="1s"
                                    repeatCount="indefinite"
                                />
                            </circle>
                        </svg>
                    </span>
                )}
                <span className="btn-content">{children}</span>
            </button>
        )
    }
)

Button.displayName = 'Button'
