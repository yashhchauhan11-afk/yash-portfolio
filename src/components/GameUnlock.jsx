import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'

const BASE_WIDTH = 480
const BASE_HEIGHT = 560
const TARGET_SCORE = 8
const MAX_STRIKES = 3

export default function GameUnlock({ resourceTitle, onWin, onClose }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [dimensions, setDimensions] = useState({
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    scale: 1,
  })

  const [gameState, setGameState] = useState('ready') // 'ready' | 'playing' | 'won' | 'lost'
  const [score, setScore] = useState(0)
  const [strikes, setStrikes] = useState(0)

  // Keep stable ref to onWin to prevent re-triggering animation loops
  const onWinRef = useRef(onWin)
  useEffect(() => {
    onWinRef.current = onWin
  }, [onWin])

  // Internal mutable game state ref for high-frequency rAF loop (no closure staleness)
  const stateRef = useRef({
    score: 0,
    strikes: 0,
    gameState: 'ready',
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    scale: 1,
    paddleX: BASE_WIDTH / 2,
    paddleWidth: 68,
    paddleHeight: 12,
    particles: [],
    effects: [],
    lastSpawnTime: 0,
    keys: { ArrowLeft: false, ArrowRight: false, a: false, d: false },
    prefersReducedMotion: false,
  })

  // Part C: Responsive canvas width measured from container clientWidth
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateDimensions = () => {
      if (!containerRef.current) return
      const w = Math.min(BASE_WIDTH, Math.max(280, containerRef.current.clientWidth))
      const h = Math.round(w * (BASE_HEIGHT / BASE_WIDTH))
      const scale = w / BASE_WIDTH

      const prevW = stateRef.current.width || w
      const prevH = stateRef.current.height || h

      // Update state ref physics dimensions immediately
      stateRef.current.width = w
      stateRef.current.height = h
      stateRef.current.scale = scale
      stateRef.current.paddleWidth = Math.round(68 * scale)
      stateRef.current.paddleHeight = Math.max(8, Math.round(12 * scale))

      // Rescale paddle position
      const halfPaddle = stateRef.current.paddleWidth / 2
      stateRef.current.paddleX = Math.max(
        halfPaddle,
        Math.min(w - halfPaddle, (stateRef.current.paddleX / prevW) * w)
      )

      // Rescale any existing active particles to new dimensions
      for (const p of stateRef.current.particles) {
        p.x = (p.x / prevW) * w
        p.y = (p.y / prevH) * h
        p.radius = (p.isGood ? 9 : 8.5) * scale
        p.speed = p.baseSpeed * scale
      }

      setDimensions({ width: w, height: h, scale })
    }

    updateDimensions()

    const observer = new ResizeObserver(() => {
      updateDimensions()
    })
    observer.observe(container)

    window.addEventListener('resize', updateDimensions)
    window.addEventListener('orientationchange', updateDimensions)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateDimensions)
      window.removeEventListener('orientationchange', updateDimensions)
    }
  }, [])

  // Start game from ready or lost state
  const startGame = useCallback(() => {
    const s = stateRef.current
    s.score = 0
    s.strikes = 0
    s.gameState = 'playing'
    s.paddleX = s.width / 2
    s.particles = []
    s.effects = []
    s.lastSpawnTime = performance.now()
    setScore(0)
    setStrikes(0)
    setGameState('playing')
  }, [])

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    stateRef.current.prefersReducedMotion = mediaQuery.matches
    const listener = (e) => {
      stateRef.current.prefersReducedMotion = e.matches
    }
    mediaQuery.addEventListener?.('change', listener)
    return () => mediaQuery.removeEventListener?.('change', listener)
  }, [])

  // Keyboard navigation listeners
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose?.()
        return
      }
      if (
        (stateRef.current.gameState === 'ready' || stateRef.current.gameState === 'lost') &&
        (e.key === 'Enter' || e.key === ' ')
      ) {
        e.preventDefault()
        startGame()
        return
      }
      if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) {
        const k = e.key.toLowerCase()
        if (k === 'arrowleft' || k === 'a') stateRef.current.keys.ArrowLeft = true
        if (k === 'arrowright' || k === 'd') stateRef.current.keys.ArrowRight = true
      }
    }

    function handleKeyUp(e) {
      const k = e.key.toLowerCase()
      if (k === 'arrowleft' || k === 'a') stateRef.current.keys.ArrowLeft = false
      if (k === 'arrowright' || k === 'd') stateRef.current.keys.ArrowRight = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [onClose, startGame])

  // Part C: Direct, immediate pointer/touch tracking with zero deadzone
  const updatePaddleFromPointer = useCallback((clientX) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const relativeX = clientX - rect.left
    const w = stateRef.current.width
    const halfWidth = stateRef.current.paddleWidth / 2
    stateRef.current.paddleX = Math.max(halfWidth, Math.min(w - halfWidth, relativeX))
  }, [])

  const handlePointerDown = (e) => {
    if (e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch (_) {}
    }
    if (stateRef.current.gameState === 'playing') {
      updatePaddleFromPointer(e.clientX)
    }
  }

  const handlePointerMove = (e) => {
    if (stateRef.current.gameState === 'playing') {
      if (e.pointerType === 'touch' || e.pointerType === 'pen' || e.buttons === 1) {
        updatePaddleFromPointer(e.clientX)
      }
    }
  }

  const handlePointerUp = (e) => {
    if (e.currentTarget.releasePointerCapture) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch (_) {}
    }
  }

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = null
    let lastFrameTime = performance.now()

    // Part B Spawn logic with proportional responsive scaling
    function spawnParticle(time, reduced) {
      const s = stateRef.current
      const scale = s.scale

      // 38% bad particle ratio (62% good packets)
      const isGood = Math.random() < 0.62
      const radius = (isGood ? 9 : 8.5) * scale
      const margin = 28 * scale
      const x = margin + Math.random() * (s.width - margin * 2)

      // Fall speed: base 4.2 -> 5.8 (ramping with score), scaled by screen width
      const unscaledBase = reduced ? 2.6 : 4.2 + (s.score / TARGET_SCORE) * 1.6
      const speedVariance = (Math.random() - 0.5) * 0.4
      const baseSpeed = Math.max(2.4, unscaledBase + speedVariance)
      const speed = baseSpeed * scale

      s.particles.push({
        id: Math.random(),
        x,
        y: -radius,
        radius,
        isGood,
        baseSpeed,
        speed,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.06,
      })
      s.lastSpawnTime = time
    }

    function createExplosion(x, y, color, count = 12) {
      const s = stateRef.current
      const scale = s.scale
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = (1.8 + Math.random() * 3.8) * scale
        s.effects.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          radius: (2 + Math.random() * 2.5) * scale,
          alpha: 1,
          decay: 0.035 + Math.random() * 0.02,
        })
      }
    }

    function loop(now) {
      const dt = Math.min(now - lastFrameTime, 32)
      lastFrameTime = now

      const s = stateRef.current
      const reduced = s.prefersReducedMotion
      const scale = s.scale
      const w = s.width
      const h = s.height

      // 1. Keyboard paddle movement (60fps scale)
      if (s.gameState === 'playing') {
        const paddleSpeed = (9.0 * scale) * (dt / 16.66)
        const halfPaddle = s.paddleWidth / 2
        if (s.keys.ArrowLeft) {
          s.paddleX = Math.max(halfPaddle, s.paddleX - paddleSpeed)
        }
        if (s.keys.ArrowRight) {
          s.paddleX = Math.min(w - halfPaddle, s.paddleX + paddleSpeed)
        }

        // 2. Spawn particles (interval: 550ms -> 800ms)
        const spawnInterval = reduced
          ? 1100
          : Math.max(550, 800 - (s.score / TARGET_SCORE) * 250)

        if (now - s.lastSpawnTime > spawnInterval) {
          spawnParticle(now, reduced)
        }
      }

      // 3. Clear canvas & draw background
      ctx.fillStyle = '#0B0E1A'
      ctx.fillRect(0, 0, w, h)

      // Subtle starfield grid lines
      ctx.strokeStyle = '#141829'
      ctx.lineWidth = 1
      const gridStep = Math.max(28, Math.round(40 * scale))
      for (let x = gridStep; x < w; x += gridStep) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let y = gridStep; y < h; y += gridStep) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      // 4. Update and draw particles
      const halfPaddle = s.paddleWidth / 2
      const paddleY = h - Math.round(38 * scale)
      const paddleLeft = s.paddleX - halfPaddle
      const paddleRight = s.paddleX + halfPaddle
      const paddleTop = paddleY - s.paddleHeight / 2
      const paddleBottom = paddleY + s.paddleHeight / 2

      if (s.gameState === 'playing') {
        const remainingParticles = []
        for (const p of s.particles) {
          p.y += p.speed * (dt / 16.66)
          p.rotation += p.rotationSpeed

          // Collision detection with paddle
          const hitsPaddle =
            p.y + p.radius >= paddleTop &&
            p.y - p.radius <= paddleBottom &&
            p.x + p.radius >= paddleLeft &&
            p.x - p.radius <= paddleRight

          if (hitsPaddle) {
            if (p.isGood) {
              s.score += 1
              setScore(s.score)
              createExplosion(p.x, paddleTop, '#6EE7C0', 14)

              if (s.score >= TARGET_SCORE) {
                s.gameState = 'won'
                setGameState('won')
                createExplosion(w / 2, h / 2, '#6EE7C0', 40)
                // Trigger win callback after brief celebration
                setTimeout(() => {
                  onWinRef.current?.()
                }, 900)
              }
            } else {
              s.strikes += 1
              setStrikes(s.strikes)
              createExplosion(p.x, paddleTop, '#F87171', 16)

              if (s.strikes >= MAX_STRIKES) {
                s.gameState = 'lost'
                setGameState('lost')
              }
            }
            continue // Particle caught, do not keep
          }

          // Off bottom of screen (dodged debris or missed good packet without penalty)
          if (p.y - p.radius > h) {
            continue
          }

          remainingParticles.push(p)

          // Render particle
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rotation)

          if (p.isGood) {
            // Mint packet glow
            ctx.shadowColor = '#6EE7C0'
            ctx.shadowBlur = Math.round(10 * scale)
            ctx.fillStyle = '#6EE7C0'
            ctx.beginPath()
            ctx.arc(0, 0, p.radius, 0, Math.PI * 2)
            ctx.fill()

            // Core center dot
            ctx.fillStyle = '#FFFFFF'
            ctx.beginPath()
            ctx.arc(0, 0, p.radius * 0.4, 0, Math.PI * 2)
            ctx.fill()
          } else {
            // Corrupted debris (amber-red diamond/spike)
            ctx.shadowColor = '#EF4444'
            ctx.shadowBlur = Math.round(8 * scale)
            ctx.fillStyle = '#EF4444'
            ctx.beginPath()
            ctx.moveTo(0, -p.radius * 1.2)
            ctx.lineTo(p.radius * 1.1, 0)
            ctx.lineTo(0, p.radius * 1.2)
            ctx.lineTo(-p.radius * 1.1, 0)
            ctx.closePath()
            ctx.fill()

            ctx.fillStyle = '#FBBF24'
            ctx.beginPath()
            ctx.arc(0, 0, p.radius * 0.35, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.restore()
        }
        s.particles = remainingParticles
      }

      // 5. Update and draw burst effects
      const remainingEffects = []
      for (const eff of s.effects) {
        eff.x += eff.vx
        eff.y += eff.vy
        eff.alpha -= eff.decay
        if (eff.alpha > 0) {
          remainingEffects.push(eff)
          ctx.save()
          ctx.globalAlpha = Math.max(0, eff.alpha)
          ctx.fillStyle = eff.color
          ctx.shadowColor = eff.color
          ctx.shadowBlur = Math.round(6 * scale)
          ctx.beginPath()
          ctx.arc(eff.x, eff.y, eff.radius, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      }
      s.effects = remainingEffects

      // 6. Draw Paddle
      ctx.save()
      ctx.shadowColor = '#6EE7C0'
      ctx.shadowBlur = Math.round(12 * scale)
      ctx.fillStyle = '#6EE7C0'

      // Rounded paddle shape
      const r = s.paddleHeight / 2
      ctx.beginPath()
      ctx.roundRect(paddleLeft, paddleTop, s.paddleWidth, s.paddleHeight, r)
      ctx.fill()

      // Inner accent highlight line
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.roundRect(
        paddleLeft + 5 * scale,
        paddleTop + 2 * scale,
        s.paddleWidth - 10 * scale,
        Math.max(2, s.paddleHeight - 4 * scale),
        Math.max(1, r - 1)
      )
      ctx.fill()
      ctx.restore()

      // 7. Request next frame
      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => {
      if (animId) cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Zero-Gravity Catch Unlock Challenge"
      onClick={onClose}
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 select-none overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[400px] sm:max-w-[460px] bg-space-surface border border-space-surface-2 rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center my-auto"
      >
        {/* Header Bar */}
        <div className="w-full px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-space-surface-2 bg-space-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-space-surface-2 text-space-warm border border-space-surface-2 uppercase tracking-wider font-medium">
              Security Protocol
            </span>
            <span className="font-display text-xs sm:text-sm font-medium text-space-text">
              Zero-Gravity Catch
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close game"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-space-muted hover:text-space-accent hover:bg-space-surface-2/60 transition-colors font-mono text-sm cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Live HUD Banner */}
        <div className="w-full px-3.5 sm:px-5 py-2 bg-space-bg/60 border-b border-space-surface-2/60 flex items-center justify-between font-mono text-xs shrink-0">
          {/* Good catches counter */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-space-muted">Packets:</span>
            <span className="text-space-accent font-medium font-mono">
              {score} / {TARGET_SCORE}
            </span>
            <div className="flex items-center gap-1 ml-0.5 sm:ml-1" aria-hidden="true">
              {Array.from({ length: TARGET_SCORE }).map((_, i) => (
                <span
                  key={i}
                  className={`inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                    i < score ? 'bg-space-accent' : 'bg-space-surface-2'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Strikes counter */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-space-muted">Strikes:</span>
            <span className="text-rose-400 font-medium font-mono">
              {strikes} / {MAX_STRIKES}
            </span>
            <div className="flex items-center gap-1" aria-hidden="true">
              {Array.from({ length: MAX_STRIKES }).map((_, i) => (
                <span
                  key={i}
                  className={`font-mono text-xs ${
                    i < strikes ? 'text-rose-400 font-bold' : 'text-space-surface-2'
                  }`}
                >
                  ✕
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Part C: Responsive Canvas Container */}
        <div
          ref={containerRef}
          className="relative w-full bg-space-bg overflow-hidden flex items-center justify-center shrink-0"
          style={{ height: `${dimensions.height}px` }}
        >
          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="block touch-none cursor-ew-resize select-none"
            style={{
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              touchAction: 'none',
            }}
          />

          {/* Mission Briefing / Ready Screen Overlay - fits comfortably within 360x800 */}
          {gameState === 'ready' && (
            <div className="absolute inset-0 bg-space-bg/95 backdrop-blur-xs flex flex-col items-center justify-center p-3.5 sm:p-5 text-center overflow-hidden">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-space-warm/15 border border-space-warm/40 flex items-center justify-center text-space-warm mb-2 sm:mb-2.5 shadow-inner shrink-0">
                {/* Controller Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6 sm:w-7 sm:h-7"
                >
                  <rect x="2" y="6" width="20" height="12" rx="4" />
                  <path d="M6 12h4m-2-2v4" />
                  <circle cx="15" cy="12" r="1" fill="currentColor" />
                  <circle cx="18" cy="10" r="1" fill="currentColor" />
                </svg>
              </div>

              <h4 className="font-display text-base sm:text-lg font-medium text-space-text mb-1 shrink-0">
                Download Locked
              </h4>
              <p className="font-body text-[11px] sm:text-xs text-space-muted max-w-xs mb-2.5 sm:mb-3 leading-relaxed shrink-0">
                Catch <span className="text-space-accent font-medium">8 mint packets</span> to decrypt and unlock &quot;{resourceTitle}&quot;. Avoid red debris!
              </p>

              {/* Instructions checklist */}
              <div className="w-full max-w-[280px] sm:max-w-xs bg-space-surface border border-space-surface-2 rounded-xl p-2.5 sm:p-3 mb-3 text-left font-mono text-[11px] space-y-1.5 text-space-muted shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-space-accent shrink-0" />
                  <span>Mint Packets: <strong className="text-space-accent">+1 Point</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rotate-45 bg-rose-500 shrink-0" />
                  <span>Red Debris: <strong className="text-rose-400">1 Strike</strong> (3 Max)</span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-space-surface-2 text-[10px]">
                  <span>Controls: Arrows / A-D / Drag</span>
                </div>
              </div>

              <button
                type="button"
                onClick={startGame}
                className="w-full max-w-[280px] sm:max-w-xs py-2.5 sm:py-3 rounded-xl bg-space-accent text-space-bg hover:bg-space-accent/90 transition-all font-mono text-xs font-semibold uppercase tracking-wider cursor-pointer shadow-lg active:scale-95 touch-manipulation shrink-0"
              >
                Launch Protocol (Space)
              </button>
            </div>
          )}

          {/* Win Overlay Card */}
          {gameState === 'won' && (
            <div className="absolute inset-0 bg-space-bg/95 backdrop-blur-xs flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fade-in">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-space-accent/20 border border-space-accent/50 flex items-center justify-center text-space-accent text-xl sm:text-2xl mb-2 sm:mb-3 shadow-inner">
                ✓
              </div>
              <h4 className="font-display text-lg sm:text-xl font-medium text-space-text mb-1">
                Access Granted!
              </h4>
              <p className="font-body text-xs text-space-muted max-w-xs mb-3 sm:mb-4">
                Decryption complete. Starting download for &quot;{resourceTitle}&quot;...
              </p>
              <div className="flex items-center gap-2 text-space-accent font-mono text-xs">
                <span className="w-3.5 h-3.5 border-2 border-space-accent border-t-transparent rounded-full animate-spin" />
                <span>Downloading document...</span>
              </div>
            </div>
          )}

          {/* Lose / Retry Overlay Card */}
          {gameState === 'lost' && (
            <div className="absolute inset-0 bg-space-bg/95 backdrop-blur-xs flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fade-in">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 text-xl sm:text-2xl font-mono mb-2 sm:mb-3">
                ✕
              </div>
              <h4 className="font-display text-lg sm:text-xl font-medium text-space-text mb-1">
                Transmission Disrupted
              </h4>
              <p className="font-body text-xs text-space-muted max-w-xs mb-4">
                3 corrupted debris particles intercepted. Reset integrity to try again.
              </p>
              <button
                type="button"
                onClick={startGame}
                className="px-5 sm:px-6 py-2.5 rounded-lg bg-space-surface-2 text-space-accent hover:bg-space-accent hover:text-space-bg border border-space-surface-2 hover:border-space-accent transition-all font-mono text-xs font-medium cursor-pointer shadow-md active:scale-95"
              >
                Try Again (Space / Enter)
              </button>
            </div>
          )}
        </div>

        {/* Footer controls tip */}
        <div className="w-full px-3.5 sm:px-5 py-2 bg-space-surface border-t border-space-surface-2 flex items-center justify-between text-[10px] sm:text-[11px] text-space-muted font-mono shrink-0">
          <span>Catch: 🟢 Mint (+1)</span>
          <span>Dodge: 🔴 Corrupted</span>
          <span className="hidden sm:inline">Arrows / Drag</span>
        </div>
      </div>
    </div>
  )
}
