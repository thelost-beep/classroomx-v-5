import { create } from 'zustand'

export interface Toast {
    id: string
    type: 'success' | 'error' | 'info' | 'warning'
    message: string
    duration?: number
}

interface ToastStore {
    toasts: Toast[]
    addToast: (toast: Omit<Toast, 'id'>) => void
    removeToast: (id: string) => void
}

export const useToast = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (toast) => {
        const id = Math.random().toString(36).slice(2)
        set((state) => ({
            toasts: [...state.toasts, { ...toast, id }],
        }))

        const duration = toast.duration ?? 3000
        if (duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id),
                }))
            }, duration)
        }
    },
    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}))

// Helper functions
export const toast = {
    success: (message: string, duration?: number) =>
        useToast.getState().addToast({ type: 'success', message, duration }),
    error: (message: string, duration?: number) =>
        useToast.getState().addToast({ type: 'error', message, duration }),
    info: (message: string, duration?: number) =>
        useToast.getState().addToast({ type: 'info', message, duration }),
    warning: (message: string, duration?: number) =>
        useToast.getState().addToast({ type: 'warning', message, duration }),
}
