'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

const SceneCanvas = dynamic(
  () => import('./SceneCanvas').then((m) => m.SceneCanvas),
  { ssr: false }
)

function getIntensity(pathname: string): number {
  if (pathname.startsWith('/login')) return 0.3
  if (pathname.startsWith('/onboarding')) return 0.5
  return 1.0
}

export function VisualEngine() {
  const pathname = usePathname()
  const intensity = getIntensity(pathname)

  return <SceneCanvas intensity={intensity} />
}
