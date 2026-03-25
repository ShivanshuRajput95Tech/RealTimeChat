import { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sparkles, Stars } from '@react-three/drei'
import * as THREE from 'three'

function EnhancedParticles({ count = 500 }) {
  const mesh = useRef()
  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30
    }
    return pos
  })

  const colors = useMemo(() => {
    const col = new Float32Array(count * 3)
    const palette = [
      new THREE.Color('#6366f1'),
      new THREE.Color('#8b5cf6'),
      new THREE.Color('#06b6d4'),
      new THREE.Color('#ec4899'),
      new THREE.Color('#22c55e'),
      new THREE.Color('#f59e0b'),
    ]
    for (let i = 0; i < count; i++) {
      const c = palette[Math.floor(Math.random() * palette.length)]
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    return col
  }, [count])

  useFrame((state) => {
    if (mesh.current) {
      const time = state.clock.getElapsedTime()
      mesh.current.rotation.x = time * 0.02
      mesh.current.rotation.y = time * 0.04
    }
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors transparent opacity={0.8} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  )
}

function AnimatedOrb({ position, color, scale = 1, speed = 2 }) {
  const meshRef = useRef()
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(time * speed) * 0.5
      meshRef.current.rotation.x = time * 0.15
      meshRef.current.rotation.z = time * 0.1
    }
  })

  return (
    <Float speed={4} rotationIntensity={0.5} floatIntensity={0.8}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={0.8} 
          roughness={0.1} 
          metalness={0.9} 
          distort={0.4} 
          speed={speed} 
          transparent 
          opacity={0.7} 
        />
      </mesh>
    </Float>
  )
}

function NebulaCloud() {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.02
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -15]}>
      <planeGeometry args={[40, 40]} />
      <meshBasicMaterial color="#6366f1" transparent opacity={0.05} />
    </mesh>
  )
}

function InteractiveSphere() {
  const meshRef = useRef()
  const { mouse } = useThree()
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x = mouse.y * 0.5
      meshRef.current.rotation.y = mouse.x * 0.5
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh ref={meshRef} position={[8, 3, -5]} scale={0.8}>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshDistortMaterial 
          color="#8b5cf6" 
          emissive="#8b5cf6" 
          emissiveIntensity={0.5} 
          roughness={0.2} 
          metalness={0.8} 
          distort={0.3} 
          speed={2} 
          transparent 
          opacity={0.6}
        />
      </mesh>
    </Float>
  )
}

function DataStreams() {
  const linesRef = useRef()
  
  const positions = useMemo(() => {
    const pos = new Float32Array(200 * 3)
    for (let i = 0; i < 200; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 25
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 8
    }
    return pos
  }, [])

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.y = state.clock.getElapsedTime() * 0.015
    }
  })

  return (
    <points ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={200} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#06b6d4" transparent opacity={0.5} sizeAttenuation />
    </points>
  )
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#030712']} />
      <fog attach="fog" args={['#030712', 8, 40]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[15, 15, 15]} intensity={1.5} color="#6366f1" />
      <pointLight position={[-15, -15, -15]} intensity={1} color="#8b5cf6" />
      <spotLight position={[0, 20, 0]} angle={0.4} penumbra={1} intensity={2} color="#06b6d4" />
      
      <EnhancedParticles count={600} />
      <Sparkles count={200} scale={25} size={2} speed={0.4} opacity={0.5} color="#6366f1" />
      <Stars radius={50} depth={50} count={1000} factor={2} saturation={0} fade speed={0.5} />
      
      <AnimatedOrb position={[-6, 3, -4]} color="#6366f1" scale={0.9} speed={2} />
      <AnimatedOrb position={[6, -2, -5]} color="#8b5cf6" scale={0.7} speed={2.5} />
      <AnimatedOrb position={[4, 4, -3]} color="#06b6d4" scale={0.6} speed={3} />
      <AnimatedOrb position={[-4, -3, -6]} color="#ec4899" scale={0.5} speed={1.8} />
      <AnimatedOrb position={[0, 5, -7]} color="#22c55e" scale={0.4} speed={2.2} />
      <AnimatedOrb position={[-8, -4, -8]} color="#f59e0b" scale={0.35} speed={1.5} />
      
      <InteractiveSphere />
      <NebulaCloud />
      <DataStreams />
    </>
  )
}

export default function ThreeBackground({ children, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Canvas 
        camera={{ position: [0, 0, 10], fov: 50 }} 
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} 
        dpr={[1, 2]} 
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <Scene />
      </Canvas>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {children}
      </div>
    </div>
  )
}
