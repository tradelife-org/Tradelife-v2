'use client'

import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { EmberSystem } from './EmberSystem'
import { CoreLight } from './CoreLight'
import { CoreTElement } from './CoreTElement'
import { MoltenCore } from './MoltenCore'
import * as THREE from 'three'

function PostFX({ intensity }: { intensity: number }) {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.7 * intensity}
        luminanceThreshold={0.06}
        luminanceSmoothing={0.85}
        mipmapBlur
      />
      <Vignette
        offset={0.12}
        darkness={0.75 + 0.2 * intensity}
        blendFunction={BlendFunction.NORMAL}
      />
      <ChromaticAberration
        offset={new THREE.Vector2(0.0004 * intensity, 0.0002 * intensity)}
        radialModulation={true}
        modulationOffset={0.5}
      />
      <Noise
        premultiply
        blendFunction={BlendFunction.SOFT_LIGHT}
        opacity={0.08}
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
        <fog attach="fog" args={['#06060a', 2.5, 11]} />
        <CoreLight intensity={intensity} />
        <MoltenCore intensity={intensity} />
        <CoreTElement intensity={intensity} />
        <EmberSystem intensity={intensity} />
        <PostFX intensity={intensity} />
      </Canvas>
    </div>
  )
}
