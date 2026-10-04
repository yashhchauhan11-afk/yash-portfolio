import { useEffect, useState, useCallback, lazy, Suspense } from 'react'
import { getAllPosts } from '../content/blogLoader'
import { supabase } from '../lib/supabaseClient'

import GameUnlock from './GameUnlock'

const PdfCanvasViewer = lazy(() => import('./PdfCanvasViewer'))

function isImageFile(filePath) {
  if (!filePath) return false
  const clean = filePath.split('?')[0].split('#')[0].toLowerCase()
  return (
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.png') ||
    clean.endsWith('.webp') ||
    clean.endsWith('.gif') ||
    clean.endsWith('.svg')
  )
}

export default function BlogList({ navigate }) {
  const writingEntries = getAllPosts()
  const [collections, setCollections] = useState([])
  const [loadingCollections, setLoadingCollections] = useState(true)
  const [collectionsError, setCollectionsError] = useState(null)

  const [activeTab, setActiveTab] = useState('writing')
  const [expandedCollection, setExpandedCollection] = useState(null)
  const [selectedResource, setSelectedResource] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [isGameOpen, setIsGameOpen] = useState(false)

  useEffect(() => {
    let isCancelled = false

    async function loadCollections() {
      try {
        setLoadingCollections(true)
        setCollectionsError(null)

        const { data, error } = await supabase
          .from('collections')
          .select(`
            id,
            slug,
            title,
            excerpt,
            created_at,
            resources (
              id,
              title,
              description,
              file_path,
              sort_order,
              downloadable,
              game_gated
            )
          `)
          .order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        if (!isCancelled) {
          const formatted = (data || []).map((col) => ({
            ...col,
            resources: (col.resources || []).sort(
              (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
            ),
          }))
          setCollections(formatted)
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to load collections from Supabase:', err)
          setCollectionsError('Unable to load resources right now.')
        }
      } finally {
        if (!isCancelled) {
          setLoadingCollections(false)
        }
      }
    }

    loadCollections()

    return () => {
      isCancelled = true
    }
  }, [])


  // Close modal on Escape key (handles game overlay first)
  useEffect(() => {
    if (!selectedResource) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (isGameOpen) {
          setIsGameOpen(false)
        } else {
          setSelectedResource(null)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedResource, isGameOpen])

  // Lock background page scroll while modal is open, restore on close
  useEffect(() => {
    if (!selectedResource) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [selectedResource])

  // Download handler: fetches blob and initiates programmatic download
  async function handleDownload(resource) {
    if (!resource?.file || downloading) return

    try {
      setDownloading(true)
      const res = await fetch(resource.file)
      if (!res.ok) {
        throw new Error(`Failed to fetch file (HTTP ${res.status})`)
      }
      const blob = await res.blob()

      const cleanPath = resource.file.split('?')[0].split('#')[0]
      const ext = cleanPath.split('.').pop()?.toLowerCase() || 'pdf'
      const safeTitle = (resource.title || 'document')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'document'
      const filename = `${safeTitle}.${ext}`

      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Download failed:', err)
      alert('Failed to download the document. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  // Stable handlers for GameUnlock overlay
  const handleGameClose = useCallback(() => {
    setIsGameOpen(false)
  }, [])

  const handleGameWin = useCallback(() => {
    setIsGameOpen(false)
    if (selectedResource) {
      handleDownload(selectedResource)
      if (selectedResource.id) {
        fetch('/api/notify-game-win', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resourceId: selectedResource.id }),
        }).catch((err) => {
          console.error('Failed to notify game win:', err)
        })
      }
    }
  }, [selectedResource])

  return (
    <div className="min-h-screen px-6 md:px-16 py-16 md:py-24 max-w-6xl mx-auto">
      {navigate && (
        <button
          type="button"
          onClick={() => navigate('/')}
          className="font-mono text-xs text-space-muted hover:text-space-accent mb-10 inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          ← Back to portfolio
        </button>
      )}

      <div className="max-w-2xl mb-8">
        <p className="font-mono text-xs uppercase tracking-wider text-space-accent mb-2">
          Writing & Resources
        </p>
        <h1 className="font-display text-4xl md:text-6xl font-medium mb-4 text-space-text">
          Articles & Knowledge.
        </h1>
        <p className="font-body text-space-muted text-lg leading-relaxed">
          Deep dives into systems automation, quantitative experiments, engineering notes, and curated academic resources.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-3 mb-10">
        <button
          type="button"
          onClick={() => setActiveTab('writing')}
          className={`font-mono text-xs px-4 py-1.5 rounded-full border transition-all cursor-pointer ${
            activeTab === 'writing'
              ? 'bg-space-accent text-space-bg border-space-accent font-medium shadow-[0_0_12px_rgba(110,231,192,0.25)]'
              : 'bg-space-surface text-space-muted border-space-surface-2 hover:border-space-accent/40 hover:text-space-text'
          }`}
        >
          Writing
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('resources')}
          className={`font-mono text-xs px-4 py-1.5 rounded-full border transition-all cursor-pointer ${
            activeTab === 'resources'
              ? 'bg-space-accent text-space-bg border-space-accent font-medium shadow-[0_0_12px_rgba(110,231,192,0.25)]'
              : 'bg-space-surface text-space-muted border-space-surface-2 hover:border-space-accent/40 hover:text-space-text'
          }`}
        >
          Resources
        </button>
      </div>

      {/* Tab Content: Writing */}
      {activeTab === 'writing' && (
        <>
          {writingEntries.length === 0 ? (
            <div className="bg-space-surface border border-space-surface-2 rounded-2xl p-8 max-w-xl">
              <p className="font-mono text-xs text-space-accent mb-2">status: draft queue empty</p>
              <p className="font-body text-space-muted text-sm">
                Posts are being drafted. Add markdown files to{' '}
                <code className="font-mono text-space-accent">src/content/blog/*.md</code> to publish.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {writingEntries.map((post, idx) => (
                <div
                  key={post.slug}
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  className="bg-space-surface border border-space-surface-2 rounded-2xl p-6 md:p-8 flex flex-col justify-between hover:border-space-accent/50 transition-colors group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-xs text-space-accent">
                        {post.date || `0${idx + 1}`}
                      </span>
                      <span className="font-mono text-xs text-space-muted/80 uppercase tracking-wide">
                        Article
                      </span>
                    </div>
                    <h2 className="font-display text-xl md:text-2xl font-medium mb-3 text-space-text group-hover:text-space-accent transition-colors">
                      {post.title}
                    </h2>
                    <p className="font-body text-space-muted text-sm leading-relaxed mb-6">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-space-surface-2/60">
                    <span className="font-mono text-xs text-space-accent group-hover:underline">
                      Read article →
                    </span>
                    <span className="font-mono text-xs text-space-muted">
                      markdown
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab Content: Resources / Collections */}
      {activeTab === 'resources' && (
        <>
          {loadingCollections ? (
            <div className="bg-space-surface border border-space-surface-2 rounded-2xl p-8 max-w-xl flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-space-accent border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-xs text-space-muted">Loading collections...</span>
            </div>
          ) : collectionsError ? (
            <div className="bg-space-surface border border-space-surface-2 rounded-2xl p-8 max-w-xl">
              <p className="font-mono text-xs text-rose-400 mb-2">status: unable to load</p>
              <p className="font-body text-space-muted text-sm">{collectionsError}</p>
            </div>
          ) : collections.length === 0 ? (
            <div className="bg-space-surface border border-space-surface-2 rounded-2xl p-8 max-w-xl">
              <p className="font-mono text-xs text-space-accent mb-2">status: no collections yet</p>
              <p className="font-body text-space-muted text-sm">
                Subject libraries and study collections will appear here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {collections.map((collection) => {
                const isExpanded = expandedCollection === collection.slug
                const resourceList = collection.resources || []

                return (
                  <div
                    key={collection.id || collection.slug || collection.title}
                    className={`bg-space-surface border rounded-2xl transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? 'border-space-accent/50 shadow-[0_0_25px_rgba(110,231,192,0.06)]'
                        : 'border-space-surface-2 hover:border-space-accent/30'
                    }`}
                  >
                    {/* Header: Clickable to expand/collapse accordion */}
                    <div
                      onClick={() =>
                        setExpandedCollection((prev) =>
                          prev === collection.slug ? null : collection.slug
                        )
                      }
                      className="p-6 md:p-8 cursor-pointer flex flex-col justify-between select-none group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs text-space-accent font-medium">
                          {resourceList.length}{' '}
                          {resourceList.length === 1 ? 'Resource' : 'Resources'}
                        </span>
                        <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-space-surface-2 text-space-muted border border-space-surface-2 uppercase tracking-wide">
                          Collection
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="font-display text-2xl md:text-3xl font-medium text-space-text mb-2 group-hover:text-space-accent transition-colors">
                            {collection.title}
                          </h2>
                          {collection.excerpt && (
                            <p className="font-body text-space-muted text-sm md:text-base leading-relaxed max-w-3xl">
                              {collection.excerpt}
                            </p>
                          )}
                        </div>

                        {/* Chevron / Toggle Button */}
                        <div className="shrink-0 pt-1">
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedCollection((prev) =>
                                prev === collection.slug ? null : collection.slug
                              )
                            }}
                            className="font-mono text-xs px-3.5 py-1.5 rounded-lg bg-space-surface-2 text-space-muted group-hover:text-space-accent group-hover:bg-space-surface-2/80 border border-space-surface-2 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                            <span
                              className={`transition-transform duration-200 inline-block text-[10px] ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            >
                              ▼
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Accordion Content: Revealed when expanded */}
                    {isExpanded && (
                      <div className="border-t border-space-surface-2 bg-space-bg/50 p-4 sm:p-6 md:p-8 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-space-surface-2/60">
                          <span className="font-mono text-xs uppercase tracking-wider text-space-muted">
                            Available Documents
                          </span>
                          <span className="font-mono text-xs text-space-muted">
                            interactive viewer
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {resourceList.map((item, idx) => (
                            <div
                              key={item.id || item.title || idx}
                              className="p-4 sm:p-5 md:p-6 rounded-xl bg-space-surface border border-space-surface-2 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-5 hover:border-space-accent/40 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 mb-2">
                                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-space-surface-2 text-space-accent border border-space-surface-2 uppercase tracking-wide shrink-0">
                                    {isImageFile(item.file_path) ? 'Image' : 'PDF Document'}
                                  </span>
                                  <h3 className="font-display text-base sm:text-lg font-medium text-space-text break-words">
                                    {item.title}
                                  </h3>
                                </div>
                                {item.description && (
                                  <p className="font-body text-space-muted text-xs sm:text-sm leading-relaxed break-words">
                                    {item.description}
                                  </p>
                                )}
                              </div>

                              <div className="w-full md:w-auto shrink-0 flex items-center pt-2 md:pt-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedResource({
                                      id: item.id,
                                      title: item.title,
                                      file: item.file_path,
                                      downloadable: !!item.downloadable,
                                      game_gated: !!item.game_gated,
                                    })
                                  }}
                                  className="w-full md:w-auto min-h-[44px] px-5 py-2.5 rounded-lg bg-space-surface-2 text-space-accent hover:bg-space-accent hover:text-space-bg border border-space-surface-2 hover:border-space-accent transition-all inline-flex items-center justify-center gap-2 font-mono text-xs font-medium cursor-pointer shadow-xs touch-manipulation"
                                >
                                  <span>Open</span>
                                  <span aria-hidden="true">↗</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Full-screen Resource Viewer Modal */}
      {selectedResource && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedResource.title}
          onClick={() => setSelectedResource(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-6 lg:p-8"
        >
          {/* Modal Container:
              Below md: true full-screen (fixed inset-0, height 100dvh, no rounded corners, no outer padding, no max-width)
              md and above: centered dialog (relative, max-w-5xl, h-[88vh], rounded-2xl, border) */}
          <div
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
            className="fixed inset-0 md:relative w-full h-[100dvh] md:h-[88vh] md:max-w-5xl bg-space-surface border-0 md:border md:border-space-surface-2 rounded-none md:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Modal Header:
                Below md: compact single row (~52px content + safe-area-inset-top), title truncated with ellipsis, 44x44px close button.
                md and above: spacious desktop header */}
            <div
              className="px-3 sm:px-4 md:px-5 py-2 md:py-3.5 min-h-[52px] border-b border-space-surface-2 bg-space-surface/95 flex items-center justify-between gap-3 shrink-0"
              style={{
                paddingTop: 'max(0.5rem, calc(env(safe-area-inset-top, 0px) + 0.35rem))',
              }}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="hidden sm:inline-block font-mono text-[10px] px-2 py-0.5 rounded bg-space-surface-2 text-space-accent border border-space-surface-2 uppercase tracking-wide shrink-0">
                  {isImageFile(selectedResource.file) ? 'Image' : 'PDF Document'}
                </span>
                <h3 className="font-display text-sm md:text-base font-medium text-space-text truncate flex-1 min-w-0">
                  {selectedResource.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selectedResource.downloadable && (
                  selectedResource.game_gated ? (
                    <button
                      type="button"
                      onClick={() => setIsGameOpen(true)}
                      aria-label="Play a short game to unlock the download"
                      title="Play a short game to unlock the download"
                      className="min-h-10 md:min-h-9 px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 bg-space-warm/15 hover:bg-space-warm text-space-warm hover:text-space-bg border border-space-warm/40 hover:border-space-warm transition-all font-mono text-xs font-medium cursor-pointer shrink-0 touch-manipulation shadow-xs active:scale-95"
                    >
                      {/* Crisp Game Controller SVG - constrained to exactly 20x20px */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-5 h-5 shrink-0 block"
                        aria-hidden="true"
                      >
                        <rect x="2" y="6" width="20" height="12" rx="4" />
                        <path d="M6 12h4m-2-2v4" />
                        <circle cx="15" cy="12" r="1" fill="currentColor" />
                        <circle cx="18" cy="10" r="1" fill="currentColor" />
                      </svg>
                      <span className="hidden sm:inline">Unlock</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDownload(selectedResource)}
                      disabled={downloading}
                      aria-label={downloading ? 'Downloading document...' : 'Download document'}
                      title={downloading ? 'Downloading...' : 'Download document'}
                      className="min-h-10 md:min-h-9 px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 bg-space-surface-2 text-space-text hover:bg-space-accent hover:text-space-bg border border-space-surface-2 hover:border-space-accent transition-all font-mono text-xs font-medium cursor-pointer shrink-0 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed shadow-xs active:scale-95"
                    >
                      {downloading ? (
                        <span className="w-5 h-5 border-2 border-space-accent border-t-transparent rounded-full animate-spin shrink-0 block" />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          width="20"
                          height="20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-5 h-5 shrink-0 block"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 14v2a2 2 0 002 2h10a2 2 0 002-2v-2M10 3v10m0 0l-3.5-3.5M10 13l3.5-3.5"
                          />
                        </svg>
                      )}
                      <span className="hidden sm:inline">{downloading ? 'Downloading...' : 'Download'}</span>
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedResource(null)
                    setIsGameOpen(false)
                  }}
                  aria-label="Close document viewer"
                  className="w-10 h-10 md:w-9 md:h-9 rounded-lg flex items-center justify-center text-space-muted hover:text-space-accent hover:bg-space-surface-2/60 transition-colors text-base md:text-sm font-mono cursor-pointer shrink-0 touch-manipulation"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 w-full h-full min-h-0 relative overflow-hidden flex items-center justify-center bg-space-bg/80">
              {isImageFile(selectedResource.file) ? (
                <div className="w-full h-full flex items-center justify-center p-2 md:p-4 overflow-auto">
                  <img
                    src={selectedResource.file}
                    alt={selectedResource.title}
                    onContextMenu={(e) => e.preventDefault()}
                    className="max-w-full max-h-full object-contain rounded-lg select-none"
                  />
                </div>
              ) : (
                <Suspense
                  fallback={
                    <div className="flex flex-col items-center justify-center p-8 text-center text-space-muted font-mono text-sm gap-3">
                      <div className="w-6 h-6 border-2 border-space-accent border-t-transparent rounded-full animate-spin" />
                      <span>Loading document...</span>
                    </div>
                  }
                >
                  <PdfCanvasViewer file={selectedResource.file} title={selectedResource.title} />
                </Suspense>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Zero-Gravity Catch Game Unlock Overlay */}
      {isGameOpen && selectedResource && (
        <GameUnlock
          resourceTitle={selectedResource.title}
          onClose={handleGameClose}
          onWin={handleGameWin}
        />
      )}
    </div>
  )
}

