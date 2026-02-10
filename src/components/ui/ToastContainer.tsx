import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import './ToastContainer.css'

const iconMap = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
}

export function ToastContainer() {
    const { toasts, removeToast } = useToast()

    return (
        <div className="toast-container">
            {toasts.map((toast) => {
                const Icon = iconMap[toast.type]
                return (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        <Icon size={20} className="toast-icon" />
                        <span className="toast-message">{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="toast-close"
                            aria-label="Close toast"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
