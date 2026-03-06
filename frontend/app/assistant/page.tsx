import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAssistantData } from '@/lib/actions/assistant'
import InboxList from '@/components/assistant/inbox-list'
import TaskBoard from '@/components/assistant/task-board'

export default async function AssistantPage() {
  const { messages, tasks } = await getAssistantData()

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-bold text-slate-900">Assistant</h1>
        <p className="text-slate-500">Unified Inbox & Task Management</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        
        {/* Left: Inbox (4 cols) */}
        <div className="lg:col-span-4 flex flex-col min-h-0">
          <h2 className="font-bold text-slate-700 mb-4 px-1">Inbox ({messages.filter((m: any) => !m.is_read).length})</h2>
          <div className="flex-1 overflow-y-auto pr-2">
            <InboxList messages={messages} />
          </div>
        </div>

        {/* Right: Tasks (8 cols) */}
        <div className="lg:col-span-8 flex flex-col min-h-0">
          <h2 className="font-bold text-slate-700 mb-4 px-1">Tasks</h2>
          <div className="flex-1 min-h-0 bg-slate-50/50 rounded-2xl p-2">
            <TaskBoard tasks={tasks} />
          </div>
        </div>

      </div>
    </div>
  )
}
