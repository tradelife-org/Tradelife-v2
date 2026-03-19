'use client'

import { ReactNode } from 'react'
import { Panel } from '@/components/ui/Panel'
import { SortableStack } from './SortableStack'
import { useUIStore } from '@/store/useUIStore'

/* ── Data ─────────────────────────────────────────────── */

const attentionItems = [
  { id: '1', label: '3 invoices overdue', type: 'warning' as const },
  { id: '2', label: 'VAT return due in 5 days', type: 'danger' as const },
  { id: '3', label: 'Quote #047 awaiting approval', type: 'warning' as const },
]

const activeProjects = [
  { id: '1', name: 'Kitchen Renovation', client: 'Mrs. Patterson', progress: 72 },
  { id: '2', name: 'Office Fit-Out', client: 'Apex Ltd', progress: 45 },
  { id: '3', name: 'Bathroom Remodel', client: 'Mr. Singh', progress: 90 },
]

const activeTrades = [
  { id: '1', name: 'Plumbing', status: 'on-site' },
  { id: '2', name: 'Electrical', status: 'on-site' },
  { id: '3', name: 'Carpentry', status: 'scheduled' },
  { id: '4', name: 'Painting', status: 'completed' },
]

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">{children}</h3>
}

/* ── Widget renderers ─────────────────────────────────── */

const widgets: Record<string, () => ReactNode> = {
  attention: () => (
    <Panel data-testid="panel-attention">
      <SectionHeader>Attention Needed</SectionHeader>
      <div className="space-y-2" data-testid="attention-needed-list">
        {attentionItems.map((item) => (
          <div key={item.id} data-testid={`attention-item-${item.id}`} className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] inset-material">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.type === 'danger' ? 'var(--danger)' : 'var(--warning)' }} />
            <span className="text-xs text-[var(--text-primary)]">{item.label}</span>
          </div>
        ))}
      </div>
    </Panel>
  ),
  projects: () => (
    <Panel data-testid="panel-projects">
      <SectionHeader>Active Projects</SectionHeader>
      <div className="space-y-2.5" data-testid="active-projects-list">
        {activeProjects.map((project) => (
          <div key={project.id} data-testid={`project-${project.id}`} className="px-3 py-3 rounded-[var(--radius-md)] inset-material">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-[var(--text-primary)]">{project.name}</span>
              <span className="text-[10px] font-medium text-[var(--accent)]">{project.progress}%</span>
            </div>
            <div className="w-full h-1 rounded-full bg-[var(--border-strong)]">
              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${project.progress}%` }} />
            </div>
            <span className="text-[10px] text-[var(--text-muted)] mt-1.5 block">{project.client}</span>
          </div>
        ))}
      </div>
    </Panel>
  ),
  trades: () => (
    <Panel data-testid="panel-trades">
      <SectionHeader>Active Trades</SectionHeader>
      <div className="space-y-2" data-testid="active-trades-list">
        {activeTrades.map((trade) => (
          <div key={trade.id} data-testid={`trade-${trade.id}`} className="flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-md)] inset-material">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: trade.status === 'on-site' ? 'var(--success)' : trade.status === 'scheduled' ? 'var(--warning)' : 'var(--text-muted)' }} />
              <span className="text-xs font-medium text-[var(--text-primary)]">{trade.name}</span>
            </div>
            <span className="text-[10px] font-medium capitalize" style={{ color: trade.status === 'on-site' ? 'var(--success)' : trade.status === 'scheduled' ? 'var(--warning)' : 'var(--text-muted)' }}>
              {trade.status.replace('-', ' ')}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  ),
}

/* ── Component ────────────────────────────────────────── */

export function LeftStack() {
  const leftOrder = useUIStore((s) => s.leftOrder)
  const setLeftOrder = useUIStore((s) => s.setLeftOrder)

  return (
    <div className="lg:col-span-3" data-testid="left-column">
      <SortableStack
        items={leftOrder}
        onReorder={setLeftOrder}
        renderWidget={(id) => widgets[id]?.() ?? null}
        testId="left-sortable"
      />
    </div>
  )
}
