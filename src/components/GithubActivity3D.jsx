import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Single 3D Bar representing a GitHub repository
function RepoBar({
  repo,
  index,
  total,
  isSelected,
  onSelect,
  reducedMotion,
}) {
  const meshRef = useRef(null)
  const [hovered, setHovered] = useState(false)

  // Calculate centered X position
  const spacing = total > 1 ? Math.min(1.8, 5.5 / (total - 1)) : 0
  const posX = (index - (total - 1) / 2) * spacing
  const initialY = -0.6

  // Height proportional to stars with visible baseline for 0-star repos
  const barHeight = Math.max(1.1, 1.1 + Math.min(repo.stars, 30) * 0.25)

  useFrame((state, delta) => {
    if (!meshRef.current || reducedMotion) return

    // Slow continuous rotation around Y axis
    meshRef.current.rotation.y += delta * (hovered ? 0.7 : 0.25)

    // Gentle bobbing with offset per bar
    const elapsed = state.clock.getElapsedTime()
    meshRef.current.position.y =
      initialY + Math.sin(elapsed * 1.3 + index * 0.9) * 0.1
  })

  // Update cursor on hover
  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = 'pointer'
    } else {
      document.body.style.cursor = 'auto'
    }
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [hovered])

  const active = hovered || isSelected

  return (
    <group
      ref={meshRef}
      position={[posX, initialY, 0]}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(repo)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Hexagonal prism bar (6 sides) — max 1 mesh per repo to respect guardrail */}
      <mesh position={[0, barHeight / 2, 0]}>
        <cylinderGeometry args={[0.36, 0.42, barHeight, 6]} />
        <meshStandardMaterial
          color={active ? '#6EE7C0' : '#141829'}
          roughness={0.25}
          metalness={0.35}
          emissive={active ? '#6EE7C0' : '#1B2036'}
          emissiveIntensity={active ? 0.45 : 0.15}
        />
      </mesh>
    </group>
  )
}

// Scene wrapper applying lerped pointer parallax
function ParallaxBars({ repos, selectedRepo, onSelect, reducedMotion }) {
  const groupRef = useRef(null)

  useFrame((state) => {
    if (!groupRef.current || reducedMotion) return

    const px = Math.max(-1, Math.min(1, state.pointer.x))
    const py = Math.max(-1, Math.min(1, state.pointer.y))

    // Subtle pointer parallax tilt
    const targetRotY = px * 0.22
    const targetRotX = -py * 0.15

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
  })

  return (
    <group ref={groupRef}>
      {repos.map((repo, i) => (
        <RepoBar
          key={repo.name}
          repo={repo}
          index={i}
          total={repos.length}
          isSelected={selectedRepo?.name === repo.name}
          onSelect={onSelect}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  )
}

export default function GithubActivity3D({
  repos = [],
  selectedRepo,
  onSelect,
  containerRef,
}) {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleMotionChange = (e) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleMotionChange)
    return () => mediaQuery.removeEventListener('change', handleMotionChange)
  }, [])

  return (
    <div className="w-full h-56 md:h-64 relative pointer-events-auto">
      <Canvas
        eventSource={containerRef}
        eventPrefix="client"
        camera={{ position: [0, 0.4, 4.6], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 6, 4]} intensity={1.3} />
        <pointLight position={[-4, -2, 3]} color="#6EE7C0" intensity={1.6} />
        <pointLight position={[4, 2, 2]} color="#F2B84B" intensity={1.1} />

        <ParallaxBars
          repos={repos}
          selectedRepo={selectedRepo}
          onSelect={onSelect}
          reducedMotion={reducedMotion}
        />
      </Canvas>
    </div>
  )
}
