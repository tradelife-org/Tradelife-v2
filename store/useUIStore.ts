import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
  onboardingStep: number
  setOnboardingStep: (step: number) => void
  aiCoreOpen: boolean
  setAiCoreOpen: (open: boolean) => void
  leftOrder: string[]
  rightOrder: string[]
  setLeftOrder: (order: string[]) => void
  setRightOrder: (order: string[]) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      onboardingStep: 0,
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      aiCoreOpen: false,
      setAiCoreOpen: (open) => set({ aiCoreOpen: open }),
      leftOrder: ['attention', 'projects', 'trades'],
      rightOrder: ['schedule', 'urgent', 'financial'],
      setLeftOrder: (order) => set({ leftOrder: order }),
      setRightOrder: (order) => set({ rightOrder: order }),
    }),
    { name: 'tradelife-ui' }
  )
)
