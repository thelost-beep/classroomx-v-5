import { TextareaHTMLAttributes, forwardRef } from 'react'
import './Textarea.css'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: string
    fullWidth?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, fullWidth, className = '', ...props }, ref) => {
        const textareaId =
            props.id || `textarea-${Math.random().toString(36).slice(2)}`

        return (
            <div className={`textarea-wrapper ${fullWidth ? 'textarea-full' : ''}`}>
                {label && (
                    <label htmlFor={textareaId} className="textarea-label">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    className={`textarea ${error ? 'textarea-error' : ''} ${className}`}
                    {...props}
                />
                {error && <span className="textarea-error-text">{error}</span>}
            </div>
        )
    }
)

Textarea.displayName = 'Textarea'
