'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

export function CoreTElement() {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    if (!matRef.current || !lightRef.current) return
    const t = clock.getElapsedTime()

    // Slow pulse
    const pulse = 0.85 + Math.sin(t * 0.8) * 0.15

    // Subtle flicker — layered noise at different frequencies
    const flicker = 1.0
      + Math.sin(t * 3.7) * 0.03
      + Math.sin(t * 7.3) * 0.015
      + Math.sin(t * 13.1) * 0.008

    const intensity = pulse * flicker

    matRef.current.emissiveIntensity = intensity * 2.5
    lightRef.current.intensity = intensity * 6
  })

  return (
    <group position={[0, 0.6, 0]}>
      {/* The T — emissive text mesh, bloom will catch this */}
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
          color={new THREE.Color(0.15, 0.08, 0.02)}
          emissive={new THREE.Color(1, 0.45, 0.08)}
          emissiveIntensity={2.5}
          roughness={0.3}
          metalness={0.7}
          toneMapped={false}
        />
      </Text>

      {/* Point light — the T emits warm light into the scene */}
      <pointLight
        ref={lightRef}
        color={new THREE.Color(1, 0.5, 0.12)}
        intensity={6}
        distance={18}
        decay={2}
      />
    </group>
  )
}
