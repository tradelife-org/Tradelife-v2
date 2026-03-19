interface PanelProps {
  children: React.ReactNode
  className?: string
  'data-testid'?: string
}

export function Panel({ children, className = '', 'data-testid': testId }: PanelProps) {
  return (
    <div
      data-testid={testId}
      className={`bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 ${className}`}
    >
      {children}
    </div>
  )
}
