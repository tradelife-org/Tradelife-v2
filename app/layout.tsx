import '@/styles/globals.css'
import { CinematicBackground } from '@/components/CinematicBackground'

export const metadata = {
  title: 'TradeLife',
  description: 'Smart finance for tradespeople',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CinematicBackground />
        <div className="relative z-[2]">{children}</div>
      </body>
    </html>
  )
}
