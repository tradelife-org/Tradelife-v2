'use client'

import { useRef } from 'react'
import * as THREE from 'three'

export function CoreLight() {
  const groupRef = useRef<THREE.Group>(null)

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      {/* Primary warm point light — the core source */}
      <pointLight
        color={new THREE.Color(0.95, 0.55, 0.15)}
        intensity={4}
        distance={15}
        decay={2}
      />

      {/* Soft ambient fill — prevents total black */}
      <ambientLight color={new THREE.Color(0.08, 0.05, 0.02)} intensity={1} />

      {/* Core orb — visible center glow */}
      <mesh>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshBasicMaterial
          color={new THREE.Color(1, 0.5, 0.12)}
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Halo ring — soft spread around the core */}
      <mesh>
        <sphereGeometry args={[0.8, 24, 24]} />
        <meshBasicMaterial
          color={new THREE.Color(0.9, 0.4, 0.08)}
          transparent
          opacity={0.08}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Wider atmospheric halo */}
      <mesh>
        <sphereGeometry args={[2.0, 16, 16]} />
        <meshBasicMaterial
          color={new THREE.Color(0.8, 0.35, 0.06)}
          transparent
          opacity={0.03}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}
