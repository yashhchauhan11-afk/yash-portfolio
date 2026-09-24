import { lazy, Suspense, useRef } from 'react'

const Hero3D = lazy(() => import('./Hero3D'))
const DraggableCard = lazy(() => import('./DraggableCard'))

export default function Hero() {
  const heroRef = useRef(null)

  return (
    <section
      ref={heroRef}
      className="min-h-[90vh] flex items-center px-6 md:px-16 relative overflow-hidden"
    >
      {/* 3D Zero-gravity scene lazy-loaded with current gradient blob as Suspense fallback */}
      <Suspense
        fallback={
          <div
            aria-hidden="true"
            className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #6EE7C0 0%, transparent 70%)' }}
          />
        }
      >
        <Hero3D containerRef={heroRef} />
      </Suspense>

      {/* 2D Draggable Profile Card with Matter.js physics lazy-loaded with null fallback */}
      <Suspense fallback={null}>
        <DraggableCard containerRef={heroRef} />
      </Suspense>

      <div className="max-w-2xl relative z-10 pointer-events-auto">
        <p className="font-body text-space-muted text-sm mb-4 tracking-wide">
          CSE / IoT Engineer — GTU, Gujarat
        </p>
        <h1 className="font-display text-5xl md:text-7xl font-medium leading-[1.05] mb-6">
          Yash Chauhan builds things that shouldn't exist yet.
        </h1>
        <p className="font-body text-space-muted text-lg max-w-lg mb-10 leading-relaxed">
          Automation, embedded systems, and AI-driven products — from a
          missed-call recovery workflow to an order-flow forecasting engine.
          This is where the working ones live.
        </p>
        <div className="flex gap-4">
          <a
            href="#projects"
            className="px-6 py-3 rounded-full bg-space-accent text-space-bg font-body font-medium hover:opacity-90 transition-opacity"
          >
            See the work
          </a>
          <a
            href="#say-hello"
            className="px-6 py-3 rounded-full border border-space-muted/40 text-space-text font-body font-medium hover:border-space-accent transition-colors"
          >
            Say hello
          </a>
        </div>
      </div>
    </section>
  )
}
