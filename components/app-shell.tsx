export default function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="w-full" data-testid="app-shell-content">{children}</div>
}
