import { createClient } from '@/lib/supabase/server'

export default async function QuotesPage() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Quotes</h1>
        <p style={{ color: 'red' }}>Error loading quotes</p>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Quotes</h1>
        <p>No quotes yet</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Quotes</h1>

      <ul>
        {data.map((quote: any) => (
          <li key={quote.id} style={{ marginBottom: 10 }}>
            <strong>{quote.reference || 'No Ref'}</strong> — £{quote.total || 0}
          </li>
        ))}
      </ul>
    </div>
  )
}
