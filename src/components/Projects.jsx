import { useEffect, useRef, useState } from 'react'

export const PROJECTS = [
  {
    id: 1,
    era: 'current',
    year: 2026,
    title: 'Missed-Call Lead-Recovery Workflow',
    category: 'AI + Automation + Business Systems',
    description:
      "A working AI-powered customer recovery workflow designed to prevent missed calls from becoming lost leads. It reconnects with customers through WhatsApp, understands their requirements, provides business-specific support, and escalates to a human when the AI can't resolve the request.",
    tags: [
      'n8n',
      'Twilio',
      'WhatsApp API',
      'AI',
      'Automation',
      'Webhooks',
      'Google Workspace',
    ],
  },
  {
    id: 2,
    era: 'current',
    year: 2026,
    title: 'Quantitative R&D',
    category: 'Quantitative Research',
    description:
      'A foundational quantitative research track exploring market microstructure through Order Flow Imbalance analysis and Hawkes self-exciting point processes. Rather than jumping straight into complex trading systems, this project builds the conceptual and engineering fundamentals — limit order book dynamics, statistical validation, and event-driven forecasting — needed to approach advanced quantitative research with confidence.',
    tags: [
      'Python',
      'Market Microstructure',
      'Order Flow Imbalance',
      'Hawkes Processes',
      'Statistics',
    ],
  },
  {
    id: 3,
    era: 'older',
    year: 2024,
    title: 'Spotify Clone',
    category: 'Web Development / Frontend',
    description:
      'An early frontend project reproducing a real-world music-streaming interface — built to strengthen frontend fundamentals and UI implementation skills.',
    tags: [],
  },
  {
    id: 4,
    era: 'older',
    year: 2024,
    title: 'Airbnb Clone',
    category: 'Full-Stack / Web Development',
    description:
      'An early full-stack project experimenting with building a larger, real-world-style web application end to end.',
    tags: [],
  },
]

export const PROJECTS_OUTPUT = [
  '[1] spotify clone — web development / frontend',
  '[2] airbnb clone — full-stack / web development',
  '[3] missed-call lead-recovery workflow — ai + automation + business systems',
  '[4] quantitative r&d — quantitative research',
]

