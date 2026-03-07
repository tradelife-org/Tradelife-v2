import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const COMPANIES_HOUSE_API_KEY = process.env.COMPANIES_HOUSE_API_KEY
const BASE_URL = 'https://api.company-information.service.gov.uk'

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  const type = searchParams.get('type') || 'search' // search, officers, psc
  const companyNumber = searchParams.get('companyNumber')

  if (type === 'search' && !query) {
    return NextResponse.json({ items: [] })
  }

  if (type !== 'search' && !companyNumber) {
    return NextResponse.json({ error: 'Company number required' }, { status: 400 })
  }

  if (!COMPANIES_HOUSE_API_KEY) {
    console.error('Companies House API key missing')
    return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
  }

  try {
    // Basic Auth with API Key as username, empty password
    const auth = Buffer.from(`${COMPANIES_HOUSE_API_KEY}:`).toString('base64')
    
    let url = `${BASE_URL}/search/companies?q=${encodeURIComponent(query || '')}&items_per_page=10`

    if (type === 'officers') {
      url = `${BASE_URL}/company/${companyNumber}/officers`
    } else if (type === 'psc') {
      url = `${BASE_URL}/company/${companyNumber}/persons-with-significant-control`
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Companies House API error:', response.status, errorText)
      return NextResponse.json({ error: 'API request failed', details: errorText }, { status: response.status })
    }

    const data = await response.json()
    
    if (type === 'search') {
      // Transform items to match our frontend interface
      const items = data.items?.map((item: any) => ({
        company_number: item.company_number,
        title: item.title,
        address_snippet: item.address_snippet,
        company_status: item.company_status,
        address: item.address
      })) || []
      return NextResponse.json({ items })
    }

    return NextResponse.json(data)

  } catch (err: any) {
    console.error('Companies House fetch error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
