import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, MeshTransmissionMaterial, Environment } from '@react-three/drei'
import * as THREE from 'three'

function ChatParticles({ count = 80 }) {
  const mesh = useRef()
  
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const palette = [
      new THREE.Color('#6366f1'),
      new THREE.Color('#8b5cf6'),
      new THREE.Color('#06b6d4'),
    ]
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 25
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5
      
      const c = palette[Math.floor(Math.random() * palette.length)]
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    return [pos, col]
  }, [count])

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = state.clock.getElapsedTime() * 0.01
      mesh.current.rotation.y = state.clock.getElapsedTime() * 0.015
    }
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.04} 
        vertexColors 
        transparent 
        opacity={0.5} 
        sizeAttenuation 
        blending={THREE.AdditiveBlending} 
      />
    </points>
  )
}

function ChatGlassOrb({ position, color, scale = 0.6 }) {
  const meshRef = useRef()
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.3
      meshRef.current.rotation.y = time * 0.15
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshTransmissionMaterial
          color={color}
          backside
          samples={2}
          resolution={128}
          transmission={0.9}
          roughness={0.1}
          thickness={0.3}
          ior={1.3}
          chromaticAberration={0.04}
          distortion={0.05}
          distortionScale={0.2}
          temporalDistortion={0.1}
          clearcoat={0.5}
          envMapIntensity={0.8}
        />
      </mesh>
    </Float>
  )
}

function GlowingRing() {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.08
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -8]} rotation={[Math.PI / 4, 0, 0]}>
      <torusGeometry args={[5, 0.04, 12, 64]} />
      <meshStandardMaterial 
        color="#6366f1" 
        emissive="#6366f1" 
        emissiveIntensity={1.5} 
        transparent 
        opacity={0.2} 
      />
    </mesh>
  )
}

function ChatScene({ mouse }) {
  const { camera } = useThree()
  
  useFrame(() => {
    camera.position.x += (mouse.x * 0.3 - camera.position.x) * 0.015
    camera.position.y += (mouse.y * 0.2 - camera.position.y) * 0.015
    camera.lookAt(0, 0, 0)
  })

  return (
    <>
      <color attach="background" args={['#030712']} />
      <fog attach="fog" args={['#030712', 8, 25]} />
      
      <ambientLight intensity={0.25} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#6366f1" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#8b5cf6" />
      
      <Environment preset="night" />
      <ChatParticles count={50} />
      <GlowingRing />
      
      <ChatGlassOrb position={[-4, 1, -3]} color="#6366f1" scale={0.5} />
      <ChatGlassOrb position={[4, -1, -4]} color="#8b5cf6" scale={0.4} />
      <ChatGlassOrb position={[2, 2, -5]} color="#06b6d4" scale={0.35} />
    </>
  )
}

export default function ChatLiquidGlassBackground({ children, className = '', intensity = 'medium' }) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
    
    const handleMouseMove = (e) => {
      setMouse({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2
      })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  if (!isClient) {
    return (
      <div className={`relative ${className}`} style={{ background: '#030712' }}>
        {children}
      </div>
    )
  }

  const dpr = intensity === 'high' ? [1, 1.5] : intensity === 'low' ? [1, 1] : [1, 1.25]

  return (
    <div className={`relative ${className}`} style={{ background: '#030712' }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 55 }}
        gl={{ 
          antialias: true, 
          alpha: true, 
          powerPreference: 'high-performance',
          stencil: false,
          depth: true
        }}
        dpr={dpr}
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        <ChatScene mouse={mouse} />
      </Canvas>
      
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(3, 7, 18, 0.25) 40%, rgba(3, 7, 18, 0.7) 100%)'
      }} />
      
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </div>
  )
}
