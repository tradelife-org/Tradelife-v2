'use client'

import * as React from 'react'

interface PercentageInputProps {
  value: number // stored as x100 (2500 = 25.00%)
  onChange: (storedValue: number) => void
  label?: string
  id?: string
  disabled?: boolean
  'data-testid'?: string
}

/**
 * PercentageInput: Displays percentage, stores x100 integer.
 * 25.00% displayed -> 2500 stored.
 */
export function PercentageInput({
  value,
  onChange,
  label,
  id,
  disabled = false,
  ...props
}: PercentageInputProps) {
  const [displayValue, setDisplayValue] = React.useState('')
  const [isFocused, setIsFocused] = React.useState(false)

  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue((value / 100).toFixed(2))
    }
  }, [value, isFocused])

  const handleFocus = () => {
    setIsFocused(true)
    const pct = value / 100
    setDisplayValue(pct === 0 ? '' : String(pct))
  }

  const handleBlur = () => {
    setIsFocused(false)
    const parsed = parseFloat(displayValue)
    if (isNaN(parsed) || parsed < 0) {
      onChange(0)
      setDisplayValue('0.00')
    } else {
      const clamped = Math.min(parsed, 100)
      const stored = Math.round(clamped * 100)
      onChange(stored)
      setDisplayValue((stored / 100).toFixed(2))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '' || /^\d*\.?\d{0,2}$/.test(raw)) {
      setDisplayValue(raw)
      const parsed = parseFloat(raw)
      if (!isNaN(parsed) && parsed >= 0) {
        onChange(Math.round(Math.min(parsed, 100) * 100))
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
          className="w-full h-12 pl-3 pr-10 text-right font-mono text-base bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-all disabled:bg-slate-50 disabled:text-slate-400"
          placeholder="0.00"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm select-none">
          %
        </span>
      </div>
    </div>
  )
}
