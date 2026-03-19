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
    hazeRef.current.rotation.z = clock.getElapsedTime() * 0.01
  })

  return (
    <group position={[0, 0.5, 0]}>
      <ambientLight color={new THREE.Color(0.03, 0.02, 0.01)} intensity={0.4 * intensity} />

      <mesh>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshBasicMaterial
          color={new THREE.Color(1, 0.45, 0.1)}
          transparent
          opacity={0.07 * intensity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[2.0, 16, 16]} />
        <meshBasicMaterial
          color={new THREE.Color(0.8, 0.3, 0.06)}
          transparent
          opacity={0.025 * intensity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[4.5, 12, 12]} />
        <meshBasicMaterial
          color={new THREE.Color(0.5, 0.2, 0.04)}
          transparent
          opacity={0.01 * intensity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial
          color={new THREE.Color(0, 0, 0)}
          transparent
          opacity={0.2}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh ref={hazeRef} position={[0, -0.2, -5]}>
        <planeGeometry args={[20, 14]} />
        <meshBasicMaterial
          color={new THREE.Color(0.04, 0.02, 0.01)}
          transparent
          opacity={0.4}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, -3.5, -1]} rotation={[-Math.PI * 0.45, 0, 0]}>
        <planeGeometry args={[16, 8]} />
        <meshBasicMaterial
          color={new THREE.Color(0.015, 0.008, 0.004)}
          transparent
          opacity={0.35}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
