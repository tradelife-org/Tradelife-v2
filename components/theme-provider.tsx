'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/lib/stores/theme-store'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('theme-molten', 'theme-commercial', 'theme-remembrance')
    html.classList.add(`theme-${theme}`)
  }, [theme])

  return <>{children}</>
}
