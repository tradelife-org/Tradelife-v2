import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { saveQuoteDraft } from '@/lib/actions/save-quote'

export default async function CreateQuotePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('org_id', profile?.org_id)
    .order('name')

  async function handleCreate(formData: FormData) {
    'use server'
    const clientId = formData.get('client_id') as string
    const title = formData.get('title') as string
    const vatRate = parseInt(formData.get('vat_rate') as string || '2000')
    const labourDays = parseInt(formData.get('labour_days') as string || '1')
    const labourDayRate = Math.round(parseFloat(formData.get('labour_day_rate') as string || '250') * 100)
    const materialCost = Math.round(parseFloat(formData.get('material_cost') as string || '0') * 100)
    const marginPercentage = parseInt(formData.get('margin_percentage') as string || '2500')

    const result = await saveQuoteDraft({
      client_id: clientId || null,
      reference: title || 'New Quote',
      vat_rate: vatRate,
      sections: [{
        title: title || 'General Works',
        trade_type: 'GENERAL',
        is_subcontract: false,
        labour_days: labourDays,
        labour_day_rate: labourDayRate,
        subcontract_cost: 0,
        material_cost_total: materialCost,
        margin_percentage: marginPercentage,
        sort_order: 0,
        line_items: [],
      }],
    })

    if (result.success && result.quoteId) {
      redirect(`/quotes/${result.quoteId}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6" data-testid="create-quote-page">
      <div className="flex items-center gap-4">
        <Link href="/quotes" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" data-testid="back-to-quotes">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-900" data-testid="create-quote-heading">Create Quote</h1>
      </div>

      <form action={handleCreate} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-5">
        {/* Client */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
          <select
            name="client_id"
            className="border border-gray-300 rounded-md px-3 py-2 text-black bg-white w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="client-select"
          >
            <option value="">No client</option>
            {clients?.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Title / Reference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quote Title</label>
          <input
            name="title"
            type="text"
            placeholder="e.g. Kitchen renovation"
            className="border border-gray-300 rounded-md px-3 py-2 text-black bg-white w-full text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="title-input"
          />
        </div>

        {/* Labour */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Labour Days</label>
            <input
              name="labour_days"
              type="number"
              min="0"
              defaultValue="1"
              className="border border-gray-300 rounded-md px-3 py-2 text-black bg-white w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="labour-days-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Day Rate (£)</label>
            <input
              name="labour_day_rate"
              type="number"
              min="0"
              step="0.01"
              defaultValue="250"
              className="border border-gray-300 rounded-md px-3 py-2 text-black bg-white w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="day-rate-input"
            />
          </div>
        </div>

        {/* Materials */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Material Cost (£)</label>
          <input
            name="material_cost"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            className="border border-gray-300 rounded-md px-3 py-2 text-black bg-white w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="material-cost-input"
          />
        </div>

        {/* Margin */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Margin %</label>
            <select
              name="margin_percentage"
              defaultValue="2500"
              className="border border-gray-300 rounded-md px-3 py-2 text-black bg-white w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="margin-select"
            >
              <option value="1000">10%</option>
              <option value="1500">15%</option>
              <option value="2000">20%</option>
              <option value="2500">25%</option>
              <option value="3000">30%</option>
              <option value="3500">35%</option>
              <option value="4000">40%</option>
              <option value="5000">50%</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">VAT Rate</label>
            <select
              name="vat_rate"
              defaultValue="2000"
              className="border border-gray-300 rounded-md px-3 py-2 text-black bg-white w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="vat-select"
            >
              <option value="0">0% (VAT exempt)</option>
              <option value="500">5%</option>
              <option value="2000">20% (Standard)</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md w-full font-medium text-sm hover:bg-blue-700 transition-colors"
          data-testid="save-quote-button"
        >
          Save Draft
        </button>
      </form>
    </div>
  )
}