export default function Projects() {
  const defaultIndex = PROJECTS.findIndex((p) => p.era === 'current')
  const [focusedIndex, setFocusedIndex] = useState(() => (defaultIndex !== -1 ? defaultIndex : 0))
  const [dragDeltaX, setDragDeltaX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [spacing, setSpacing] = useState(340)
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  const dragStartXRef = useRef(0)
  const dragDeltaXRef = useRef(0)
  const isDraggingRef = useRef(false)
  const hasMovedRef = useRef(false)

  // Listen to prefers-reduced-motion changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleMotionChange = (e) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleMotionChange)
    return () => mediaQuery.removeEventListener('change', handleMotionChange)
  }, [])

  // Responsive spacing: 340px desktop, 300px tablet, 260px mobile
  useEffect(() => {
    function updateSpacing() {
      if (typeof window === 'undefined') return
      const w = window.innerWidth
      if (w < 480) {
        setSpacing(260)
      } else if (w < 768) {
        setSpacing(300)
      } else {
        setSpacing(340)
      }
    }
    updateSpacing()
    window.addEventListener('resize', updateSpacing)
    return () => window.removeEventListener('resize', updateSpacing)
  }, [])

  // Pointer event drag navigation (unified touch & mouse)
  function handlePointerDown(e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    dragStartXRef.current = e.clientX
    dragDeltaXRef.current = 0
    isDraggingRef.current = true
    hasMovedRef.current = false
    setIsDragging(true)
    setDragDeltaX(0)
  }

  function handlePointerMove(e) {
    if (!isDraggingRef.current) return
    const deltaX = e.clientX - dragStartXRef.current
    if (Math.abs(deltaX) > 6) {
      hasMovedRef.current = true
    }
    dragDeltaXRef.current = deltaX
    setDragDeltaX(deltaX)
  }

  function handlePointerUp(e) {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDragging(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}

    const deltaX = dragDeltaXRef.current !== 0 ? dragDeltaXRef.current : (e.clientX - dragStartXRef.current)
    const SWIPE_THRESHOLD = 40

    if (deltaX < -SWIPE_THRESHOLD) {
      setFocusedIndex((prev) => Math.min(PROJECTS.length - 1, prev + 1))
    } else if (deltaX > SWIPE_THRESHOLD) {
      setFocusedIndex((prev) => Math.max(0, prev - 1))
    }
    dragDeltaXRef.current = 0
    setDragDeltaX(0)
  }

  // Keyboard navigation when carousel container has focus
  function handleKeyDown(e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setFocusedIndex((prev) => Math.max(0, prev - 1))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setFocusedIndex((prev) => Math.min(PROJECTS.length - 1, prev + 1))
    }
  }

  // Clicking an unfocused card focuses it (unless user was dragging)
  function handleCardClick(index) {
    if (hasMovedRef.current) return
    if (index !== focusedIndex) {
      setFocusedIndex(index)
    }
  }

  // Calculate per-card 3D perspective transform
  function getCardStyle(index) {
    const isFocused = index === focusedIndex

    if (reducedMotion) {
      return {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: isFocused ? 1 : 0,
        pointerEvents: isFocused ? 'auto' : 'none',
        zIndex: isFocused ? 20 : 1,
        filter: 'none',
        transition: 'opacity 0.15s ease',
      }
    }

    // Live drag tracking with boundary resistance
    let effectiveDeltaX = dragDeltaX
    if (
      (focusedIndex === 0 && dragDeltaX > 0) ||
      (focusedIndex === PROJECTS.length - 1 && dragDeltaX < 0)
    ) {
      effectiveDeltaX = dragDeltaX * 0.3
    }

    const dragOffset = effectiveDeltaX / spacing
    const rawDistance = (index - focusedIndex) + dragOffset
    const clampedDist = Math.max(-2, Math.min(2, rawDistance))
    const absClampedDist = Math.abs(clampedDist)
    const norm = absClampedDist / 2 // 0 at center, 1 at |dist| >= 2

    const tx = clampedDist * spacing
    const tz = -absClampedDist * 150
    const scale = 1 - norm * 0.25 // 1 at dist 0, down to 0.75 at |dist| >= 2
    const opacity = 1 - norm * 0.65 // 1 at dist 0, down to 0.35 at |dist| >= 2
    const blur = norm * 8 // 0px at dist 0, up to 8px at |dist| >= 2
    const rotateY = clampedDist * 8 // -16deg to +16deg
    const zIndex = Math.round(30 - absClampedDist * 10)

    return {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: `translate(-50%, -50%) translateX(${tx.toFixed(1)}px) translateZ(${tz.toFixed(1)}px) rotateY(${rotateY.toFixed(1)}deg) scale(${scale.toFixed(3)})`,
      opacity: Number(opacity.toFixed(3)),
      filter: blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : 'none',
      zIndex,
      transition: isDragging
        ? 'none'
        : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease, filter 0.45s ease',
      pointerEvents: isFocused ? 'auto' : Math.abs(rawDistance) < 2.2 ? 'auto' : 'none',
      willChange: 'transform, opacity, filter',
    }
  }

  const currentProject = PROJECTS[focusedIndex]

  return (
    <section id="projects" className="px-6 md:px-16 py-24 border-t border-space-surface-2 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-space-accent mb-2">
              Featured Work
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-medium mb-3">
              Things I've shipped.
            </h2>
            <p className="font-body text-space-muted text-base md:text-lg max-w-xl leading-relaxed">
              Production systems, workflows, and quantitative research built with intent.
            </p>
          </div>

          {/* Project counter & active status */}
          <div className="flex items-center gap-3 font-mono text-xs text-space-muted shrink-0">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-surface border border-space-surface-2">
              <span className="w-2 h-2 rounded-full bg-space-accent animate-pulse" />
              <span>0{focusedIndex + 1}</span>
              <span className="opacity-40">/</span>
              <span>0{PROJECTS.length}</span>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-space-surface border border-space-surface-2 uppercase tracking-wider text-[11px] text-space-accent">
              {currentProject?.era === 'current' ? '● Current' : '○ Archive'}
            </span>
          </div>
        </div>

        {/* 3D Perspective Carousel Stage */}
        <div
          tabIndex={0}
          role="region"
          aria-label="Projects 3D carousel"
          aria-roledescription="carousel"
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-full h-[520px] sm:h-[480px] md:h-[450px] my-4 select-none touch-pan-y focus:outline-none focus-visible:ring-1 focus-visible:ring-space-accent/50 cursor-grab active:cursor-grabbing overflow-hidden rounded-2xl"
          style={{ perspective: '1000px' }}
        >
          {PROJECTS.map((project, index) => {
            const isFocused = index === focusedIndex
            const cardStyle = getCardStyle(index)

            return (
              <div
                key={project.id}
                onClick={() => handleCardClick(index)}
                className={`w-[88vw] sm:w-[400px] md:w-[440px] max-h-[480px] sm:max-h-[440px] md:max-h-[420px] rounded-2xl p-5 sm:p-6 md:p-8 flex flex-col justify-between transition-colors overflow-y-auto overscroll-contain touch-pan-y ${
                  isFocused
                    ? 'bg-space-surface/95 border-2 border-space-accent/80 shadow-[0_0_35px_rgba(110,231,192,0.18)] cursor-default'
                    : 'bg-space-surface/85 border border-space-surface-2 hover:border-space-surface-2/80 cursor-pointer'
                }`}
                style={cardStyle}
              >
                <div>
                  {/* Card metadata row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-space-accent font-semibold">0{project.id}</span>
                      <span className="text-space-muted opacity-40">/</span>
                      <span
                        className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${
                          project.era === 'current'
                            ? 'bg-space-accent/10 text-space-accent border-space-accent/30'
                            : 'bg-space-surface-2 text-space-muted border-space-surface-2'
                        }`}
                      >
                        {project.year} // {project.era}
                      </span>
                    </div>

                    <span className="font-mono text-[10px] sm:text-[11px] text-space-muted/80 uppercase tracking-wide truncate max-w-[110px] sm:max-w-[170px]">
                      {project.category}
                    </span>
                  </div>

                  {/* Card Title */}
                  <h3
                    className={`font-display text-xl md:text-2xl font-medium mb-3 transition-colors ${
                      isFocused ? 'text-space-text' : 'text-space-muted'
                    }`}
                  >
                    {project.title}
                  </h3>

                  {/* Card Description: full when focused, clamped when receding */}
                  <p
                    className={`font-body text-xs sm:text-sm leading-relaxed ${
                      isFocused
                        ? 'text-space-muted'
                        : 'text-space-muted/70 line-clamp-3'
                    }`}
                  >
                    {project.description}
                  </p>
                </div>

                {/* Tags row: only shown on focused card if tags exist */}
                {isFocused && project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-4 border-t border-space-surface-2/60 mt-4">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-xs px-2.5 py-1 rounded-full bg-space-surface-2 text-space-muted border border-space-surface-2"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between mt-6 max-w-md mx-auto px-4">
          <button
            type="button"
            onClick={() => setFocusedIndex((prev) => Math.max(0, prev - 1))}
            disabled={focusedIndex === 0}
            aria-label="Previous project"
            className={`w-11 h-11 rounded-full border font-mono text-base flex items-center justify-center transition-all ${
              focusedIndex === 0
                ? 'opacity-30 border-space-surface-2 text-space-muted cursor-not-allowed'
                : 'border-space-surface-2 bg-space-surface text-space-accent hover:border-space-accent hover:bg-space-surface-2'
            }`}
          >
            ←
          </button>

          {/* Indicator dots */}
          <div className="flex items-center gap-2">
            {PROJECTS.map((proj, idx) => (
              <button
                key={proj.id}
                type="button"
                onClick={() => setFocusedIndex(idx)}
                aria-label={`Jump to project ${idx + 1}: ${proj.title}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === focusedIndex
                    ? 'w-7 bg-space-accent'
                    : 'w-2 bg-space-surface-2 hover:bg-space-muted/50'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setFocusedIndex((prev) => Math.min(PROJECTS.length - 1, prev + 1))}
            disabled={focusedIndex === PROJECTS.length - 1}
            aria-label="Next project"
            className={`w-11 h-11 rounded-full border font-mono text-base flex items-center justify-center transition-all ${
              focusedIndex === PROJECTS.length - 1
                ? 'opacity-30 border-space-surface-2 text-space-muted cursor-not-allowed'
                : 'border-space-surface-2 bg-space-surface text-space-accent hover:border-space-accent hover:bg-space-surface-2'
            }`}
          >
            →
          </button>
        </div>

        <p className="text-center font-mono text-[11px] text-space-muted/50 mt-3">
          swipe, drag, or use ← → arrow keys
        </p>
      </div>
    </section>
  )
}
