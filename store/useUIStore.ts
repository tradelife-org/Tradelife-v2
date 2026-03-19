import { create } from 'zustand'

interface UIStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
  onboardingStep: number
  setOnboardingStep: (step: number) => void
  aiCoreOpen: boolean
  setAiCoreOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  onboardingStep: 0,
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  aiCoreOpen: false,
  setAiCoreOpen: (open) => set({ aiCoreOpen: open }),
}))
