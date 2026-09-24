import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Category Node on the radial perimeter
function CategoryStar({
  category,
  position,
  isActive,
  onSelect,
  reducedMotion,
}) {
  const meshRef = useRef(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state, delta) => {
    if (!meshRef.current || reducedMotion) return
    meshRef.current.rotation.x += delta * 0.4
    meshRef.current.rotation.y += delta * (hovered ? 0.9 : 0.3)
  })

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

  const active = isActive || hovered
  const color = active ? '#6EE7C0' : '#141829'
  const emissive = active ? '#6EE7C0' : '#1B2036'

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={active ? 1.25 : 1.0}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(category)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      <icosahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial
        color={color}
        roughness={0.25}
        metalness={0.4}
        emissive={emissive}
        emissiveIntensity={active ? 0.6 : 0.15}
      />
    </mesh>
  )
}

// Satellite Skill Node orbiting the active category
function SkillSatellite({
  skill,
  position,
  isSelected,
  onSelect,
  reducedMotion,
}) {
  const meshRef = useRef(null)
  const [hovered, setHovered] = useState(false)
  const initialY = position[1]

  useFrame((state, delta) => {
    if (!meshRef.current || reducedMotion) return
    meshRef.current.rotation.y += delta * 0.6
    const elapsed = state.clock.getElapsedTime()
    meshRef.current.position.y = initialY + Math.sin(elapsed * 2.0) * 0.08
  })

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

  const active = isSelected || hovered
  const color = active ? '#F2B84B' : '#6EE7C0'

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={active ? 1.3 : 1.0}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(skill)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial
        color={color}
        roughness={0.2}
        metalness={0.3}
        emissive={color}
        emissiveIntensity={active ? 0.7 : 0.3}
      />
    </mesh>
  )
}

