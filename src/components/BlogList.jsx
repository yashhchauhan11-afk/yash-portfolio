import { useEffect, useState, lazy, Suspense } from 'react'
import { getAllPosts } from '../content/blogLoader'

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
  const allEntries = getAllPosts()
  const writingEntries = allEntries.filter((entry) => entry.type === 'post')
  const collectionEntries = allEntries.filter(
    (entry) => entry.type === 'collection' || entry.type === 'resource'
  )

  const [activeTab, setActiveTab] = useState(() => {
    if (writingEntries.length > 0) return 'writing'
    if (collectionEntries.length > 0) return 'resources'
    return 'writing'
  })

  const [expandedCollection, setExpandedCollection] = useState(null)
  const [selectedResource, setSelectedResource] = useState(null)


  // Close modal on Escape key
  useEffect(() => {
    if (!selectedResource) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setSelectedResource(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
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
          {collectionEntries.length === 0 ? (
            <div className="bg-space-surface border border-space-surface-2 rounded-2xl p-8 max-w-xl">
              <p className="font-mono text-xs text-space-accent mb-2">status: no collections yet</p>
              <p className="font-body text-space-muted text-sm">
                Subject libraries and study collections will appear here. Add a markdown file with{' '}
                <code className="font-mono text-space-accent">type: collection</code> to add entries.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {collectionEntries.map((collection) => {
                const isExpanded = expandedCollection === collection.slug
                const resourceList =
                  collection.resources && collection.resources.length > 0
                    ? collection.resources
                    : collection.file
                      ? [{ title: collection.title, description: collection.excerpt, file: collection.file }]
                      : []

                return (
                  <div
                    key={collection.slug || collection.title}
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
                      <div className="border-t border-space-surface-2 bg-space-bg/50 p-6 md:p-8 space-y-4">
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
                              key={item.title || idx}
                              className="p-5 md:p-6 rounded-xl bg-space-surface border border-space-surface-2 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-space-accent/40 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-space-surface-2 text-space-accent border border-space-surface-2 uppercase tracking-wide shrink-0">
                                    {isImageFile(item.file) ? 'Image' : 'PDF Document'}
                                  </span>
                                  <h3 className="font-display text-lg font-medium text-space-text">
                                    {item.title}
                                  </h3>
                                </div>
                                {item.description && (
                                  <p className="font-body text-space-muted text-sm leading-relaxed">
                                    {item.description}
                                  </p>
                                )}
                              </div>

                              <div className="shrink-0 flex items-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedResource({
                                      title: item.title,
                                      file: item.file,
                                    })
                                  }}
                                  className="font-mono text-xs px-4 py-2 rounded-lg bg-space-surface-2 text-space-accent hover:bg-space-accent hover:text-space-bg border border-space-surface-2 hover:border-space-accent transition-all inline-flex items-center gap-1.5 font-medium cursor-pointer shadow-xs"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 md:p-8"
        >
          {/* Modal Container: onContextMenu blocks right-click context menu (casual download deterrent, not real security) */}
          <div
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full max-w-5xl h-[88vh] bg-space-surface border border-space-surface-2 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-space-surface-2 bg-space-surface/95 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-space-surface-2 text-space-accent border border-space-surface-2 uppercase tracking-wide shrink-0">
                  {isImageFile(selectedResource.file) ? 'Image' : 'PDF Document'}
                </span>
                <h3 className="font-display text-base font-medium text-space-text truncate">
                  {selectedResource.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResource(null)}
                aria-label="Close document viewer"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-space-muted hover:text-space-accent hover:bg-space-surface-2/60 transition-colors text-sm font-mono cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 w-full h-full min-h-0 relative overflow-hidden flex items-center justify-center bg-space-bg/80">
              {isImageFile(selectedResource.file) ? (
                <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
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
    </div>
  )
}

