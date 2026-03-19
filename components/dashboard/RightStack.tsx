'use client'

import { ReactNode } from 'react'
import { Panel } from '@/components/ui/Panel'
import { SortableStack } from './SortableStack'
import { useUIStore } from '@/store/useUIStore'

/* ── Data ─────────────────────────────────────────────── */

const scheduleItems = [
  { id: '1', time: '09:00', label: 'Site visit — Unit 4' },
  { id: '2', time: '11:30', label: 'Supplier call — BuildCo' },
  { id: '3', time: '14:00', label: 'Client meeting — Smith' },
  { id: '4', time: '16:30', label: 'Inspection — Plot 12' },
]

const urgentTasks = [
  { id: '1', label: 'Submit VAT return' },
  { id: '2', label: 'Chase invoice #042' },
  { id: '3', label: 'Order materials for Unit 4' },
  { id: '4', label: 'Sign off snagging list' },
]

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">{children}</h3>
}

/* ── Widget renderers ─────────────────────────────────── */

const widgets: Record<string, () => ReactNode> = {
  schedule: () => (
    <Panel data-testid="panel-schedule">
      <SectionHeader>Schedule</SectionHeader>
      <div className="space-y-2" data-testid="schedule-list">
        {scheduleItems.map((item) => (
          <div key={item.id} data-testid={`schedule-item-${item.id}`} className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] inset-material">
            <span className="text-[10px] font-mono font-medium text-[var(--accent)] w-10 shrink-0">{item.time}</span>
            <span className="text-xs text-[var(--text-primary)] flex-1 truncate">{item.label}</span>
          </div>
        ))}
      </div>
    </Panel>
  ),
  urgent: () => (
    <Panel data-testid="panel-urgent">
      <SectionHeader>Urgent Tasks</SectionHeader>
      <div className="space-y-2" data-testid="urgent-tasks-list">
        {urgentTasks.map((task) => (
          <div key={task.id} data-testid={`urgent-task-${task.id}`} className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] inset-material">
            <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-[var(--danger)]" />
            <span className="text-xs text-[var(--text-primary)]">{task.label}</span>
          </div>
        ))}
      </div>
    </Panel>
  ),
  financial: () => (
    <Panel data-testid="panel-financial">
      <SectionHeader>Financial Overview</SectionHeader>
      <div className="space-y-4" data-testid="financial-overview">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[var(--text-secondary)]">Total Revenue</span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">£24,500</span>
          </div>
          <div className="w-full h-1.5 rounded-full inset-material"><div className="h-full rounded-full bg-[var(--success)] w-[75%]" /></div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[var(--text-secondary)]">Expenses</span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">£8,200</span>
          </div>
          <div className="w-full h-1.5 rounded-full inset-material"><div className="h-full rounded-full bg-[var(--danger)] w-[33%]" /></div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[var(--text-secondary)]">Net Profit</span>
            <span className="text-sm font-semibold text-[var(--success)]">£16,300</span>
          </div>
          <div className="w-full h-1.5 rounded-full inset-material"><div className="h-full rounded-full bg-[var(--accent)] w-[66%]" /></div>
        </div>
        <div className="pt-3 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">Profit Margin</span>
            <span className="text-xs font-semibold text-[var(--success)]">66.5%</span>
          </div>
        </div>
      </div>
    </Panel>
  ),
}

/* ── Component ────────────────────────────────────────── */

export function RightStack() {
  const rightOrder = useUIStore((s) => s.rightOrder)
  const setRightOrder = useUIStore((s) => s.setRightOrder)

  return (
    <div className="col-span-12 lg:col-span-3" data-testid="right-column">
      <SortableStack
        items={rightOrder}
        onReorder={setRightOrder}
        renderWidget={(id) => widgets[id]?.() ?? null}
        testId="right-sortable"
      />
    </div>
  )
}
