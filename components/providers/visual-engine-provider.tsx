"use client"

import React from "react"

export function VisualEngineProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function useVisualEngine() {
  return {}
}
