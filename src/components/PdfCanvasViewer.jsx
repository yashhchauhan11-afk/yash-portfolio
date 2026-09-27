import { useState, useEffect, useRef } from 'react'
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

function PdfPage({ pdfDoc, pageNumber, containerWidth }) {
  const canvasRef = useRef(null)
  const [renderStatus, setRenderStatus] = useState('rendering')

  useEffect(() => {
    let isCancelled = false
    let renderTask = null

    async function render() {
      try {
        const page = await pdfDoc.getPage(pageNumber)
        if (isCancelled || !canvasRef.current) return

        const unscaledViewport = page.getViewport({ scale: 1.0 })
        const availableWidth = Math.max(260, Math.min(containerWidth - 48, 840))
        const scale = availableWidth / unscaledViewport.width
        const viewport = page.getViewport({ scale })

        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d', { alpha: false })

        canvas.width = Math.floor(viewport.width * dpr)
        canvas.height = Math.floor(viewport.height * dpr)
        canvas.style.width = `${Math.floor(viewport.width)}px`
        canvas.style.height = `${Math.floor(viewport.height)}px`

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
    }
  }, [pdfDoc, pageNumber, containerWidth])

  return (
    <div className="flex flex-col items-center max-w-full">
      <div className="relative shadow-2xl rounded-sm overflow-hidden bg-white border border-space-surface-2 max-w-full">
        {renderStatus === 'rendering' && (
          <div className="absolute inset-0 flex items-center justify-center bg-space-surface/30 backdrop-blur-xs">
            <div className="w-5 h-5 border-2 border-space-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {/* Real DOM canvas: onContextMenu prevents native browser save/download menu */}
        <canvas
          ref={canvasRef}
          onContextMenu={(e) => e.preventDefault()}
          className="block max-w-full h-auto select-none"
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        />
      </div>
      <span className="font-mono text-[11px] text-space-muted mt-2">
        Page {pageNumber} of {pdfDoc.numPages}
      </span>
    </div>
  )
}

export default function PdfCanvasViewer({ file }) {
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(800)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pdfDoc, setPdfDoc] = useState(null)

  useEffect(() => {
    if (!containerRef.current) return
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth || 800)
      }
    }
    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let isCancelled = false
    let loadingTask = null

    async function loadPdf() {
      setLoading(true)
      setError(null)
      setPdfDoc(null)
      try {
        loadingTask = pdfjsLib.getDocument({ url: file })
        const doc = await loadingTask.promise
        if (!isCancelled) {
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


  if (loading) {
    return (
      <div
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-space-muted font-mono text-sm gap-3"
      >
        <div className="w-6 h-6 border-2 border-space-accent border-t-transparent rounded-full animate-spin" />
        <span>Loading document...</span>
      </div>
    )
  }

  const pageNumbers = Array.from({ length: pdfDoc?.numPages || 0 }, (_, i) => i + 1)

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className="w-full h-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 flex flex-col items-center gap-6 select-none"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {pageNumbers.map((pageNumber) => (
        <PdfPage
          key={pageNumber}
          pdfDoc={pdfDoc}
          pageNumber={pageNumber}
          containerWidth={containerWidth}
        />
      ))}
    </div>
  )
}
