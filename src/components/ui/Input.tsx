import React, { InputHTMLAttributes, forwardRef } from 'react'
import './Input.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    fullWidth?: boolean
    icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, fullWidth, icon, className = '', ...props }, ref) => {
        const inputId = props.id || `input-${Math.random().toString(36).slice(2)}`

        return (
            <div className={`input-wrapper ${fullWidth ? 'input-full' : ''}`}>
                {label && (
                    <label htmlFor={inputId} className="input-label">
                        {label}
                    </label>
                )}
                <div className="input-container">
                    {icon && <div className="input-icon">{icon}</div>}
                    <input
                        ref={ref}
                        id={inputId}
                        className={`input ${error ? 'input-error' : ''} ${icon ? 'input-with-icon' : ''
                            } ${className}`}
                        {...props}
                    />
                </div>
                {error && <span className="input-error-text">{error}</span>}
            </div>
        )
    }
)

Input.displayName = 'Input'
