import '@/styles/globals.css'
import { VisualEngine } from '@/visual-engine/VisualEngine'

export const metadata = {
  title: 'TradeLife',
  description: 'Smart finance for tradespeople',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <VisualEngine />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  )
}
