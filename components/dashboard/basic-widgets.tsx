import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Briefcase, FileText, Clock, Activity } from 'lucide-react'
import { GlassPanel } from '@/components/ui/glass-panel'

export default async function DashboardWidgets() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  const orgId = profile?.org_id

  // Fallback safe queries
  let activeJobs = 0
  let monthlyRevenue = 0
  let outstandingInvoices = 0
  let averageMargin = 0
  let recentActivity: any[] = []

  if (orgId) {
    try {
      const { count: jCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .in('status', ['BOOKED', 'ON_SITE', 'IN_PROGRESS', 'SNAGGING'])

      activeJobs = jCount || 0

      // Monthly Revenue from ledger
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0,0,0,0)
      
      const { data: revData } = await supabase
        .from('job_wallet_ledger')
        .select('amount')
        .eq('org_id', orgId)
        .eq('transaction_type', 'CREDIT')
        .gte('created_at', startOfMonth.toISOString())
      
      monthlyRevenue = revData?.reduce((sum, item) => sum + item.amount, 0) || 0

      // Outstanding Invoices (Sum of gross amount for unpaid)
      const { data: invData } = await supabase
        .from('invoices')
        .select('amount_gross')
        .eq('org_id', orgId)
        .in('status', ['DRAFT', 'SENT', 'OVERDUE'])

      outstandingInvoices = invData?.reduce((sum, item) => sum + item.amount_gross, 0) || 0

      // Average Margin (from accepted quotes)
      const { data: marginData } = await supabase
        .from('quotes')
        .select('quote_margin_percentage')
        .eq('org_id', orgId)
        .eq('status', 'ACCEPTED')
      
      if (marginData && marginData.length > 0) {
        const totalMargin = marginData.reduce((sum, item) => sum + (item.quote_margin_percentage || 0), 0)
        averageMargin = Math.round(totalMargin / marginData.length)
      }

      // Simplified recent activity: latest 5 created entities (quotes/jobs/invoices)
      const { data: latestQuotes } = await supabase
        .from('quotes')
        .select('id, reference, created_at, status')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(3)

      const { data: latestJobs } = await supabase
        .from('jobs')
        .select('id, title, created_at, status')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(3)

      const combined = [
        ...(latestQuotes || []).map(q => ({ type: 'Quote', title: q.reference || 'New Quote', date: q.created_at, url: `/quotes/${q.id}` })),
        ...(latestJobs || []).map(j => ({ type: 'Job', title: j.title, date: j.created_at, url: `/jobs/${j.id}` }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

      recentActivity = combined
    } catch (err) {
      console.error("Failed to load widget data", err)
    }
  }

  const formatCurrency = (pence: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(pence / 100)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-6">
      {/* Monthly Revenue */}
      <Link href="/finance" className="block">
        <GlassPanel className="p-6 bg-white/80 hover:bg-white transition-all border-slate-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Monthly Revenue</p>
              <h3 className="text-2xl font-black text-slate-900">{formatCurrency(monthlyRevenue)}</h3>
            </div>
          </div>
        </GlassPanel>
      </Link>

      {/* Outstanding Invoices */}
      <Link href="/invoices" className="block">
        <GlassPanel className="p-6 bg-white/80 hover:bg-white transition-all border-slate-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Outstanding Invoices</p>
              <h3 className="text-2xl font-black text-slate-900">{formatCurrency(outstandingInvoices)}</h3>
            </div>
          </div>
        </GlassPanel>
      </Link>

      {/* Average Job Margin */}
      <Link href="/finance" className="block">
        <GlassPanel className="p-6 bg-white/80 hover:bg-white transition-all border-slate-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Avg Job Margin</p>
              <h3 className="text-2xl font-black text-slate-900">{(averageMargin / 100).toFixed(1)}%</h3>
            </div>
          </div>
        </GlassPanel>
      </Link>

      {/* Recent Activity */}
      <GlassPanel className="p-6 bg-white/80 border-slate-200/50 row-span-2 lg:row-span-1 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Recent Activity</h3>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400">No recent activity.</p>
          ) : (
            recentActivity.map((act, i) => (
              <Link key={i} href={act.url} className="block group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500">{act.type}</p>
                    <p className="text-sm font-medium text-slate-900 group-hover:text-blueprint transition-colors truncate max-w-[150px]">
                      {act.title}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400">{new Date(act.date).toLocaleDateString()}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </GlassPanel>
    </div>
  )
}
