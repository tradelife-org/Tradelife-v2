interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  'data-testid'?: string
}

export function Input({ label, className = '', 'data-testid': testId, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-medium text-[var(--text-secondary)]">{label}</label>}
      <input
        data-testid={testId}
        className={`w-full bg-[var(--bg-inset)] border border-[var(--border)] rounded-[var(--radius-md)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--border-strong)] ${className}`}
        {...props}
      />
    </div>
  )
}
