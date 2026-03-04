import { NextResponse } from 'next/server'

// MOCK DATA for Companies House
// Since we don't have a real key, we return a few dummy results for testing.
const MOCK_COMPANIES = [
  {
    company_number: '12345678',
    title: 'TradeLife Ltd',
    address_snippet: '123 Tech Street, London, EC1A 1BB',
    company_status: 'active',
    address: {
      premises: '123',
      address_line_1: 'Tech Street',
      locality: 'London',
      postal_code: 'EC1A 1BB',
      country: 'United Kingdom'
    }
  },
  {
    company_number: '87654321',
    title: 'Acme Builders',
    address_snippet: '456 Construction Rd, Manchester, M1 1AA',
    company_status: 'active',
    address: {
      premises: '456',
      address_line_1: 'Construction Rd',
      locality: 'Manchester',
      postal_code: 'M1 1AA',
      country: 'United Kingdom'
    }
  },
  {
    company_number: '11223344',
    title: 'Rapid Plumbers',
    address_snippet: '789 Pipe Lane, Birmingham, B1 1BB',
    company_status: 'active',
    address: {
      premises: '789',
      address_line_1: 'Pipe Lane',
      locality: 'Birmingham',
      postal_code: 'B1 1BB',
      country: 'United Kingdom'
    }
  }
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ items: [] })
  }

  // Simple case-insensitive filter
  const filtered = MOCK_COMPANIES.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) || 
    c.company_number.includes(query)
  )

  return NextResponse.json({ items: filtered })
}
