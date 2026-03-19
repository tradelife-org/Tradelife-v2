interface PanelProps {
  children: React.ReactNode
  className?: string
  'data-testid'?: string
}

export function Panel({ children, className = '', 'data-testid': testId }: PanelProps) {
  return (
    <div
      data-testid={testId}
      className={`panel-material p-5 ${className}`}
    >
      <div className="relative z-[1]">{children}</div>
    </div>
  )
}
