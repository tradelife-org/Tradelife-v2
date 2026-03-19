'use client'

import { Canvas } from '@react-three/fiber'
import { EmberSystem } from './EmberSystem'
import { CoreLight } from './CoreLight'

export function SceneCanvas() {
  return (
    <div
      data-testid="visual-engine"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <fog attach="fog" args={['#0a0a0e', 4, 14]} />
        <CoreLight />
        <EmberSystem count={50} />
      </Canvas>
    </div>
  )
}
