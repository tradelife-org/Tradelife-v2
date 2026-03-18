import { NextResponse } from 'next/server'

const COMPANIES_HOUSE_API_KEY = process.env.COMPANIES_HOUSE_API_KEY
const BASE_URL = 'https://api.company-information.service.gov.uk'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ items: [] })
  }

  if (!COMPANIES_HOUSE_API_KEY) {
    console.error('Companies House API key missing')
    return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
  }

  try {
    // Basic Auth with API Key as username, empty password
    const auth = Buffer.from(`${COMPANIES_HOUSE_API_KEY}:`).toString('base64')
    
    const response = await fetch(`${BASE_URL}/search/companies?q=${encodeURIComponent(query)}&items_per_page=10`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Companies House API error:', response.status, errorText)
      return NextResponse.json({ error: 'Search failed', details: errorText }, { status: response.status })
    }

    const data = await response.json()
    
    // Transform items to match our frontend interface
    const items = data.items?.map((item: any) => ({
      company_number: item.company_number,
      title: item.title,
      address_snippet: item.address_snippet,
      company_status: item.company_status,
      address: item.address // API returns address object similar to our mock
    })) || []

    return NextResponse.json({ items })

  } catch (err: any) {
    console.error('Companies House fetch error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
