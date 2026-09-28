import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// Polyfill Promise.withResolvers for broader browser compatibility
if (typeof Promise.withResolvers === 'undefined') {
  Promise.withResolvers = function () {
    let resolve, reject
    const promise = new Promise((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }
}

// Configure PDF.js worker via Vite static asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

const ZOOM_LEVELS = [1.0, 1.5, 2.0, 3.0]

function PdfPage({
  pdfDoc,
  pageNumber,
  unscaledViewport,
  containerWidth,
  zoomFactor,
  containerRef,
}) {
  const wrapperRef = useRef(null)
  const canvasRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [renderStatus, setRenderStatus] = useState('idle')

  // Part A: fitScale = containerWidth / unscaledViewport.width — NO lower clamp
  const fitScale = containerWidth / unscaledViewport.width
  const effectiveScale = fitScale * zoomFactor

  // At 100% zoom, cssWidth === containerWidth exactly (immune to FP rounding quirks)
  const cssWidth =
    zoomFactor === 1.0
      ? containerWidth
      : Math.round(unscaledViewport.width * effectiveScale)
  const cssHeight = Math.round(unscaledViewport.height * effectiveScale)

  // Part B: Lazy render visibility check (renders within ~1 viewport of visible area)
  useEffect(() => {
    const target = wrapperRef.current
    const root = containerRef?.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setIsVisible(entry.isIntersecting)
        }
      },
      {
        root: root || null,
        rootMargin: '100% 0px 100% 0px', // ~1 viewport above and below
        threshold: 0,
      }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [containerRef])

  // Canvas rendering effect: active only when isVisible is true
  useEffect(() => {
    if (!isVisible || !pdfDoc) {
      return
    }

    let isCancelled = false
    let renderTask = null
    const canvasEl = canvasRef.current

    async function render() {
      try {
        setRenderStatus('rendering')
        const page = await pdfDoc.getPage(pageNumber)
        if (isCancelled || !canvasRef.current) return

        const viewport = page.getViewport({ scale: effectiveScale })

        // Part B: Cap backing-store pixels per canvas (max 8 million) by lowering DPR at high zoom
        let dpr = Math.min(window.devicePixelRatio || 1, 2)
        const unscaledPixelCount = viewport.width * viewport.height
        const MAX_BACKING_PIXELS = 8_000_000

        if (unscaledPixelCount * dpr * dpr > MAX_BACKING_PIXELS) {
          dpr = Math.max(0.5, Math.sqrt(MAX_BACKING_PIXELS / unscaledPixelCount))
        }

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d', { alpha: false })

        // Backing store gets the DPR multiplier
        canvas.width = Math.floor(viewport.width * dpr)
        canvas.height = Math.floor(viewport.height * dpr)

        // CSS size is strictly the un-multiplied viewport coordinates
        canvas.style.width = `${cssWidth}px`
        canvas.style.height = `${cssHeight}px`

        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const renderContext = {
          canvasContext: ctx,
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
        }

        renderTask = page.render(renderContext)
        await renderTask.promise
        if (!isCancelled) {
          setRenderStatus('done')
        }
      } catch (err) {
        if (!isCancelled && err?.name !== 'RenderingCancelledException') {
          console.error(`Page ${pageNumber} render error:`, err)
          setRenderStatus('error')
        }
      }
    }

    render()

    return () => {
      isCancelled = true
      if (renderTask) {
        try {
          renderTask.cancel()
        } catch {
          // ignore cancellation
        }
      }
      // Release canvas backing store GPU memory when scrolled away
      if (canvasEl) {
        canvasEl.width = 1
        canvasEl.height = 1
      }
    }
  }, [isVisible, pdfDoc, pageNumber, effectiveScale, cssWidth, cssHeight])

  return (
    <div
      ref={wrapperRef}
      data-page-number={pageNumber}
      className="mx-auto mb-2 md:mb-6 block"
      style={{
        width: `${cssWidth}px`,
        minHeight: `${cssHeight}px`,
      }}
    >
      <div
        className="relative shadow-md md:rounded-sm overflow-hidden bg-white border-y md:border border-space-surface-2/60"
        style={{
          width: `${cssWidth}px`,
          height: `${cssHeight}px`,
        }}
      >
        {isVisible ? (
          <>
            {renderStatus === 'rendering' && (
              <div className="absolute inset-0 flex items-center justify-center bg-space-surface/20 backdrop-blur-xs">
                <div className="w-5 h-5 border-2 border-space-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {/* Real DOM canvas: onContextMenu prevents native browser save/download menu */}
            <canvas
              ref={canvasRef}
              onContextMenu={(e) => e.preventDefault()}
              className="block select-none"
              style={{
                width: `${cssWidth}px`,
                height: `${cssHeight}px`,
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
            />
          </>
        ) : (
          /* Memory-safe placeholder maintaining exact aspect-ratio dimensions */
          <div className="w-full h-full flex items-center justify-center bg-space-surface/10 text-space-muted font-mono text-xs select-none">
            Page {pageNumber}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PdfCanvasViewer({ file }) {
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [pageViewports, setPageViewports] = useState([])
  const [zoomIndex, setZoomIndex] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  // Part A: Measure container in useLayoutEffect and wait for non-zero width; re-render on ResizeObserver
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateWidth = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth
        if (w > 0) {
          setContainerWidth(w)
        }
      }
    }

    updateWidth()

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width || containerRef.current?.clientWidth || 0
        if (w > 0) {
          setContainerWidth(Math.floor(w))
        }
      }
    })
    observer.observe(container)

    window.addEventListener('resize', updateWidth)
    window.addEventListener('orientationchange', updateWidth)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateWidth)
      window.removeEventListener('orientationchange', updateWidth)
    }
  }, [])

  // Load PDF document and initial page viewports
  useEffect(() => {
    let isCancelled = false
    let loadingTask = null

    async function loadPdf() {
      setLoading(true)
      setError(null)
      setPdfDoc(null)
      setPageViewports([])
      setZoomIndex(0)
      setCurrentPage(1)
      try {
        loadingTask = pdfjsLib.getDocument({ url: file })
        const doc = await loadingTask.promise
        if (isCancelled) return

        const viewports = []
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i)
          viewports.push(page.getViewport({ scale: 1.0 }))
        }

        if (!isCancelled) {
          setPageViewports(viewports)
          setPdfDoc(doc)
          setLoading(false)
        }
      } catch (err) {
        if (!isCancelled) {
          console.error(err)
          setError("Couldn't load this document")
          setLoading(false)
        }
      }
    }

    loadPdf()

    return () => {
      isCancelled = true
      if (loadingTask) {
        try {
          loadingTask.destroy()
        } catch {
          // ignore
        }
      }
    }
  }, [file])

  // Track current page via IntersectionObserver
  useEffect(() => {
    const container = containerRef.current
    if (!container || !pdfDoc || containerWidth === 0 || pageViewports.length === 0) return

    const visiblePages = new Map()

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNum = Number(entry.target.getAttribute('data-page-number'))
          if (!pageNum) return
          if (entry.isIntersecting) {
            visiblePages.set(pageNum, entry.intersectionRatio)
          } else {
            visiblePages.delete(pageNum)
          }
        })

        if (visiblePages.size > 0) {
          let bestPage = 1
          let maxRatio = -1
          for (const [pageNum, ratio] of visiblePages.entries()) {
            if (ratio > maxRatio) {
              maxRatio = ratio
              bestPage = pageNum
            }
          }
          setCurrentPage(bestPage)
        }
      },
      {
        root: container,
        threshold: [0.1, 0.3, 0.5, 0.7, 0.9],
      }
    )

    const pageEls = container.querySelectorAll('[data-page-number]')
    pageEls.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [pdfDoc, zoomIndex, containerWidth, pageViewports])

  const handleZoomOut = useCallback(() => {
    setZoomIndex((prev) => Math.max(0, prev - 1))
  }, [])

  const handleZoomIn = useCallback(() => {
    setZoomIndex((prev) => Math.min(ZOOM_LEVELS.length - 1, prev + 1))
  }, [])

  if (error) {
    return (
      <div
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
      >
        <div className="w-10 h-10 rounded-full bg-space-surface-2 flex items-center justify-center text-space-warm mb-3 text-lg font-mono">
          !
        </div>
        <p className="font-display text-lg text-space-text mb-1">
          Couldn't load this document
        </p>
        <p className="font-body text-xs text-space-muted max-w-sm">
          The file may be inaccessible or in an unsupported format.
        </p>
      </div>
    )
  }

  const pageNumbers = Array.from({ length: pdfDoc?.numPages || 0 }, (_, i) => i + 1)
  const currentZoomFactor = ZOOM_LEVELS[zoomIndex]
  const isReady = !loading && pdfDoc && containerWidth > 0 && pageViewports.length > 0

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full h-full overflow-hidden flex flex-col bg-space-bg select-none"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Scrollable Document Area: Normal block scroll container (overflow: auto, touch-action: pan-x pan-y) */}
      <div
        ref={containerRef}
        className="w-full flex-1 overflow-auto touch-pan-x touch-pan-y"
        style={{ touchAction: 'pan-x pan-y' }}
      >
        {!isReady ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-space-muted font-mono text-sm gap-3">
            <div className="w-6 h-6 border-2 border-space-accent border-t-transparent rounded-full animate-spin" />
            <span>Loading document...</span>
          </div>
        ) : (
          <div className="py-2 md:py-6 pb-28 min-w-full w-max">
            {pageNumbers.map((pageNumber) => (
              <PdfPage
                key={pageNumber}
                pdfDoc={pdfDoc}
                pageNumber={pageNumber}
                unscaledViewport={pageViewports[pageNumber - 1]}
                containerWidth={containerWidth}
                zoomFactor={currentZoomFactor}
                containerRef={containerRef}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Toolbar: Zoom Controls & Page Indicator */}
      {isReady && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-full bg-space-surface/90 backdrop-blur-md border border-space-surface-2 shadow-2xl text-space-text pointer-events-auto"
          style={{
            bottom: 'max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))',
          }}
        >
          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomIndex === 0}
            aria-label="Zoom out"
            className="w-11 h-11 rounded-full flex items-center justify-center font-mono text-base text-space-muted hover:text-space-accent hover:bg-space-surface-2/60 disabled:opacity-25 disabled:hover:text-space-muted disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed touch-manipulation"
          >
            −
          </button>

          {/* Zoom Level Label */}
          <span className="font-mono text-xs text-space-muted min-w-[38px] text-center select-none font-medium">
            {Math.round(currentZoomFactor * 100)}%
          </span>

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
            aria-label="Zoom in"
            className="w-11 h-11 rounded-full flex items-center justify-center font-mono text-base text-space-muted hover:text-space-accent hover:bg-space-surface-2/60 disabled:opacity-25 disabled:hover:text-space-muted disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed touch-manipulation"
          >
            +
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-space-surface-2 mx-1" />

          {/* Page Indicator */}
          <div className="px-2 py-1 font-mono text-xs select-none">
            <span className="text-space-accent font-medium">{currentPage}</span>
            <span className="text-space-muted"> / {pdfDoc.numPages}</span>
          </div>
        </div>
      )}
    </div>
  )
}


