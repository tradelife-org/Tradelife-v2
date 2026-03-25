import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Briefcase, BarChart3, Receipt } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'

export default async function Home() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="px-4 py-8 sm:px-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2" data-testid="dashboard-heading">Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)] mb-8">Welcome back. Where do you want to go?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="dashboard-nav-grid">
          <Link
            href="/quotes"
            data-testid="nav-card-quotes"
            className="flex items-center gap-4 p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
          >
            <FileText className="w-5 h-5 text-[var(--accent)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Quotes</p>
              <p className="text-xs text-[var(--text-muted)]">Create and manage quotes</p>
            </div>
          </Link>

          <Link
            href="/jobs"
            data-testid="nav-card-jobs"
            className="flex items-center gap-4 p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
          >
            <Briefcase className="w-5 h-5 text-[var(--accent)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Jobs</p>
              <p className="text-xs text-[var(--text-muted)]">Track active jobs</p>
            </div>
          </Link>

          <Link
            href="/finance"
            data-testid="nav-card-finance"
            className="flex items-center gap-4 p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-[var(--accent)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Finance</p>
              <p className="text-xs text-[var(--text-muted)]">Burn rate, runway, ledger</p>
            </div>
          </Link>

          <Link
            href="/invoices"
            data-testid="nav-card-invoices"
            className="flex items-center gap-4 p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
          >
            <Receipt className="w-5 h-5 text-[var(--accent)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Invoices</p>
              <p className="text-xs text-[var(--text-muted)]">Send and track payments</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
