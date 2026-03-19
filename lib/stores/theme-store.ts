import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeName = 'molten' | 'commercial' | 'remembrance'

interface ThemeStore {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'commercial',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'tradelife-theme' }
  )
)
