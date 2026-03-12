'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function processRecurringServicesAction() {
  // Use Admin Client for automated tasks
  const { supabase } = await import('@supabase/supabase-js')
  const adminClient = supabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date().toISOString().split('T')[0]

  // 1. Find Due Schedules
  const { data: schedules, error } = await adminClient
    .from('maintenance_schedules')
    .select('*')
    .eq('active', true)
    .lte('next_due_date', today)

  if (error) throw new Error(error.message)
  if (!schedules || schedules.length === 0) return { processed: 0 }

  let processedCount = 0

  for (const schedule of schedules) {
    // 2. Generate Draft Quote
    const { data: quote } = await adminClient
      .from('quotes')
      .insert({
        org_id: schedule.org_id,
        client_id: schedule.client_id,
        status: 'DRAFT',
        quote_amount_net: schedule.amount_net,
        quote_amount_gross: Math.round(schedule.amount_net * 1.2), // Default 20% VAT
        vat_rate: 2000,
        quote_total_cost: Math.round(schedule.amount_net * 0.5), // Estimate 50% cost?
        quote_profit: Math.round(schedule.amount_net * 0.5),
        quote_margin_percentage: 5000,
        reference: `Recurring: ${schedule.title}`,
        notes: 'Auto-generated maintenance quote'
      })
      .select('id')
      .single()

    if (quote) {
      // Create Section/Line Item
      const { data: section } = await adminClient
        .from('quote_sections')
        .insert({
          quote_id: quote.id,
          org_id: schedule.org_id,
          title: 'Routine Maintenance',
          trade_type: 'Maintenance',
          section_revenue_total: schedule.amount_net,
          section_cost_total: Math.round(schedule.amount_net * 0.5),
          section_profit: Math.round(schedule.amount_net * 0.5),
          margin_percentage: 5000
        })
        .select('id')
        .single()

      if (section) {
        await adminClient.from('quote_line_items').insert({
          quote_id: quote.id,
          quote_section_id: section.id,
          org_id: schedule.org_id,
          description: schedule.title,
          quantity: 1,
          unit_price_net: schedule.amount_net,
          line_total_net: schedule.amount_net
        })
      }

      // 3. Update Schedule Next Date
      let nextDate = new Date(schedule.next_due_date)
      switch (schedule.frequency) {
        case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
        case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
        case 'quarterly': nextDate.setMonth(nextDate.getMonth() + 3); break;
        case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      }

      await adminClient
        .from('maintenance_schedules')
        .update({
          next_due_date: nextDate.toISOString().split('T')[0],
          last_service_date: today
        })
        .eq('id', schedule.id)

      processedCount++
    }
  }

  return { processed: processedCount }
}
