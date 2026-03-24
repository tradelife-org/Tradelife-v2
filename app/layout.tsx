import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative min-h-screen text-white">

        <div className="fixed inset-0 -z-10">
          <img src="/login-bg.png" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute left-0 top-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[120px]" />
          <div className="absolute right-0 bottom-0 w-[600px] h-[600px] bg-orange-500/20 blur-[120px]" />
        </div>

        {children}

      </body>
    </html>
  )
}
