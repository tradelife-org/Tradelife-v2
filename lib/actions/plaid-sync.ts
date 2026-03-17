import { plaidClient } from '@/lib/plaid'
import { createClient } from '@supabase/supabase-js'

export async function syncPlaidTransactions(itemId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
  )

  const { data: connection } = await supabase
    .from('bank_connections')
    .select('*')
    .eq('item_id', itemId)
    .single()

  if (!connection) throw new Error('Bank connection not found')

  // We fetch last 30 days of transactions
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  const endDate = new Date()

  try {
    const response = await plaidClient.transactionsGet({
      access_token: connection.access_token,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    })

    const transactions = response.data.transactions

    for (const txn of transactions) {
      // Upsert transaction to avoid duplicates
      // Note: amount in Plaid is positive for expenses, negative for income.
      // We store it as pence.
      const amountPence = Math.round(txn.amount * 100)

      await supabase.from('bank_transactions').upsert({
        id: txn.transaction_id,
        org_id: connection.org_id,
        connection_id: connection.id,
        amount: amountPence,
        merchant_name: txn.merchant_name || txn.name,
        category: txn.category ? txn.category.join(',') : null,
        date: txn.date,
        pending: txn.pending,
        created_at: new Date().toISOString()
      }, { onConflict: 'id' })
    }

    return { success: true, count: transactions.length }
  } catch (err) {
    console.error('Plaid transaction sync error', err)
    throw err
  }
}
