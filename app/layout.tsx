export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: 10 }}>
          <div>
            <a href="/dashboard">Dashboard</a>{" "}
            <a href="/quotes">Quotes</a>{" "}
            <a href="/jobs">Jobs</a>{" "}
            <a href="/invoices">Invoices</a>{" "}
            <a href="/clients">Clients</a>{" "}
            <a href="/finance">Finance</a>{" "}
            <a href="/settings">Settings</a>
          </div>

          <hr />

          {/* THIS IS THE CRITICAL PART */}
          {children}
        </div>
      </body>
    </html>
  )
}
