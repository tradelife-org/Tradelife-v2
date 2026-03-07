"use client"

import { createContext, useContext, useEffect, useState } from "react"

interface VisualEngineContextType {
  theme: "molten-copper"
  colors: {
    primary: string
    accent: string
    surface: string
    background: string
  }
}

const VisualEngineContext = createContext<VisualEngineContextType | undefined>(undefined)

export function VisualEngineProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState<"molten-copper">("molten-copper")

  // Colors from Bible v6 (design_guidelines.json)
  const colors = {
    primary: "#0047AB", // Blueprint Blue
    accent: "#FF5F00",  // Safety Orange (Molten Copper)
    surface: "#FFFFFF",
    background: "#F8FAFC",
  }

  useEffect(() => {
    // Enforce Bible v6 typography and colors via CSS variables if needed
    // Currently handled by Tailwind config, but we set root vars for consistency
    const root = document.documentElement
    root.style.setProperty("--color-primary", colors.primary)
    root.style.setProperty("--color-accent", colors.accent)
    root.style.setProperty("--font-heading", "Chivo, sans-serif")
    root.style.setProperty("--font-body", "Manrope, sans-serif")
    root.style.setProperty("--font-mono", "JetBrains Mono, monospace")
    
    console.log("VisualEngine: Active Theme - Molten Copper (Bible v6)")
  }, [colors])

  return (
    <VisualEngineContext.Provider value={{ theme, colors }}>
      {children}
    </VisualEngineContext.Provider>
  )
}

export function useVisualEngine() {
  const context = useContext(VisualEngineContext)
  if (context === undefined) {
    throw new Error("useVisualEngine must be used within a VisualEngineProvider")
  }
  return context
}
