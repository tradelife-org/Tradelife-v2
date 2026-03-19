'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/*
  3-layer ember system:
    Far  — small, slow, dim, deep z
    Mid  — medium, moderate, warmer
    Near — larger, faster, brightest, shallow z
*/

interface LayerConfig {
  count: number
  zRange: [number, number]
  speed: [number, number]
  size: number
  opacity: number
  color: THREE.Color
  spread: [number, number] // x, y range
}

const LAYERS: LayerConfig[] = [
  // Far — deep background dust
  {
    count: 25,
    zRange: [-4, -2],
    speed: [0.06, 0.15],
    size: 0.008,
    opacity: 0.2,
    color: new THREE.Color(0.7, 0.3, 0.08),
    spread: [10, 8],
  },
  // Mid — main ember field
  {
    count: 20,
    zRange: [-2, 0],
    speed: [0.1, 0.25],
    size: 0.014,
    opacity: 0.4,
    color: new THREE.Color(0.95, 0.45, 0.1),
    spread: [7, 6],
  },
  // Near — closest, brightest sparks
  {
    count: 10,
    zRange: [0, 1.5],
    speed: [0.18, 0.4],
    size: 0.02,
    opacity: 0.55,
    color: new THREE.Color(1, 0.55, 0.15),
    spread: [5, 5],
  },
]

function EmberLayer({ config }: { config: LayerConfig }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { count } = config

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
    () =>
      new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: config.opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [config.color, config.opacity]
  )

  useFrame(() => {
    if (!meshRef.current) return
    const t = performance.now() * 0.001
    for (let i = 0; i < count; i++) {
      // Gentle horizontal sway
      const x = baseX[i] + Math.sin(t * 0.2 + offsets[i]) * 0.2
      // Upward drift, wrapping
      const yTravel = config.spread[1]
      const y = baseY[i] + ((t * speeds[i] + offsets[i] * 5) % yTravel) - yTravel * 0.5
      const z = baseZ[i] + Math.sin(t * 0.15 + offsets[i] * 2) * 0.1

      dummy.position.set(x, y, z)
      // Subtle scale breathing
      const s = 0.7 + Math.sin(t * 0.6 + offsets[i]) * 0.3
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={meshRef} args={[geo, mat, count]} />
}

export function EmberSystem() {
  return (
    <group>
      {LAYERS.map((cfg, i) => (
        <EmberLayer key={i} config={cfg} />
      ))}
    </group>
  )
}
