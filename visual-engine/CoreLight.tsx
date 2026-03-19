'use client'

import { useRef } from 'react'
import * as THREE from 'three'

export function CoreLight() {
  const groupRef = useRef<THREE.Group>(null)

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      {/* Soft ambient fill */}
      <ambientLight color={new THREE.Color(0.06, 0.04, 0.02)} intensity={0.8} />

      {/* Inner halo — catches bloom */}
      <mesh>
        <sphereGeometry args={[0.6, 24, 24]} />
        <meshBasicMaterial
          color={new THREE.Color(0.9, 0.4, 0.08)}
          transparent
          opacity={0.06}
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
          opacity={0.025}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}
