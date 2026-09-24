import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Floating mesh component with gentle rotation and bobbing
function FloatingMesh({
  geometryType = 'icosahedron',
  color = '#6EE7C0',
  position = [0, 0, 0],
  scale = 1,
  rotationSpeed = [0.2, 0.3],
  bobSpeed = 1.2,
  bobAmplitude = 0.15,
  reducedMotion = false,
}) {
  const meshRef = useRef(null)
  const initialY = position[1]

  useFrame((state, delta) => {
    if (!meshRef.current || reducedMotion) return

    // Slow rotation
    meshRef.current.rotation.x += delta * rotationSpeed[0]
    meshRef.current.rotation.y += delta * rotationSpeed[1]

    // Gentle bobbing
    const elapsed = state.clock.getElapsedTime()
    meshRef.current.position.y = initialY + Math.sin(elapsed * bobSpeed) * bobAmplitude
  })

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      {geometryType === 'icosahedron' && <icosahedronGeometry args={[1, 0]} />}
      {geometryType === 'torus' && <torusGeometry args={[1, 0.35, 16, 32]} />}
      {geometryType === 'sphere' && <sphereGeometry args={[1, 24, 24]} />}
      {geometryType === 'octahedron' && <octahedronGeometry args={[1, 0]} />}

      <meshStandardMaterial
        color={color}
        roughness={0.25}
        metalness={0.2}
        wireframe={geometryType === 'octahedron'}
        wireframeLinewidth={1}
      />
    </mesh>
  )
}

// Scene wrapper applying lerped pointer parallax
function ParallaxScene({ reducedMotion }) {
  const groupRef = useRef(null)

  useFrame((state) => {
    if (!groupRef.current || reducedMotion) return

    // Clamp normalized pointer coordinates (-1 to 1)
    const px = Math.max(-1, Math.min(1, state.pointer.x))
    const py = Math.max(-1, Math.min(1, state.pointer.y))

    // Subtle pointer parallax tilt & translation:
    // Left (-px) -> tilt left (-rotY) & shift left (-posX)
    // Right (+px) -> tilt right (+rotY) & shift right (+posX)
    // Up (+py) -> tilt up (-rotX) & shift up (+posY)
    // Down (-py) -> tilt down (+rotX) & shift down (-posY)
    const targetRotY = px * 0.28
    const targetRotX = -py * 0.22
    const targetPosX = px * 0.3
    const targetPosY = py * 0.2

    // Smooth lerp (0.05 factor) — gentle delay, zero snapping
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotY,
      0.05
    )
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotX,
      0.05
    )
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      targetPosX,
      0.05
    )
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetPosY,
      0.05
    )
  })

  return (
    <group ref={groupRef}>
      {/* 4 floating low-poly meshes: space-accent (#6EE7C0) and space-warm (#F2B84B) */}
      {/* 1. Primary Icosahedron */}
      <FloatingMesh
        geometryType="icosahedron"
        color="#6EE7C0"
        position={[1.8, 0.4, 0]}
        scale={0.9}
        rotationSpeed={[0.3, 0.4]}
        bobSpeed={1.0}
        bobAmplitude={0.18}
        reducedMotion={reducedMotion}
      />

      {/* 2. Warm Torus */}
      <FloatingMesh
        geometryType="torus"
        color="#F2B84B"
        position={[-1.2, -0.8, -0.5]}
        scale={0.7}
        rotationSpeed={[-0.2, 0.35]}
        bobSpeed={1.3}
        bobAmplitude={0.14}
        reducedMotion={reducedMotion}
      />

      {/* 3. Mint Sphere */}
      <FloatingMesh
        geometryType="sphere"
        color="#6EE7C0"
        position={[0.2, 1.4, -1.2]}
        scale={0.65}
        rotationSpeed={[0.15, 0.2]}
        bobSpeed={0.9}
        bobAmplitude={0.12}
        reducedMotion={reducedMotion}
      />

      {/* 4. Wireframe Octahedron accent */}
      <FloatingMesh
        geometryType="octahedron"
        color="#6EE7C0"
        position={[-1.6, 1.1, -0.8]}
        scale={0.55}
        rotationSpeed={[0.25, -0.3]}
        bobSpeed={1.4}
        bobAmplitude={0.15}
        reducedMotion={reducedMotion}
      />
    </group>
  )
}

export default function Hero3D({ containerRef }) {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    function handleMotionChange(e) {
      setReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleMotionChange)
    return () => mediaQuery.removeEventListener('change', handleMotionChange)
  }, [])

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {/* Atmospheric ambient glow behind meshes */}
      <div
        aria-hidden="true"
        className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full opacity-35 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6EE7C0 0%, #141829 60%, transparent 75%)' }}
      />

      <Canvas
        eventSource={containerRef}
        eventPrefix="client"
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[6, 8, 5]} intensity={1.4} />
        <pointLight position={[-4, -3, 3]} color="#6EE7C0" intensity={1.8} />
        <pointLight position={[4, 3, 2]} color="#F2B84B" intensity={1.2} />

        <ParallaxScene reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  )
}
