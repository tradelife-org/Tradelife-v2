interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
  'data-testid'?: string
}

export function Button({ children, variant = 'secondary', size = 'md', className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium transition-colors'
  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-xs px-4 py-2.5',
  }
  const variants = {
    primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-dim)] rounded-[var(--radius-md)]',
    secondary: 'btn-material text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
    ghost: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-[var(--radius-md)]',
  }

  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
