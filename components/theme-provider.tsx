'use client'

import { useEffect, useState } from 'react'
import { useThemeStore } from '@/lib/stores/theme-store'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <div className={mounted ? `theme-${theme}` : 'theme-commercial'} style={{ minHeight: '100vh' }}>
      {children}
    </div>
  )
}
