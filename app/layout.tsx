import type { Metadata } from 'next'
import { VisualEngineProvider } from '@/components/providers/visual-engine-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'TradeLife | Built for Trades',
  description: 'TradeLife — Built for Trades. The business operating system for builders and trades.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-body text-slate-900 antialiased selection:bg-safety/20 selection:text-safety-600">
        <VisualEngineProvider>
          {children}
        </VisualEngineProvider>
      </body>
    </html>
  )
}
