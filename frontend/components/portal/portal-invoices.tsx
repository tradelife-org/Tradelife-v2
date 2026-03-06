import { GlassPanel } from '@/components/ui/glass-panel'
import { FileText, ArrowRight, CheckCircle } from 'lucide-react'

export default function PortalInvoices({ invoices }: { invoices: any[] }) {
  if (!invoices || invoices.length === 0) return null

  const formatPence = (p: number) => (p / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })

  return (
    <div className="space-y-4">
      <h3 className="font-heading font-bold text-white text-lg flex items-center gap-2">
        <FileText className="w-5 h-5 text-blueprint-300" />
        Invoices
      </h3>

      <div className="grid grid-cols-1 gap-4">
        {invoices.map(inv => (
          <GlassPanel key={inv.id} className="p-4 bg-white/10 border-white/20 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center 
                ${inv.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white'}`}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white">{inv.invoice_number}</h4>
                <p className="text-xs text-white/60">Due: {new Date(inv.due_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="font-mono font-bold text-white">{formatPence(inv.amount_gross)}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider
                  ${inv.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 
                    inv.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {inv.status}
                </span>
              </div>

              {inv.status !== 'PAID' && (
                <button className="h-10 px-4 bg-white text-blueprint font-bold rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-2 text-sm shadow-lg">
                  Pay Now
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {inv.status === 'PAID' && (
                <div className="h-10 px-4 flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle className="w-5 h-5" />
                  Paid
                </div>
              )}
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  )
}
