'use client'

import { useState } from 'react'
import { GlassPanel } from '@/components/ui/glass-panel'
import { updateTaskStatusAction } from '@/lib/actions/assistant'
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react'

export default function TaskBoard({ tasks }: { tasks: any[] }) {
  // Group by Status
  const columns = {
    PENDING: tasks.filter(t => t.status === 'PENDING'),
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
    DONE: tasks.filter(t => t.status === 'DONE')
  }

  async function moveTask(taskId: string, newStatus: string) {
    // Optimistic update could happen here, but we'll rely on revalidate for MVP simplicity
    await updateTaskStatusAction(taskId, newStatus)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
      <TaskColumn 
        title="Pending" 
        tasks={columns.PENDING} 
        status="PENDING" 
        onMove={moveTask} 
        color="bg-slate-100"
      />
      <TaskColumn 
        title="In Progress" 
        tasks={columns.IN_PROGRESS} 
        status="IN_PROGRESS" 
        onMove={moveTask} 
        color="bg-blue-50"
      />
      <TaskColumn 
        title="Done" 
        tasks={columns.DONE} 
        status="DONE" 
        onMove={moveTask} 
        color="bg-green-50"
      />
    </div>
  )
}

function TaskColumn({ title, tasks, status, onMove, color }: any) {
  return (
    <div className={`rounded-xl p-4 flex flex-col h-full ${color}`}>
      <h3 className="font-bold text-slate-500 uppercase text-xs tracking-wider mb-4 px-1">{title} ({tasks.length})</h3>
      
      <div className="flex-1 space-y-3 overflow-y-auto">
        {tasks.map((task: any) => (
          <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 group">
            <h4 className="font-bold text-slate-800 text-sm mb-1">{task.title}</h4>
            <p className="text-xs text-slate-500 mb-2 line-clamp-2">{task.description}</p>
            
            {task.jobs && (
              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 mb-2 inline-block">
                {task.jobs.title}
              </span>
            )}

            <div className="flex justify-between items-center mt-2 border-t border-slate-50 pt-2">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(task.due_date).toLocaleDateString()}
              </span>
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {status !== 'PENDING' && (
                  <button onClick={() => onMove(task.id, 'PENDING')} className="p-1 hover:bg-slate-100 rounded" title="Move to Pending">
                    <Circle className="w-3 h-3 text-slate-400" />
                  </button>
                )}
                {status !== 'IN_PROGRESS' && (
                  <button onClick={() => onMove(task.id, 'IN_PROGRESS')} className="p-1 hover:bg-slate-100 rounded" title="Move to In Progress">
                    <Clock className="w-3 h-3 text-blue-500" />
                  </button>
                )}
                {status !== 'DONE' && (
                  <button onClick={() => onMove(task.id, 'DONE')} className="p-1 hover:bg-slate-100 rounded" title="Mark Done">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
