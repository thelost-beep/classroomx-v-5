import { supabase } from '../supabase'

export async function createReport(targetType: 'post' | 'comment' | 'confession' | 'bug', targetId: string, reason: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('reports')
        .insert({
            reporter_id: user.id,
            target_type: targetType,
            target_id: targetId,
            reason
        })

    if (error) throw error
    return true
}

export async function getReports() {
    const { data, error } = await supabase
        .from('reports')
        .select(`
            *,
            reporter:reporter_id (name, email)
        `)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}
export async function resolveReport(reportId: string) {
    const { data, error } = await supabase
        .from('reports')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', reportId)

    if (error) throw error
    return data
}

export async function deleteReportedContent(targetType: string, targetId: string) {
    const table = targetType === 'post' ? 'posts' : (targetType === 'confession' ? 'confessions' : 'comments')
    const { error } = await supabase.from(table).delete().eq('id', targetId)
    if (error) throw error
    return true
}