// Faint geometric constellation lines connecting categories
function ConstellationLines({ positions }) {
  const lineGeometry = useMemo(() => {
    const points = []
    const count = positions.length
    for (let i = 0; i < count; i++) {
      const p1 = positions[i]
      const p2 = positions[(i + 1) % count]
      points.push(new THREE.Vector3(...p1))
      points.push(new THREE.Vector3(...p2))
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [positions])

  return (
    <lineSegments geometry={lineGeometry}>
      <lineBasicMaterial color="#1B2036" transparent opacity={0.8} />
    </lineSegments>
  )
}

// 3D Scene Group with lerped parallax
function ConstellationScene({
  skillsData,
  activeCategory,
  onSelectCategory,
  activeSkill,
  onSelectSkill,
  reducedMotion,
}) {
  const groupRef = useRef(null)

  // 5 Category positions arranged radially (radius 2.3)
  const categoryPositions = useMemo(() => {
    const radius = 2.3
    const total = skillsData.length
    return skillsData.map((_, i) => {
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2
      return [
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0,
      ]
    })
  }, [skillsData])

  // Active category index and position
  const activeIndex = useMemo(
    () => skillsData.findIndex((c) => c.category === activeCategory),
    [skillsData, activeCategory]
  )
  const activePos = categoryPositions[activeIndex]

  // Active category's skills (max 2 satellite nodes)
  const activeSkills = skillsData[activeIndex]?.items || []
  const satellitePositions = useMemo(() => {
    if (!activePos) return [[0, 0, 0], [0, 0, 0]]
    return [
      [activePos[0] * 0.65 + 0.45, activePos[1] * 0.65 + 0.35, 0.4],
      [activePos[0] * 0.65 - 0.45, activePos[1] * 0.65 - 0.35, 0.4],
    ]
  }, [activePos])

  useFrame((state) => {
    if (!groupRef.current || reducedMotion) return

    const px = Math.max(-1, Math.min(1, state.pointer.x))
    const py = Math.max(-1, Math.min(1, state.pointer.y))

    const targetRotY = px * 0.25
    const targetRotX = -py * 0.2

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
      {/* 5 Constellation Lines connecting category stars */}
      <ConstellationLines positions={categoryPositions} />

      {/* 5 Category stars (Meshes 1-5) */}
      {skillsData.map((group, i) => (
        <CategoryStar
          key={group.category}
          category={group.category}
          position={categoryPositions[i]}
          isActive={group.category === activeCategory}
          onSelect={(cat) => {
            onSelectCategory(cat)
            const firstSkill = skillsData.find((g) => g.category === cat)?.items[0]
            if (firstSkill) onSelectSkill(firstSkill)
          }}
          reducedMotion={reducedMotion}
        />
      ))}

      {/* Max 2 Satellite Skill stars for active category (Meshes 6-7, keeping total <= 7) */}
      {activeSkills.slice(0, 2).map((skill, i) => (
        <SkillSatellite
          key={skill}
          skill={skill}
          position={satellitePositions[i] || [0, 0, 0]}
          isSelected={skill === activeSkill}
          onSelect={onSelectSkill}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  )
}

export default function SkillsConstellation({
  skillsData = [],
  skillDescriptions = {},
  containerRef,
}) {
  const [activeCategory, setActiveCategory] = useState(
    () => skillsData[0]?.category || 'Languages'
  )
  const [activeSkill, setActiveSkill] = useState(
    () => skillsData[0]?.items[0] || 'Python'
  )

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

  const currentGroup = skillsData.find((g) => g.category === activeCategory)
  const currentSkillDesc =
    skillDescriptions[activeSkill] ||
    'Architectural stack component deployed in high-performance production flows.'

  return (
    <div className="mt-14 bg-space-surface border border-space-surface-2 rounded-2xl p-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-space-accent">
            // Interactive 3D Orbit
          </span>
          <h3 className="font-display text-2xl font-medium text-space-text mt-1">
            Skills Constellation
          </h3>
          <p className="font-body text-space-muted text-sm mt-0.5">
            Radial node topology. Click category nodes or orbiting satellites to inspect components.
          </p>
        </div>

        {/* Category navigation pills */}
        <div className="flex flex-wrap gap-2">
          {skillsData.map((group) => {
            const isActive = group.category === activeCategory
            return (
              <button
                key={group.category}
                type="button"
                onClick={() => {
                  setActiveCategory(group.category)
                  if (group.items[0]) setActiveSkill(group.items[0])
                }}
                className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-space-accent text-space-bg border-space-accent font-medium'
                    : 'bg-space-surface-2/60 text-space-muted border-space-surface-2 hover:text-space-text'
                }`}
              >
                {group.category}
              </button>
            )
          })}
        </div>
      </div>

      {/* 3D Radial Canvas */}
      <div className="w-full h-64 md:h-80 relative pointer-events-auto">
        <Canvas
          eventSource={containerRef}
          eventPrefix="client"
          camera={{ position: [0, 0, 6.2], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
          className="w-full h-full"
        >
          <ambientLight intensity={0.9} />
          <directionalLight position={[4, 5, 4]} intensity={1.3} />
          <pointLight position={[-4, -3, 3]} color="#6EE7C0" intensity={1.6} />
          <pointLight position={[3, 3, 2]} color="#F2B84B" intensity={1.1} />

          <ConstellationScene
            skillsData={skillsData}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            activeSkill={activeSkill}
            onSelectSkill={setActiveSkill}
            reducedMotion={reducedMotion}
          />
        </Canvas>
      </div>

      {/* Expanded Skill Detail Card */}
      <div className="mt-4 pt-4 border-t border-space-surface-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-space-surface-2 text-space-accent border border-space-surface-2">
              // {activeCategory}
            </span>
            <span className="font-display text-lg font-medium text-space-text">
              {activeSkill}
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-space-warm/15 text-space-warm border border-space-warm/30">
              Active Node
            </span>
          </div>
          <p className="font-body text-sm text-space-muted max-w-2xl leading-relaxed">
            {currentSkillDesc}
          </p>
        </div>

        {/* Skill selector within active category */}
        <div className="flex items-center gap-2 shrink-0">
          {currentGroup?.items.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => setActiveSkill(skill)}
              className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-all ${
                skill === activeSkill
                  ? 'bg-space-surface-2 text-space-warm border-space-warm/40 font-medium'
                  : 'bg-space-surface-2/40 text-space-muted border-space-surface-2 hover:text-space-text'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
