import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getFinanceDashboardData } from '@/lib/actions/finance'
import FinanceDashboard from '@/components/finance/dashboard'
import ReceiptIngest from '@/components/finance/receipt-ingest'
import SceneLayerV3 from "@/visual-engine/scene/SceneLayerV3"

export default async function FinancePage() {
  const supabase = await createServerSupabaseClient()
  const data = await getFinanceDashboardData()

  // Fetch Jobs for receipt upload
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, clients(name)')
    .neq('status', 'CANCELLED')
    .order('created_at', { ascending: false })

  return (
    <SceneLayerV3 scene="remembrance">
      <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-slate-900">Finance Control</h1>
        <p className="text-slate-500">Profit First Allocation & Expense Tracking</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Dashboard */}
        <div className="lg:col-span-2">
          <FinanceDashboard data={data} />
        </div>

        {/* Sidebar Tools */}
        <div className="space-y-6">
          <ReceiptIngest jobs={jobs || []} />
          
          {/* Future: Quick Transfer / Allocations */}
        </div>
      </div>
    </div>
    </SceneLayerV3>
  )
}
