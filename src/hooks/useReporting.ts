import { useState } from 'react'
import { createReport } from '@/lib/api/reports'
import { toast } from './useToast'

export function useReporting() {
    const [reporting, setReporting] = useState(false)

    const report = async (type: 'post' | 'comment' | 'confession' | 'bug', id: string, reason: string) => {
        try {
            setReporting(true)
            await createReport(type, id, reason)
            toast.success('Report submitted successfully. Thank you!')
            return true
        } catch (error) {
            console.error('Reporting error:', error)
            toast.error('Failed to submit report. Please try again.')
            return false
        } finally {
            setReporting(false)
        }
    }

    return { report, reporting }
}
