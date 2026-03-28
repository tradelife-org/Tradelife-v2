import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Briefcase, BarChart3, Receipt } from 'lucide-react'

export default async function Home() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]" data-testid="dashboard-heading">Dashboard</h1>
      <p className="mb-8 text-sm text-[var(--text-muted)]">Welcome back. Where do you want to go?</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-testid="dashboard-nav-grid">
        <Link
          href="/quotes"
          data-testid="nav-card-quotes"
          className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-colors hover:border-[var(--border-strong)]"
        >
          <FileText className="h-5 w-5 text-[var(--accent)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Quotes</p>
            <p className="text-xs text-[var(--text-muted)]">Create and manage quotes</p>
          </div>
        </Link>

        <Link
          href="/jobs"
          data-testid="nav-card-jobs"
          className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-colors hover:border-[var(--border-strong)]"
        >
          <Briefcase className="h-5 w-5 text-[var(--accent)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Jobs</p>
            <p className="text-xs text-[var(--text-muted)]">Track active jobs</p>
          </div>
        </Link>

        <Link
          href="/finance"
          data-testid="nav-card-finance"
          className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-colors hover:border-[var(--border-strong)]"
        >
          <BarChart3 className="h-5 w-5 text-[var(--accent)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Finance</p>
            <p className="text-xs text-[var(--text-muted)]">Burn rate, runway, ledger</p>
          </div>
        </Link>

        <Link
          href="/invoices"
          data-testid="nav-card-invoices"
          className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-colors hover:border-[var(--border-strong)]"
        >
          <Receipt className="h-5 w-5 text-[var(--accent)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Invoices</p>
            <p className="text-xs text-[var(--text-muted)]">Send and track payments</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
