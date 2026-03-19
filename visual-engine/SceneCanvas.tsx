'use client'

import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { EmberSystem } from './EmberSystem'
import { CoreLight } from './CoreLight'
import { CoreTElement } from './CoreTElement'

function PostFX({ intensity }: { intensity: number }) {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.6 * intensity}
        luminanceThreshold={0.1}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette
        offset={0.2}
        darkness={0.65 + 0.15 * intensity}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise
        premultiply
        blendFunction={BlendFunction.SOFT_LIGHT}
        opacity={0.12}
      />
    </EffectComposer>
  )
}

interface SceneCanvasProps {
  intensity?: number
}

export function SceneCanvas({ intensity = 1 }: SceneCanvasProps) {
  return (
    <div
      data-testid="visual-engine"
      data-intensity={intensity}
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
        <fog attach="fog" args={['#08080c', 3, 12]} />
        <CoreLight intensity={intensity} />
        <CoreTElement intensity={intensity} />
        <EmberSystem intensity={intensity} />
        <PostFX intensity={intensity} />
      </Canvas>
    </div>
  )
}
