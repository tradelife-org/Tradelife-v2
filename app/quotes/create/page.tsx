'use client'

import { ChangeEvent, FormEvent, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { poundsToPence, percentageToStored } from '@/lib/actions/quotes'
import { saveQuoteDraft } from '@/lib/actions/save-quote'

type QuoteFormState = {
  clientName: string
  jobTitle: string
  labourDays: string
  dayRate: string
  materialsCost: string
  marginPercent: string
}

const initialForm: QuoteFormState = {
  clientName: '',
  jobTitle: '',
  labourDays: '',
  dayRate: '',
  materialsCost: '',
  marginPercent: '',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  }).format(value)
}

export default function CreateQuotePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<QuoteFormState>(initialForm)
  const [error, setError] = useState('')

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const labourCost = useMemo(() => {
    return Number(form.labourDays || 0) * Number(form.dayRate || 0)
  }, [form.dayRate, form.labourDays])

  const total = useMemo(() => {
    const subtotal = labourCost + Number(form.materialsCost || 0)
    return subtotal * (1 + Number(form.marginPercent || 0) / 100)
  }, [form.marginPercent, form.materialsCost, labourCost])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    startTransition(async () => {
      const labourDays = Number(form.labourDays || 0)
      const dayRate = Number(form.dayRate || 0)
      const materialsCost = Number(form.materialsCost || 0)
      const marginPercent = Number(form.marginPercent || 0)

      const result = await saveQuoteDraft({
        clientName: form.clientName,
        vat_rate: 2000,
        sections: [
          {
            title: form.jobTitle,
            trade_type: 'General',
            sort_order: 0,
            is_subcontract: false,
            labour_days: labourDays,
            labour_day_rate: poundsToPence(dayRate),
            subcontract_cost: 0,
            material_cost_total: poundsToPence(materialsCost),
            margin_percentage: percentageToStored(marginPercent),
          },
        ],
      })

      if (!result.success || !result.quoteId) {
        setError(result.error || 'Failed to save quote.')
        return
      }

      router.push(`/quotes/${result.quoteId}`)
    })
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-0" data-testid="create-quote-page">
      <div className="mb-6 space-y-2" data-testid="create-quote-header">
        <p className="text-xs uppercase tracking-[0.28em] text-neutral-500" data-testid="create-quote-kicker">Sales</p>
        <h1 className="text-3xl font-semibold text-white" data-testid="create-quote-title">Create Quote</h1>
        <p className="text-sm text-neutral-400" data-testid="create-quote-description">Price labour, materials, and margin with a single quote draft.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-[0_24px_80px_-48px_rgba(37,99,235,0.45)] sm:p-8" data-testid="create-quote-form-card">
          <form onSubmit={handleSubmit} className="space-y-5" data-testid="create-quote-form">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="clientName" className="text-sm font-medium text-neutral-200" data-testid="create-quote-client-label">Client Name</label>
                <input id="clientName" name="clientName" type="text" value={form.clientName} onChange={handleChange} required className="w-full rounded-xl border border-neutral-700 bg-black px-4 py-3 text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-blue-500" placeholder="John Smith" data-testid="create-quote-client-input" />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="jobTitle" className="text-sm font-medium text-neutral-200" data-testid="create-quote-job-label">Job Title</label>
                <input id="jobTitle" name="jobTitle" type="text" value={form.jobTitle} onChange={handleChange} required className="w-full rounded-xl border border-neutral-700 bg-black px-4 py-3 text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-blue-500" placeholder="Kitchen Renovation" data-testid="create-quote-job-input" />
              </div>

              <div className="space-y-2">
                <label htmlFor="labourDays" className="text-sm font-medium text-neutral-200" data-testid="create-quote-labour-days-label">Labour Days</label>
                <input id="labourDays" name="labourDays" type="number" min="0" step="1" value={form.labourDays} onChange={handleChange} required className="w-full rounded-xl border border-neutral-700 bg-black px-4 py-3 text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-blue-500" placeholder="5" data-testid="create-quote-labour-days-input" />
              </div>

              <div className="space-y-2">
                <label htmlFor="dayRate" className="text-sm font-medium text-neutral-200" data-testid="create-quote-day-rate-label">Day Rate</label>
                <input id="dayRate" name="dayRate" type="number" min="0" step="0.01" value={form.dayRate} onChange={handleChange} required className="w-full rounded-xl border border-neutral-700 bg-black px-4 py-3 text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-blue-500" placeholder="250" data-testid="create-quote-day-rate-input" />
              </div>

              <div className="space-y-2">
                <label htmlFor="materialsCost" className="text-sm font-medium text-neutral-200" data-testid="create-quote-materials-label">Materials Cost</label>
                <input id="materialsCost" name="materialsCost" type="number" min="0" step="0.01" value={form.materialsCost} onChange={handleChange} required className="w-full rounded-xl border border-neutral-700 bg-black px-4 py-3 text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-blue-500" placeholder="1800" data-testid="create-quote-materials-input" />
              </div>

              <div className="space-y-2">
                <label htmlFor="marginPercent" className="text-sm font-medium text-neutral-200" data-testid="create-quote-margin-label">Margin %</label>
                <input id="marginPercent" name="marginPercent" type="number" min="0" step="0.01" value={form.marginPercent} onChange={handleChange} required className="w-full rounded-xl border border-neutral-700 bg-black px-4 py-3 text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-blue-500" placeholder="20" data-testid="create-quote-margin-input" />
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200" data-testid="create-quote-error">
                {error}
              </div>
            ) : null}

            <button type="submit" disabled={isPending} className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70" data-testid="save-quote-button">
              {isPending ? 'Saving Quote...' : 'Save Quote'}
            </button>
          </form>
        </div>

        <aside className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-[0_24px_80px_-48px_rgba(37,99,235,0.35)]" data-testid="create-quote-summary-card">
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-500" data-testid="create-quote-summary-kicker">Quote Summary</p>
          <div className="mt-5 space-y-4">
            <div data-testid="create-quote-summary-labour">
              <p className="text-sm text-neutral-400">Labour</p>
              <p className="mt-1 text-xl font-semibold text-white">{formatCurrency(labourCost)}</p>
            </div>

            <div data-testid="create-quote-summary-materials">
              <p className="text-sm text-neutral-400">Materials</p>
              <p className="mt-1 text-xl font-semibold text-white">{formatCurrency(Number(form.materialsCost || 0))}</p>
            </div>

            <div data-testid="create-quote-summary-margin">
              <p className="text-sm text-neutral-400">Margin</p>
              <p className="mt-1 text-xl font-semibold text-white">{Number(form.marginPercent || 0).toFixed(2)}%</p>
            </div>

            <div className="border-t border-neutral-800 pt-4" data-testid="create-quote-summary-total">
              <p className="text-sm text-neutral-400">Projected Total</p>
              <p className="mt-1 text-2xl font-semibold text-white">{formatCurrency(total)}</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
