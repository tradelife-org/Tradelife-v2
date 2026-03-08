import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GlassPanel } from '@/components/ui/glass-panel'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, FileText } from 'lucide-react'

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  
  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
      *,
      clients ( name, email, address, phone ),
      organisations ( name ),
      invoice_line_items ( * )
    `)
    .eq('id', params.id)
    .single()

  if (!invoice) notFound()

  const formatPence = (p: number) => (p / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/invoices" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <GlassPanel className="p-8 bg-white border-slate-200 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-12 border-b border-slate-100 pb-8">
          <div>
            <h1 className="text-3xl font-heading font-black text-slate-900">{invoice.invoice_number}</h1>
            <p className="text-slate-500 mt-1">{invoice.organisations?.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Due</p>
            <p className="text-4xl font-mono font-bold text-slate-900">{formatPence(invoice.amount_gross)}</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
              ${invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Bill To */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Bill To</p>
            <p className="font-bold text-slate-900">{invoice.clients?.name}</p>
            <p className="text-slate-500 text-sm whitespace-pre-wrap">{invoice.clients?.address}</p>
            <p className="text-slate-500 text-sm">{invoice.clients?.email}</p>
          </div>
          <div className="text-right">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Issue Date</span>
                <span className="font-medium">{new Date(invoice.issue_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Due Date</span>
                <span className="font-medium">{new Date(invoice.due_date || '').toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <table className="w-full mb-12">
          <thead className="bg-slate-50 border-y border-slate-200">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
              <th className="py-3 px-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Qty</th>
              <th className="py-3 px-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Price</th>
              <th className="py-3 px-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.invoice_line_items?.map((item: any) => (
              <tr key={item.id}>
                <td className="py-4 px-4 text-sm font-medium text-slate-900">{item.description}</td>
                <td className="py-4 px-4 text-right text-sm text-slate-600">{item.quantity}</td>
                <td className="py-4 px-4 text-right text-sm text-slate-600 font-mono">{formatPence(item.unit_price_net)}</td>
                <td className="py-4 px-4 text-right text-sm font-bold text-slate-900 font-mono">{formatPence(item.line_total_net)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-slate-500 text-sm">
              <span>Subtotal</span>
              <span className="font-mono">{formatPence(invoice.amount_net)}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-sm">
              <span>VAT ({(invoice.vat_rate/100).toFixed(0)}%)</span>
              <span className="font-mono">{formatPence(invoice.amount_gross - invoice.amount_net)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold text-lg pt-3 border-t border-slate-200">
              <span>Total</span>
              <span className="font-mono">{formatPence(invoice.amount_gross)}</span>
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  )
}
