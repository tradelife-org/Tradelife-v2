'use client'

import * as React from 'react'

interface MoneyInputProps {
  value: number // pence (BigInt stored as number)
  onChange: (pence: number) => void
  label?: string
  id?: string
  disabled?: boolean
  'data-testid'?: string
}

/**
 * MoneyInput: Displays pounds, stores pence.
 * On focus: shows raw float for editing.
 * On blur: parses, rounds to nearest pence, calls onChange.
 */
export function MoneyInput({
  value,
  onChange,
  label,
  id,
  disabled = false,
  ...props
}: MoneyInputProps) {
  const [displayValue, setDisplayValue] = React.useState('')
  const [isFocused, setIsFocused] = React.useState(false)

  // Sync display when value changes externally (and not focused)
  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue((value / 100).toFixed(2))
    }
  }, [value, isFocused])

  const handleFocus = () => {
    setIsFocused(true)
    // Show clean number for editing
    const pounds = value / 100
    setDisplayValue(pounds === 0 ? '' : String(pounds))
  }

  const handleBlur = () => {
    setIsFocused(false)
    const parsed = parseFloat(displayValue)
    if (isNaN(parsed) || parsed < 0) {
      onChange(0)
      setDisplayValue('0.00')
    } else {
      const pence = Math.round(parsed * 100)
      onChange(pence)
      setDisplayValue((pence / 100).toFixed(2))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    // Allow digits, one decimal, max 2 decimal places during editing
    if (raw === '' || /^\d*\.?\d{0,2}$/.test(raw)) {
      setDisplayValue(raw)
      // Optimistic update while typing
      const parsed = parseFloat(raw)
      if (!isNaN(parsed) && parsed >= 0) {
        onChange(Math.round(parsed * 100))
      }
    }
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-600">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm select-none">
          £
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          data-testid={props['data-testid']}
          className="w-full h-12 pl-8 pr-3 text-right font-mono text-base bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-all disabled:bg-slate-50 disabled:text-slate-400"
          placeholder="0.00"
        />
      </div>
    </div>
  )
}
