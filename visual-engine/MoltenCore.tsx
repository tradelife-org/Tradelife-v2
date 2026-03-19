'use client'

import { useRef, useMemo } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform float uTime;
uniform float uIntensity;
varying vec2 vUv;

// Value noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv - 0.5;
  float dist = length(uv) * 2.0;

  // Animated flow
  float t = uTime * 0.15;
  vec2 flow = vec2(
    fbm(uv * 3.0 + vec2(t, t * 0.7)),
    fbm(uv * 3.0 + vec2(-t * 0.6, t * 0.8) + 50.0)
  );

  float n = fbm(uv * 2.5 + flow * 0.8 + t * 0.1);
  float n2 = fbm(uv * 4.0 - flow * 0.5 + t * 0.05 + 100.0);
  float combined = mix(n, n2, 0.4);

  // Radial energy falloff — tight center
  float radial = 1.0 - smoothstep(0.0, 0.5, dist);
  radial = pow(radial, 1.5);

  float energy = combined * radial;

  // Flicker
  float flicker = 1.0 + sin(uTime * 3.7) * 0.04 + sin(uTime * 7.3) * 0.02;
  energy *= flicker;

  // Color ramp: white center → light blue → blue → deep navy → black
  vec3 colBlack = vec3(0.0, 0.005, 0.02);
  vec3 colDeep = vec3(0.02, 0.06, 0.2);
  vec3 colBlue = vec3(0.15, 0.35, 0.9);
  vec3 colLight = vec3(0.5, 0.7, 1.0);
  vec3 colWhite = vec3(0.9, 0.95, 1.0);

  vec3 color;
  if (energy < 0.15) {
    color = mix(colBlack, colDeep, energy / 0.15);
  } else if (energy < 0.35) {
    color = mix(colDeep, colBlue, (energy - 0.15) / 0.2);
  } else if (energy < 0.55) {
    color = mix(colBlue, colLight, (energy - 0.35) / 0.2);
  } else {
    color = mix(colLight, colWhite, clamp((energy - 0.55) / 0.45, 0.0, 1.0));
  }

  // Brightness boost for bloom to catch
  color *= (1.0 + energy * 2.0) * uIntensity;

  // Alpha falloff
  float alpha = radial * smoothstep(0.0, 0.1, energy) * uIntensity;

  gl_FragColor = vec4(color, alpha);
}
`

interface MoltenCoreProps {
  intensity?: number
}

export function MoltenCore({ intensity = 1 }: MoltenCoreProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: intensity },
    }),
    []
  )

  useFrame(({ clock }) => {
    if (!matRef.current) return
    matRef.current.uniforms.uTime.value = clock.getElapsedTime()
    matRef.current.uniforms.uIntensity.value = intensity
  })

  return (
    <mesh position={[0, 0.6, 0.1]}>
      <planeGeometry args={[2.8, 2.8, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
