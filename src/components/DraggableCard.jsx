import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'

export default function DraggableCard({ containerRef }) {
  const cardRef = useRef(null)
  const isDraggingRef = useRef(false)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const lastPosRef = useRef({ x: 0, y: 0 })
  const lastVelRef = useRef({ x: 0, y: 0 })
  const lastTimeRef = useRef(0)
  const engineRef = useRef(null)
  const bodyRef = useRef(null)
  const animFrameRef = useRef(null)
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  // Card dimensions (fixed baseline for Matter rigid body)
  const CARD_WIDTH = 280
  const CARD_HEIGHT = 150

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    function handleMotionChange(e) {
      setReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleMotionChange)
    return () => mediaQuery.removeEventListener('change', handleMotionChange)
  }, [])

  useEffect(() => {
    const container = containerRef?.current
    if (!container || !cardRef.current) return

    const { Engine, Bodies, Composite, Body } = Matter

    // Zero-gravity physics engine
    const engine = Engine.create({
      gravity: { x: 0, y: 0, scale: 0 },
    })
    engineRef.current = engine

    const bounds = container.getBoundingClientRect()
    const containerW = bounds.width || window.innerWidth
    const containerH = bounds.height || 600

    // Initial position: nicely placed in right half on desktop, centered on mobile
    const startX = containerW > 768
      ? Math.max(CARD_WIDTH / 2 + 20, containerW * 0.72)
      : Math.max(CARD_WIDTH / 2, containerW * 0.5)
    const startY = Math.max(CARD_HEIGHT / 2 + 20, containerH * 0.48)

    // Rigid body for the card
    const cardBody = Bodies.rectangle(startX, startY, CARD_WIDTH, CARD_HEIGHT, {
      restitution: 0.75, // bounciness off walls
      frictionAir: 0.025, // gentle zero-g deceleration
      friction: 0.05,
      density: 0.001,
    })
    bodyRef.current = cardBody
    Composite.add(engine.world, cardBody)

    // Boundary walls to bounce against
    const WALL_THICKNESS = 100
    let walls = []

    function updateWalls() {
      if (walls.length > 0) {
        Composite.remove(engine.world, walls)
      }

      const currentBounds = container.getBoundingClientRect()
      const w = currentBounds.width || window.innerWidth
      const h = currentBounds.height || 600

      walls = [
        // Top
        Bodies.rectangle(w / 2, -WALL_THICKNESS / 2, w * 2, WALL_THICKNESS, { isStatic: true }),
        // Bottom
        Bodies.rectangle(w / 2, h + WALL_THICKNESS / 2, w * 2, WALL_THICKNESS, { isStatic: true }),
        // Left
        Bodies.rectangle(-WALL_THICKNESS / 2, h / 2, WALL_THICKNESS, h * 2, { isStatic: true }),
        // Right
        Bodies.rectangle(w + WALL_THICKNESS / 2, h / 2, WALL_THICKNESS, h * 2, { isStatic: true }),
      ]
      Composite.add(engine.world, walls)
    }

    updateWalls()
    window.addEventListener('resize', updateWalls)

    // Initial render position
    if (cardRef.current) {
      cardRef.current.style.transform = `translate3d(${cardBody.position.x - CARD_WIDTH / 2}px, ${cardBody.position.y - CARD_HEIGHT / 2}px, 0px) rotate(${cardBody.angle}rad)`
    }

    // Animation & physics loop
    let lastTimestamp = performance.now()

    function step(timestamp) {
      const delta = Math.min(32, timestamp - lastTimestamp)
      lastTimestamp = timestamp

      if (!isDraggingRef.current && !reducedMotion) {
        Engine.update(engine, delta)

        // Dampen angular velocity so the card doesn't spin uncontrollably
        Body.setAngularVelocity(cardBody, cardBody.angularVelocity * 0.94)

        // Micro zero-g drift when nearly still
        const speed = Math.hypot(cardBody.velocity.x, cardBody.velocity.y)
        if (speed < 0.04) {
          const t = timestamp * 0.001
          Body.setVelocity(cardBody, {
            x: Math.sin(t * 0.8) * 0.15,
            y: Math.cos(t * 0.7) * 0.12,
          })
        }
      }

      // Sync Matter body position directly to CSS transform
      if (cardRef.current) {
        const x = cardBody.position.x - CARD_WIDTH / 2
        const y = cardBody.position.y - CARD_HEIGHT / 2
        const rot = reducedMotion ? 0 : cardBody.angle
        cardRef.current.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0px) rotate(${rot.toFixed(4)}rad)`
      }

      animFrameRef.current = requestAnimationFrame(step)
    }

    animFrameRef.current = requestAnimationFrame(step)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', updateWalls)
      Composite.clear(engine.world, false)
      Engine.clear(engine)
    }
  }, [containerRef, reducedMotion])

  // Pointer Event Drag Handlers (touch & mouse unified)
  function handlePointerDown(e) {
    if (!bodyRef.current || !containerRef.current) return
    const container = containerRef.current.getBoundingClientRect()
    const cardEl = cardRef.current

    try {
      cardEl?.setPointerCapture(e.pointerId)
    } catch {
      // Ignore if pointer capture fails
    }

    isDraggingRef.current = true
    const currentPointerX = e.clientX - container.left
    const currentPointerY = e.clientY - container.top

    dragOffsetRef.current = {
      x: currentPointerX - bodyRef.current.position.x,
      y: currentPointerY - bodyRef.current.position.y,
    }

    lastPosRef.current = { x: currentPointerX, y: currentPointerY }
    lastVelRef.current = { x: 0, y: 0 }
    lastTimeRef.current = performance.now()

    Matter.Body.setVelocity(bodyRef.current, { x: 0, y: 0 })
    Matter.Body.setAngularVelocity(bodyRef.current, 0)
  }

  function handlePointerMove(e) {
    if (!isDraggingRef.current || !bodyRef.current || !containerRef.current) return
    const container = containerRef.current.getBoundingClientRect()

    const now = performance.now()
    const dt = Math.max(1, now - lastTimeRef.current)
    lastTimeRef.current = now

    const currentPointerX = e.clientX - container.left
    const currentPointerY = e.clientY - container.top

    // Target center coordinates for the card
    const targetX = currentPointerX - dragOffsetRef.current.x
    const targetY = currentPointerY - dragOffsetRef.current.y

    // Keep card within container margins
    const clampedX = Math.max(CARD_WIDTH / 2, Math.min(container.width - CARD_WIDTH / 2, targetX))
    const clampedY = Math.max(CARD_HEIGHT / 2, Math.min(container.height - CARD_HEIGHT / 2, targetY))

    // Calculate instantaneous velocity for release throw
    const vx = ((clampedX - bodyRef.current.position.x) / dt) * 16
    const vy = ((clampedY - bodyRef.current.position.y) / dt) * 16
    lastVelRef.current = { x: vx, y: vy }

    Matter.Body.setPosition(bodyRef.current, { x: clampedX, y: clampedY })

    // Instant DOM update during drag for zero input lag
    if (cardRef.current) {
      const rot = reducedMotion ? 0 : bodyRef.current.angle
      cardRef.current.style.transform = `translate3d(${(clampedX - CARD_WIDTH / 2).toFixed(2)}px, ${(clampedY - CARD_HEIGHT / 2).toFixed(2)}px, 0px) rotate(${rot.toFixed(4)}rad)`
    }
  }

  function handlePointerUp(e) {
    if (!isDraggingRef.current || !bodyRef.current) return
    isDraggingRef.current = false

    try {
      cardRef.current?.releasePointerCapture(e.pointerId)
    } catch {
      // Ignore if not captured
    }

    if (reducedMotion) {
      Matter.Body.setVelocity(bodyRef.current, { x: 0, y: 0 })
      Matter.Body.setAngularVelocity(bodyRef.current, 0)
    } else {
      // Clamp throw momentum to natural zero-g drifting velocity
      const throwVx = Math.max(-12, Math.min(12, lastVelRef.current.x))
      const throwVy = Math.max(-12, Math.min(12, lastVelRef.current.y))

      Matter.Body.setVelocity(bodyRef.current, { x: throwVx, y: throwVy })
      Matter.Body.setAngularVelocity(bodyRef.current, (Math.random() - 0.5) * 0.04)
    }
  }

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      tabIndex={0}
      role="region"
      aria-label="Interactive draggable profile card"
      className="absolute top-0 left-0 z-20 w-[280px] select-none touch-none cursor-grab active:cursor-grabbing rounded-2xl bg-space-surface/90 border border-space-surface-2 p-5 backdrop-blur-md shadow-2xl transition-colors hover:border-space-accent/60 group focus:outline-none focus-visible:border-space-accent"
      style={{ willChange: 'transform' }}
    >
      <div className="flex items-center justify-between mb-3 text-[10px] font-mono text-space-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-space-accent animate-pulse" />
          zero-g // card
        </span>
        <span className="opacity-60 uppercase tracking-widest text-[9px]">drag me</span>
      </div>

      {/* 
        TODO FOR YASH:
        Placeholder content for the interactive draggable card.
        Edit name, tagline, and details below.
      */}
      <h3 className="font-display font-medium text-lg text-space-text mb-1 group-hover:text-space-accent transition-colors">
        Yash Chauhan
      </h3>
      <p className="font-body text-xs text-space-muted leading-relaxed mb-4">
        CSE student — turning curiosity into code, systems & experiments.
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-space-surface-2 text-[10px] font-mono text-space-muted">
        <span>GEC Patan / GTU</span>
        <span className="text-space-accent">zero-g physics</span>
      </div>
    </div>
  )
}
