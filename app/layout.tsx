import '@/styles/globals.css'

export const metadata = {
  title: 'TradeLife',
  description: 'Smart finance for tradespeople',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  )
}
