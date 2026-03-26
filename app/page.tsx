import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Briefcase, BarChart3, Receipt, Users } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'

export default async function Home() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <main className="px-4 py-8 sm:px-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="dashboard-heading">Dashboard</h1>
        <p className="text-sm text-gray-500 mb-8">Welcome back. Where do you want to go?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="dashboard-nav-grid">
          <Link
            href="/quotes"
            data-testid="nav-card-quotes"
            className="flex items-center gap-4 p-5 rounded-lg bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Quotes</p>
              <p className="text-xs text-gray-500">Create and manage quotes</p>
            </div>
          </Link>

          <Link
            href="/jobs"
            data-testid="nav-card-jobs"
            className="flex items-center gap-4 p-5 rounded-lg bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <Briefcase className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Jobs</p>
              <p className="text-xs text-gray-500">Track active jobs</p>
            </div>
          </Link>

          <Link
            href="/finance"
            data-testid="nav-card-finance"
            className="flex items-center gap-4 p-5 rounded-lg bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Finance</p>
              <p className="text-xs text-gray-500">Burn rate, runway, ledger</p>
            </div>
          </Link>

          <Link
            href="/invoices"
            data-testid="nav-card-invoices"
            className="flex items-center gap-4 p-5 rounded-lg bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <Receipt className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Invoices</p>
              <p className="text-xs text-gray-500">Send and track payments</p>
            </div>
          </Link>

          <Link
            href="/clients"
            data-testid="nav-card-clients"
            className="flex items-center gap-4 p-5 rounded-lg bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Clients</p>
              <p className="text-xs text-gray-500">Manage your client list</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
