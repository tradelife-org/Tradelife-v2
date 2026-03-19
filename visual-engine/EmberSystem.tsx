'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface LayerConfig {
  count: number
  zRange: [number, number]
  speed: [number, number]
  size: number
  opacity: number
  color: THREE.Color
  spread: [number, number]
}

const LAYERS: LayerConfig[] = [
  { count: 25, zRange: [-4, -2], speed: [0.06, 0.15], size: 0.008, opacity: 0.2, color: new THREE.Color(0.7, 0.3, 0.08), spread: [10, 8] },
  { count: 20, zRange: [-2, 0], speed: [0.1, 0.25], size: 0.014, opacity: 0.4, color: new THREE.Color(0.95, 0.45, 0.1), spread: [7, 6] },
  { count: 10, zRange: [0, 1.5], speed: [0.18, 0.4], size: 0.02, opacity: 0.55, color: new THREE.Color(1, 0.55, 0.15), spread: [5, 5] },
]

function EmberLayer({ config, intensity }: { config: LayerConfig; intensity: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const count = Math.max(1, Math.round(config.count * intensity))

  const { baseX, baseY, baseZ, speeds, offsets } = useMemo(() => {
    const bx = new Float32Array(count)
    const by = new Float32Array(count)
    const bz = new Float32Array(count)
    const sp = new Float32Array(count)
    const of = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      bx[i] = (Math.random() - 0.5) * config.spread[0]
      by[i] = (Math.random() - 0.5) * config.spread[1]
      bz[i] = config.zRange[0] + Math.random() * (config.zRange[1] - config.zRange[0])
      sp[i] = config.speed[0] + Math.random() * (config.speed[1] - config.speed[0])
      of[i] = Math.random() * Math.PI * 2
    }
    return { baseX: bx, baseY: by, baseZ: bz, speeds: sp, offsets: of }
  }, [count, config])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const geo = useMemo(() => new THREE.SphereGeometry(config.size, 6, 6), [config.size])
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: config.opacity * intensity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    [config.color, config.opacity, intensity]
  )

  useFrame(() => {
    if (!meshRef.current) return
    const t = performance.now() * 0.001
    for (let i = 0; i < count; i++) {
      const x = baseX[i] + Math.sin(t * 0.2 + offsets[i]) * 0.2
      const yTravel = config.spread[1]
      const y = baseY[i] + ((t * speeds[i] + offsets[i] * 5) % yTravel) - yTravel * 0.5
      const z = baseZ[i] + Math.sin(t * 0.15 + offsets[i] * 2) * 0.1
      dummy.position.set(x, y, z)
      const s = 0.7 + Math.sin(t * 0.6 + offsets[i]) * 0.3
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={meshRef} args={[geo, mat, count]} />
}

interface EmberSystemProps {
  intensity?: number
}

export function EmberSystem({ intensity = 1 }: EmberSystemProps) {
  return (
    <group>
      {LAYERS.map((cfg, i) => (
        <EmberLayer key={`${i}-${intensity}`} config={cfg} intensity={intensity} />
      ))}
    </group>
  )
}
