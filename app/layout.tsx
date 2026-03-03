import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TradeLife v2',
  description: 'Quote, Job & Invoice management for tradespeople',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
