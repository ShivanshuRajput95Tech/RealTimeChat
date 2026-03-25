import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, MeshTransmissionMaterial, Environment } from '@react-three/drei'
import * as THREE from 'three'

function Particles({ count = 200 }) {
  const mesh = useRef()
  
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const palette = [
      new THREE.Color('#6366f1'),
      new THREE.Color('#8b5cf6'),
      new THREE.Color('#06b6d4'),
      new THREE.Color('#ec4899'),
      new THREE.Color('#22d3ee'),
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
      mesh.current.rotation.x = state.clock.getElapsedTime() * 0.015
      mesh.current.rotation.y = state.clock.getElapsedTime() * 0.02
    }
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.05} 
        vertexColors 
        transparent 
        opacity={0.8} 
        sizeAttenuation 
        blending={THREE.AdditiveBlending} 
      />
    </points>
  )
}

function GlassOrb({ position, color, scale = 1, speed = 1 }) {
  const meshRef = useRef()
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime() * speed
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(time * 0.6) * 0.5
      meshRef.current.position.x = position[0] + Math.cos(time * 0.4) * 0.3
      meshRef.current.rotation.x = time * 0.2
      meshRef.current.rotation.z = time * 0.15
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.4}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 2]} />
        <MeshTransmissionMaterial
          color={color}
          backside
          samples={4}
          resolution={256}
          transmission={0.95}
          roughness={0.05}
          thickness={0.5}
          ior={1.5}
          chromaticAberration={0.06}
          anisotropy={0.1}
          distortion={0.1}
          distortionScale={0.3}
          temporalDistortion={0.2}
          clearcoat={1}
          attenuationDistance={0.5}
          attenuationColor={color}
          envMapIntensity={1}
        />
      </mesh>
    </Float>
  )
}

function GlowingRings() {
  const ring1 = useRef()
  const ring2 = useRef()
  const ring3 = useRef()
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (ring1.current) {
      ring1.current.rotation.x = time * 0.1
      ring1.current.rotation.y = time * 0.15
    }
    if (ring2.current) {
      ring2.current.rotation.x = -time * 0.08
      ring2.current.rotation.z = time * 0.12
    }
    if (ring3.current) {
      ring3.current.rotation.y = time * 0.06
      ring3.current.rotation.x = time * 0.1
    }
  })

  return (
    <>
      <mesh ref={ring1} position={[0, 0, -8]} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[6, 0.03, 16, 100]} />
        <meshStandardMaterial 
          color="#6366f1" 
          emissive="#6366f1" 
          emissiveIntensity={1.5} 
          transparent 
          opacity={0.4} 
        />
      </mesh>
      <mesh ref={ring2} position={[0, 0, -10]} rotation={[Math.PI / 5, Math.PI / 4, 0]}>
        <torusGeometry args={[8, 0.02, 16, 100]} />
        <meshStandardMaterial 
          color="#8b5cf6" 
          emissive="#8b5cf6" 
          emissiveIntensity={1.2} 
          transparent 
          opacity={0.3} 
        />
      </mesh>
      <mesh ref={ring3} position={[0, 0, -12]} rotation={[Math.PI / 4, Math.PI / 3, 0]}>
        <torusGeometry args={[10, 0.015, 16, 100]} />
        <meshStandardMaterial 
          color="#06b6d4" 
          emissive="#06b6d4" 
          emissiveIntensity={1} 
          transparent 
          opacity={0.2} 
        />
      </mesh>
    </>
  )
}

function Scene({ mouse }) {
  const { camera } = useThree()
  
  useFrame(() => {
    camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.02
    camera.position.y += (mouse.y * 0.3 - camera.position.y) * 0.02
    camera.lookAt(0, 0, 0)
  })

  return (
    <>
      <color attach="background" args={['#030712']} />
      <fog attach="fog" args={['#030712', 10, 40]} />
      
      <ambientLight intensity={0.3} />
      <pointLight position={[15, 15, 15]} intensity={0.8} color="#6366f1" />
      <pointLight position={[-15, -15, -15]} intensity={0.5} color="#8b5cf6" />
      <pointLight position={[0, 20, 5]} intensity={0.6} color="#06b6d4" />
      
      <Environment preset="night" />
      <Particles count={150} />
      <GlowingRings />
      
      <GlassOrb position={[-5, 2, -4]} color="#6366f1" scale={0.8} speed={0.8} />
      <GlassOrb position={[5, -1, -5]} color="#8b5cf6" scale={0.6} speed={1} />
      <GlassOrb position={[3, 3, -3]} color="#06b6d4" scale={0.5} speed={1.2} />
      <GlassOrb position={[-3, -2, -6]} color="#ec4899" scale={0.4} speed={0.9} />
      <GlassOrb position={[0, 4, -7]} color="#22d3ee" scale={0.35} speed={1.1} />
    </>
  )
}

function CameraController() {
  return null
}

export default function LiquidGlass3DBackground({ children, className = '', intensity = 'medium' }) {
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

  const dpr = intensity === 'high' ? [1, 2] : intensity === 'low' ? [1, 1] : [1, 1.5]

  return (
    <div className={`relative ${className}`} style={{ background: '#030712' }}>
      <Canvas
        camera={{ position: [0, 0, 12], fov: 50 }}
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
        <Scene mouse={mouse} />
      </Canvas>
      
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(3, 7, 18, 0.2) 40%, rgba(3, 7, 18, 0.7) 100%)'
      }} />
      
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </div>
  )
}
