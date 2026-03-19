'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function CoreLight() {
  const hazeRef = useRef<THREE.Mesh>(null)

  // Very slow haze rotation for living feel
  useFrame(({ clock }) => {
    if (!hazeRef.current) return
    hazeRef.current.rotation.z = clock.getElapsedTime() * 0.01
  })

  return (
    <group position={[0, 0.5, 0]}>
      {/* Ambient fill — warm tinted so nothing is pure black */}
      <ambientLight color={new THREE.Color(0.05, 0.03, 0.015)} intensity={0.6} />

      {/* Inner halo — tight warm sphere, bloom catches it */}
      <mesh>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshBasicMaterial
          color={new THREE.Color(0.9, 0.4, 0.08)}
          transparent
          opacity={0.05}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Mid halo — light falloff zone */}
      <mesh>
        <sphereGeometry args={[1.8, 16, 16]} />
        <meshBasicMaterial
          color={new THREE.Color(0.8, 0.32, 0.06)}
          transparent
          opacity={0.02}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Wide atmospheric reach — barely perceptible */}
      <mesh>
        <sphereGeometry args={[4.0, 12, 12]} />
        <meshBasicMaterial
          color={new THREE.Color(0.6, 0.25, 0.05)}
          transparent
          opacity={0.008}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Depth haze plane — flat disc behind the scene, simulates distance fog */}
      <mesh ref={hazeRef} position={[0, -0.2, -5]} rotation={[0, 0, 0]}>
        <planeGeometry args={[20, 14]} />
        <meshBasicMaterial
          color={new THREE.Color(0.06, 0.03, 0.015)}
          transparent
          opacity={0.35}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floor fade — subtle ground plane that darkens the bottom */}
      <mesh position={[0, -3.5, -1]} rotation={[-Math.PI * 0.45, 0, 0]}>
        <planeGeometry args={[16, 8]} />
        <meshBasicMaterial
          color={new THREE.Color(0.02, 0.01, 0.005)}
          transparent
          opacity={0.3}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
