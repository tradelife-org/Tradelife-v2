'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

export function CoreTElement() {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const primaryRef = useRef<THREE.PointLight>(null)
  const fillRef = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    if (!matRef.current || !primaryRef.current || !fillRef.current) return
    const t = clock.getElapsedTime()

    const pulse = 0.85 + Math.sin(t * 0.8) * 0.15
    const flicker = 1.0
      + Math.sin(t * 3.7) * 0.03
      + Math.sin(t * 7.3) * 0.015
      + Math.sin(t * 13.1) * 0.008

    const intensity = pulse * flicker

    matRef.current.emissiveIntensity = intensity * 3
    primaryRef.current.intensity = intensity * 8
    fillRef.current.intensity = intensity * 3
  })

  return (
    <group position={[0, 0.6, 0]}>
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
          emissiveIntensity={3}
          roughness={0.3}
          metalness={0.7}
          toneMapped={false}
        />
      </Text>

      {/* Primary point light — strong, focused */}
      <pointLight
        ref={primaryRef}
        color={new THREE.Color(1, 0.5, 0.12)}
        intensity={8}
        distance={20}
        decay={2}
      />

      {/* Forward fill — pushes light toward camera, illuminates near-UI space */}
      <pointLight
        ref={fillRef}
        color={new THREE.Color(0.9, 0.4, 0.1)}
        intensity={3}
        distance={10}
        decay={2.5}
        position={[0, 0, 2]}
      />
    </group>
  )
}
