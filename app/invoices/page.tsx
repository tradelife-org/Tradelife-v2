import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GlassPanel } from '@/components/ui/glass-panel'
import Link from 'next/link'
import SceneLayerV3 from "@/visual-engine/scene/SceneLayerV3"
import { Plus, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

export default async function InvoicesPage() {
  const supabase = await createServerSupabaseClient()
  
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, clients(name)')
    .order('created_at', { ascending: false })

  const formatPence = (p: number) => (p / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })

  return (
    <SceneLayerV3 scene="remembrance">
      <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-heading font-bold text-slate-900">Invoices</h1>
        <Link href="/invoices/create" className="btn-primary bg-blueprint text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:bg-blueprint-700 transition-colors">
          <Plus className="w-5 h-5" />
          New Invoice
        </Link>
      </div>

      <div className="space-y-4">
        {invoices?.length === 0 && (
          <div className="text-center py-12 text-slate-400">No invoices yet.</div>
        )}

        {invoices?.map(inv => (
          <Link key={inv.id} href={`/invoices/${inv.id}`} className="block group">
            <GlassPanel className="p-5 bg-white hover:border-blueprint/50 transition-all flex items-center justify-between group-hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center 
                  ${inv.status === 'PAID' ? 'bg-green-100 text-green-600' : 
                    inv.status === 'OVERDUE' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{inv.invoice_number}</h3>
                  <p className="text-xs text-slate-500">{inv.clients?.name} • {new Date(inv.issue_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="font-mono font-bold text-slate-900">{formatPence(inv.amount_gross)}</p>
                  <p className="text-xs text-slate-400 uppercase">{inv.invoice_type}</p>
                </div>
                
                {/* Status Stack */}
                <div className="w-24 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${inv.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' :
                      inv.status === 'SENT' ? 'bg-blue-100 text-blue-600' :
                      inv.status === 'PAID' ? 'bg-green-100 text-green-600' :
                      inv.status === 'OVERDUE' ? 'bg-red-100 text-red-600' : 'bg-slate-100'}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            </GlassPanel>
          </Link>
        ))}
      </div>
    </div>
    </SceneLayerV3>
  )
}
