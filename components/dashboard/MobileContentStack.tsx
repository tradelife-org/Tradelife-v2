'use client'

import { Panel } from '@/components/ui/Panel'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

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

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">{children}</h3>
}

export function MobileContentStack() {
  return (
    <div className="lg:hidden space-y-4" data-testid="mobile-content-stack">
      {/* Attention Needed */}
      <Panel data-testid="mobile-panel-attention">
        <SectionHeader>Attention Needed</SectionHeader>
        <div className="space-y-2">
          {attentionItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] inset-material">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.type === 'danger' ? 'var(--danger)' : 'var(--warning)' }} />
              <span className="text-xs text-[var(--text-primary)]">{item.label}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Active Projects */}
      <Panel data-testid="mobile-panel-projects">
        <SectionHeader>Active Projects</SectionHeader>
        <div className="space-y-2.5">
          {activeProjects.map((project) => (
            <div key={project.id} className="px-3 py-3 rounded-[var(--radius-md)] inset-material">
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

      {/* Financial Overview */}
      <Panel data-testid="mobile-panel-financial">
        <SectionHeader>Financial Overview</SectionHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="px-3 py-3 rounded-[var(--radius-md)] inset-material">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Revenue</span>
              <ArrowUpRight className="w-3 h-3 text-[var(--success)]" />
            </div>
            <div className="text-lg font-semibold text-[var(--text-primary)]">£24.5k</div>
            <div className="text-[10px] text-[var(--success)]">+12%</div>
          </div>
          <div className="px-3 py-3 rounded-[var(--radius-md)] inset-material">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Profit</span>
              <ArrowUpRight className="w-3 h-3 text-[var(--success)]" />
            </div>
            <div className="text-lg font-semibold text-[var(--text-primary)]">£16.3k</div>
            <div className="text-[10px] text-[var(--success)]">+18%</div>
          </div>
          <div className="px-3 py-3 rounded-[var(--radius-md)] inset-material">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Expenses</span>
              <ArrowDownRight className="w-3 h-3 text-[var(--danger)]" />
            </div>
            <div className="text-lg font-semibold text-[var(--text-primary)]">£8.2k</div>
            <div className="text-[10px] text-[var(--danger)]">+3%</div>
          </div>
          <div className="px-3 py-3 rounded-[var(--radius-md)] inset-material">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Margin</span>
              <ArrowUpRight className="w-3 h-3 text-[var(--success)]" />
            </div>
            <div className="text-lg font-semibold text-[var(--success)]">66.5%</div>
            <div className="text-[10px] text-[var(--text-muted)]">healthy</div>
          </div>
        </div>
      </Panel>
    </div>
  )
}
