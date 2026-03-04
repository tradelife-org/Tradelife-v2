import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import QuoteDetailClient from './quote-detail-client'
import { Quote, QuoteSection, QuoteLineItem } from '@/lib/types/database'

interface PageProps {
  params: {
    id: string
  }
}

export default async function QuoteDetailPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient()
  const { id } = params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // Middleware should handle this, but safe fallback
    return <div>Please log in</div>
  }

  // Fetch Quote with Client
  const { data: quoteData, error: quoteError } = await supabase
    .from('quotes')
    .select(`
      *,
      clients ( name )
    `)
    .eq('id', id)
    .single()

  if (quoteError || !quoteData) {
    console.error('Error fetching quote:', quoteError)
    notFound()
  }

  const quote = quoteData as Quote & { clients: { name: string } | null }
  const clientName = quote.clients?.name || null

  // Fetch Sections
  const { data: sectionsData, error: sectionsError } = await supabase
    .from('quote_sections')
    .select('*')
    .eq('quote_id', id)
    .order('sort_order', { ascending: true })

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError)
    // Don't fail the whole page, just show empty sections?
  }

  // Fetch Line Items
  const { data: linesData, error: linesError } = await supabase
    .from('quote_line_items')
    .select('*')
    .eq('quote_id', id)
    .order('sort_order', { ascending: true })

  if (linesError) {
    console.error('Error fetching lines:', linesError)
  }

  return (
    <QuoteDetailClient
      quote={quote}
      sections={(sectionsData as QuoteSection[]) || []}
      lines={(linesData as QuoteLineItem[]) || []}
      clientName={clientName}
    />
  )
}
