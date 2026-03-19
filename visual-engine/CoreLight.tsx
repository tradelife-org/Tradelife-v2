'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CoreLightProps {
  intensity?: number
}

export function CoreLight({ intensity = 1 }: CoreLightProps) {
  const hazeRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!hazeRef.current) return
    hazeRef.current.rotation.z = clock.getElapsedTime() * 0.008
  })

  return (
    <group position={[0, 0.5, 0]}>
      {/* Very low ambient — scene should be mostly dark */}
      <ambientLight color={new THREE.Color(0.01, 0.015, 0.03)} intensity={0.3 * intensity} />

      {/* Inner halo — tight, caught by bloom */}
      <mesh>
        <sphereGeometry args={[0.4, 24, 24]} />
        <meshBasicMaterial
          color={new THREE.Color(0.3, 0.55, 1.0)}
          transparent
          opacity={0.08 * intensity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Mid halo */}
      <mesh>
        <sphereGeometry args={[1.6, 16, 16]} />
        <meshBasicMaterial
          color={new THREE.Color(0.15, 0.35, 0.7)}
          transparent
          opacity={0.03 * intensity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Wide reach */}
      <mesh>
        <sphereGeometry args={[4.0, 12, 12]} />
        <meshBasicMaterial
          color={new THREE.Color(0.08, 0.18, 0.4)}
          transparent
          opacity={0.012 * intensity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Edge absorber — darkens periphery */}
      <mesh>
        <sphereGeometry args={[9, 16, 16]} />
        <meshBasicMaterial
          color={new THREE.Color(0, 0, 0)}
          transparent
          opacity={0.25}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Depth haze */}
      <mesh ref={hazeRef} position={[0, -0.3, -6]}>
        <planeGeometry args={[24, 16]} />
        <meshBasicMaterial
          color={new THREE.Color(0.01, 0.015, 0.025)}
          transparent
          opacity={0.45}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floor shadow */}
      <mesh position={[0, -4, -1]} rotation={[-Math.PI * 0.42, 0, 0]}>
        <planeGeometry args={[18, 10]} />
        <meshBasicMaterial
          color={new THREE.Color(0.005, 0.008, 0.015)}
          transparent
          opacity={0.4}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
