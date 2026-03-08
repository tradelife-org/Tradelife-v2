'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAssistantData() {
  const supabase = createServerSupabaseClient()
  
  // 1. Fetch Inbox Messages
  const { data: messages } = await supabase
    .from('inbox_messages')
    .select('*')
    .order('created_at', { ascending: false })

  // 2. Fetch Tasks
  const { data: tasks } = await supabase
    .from('assistant_tasks')
    .select('*, jobs(title)')
    .order('due_date', { ascending: true })

  // 3. Simple AI Triage (Keyword Highlighting)
  // We do this at runtime for display
  const triagedMessages = messages?.map((msg: any) => {
    const content = msg.content.toLowerCase()
    const isUrgent = content.includes('emergency') || content.includes('leak') || content.includes('urgent')
    const isFinancial = content.includes('payment') || content.includes('invoice') || content.includes('cost')
    
    return {
      ...msg,
      tags: [
        isUrgent ? 'URGENT' : null,
        isFinancial ? 'FINANCE' : null
      ].filter(Boolean)
    }
  }) || []

  return {
    messages: triagedMessages,
    tasks: tasks || []
  }
}

export async function updateTaskStatusAction(taskId: string, status: string) {
  const supabase = createServerSupabaseClient()
  await supabase
    .from('assistant_tasks')
    .update({ status })
    .eq('id', taskId)
  
  revalidatePath('/assistant')
}

export async function markMessageReadAction(messageId: string) {
  const supabase = createServerSupabaseClient()
  await supabase
    .from('inbox_messages')
    .update({ is_read: true })
    .eq('id', messageId)
  
  revalidatePath('/assistant')
}
