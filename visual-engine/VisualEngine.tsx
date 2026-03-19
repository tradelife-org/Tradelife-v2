'use client'

import dynamic from 'next/dynamic'

const SceneCanvas = dynamic(
  () => import('./SceneCanvas').then((m) => m.SceneCanvas),
  { ssr: false }
)

export function VisualEngine() {
  return <SceneCanvas />
}
