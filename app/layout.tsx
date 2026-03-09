import type { Metadata } from 'next'
import { VisualEngineProvider } from '@/components/providers/visual-engine-provider'
import VisualEngineRoot from '@/visual-engine/VisualEngineRoot'
import './globals.css'

export const metadata: Metadata = {
  title: 'TradeLife v2 | Molten Copper Theme',
  description: 'Quote, Job & Invoice management for tradespeople',
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

          {/* <VisualEngineRoot> */}
            {children}
          {/* </VisualEngineRoot> */}

        </VisualEngineProvider>
      </body>
    </html>
  )
}
