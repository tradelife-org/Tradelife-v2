'use client'

import {
  Bell,
  Settings,
  User,
  AlertCircle,
  FolderOpen,
  TrendingUp,
  Cpu,
  FileText,
  BarChart3,
  Plus,
  Clock,
  CircleDot,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from 'lucide-react'

/* ─── Mock Data ──────────────────────────────────────────── */

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
  { id: '1', name: 'Plumbing', status: 'on-site' as const },
  { id: '2', name: 'Electrical', status: 'on-site' as const },
  { id: '3', name: 'Carpentry', status: 'scheduled' as const },
  { id: '4', name: 'Painting', status: 'completed' as const },
]

const scheduleItems = [
  { id: '1', time: '09:00', label: 'Site visit — Unit 4', tag: 'Visit' },
  { id: '2', time: '11:30', label: 'Supplier call — BuildCo', tag: 'Call' },
  { id: '3', time: '14:00', label: 'Client meeting — Smith', tag: 'Meeting' },
  { id: '4', time: '16:30', label: 'Inspection — Plot 12', tag: 'Inspection' },
]

const urgentTasks = [
  { id: '1', label: 'Submit VAT return' },
  { id: '2', label: 'Chase invoice #042' },
  { id: '3', label: 'Order materials for Unit 4' },
  { id: '4', label: 'Sign off snagging list' },
]

const overviewStats = [
  { label: 'Revenue', value: '£24,500', change: '+12%', positive: true },
  { label: 'Expenses', value: '£8,200', change: '+3%', positive: false },
  { label: 'Net Profit', value: '£16,300', change: '+18%', positive: true },
  { label: 'Outstanding', value: '£4,100', change: '-8%', positive: true },
]

/* ─── Small Components ──────────────────────────────────── */

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      data-testid="card"
      className={`bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg ${className}`}
    >
      {children}
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
      {children}
    </h3>
  )
}

function StatusDot({ color }: { color: string }) {
  return <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
}

