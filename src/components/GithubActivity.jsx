import { lazy, Suspense, useEffect, useRef, useState } from 'react'

const GithubActivity3D = lazy(() => import('./GithubActivity3D'))

const GITHUB_USERNAME = 'yashhchauhan11-afk'
const CACHE_KEY = `gh_repos_cache_${GITHUB_USERNAME}`
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour session cache

export default function GithubActivity() {
  const [repos, setRepos] = useState([])
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [loading, setLoading] = useState(true)
  const sectionRef = useRef(null)

  // Guard against React StrictMode dev double-invocation and overlapping fetches
  const hasFetchedRef = useRef(false)
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true

    // 1. Check sessionStorage cache first to respect unauthenticated 60 req/hr rate limit
    try {
      const cachedRaw = sessionStorage.getItem(CACHE_KEY)
      if (cachedRaw) {
        const { timestamp, data } = JSON.parse(cachedRaw)
        if (Date.now() - timestamp < CACHE_TTL_MS && Array.isArray(data) && data.length > 0) {
          setRepos(data)
          setSelectedRepo(data[0])
          setLoading(false)
          hasFetchedRef.current = true
          return
        }
      }
    } catch {
      // sessionStorage parsing issue or blocked; proceed with fetch
    }

    // 2. Prevent duplicate network fetches during React StrictMode dev re-mounts
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true

    // 3. Fetch from GitHub public REST API
    async function loadRepos() {
      try {
        const res = await fetch(
          `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=10`
        )

        if (!res.ok) {
          // If rate-limited (403/429) or error, fail silently without breaking the UI
          if (isMountedRef.current) setLoading(false)
          return
        }

        const data = await res.json()
        if (!Array.isArray(data)) {
          if (isMountedRef.current) setLoading(false)
          return
        }

        // Filter non-forks, take top 5-6 repos to strictly adhere to max 5-7 3D elements guardrail
        const cleaned = data
          .filter((repo) => !repo.fork)
          .slice(0, 6)
          .map((repo) => ({
            id: repo.id,
            name: repo.name,
            stars: repo.stargazers_count ?? 0,
            language: repo.language || 'Code',
            url: repo.html_url,
            description: repo.description || 'Public repository on GitHub',
            updatedAt: repo.updated_at,
          }))

        if (cleaned.length > 0) {
          try {
            sessionStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ timestamp: Date.now(), data: cleaned })
            )
          } catch {
            // sessionStorage write failure; ignore
          }

          if (isMountedRef.current) {
            setRepos(cleaned)
            setSelectedRepo(cleaned[0])
          }
        }
      } catch {
        // Network/offline failure: fail silently, never show a broken error state
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    }

    loadRepos()

    return () => {
      isMountedRef.current = false
    }
  }, [])

  // If no repos found (offline / initial load failed silently), show nothing or minimal clean state
  if (!loading && repos.length === 0) {
    return null
  }

  return (
    <section
      id="github-activity"
      ref={sectionRef}
      className="px-6 md:px-16 py-20 border-t border-space-surface-2 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-space-accent mb-2">
              // Open Source Telemetry
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-medium mb-3">
              GitHub Repositories
            </h2>
            <p className="font-body text-space-muted text-base md:text-lg max-w-xl leading-relaxed">
              Live repository telemetry from GitHub REST API. Bar height represents star count with hexagonal 3D prisms.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-space-accent animate-pulse" />
            <span className="font-mono text-xs text-space-muted">
              Live REST sync (cached)
            </span>
          </div>
        </div>

        {/* 3D Scene Container */}
        <div className="bg-space-surface/60 border border-space-surface-2 rounded-2xl p-6 relative">
          <Suspense
            fallback={
              <div className="w-full h-56 md:h-64 flex items-center justify-center">
                <div className="font-mono text-xs text-space-muted flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-space-accent animate-ping" />
                  Rendering 3D telemetry bars...
                </div>
              </div>
            }
          >
            {repos.length > 0 && (
              <GithubActivity3D
                repos={repos}
                selectedRepo={selectedRepo}
                onSelect={(repo) => setSelectedRepo(repo)}
                containerRef={sectionRef}
              />
            )}
          </Suspense>

          {/* Interactive Selected Repo Details Card */}
          {selectedRepo && (
            <div className="mt-4 pt-4 border-t border-space-surface-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-display text-lg font-medium text-space-text">
                    {selectedRepo.name}
                  </span>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-space-surface-2 text-space-accent border border-space-surface-2">
                    {selectedRepo.language}
                  </span>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-space-warm/15 text-space-warm border border-space-warm/30 flex items-center gap-1">
                    ★ {selectedRepo.stars}
                  </span>
                </div>
                <p className="font-body text-xs sm:text-sm text-space-muted max-w-xl">
                  {selectedRepo.description}
                </p>
              </div>

              <a
                href={selectedRepo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full bg-space-surface-2 hover:bg-space-accent hover:text-space-bg text-space-text font-mono text-xs font-medium border border-space-surface-2 transition-colors flex items-center gap-1.5 shrink-0"
              >
                <span>View on GitHub</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
