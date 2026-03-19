'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

interface CoreTElementProps {
  intensity?: number
}

export function CoreTElement({ intensity = 1 }: CoreTElementProps) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const primaryRef = useRef<THREE.PointLight>(null)
  const fillRef = useRef<THREE.PointLight>(null)
  const rearRef = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    if (!matRef.current || !primaryRef.current || !fillRef.current || !rearRef.current) return
    const t = clock.getElapsedTime()

    const pulse = 0.88 + Math.sin(t * 0.6) * 0.12
    const flicker = 1.0
      + Math.sin(t * 3.7) * 0.025
      + Math.sin(t * 7.3) * 0.012
      + Math.sin(t * 13.1) * 0.006

    const base = pulse * flicker

    matRef.current.emissiveIntensity = base * 4 * intensity
    primaryRef.current.intensity = base * 10 * intensity
    fillRef.current.intensity = base * 4 * intensity
    rearRef.current.intensity = base * 2 * intensity
  })

  return (
    <group position={[0, 0.6, 0]}>
      {/* The T letter — emissive, bloom catches it */}
      <Text
        fontSize={1.2}
        font="/fonts/inter-bold.ttf"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0}
      >
        T
        <meshStandardMaterial
          ref={matRef}
          color={new THREE.Color(0.02, 0.04, 0.12)}
          emissive={new THREE.Color(0.3, 0.55, 1.0)}
          emissiveIntensity={4 * intensity}
          roughness={0.2}
          metalness={0.8}
          toneMapped={false}
        />
      </Text>

      {/* Primary — strong center emission */}
      <pointLight
        ref={primaryRef}
        color={new THREE.Color(0.3, 0.55, 1.0)}
        intensity={10 * intensity}
        distance={22}
        decay={2}
      />

      {/* Forward fill — pushes warmth toward camera */}
      <pointLight
        ref={fillRef}
        color={new THREE.Color(0.2, 0.45, 0.9)}
        intensity={4 * intensity}
        distance={12}
        decay={2.5}
        position={[0, 0, 2.5]}
      />

      {/* Rear fill — creates depth behind core */}
      <pointLight
        ref={rearRef}
        color={new THREE.Color(0.12, 0.25, 0.6)}
        intensity={2 * intensity}
        distance={8}
        decay={3}
        position={[0, 0, -2]}
      />
    </group>
  )
}
