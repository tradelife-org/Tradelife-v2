import './globals.css'
import { AppFrame } from './app-frame'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-neutral-950">
      <body className="min-h-screen bg-neutral-950 text-white antialiased" data-testid="root-layout-body">
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  )
}