/* ─── Dashboard Page ─────────────────────────────────────── */

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* ── Top Bar ─────────────────────────────────────── */}
      <header
        data-testid="top-bar"
        className="sticky top-0 z-50 h-14 border-b border-[var(--border)] bg-[var(--bg-base)] px-6 flex items-center justify-between"
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          <div
            data-testid="logo"
            className="w-7 h-7 rounded-md bg-[var(--accent)] flex items-center justify-center"
          >
            <span className="text-white font-bold text-xs">T</span>
          </div>
          <span className="font-semibold text-sm text-[var(--text-primary)] tracking-tight">
            TradeLife
          </span>
          <span className="text-[11px] font-medium text-[var(--text-muted)] ml-1">
            Command Center
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1">
          <button
            data-testid="notifications-button"
            className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            data-testid="settings-button"
            className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <div
            data-testid="user-avatar"
            className="w-7 h-7 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center ml-2"
          >
            <User className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          </div>
        </div>
      </header>

      {/* ── Main Grid ───────────────────────────────────── */}
      <main className="p-6">
        <div
          data-testid="dashboard-grid"
          className="grid grid-cols-12 gap-5 max-w-[1440px] mx-auto"
        >
          {/* ── LEFT COLUMN (3 cols) ──────────────────── */}
          <div className="col-span-12 lg:col-span-3 space-y-5">
            {/* Attention Needed */}
            <Card className="p-4">
              <SectionHeader>Attention Needed</SectionHeader>
              <div className="space-y-2" data-testid="attention-needed-list">
                {attentionItems.map((item) => (
                  <div
                    key={item.id}
                    data-testid={`attention-item-${item.id}`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-md"
                    style={{
                      backgroundColor:
                        item.type === 'danger' ? 'var(--danger-muted)' : 'var(--warning-muted)',
                    }}
                  >
                    <StatusDot
                      color={item.type === 'danger' ? 'var(--danger)' : 'var(--warning)'}
                    />
                    <span className="text-xs text-[var(--text-primary)]">{item.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Active Projects */}
            <Card className="p-4">
              <SectionHeader>Active Projects</SectionHeader>
              <div className="space-y-2" data-testid="active-projects-list">
                {activeProjects.map((project) => (
                  <div
                    key={project.id}
                    data-testid={`project-${project.id}`}
                    className="px-3 py-2.5 rounded-md bg-[var(--bg-elevated)]"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-[var(--text-primary)]">
                        {project.name}
                      </span>
                      <span className="text-[10px] font-medium text-[var(--accent)]">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-[var(--border-strong)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                      {project.client}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Active Trades */}
            <Card className="p-4">
              <SectionHeader>Active Trades</SectionHeader>
              <div className="space-y-1.5" data-testid="active-trades-list">
                {activeTrades.map((trade) => (
                  <div
                    key={trade.id}
                    data-testid={`trade-${trade.id}`}
                    className="flex items-center justify-between px-3 py-2 rounded-md bg-[var(--bg-elevated)]"
                  >
                    <div className="flex items-center gap-2">
                      <StatusDot
                        color={
                          trade.status === 'on-site'
                            ? 'var(--success)'
                            : trade.status === 'scheduled'
                              ? 'var(--warning)'
                              : 'var(--text-muted)'
                        }
                      />
                      <span className="text-xs font-medium text-[var(--text-primary)]">
                        {trade.name}
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-medium capitalize"
                      style={{
                        color:
                          trade.status === 'on-site'
                            ? 'var(--success)'
                            : trade.status === 'scheduled'
                              ? 'var(--warning)'
                              : 'var(--text-muted)',
                      }}
                    >
                      {trade.status.replace('-', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── CENTER COLUMN (6 cols) ────────────────── */}
          <div className="col-span-12 lg:col-span-6 space-y-5">
            {/* AI Core Placeholder */}
            <Card className="p-6" data-testid="ai-core-placeholder">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">AI Core</h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Intelligent assistant — ready to help
                  </p>
                </div>
              </div>
              <div className="mt-4 px-4 py-3 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)]">
                <p className="text-xs text-[var(--text-muted)] italic">
                  Ask me anything about your projects, finances, or schedule...
                </p>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3" data-testid="action-buttons">
              <button
                data-testid="action-new-quote"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Quote
              </button>
              <button
                data-testid="action-new-invoice"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                New Invoice
              </button>
              <button
                data-testid="action-view-reports"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Reports
              </button>
            </div>

            {/* Overview Grid */}
            <div className="grid grid-cols-2 gap-3" data-testid="overview-grid">
              {overviewStats.map((stat) => (
                <Card key={stat.label} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                      {stat.label}
                    </span>
                    {stat.positive ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-[var(--success)]" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 text-[var(--danger)]" />
                    )}
                  </div>
                  <div className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
                    {stat.value}
                  </div>
                  <div
                    className="text-[11px] font-medium mt-1"
                    style={{
                      color: stat.positive ? 'var(--success)' : 'var(--danger)',
                    }}
                  >
                    {stat.change} from last month
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* ── RIGHT COLUMN (3 cols) ─────────────────── */}
          <div className="col-span-12 lg:col-span-3 space-y-5">
            {/* Schedule */}
            <Card className="p-4">
              <SectionHeader>Schedule</SectionHeader>
              <div className="space-y-1.5" data-testid="schedule-list">
                {scheduleItems.map((item) => (
                  <div
                    key={item.id}
                    data-testid={`schedule-item-${item.id}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-md bg-[var(--bg-elevated)]"
                  >
                    <span className="text-[10px] font-mono font-medium text-[var(--accent)] w-10 shrink-0">
                      {item.time}
                    </span>
                    <span className="text-xs text-[var(--text-primary)] flex-1 truncate">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Urgent Tasks */}
            <Card className="p-4">
              <SectionHeader>Urgent Tasks</SectionHeader>
              <div className="space-y-1.5" data-testid="urgent-tasks-list">
                {urgentTasks.map((task) => (
                  <div
                    key={task.id}
                    data-testid={`urgent-task-${task.id}`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-[var(--bg-elevated)]"
                  >
                    <StatusDot color="var(--danger)" />
                    <span className="text-xs text-[var(--text-primary)]">{task.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Financial Overview */}
            <Card className="p-4">
              <SectionHeader>Financial Overview</SectionHeader>
              <div className="space-y-4" data-testid="financial-overview">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--text-secondary)]">Total Revenue</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      £24,500
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--bg-elevated)]">
                    <div className="h-full rounded-full bg-[var(--success)] w-[75%]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--text-secondary)]">Expenses</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      £8,200
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--bg-elevated)]">
                    <div className="h-full rounded-full bg-[var(--danger)] w-[33%]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--text-secondary)]">Net Profit</span>
                    <span className="text-sm font-semibold text-[var(--success)]">£16,300</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--bg-elevated)]">
                    <div className="h-full rounded-full bg-[var(--accent)] w-[66%]" />
                  </div>
                </div>
                <div className="pt-2 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Profit Margin</span>
                    <span className="text-xs font-semibold text-[var(--success)]">66.5%</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
