import './globals.css'
import ThemeProvider from '@/components/theme-provider'

export const metadata = {
  title: 'TradeLife',
  description: 'Smart finance for tradespeople',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
