import Link from 'next/link'
import { FileText } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-5xl font-heading font-black text-slate-900 tracking-tight">
            TradeLife<span className="text-blueprint">.</span>
          </h1>
          <p className="text-lg text-slate-500 font-body">
            Quote. Job. Invoice. Get paid.
          </p>
        </div>
        <Link
          href="/quotes/create"
          data-testid="create-quote-link"
          className="inline-flex items-center gap-3 h-14 px-8 bg-blueprint text-white font-body font-semibold text-lg rounded-xl hover:bg-blueprint-700 transition-colors duration-200 shadow-lg shadow-blueprint/25"
        >
          <FileText className="w-5 h-5" />
          Create Quote
        </Link>
      </div>
    </main>
  )
}
