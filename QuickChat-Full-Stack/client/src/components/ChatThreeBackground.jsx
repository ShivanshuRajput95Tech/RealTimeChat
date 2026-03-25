import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Sparkles, Stars } from '@react-three/drei'
import * as THREE from 'three'

function ChatParticles({ count = 100 }) {
  const mesh = useRef()
  const { mouse } = useThree()
  
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const palette = [
      new THREE.Color('#6366f1'),
      new THREE.Color('#8b5cf6'),
      new THREE.Color('#06b6d4'),
      new THREE.Color('#ec4899'),
    ]
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5
      
      const c = palette[Math.floor(Math.random() * palette.length)]
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    return [pos, col]
  }, [count])

  useFrame((state) => {
    if (mesh.current) {
      const time = state.clock.getElapsedTime()
      mesh.current.rotation.x = time * 0.015 + mouse.y * 0.1
      mesh.current.rotation.y = time * 0.025 + mouse.x * 0.1
    }
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} vertexColors transparent opacity={0.6} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  )
}

function GlowingTorus() {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.08
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.12
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -10]} rotation={[Math.PI / 4, 0, 0]}>
      <torusGeometry args={[6, 0.08, 16, 100]} />
      <meshStandardMaterial 
        color="#6366f1" 
        emissive="#6366f1" 
        emissiveIntensity={3} 
        transparent 
        opacity={0.15}
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  )
}

function GlowingTorus2() {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.06 + Math.PI / 3
      meshRef.current.rotation.z = state.clock.getElapsedTime() * 0.1
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -12]} rotation={[0, 0, 0]}>
      <torusGeometry args={[8, 0.05, 12, 80]} />
      <meshStandardMaterial 
        color="#8b5cf6" 
        emissive="#8b5cf6" 
        emissiveIntensity={2} 
        transparent 
        opacity={0.1}
        roughness={0.3}
        metalness={0.7}
      />
    </mesh>
  )
}

function FloatingOrb({ position, color, scale = 0.5 }) {
  const meshRef = useRef()
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(time * 0.8 + position[0]) * 0.3
      meshRef.current.rotation.x = time * 0.2
      meshRef.current.rotation.z = time * 0.15
    }
  })

  return (
    <Float speed={3} rotationIntensity={0.4} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={1} 
          transparent 
          opacity={0.4}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
    </Float>
  )
}

function MessageBubbles() {
  const groupRef = useRef()
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.03
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, -8]}>
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[
          Math.sin(i * 1.2) * 4,
          Math.cos(i * 1.5) * 2,
          Math.sin(i * 0.8) * 2 - 5
        ]} scale={0.15 + Math.random() * 0.1}>
          <boxGeometry args={[1, 0.6, 0.2]} />
          <meshStandardMaterial 
            color={i % 2 === 0 ? '#6366f1' : '#8b5cf6'} 
            emissive={i % 2 === 0 ? '#6366f1' : '#8b5cf6'} 
            emissiveIntensity={0.3}
            transparent 
            opacity={0.3}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  )
}

function ChatScene({ intensity }) {
  const particleCount = intensity === 'low' ? 40 : intensity === 'medium' ? 80 : 120
  
  return (
    <>
      <color attach="background" args={['#030712']} />
      <fog attach="fog" args={['#030712', 5, 25]} />
      
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#6366f1" />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#8b5cf6" />
      <pointLight position={[0, 10, 5]} intensity={0.3} color="#06b6d4" />
      
      <ChatParticles count={particleCount} />
      <Sparkles count={intensity === 'low' ? 20 : 50} scale={15} size={2} speed={0.3} opacity={0.4} color="#6366f1" />
      <Stars radius={30} depth={20} count={intensity === 'low' ? 200 : 500} factor={2} saturation={0} fade speed={0.3} />
      
      <GlowingTorus />
      <GlowingTorus2 />
      
      <FloatingOrb position={[-5, 2, -6]} color="#6366f1" scale={0.5} />
      <FloatingOrb position={[5, -1, -7]} color="#8b5cf6" scale={0.4} />
      <FloatingOrb position={[3, 3, -5]} color="#06b6d4" scale={0.35} />
      <FloatingOrb position={[-3, -2, -8]} color="#ec4899" scale={0.3} />
      
      <MessageBubbles />
    </>
  )
}

export default function ChatThreeBackground({ children, className = '', intensity = 'medium' }) {
  return (
    <div className={`relative ${className}`} style={{ background: '#030712' }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', dpr: [1, 1.5] }}
        dpr={[1, 1.5]}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
        performance={{ min: 0.5 }}
      >
        <ChatScene intensity={intensity} />
      </Canvas>
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none',
        zIndex: 1,
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(3, 7, 18, 0.2) 40%, rgba(3, 7, 18, 0.6) 100%)'
      }} />
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </div>
  )
}
