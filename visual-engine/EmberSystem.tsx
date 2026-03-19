'use client'

import { useRef, useMemo } from 'react'
import * as THREE from 'three'

interface EmberSystemProps {
  count?: number
}

export function EmberSystem({ count = 60 }: EmberSystemProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const { positions, speeds, offsets } = useMemo(() => {
    const p = new Float32Array(count * 3)
    const s = new Float32Array(count)
    const o = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 8
      p[i * 3 + 1] = (Math.random() - 0.5) * 6
      p[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1
      s[i] = 0.15 + Math.random() * 0.35
      o[i] = Math.random() * Math.PI * 2
    }
    return { positions: p, speeds: s, offsets: o }
  }, [count])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  const emberMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.9, 0.45, 0.12),
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  )

  const emberGeometry = useMemo(() => new THREE.SphereGeometry(0.015, 6, 6), [])

  return (
    <instancedMesh
      ref={meshRef}
      args={[emberGeometry, emberMaterial, count]}
      onBeforeRender={() => {
        if (!meshRef.current) return
        const time = performance.now() * 0.001
        for (let i = 0; i < count; i++) {
          const x = positions[i * 3] + Math.sin(time * 0.3 + offsets[i]) * 0.15
          let y = positions[i * 3 + 1] + ((time * speeds[i] + offsets[i] * 10) % 6) - 3
          const z = positions[i * 3 + 2]
          dummy.position.set(x, y, z)
          const scale = 0.6 + Math.sin(time * 0.8 + offsets[i]) * 0.4
          dummy.scale.setScalar(scale)
          dummy.updateMatrix()
          meshRef.current.setMatrixAt(i, dummy.matrix)
        }
        meshRef.current.instanceMatrix.needsUpdate = true
      }}
    />
  )
}
