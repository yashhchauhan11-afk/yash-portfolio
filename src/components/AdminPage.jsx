import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

function getValidToken() {
  const token = sessionStorage.getItem('admin_token')
  if (!token) return null
  try {
    const [payloadB64] = token.split('.')
    const payload = JSON.parse(atob(payloadB64))
    if (payload.exp && Date.now() < payload.exp) {
      return token
    }
  } catch {
    // Malformed token
  }
  sessionStorage.removeItem('admin_token')
  return null
}

export default function AdminPage({ navigate }) {
  const [token, setToken] = useState(() => getValidToken())
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Collections & resources state
  const [collections, setCollections] = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [fetchError, setFetchError] = useState('')

  // Form state
  const [isNewCollection, setIsNewCollection] = useState(false)
  const [selectedCollectionId, setSelectedCollectionId] = useState('')
  const [newColTitle, setNewColTitle] = useState('')
  const [newColSlug, setNewColSlug] = useState('')
  const [newColExcerpt, setNewColExcerpt] = useState('')

  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceDesc, setResourceDesc] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)

  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [successInfo, setSuccessInfo] = useState(null)

  const [deletingId, setDeletingId] = useState(null)

  // Fetch collections from public Supabase client
  const loadCollections = useCallback(async () => {
    try {
      setLoadingData(true)
      setFetchError('')
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
            sort_order
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const sorted = (data || []).map((col) => ({
        ...col,
        resources: (col.resources || []).sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        ),
      }))

      setCollections(sorted)
      if (sorted.length > 0 && !selectedCollectionId) {
        setSelectedCollectionId(sorted[0].id)
      }
    } catch (err) {
      console.error('Failed to load collections:', err)
      setFetchError('Failed to load collections. Please check your network.')
    } finally {
      setLoadingData(false)
    }
  }, [selectedCollectionId])

  useEffect(() => {
    if (token) {
      loadCollections()
    }
  }, [token, loadCollections])

  // Login handler
  async function handleLogin(e) {
    e.preventDefault()
    if (!password.trim()) return

    setLoginLoading(true)
    setLoginError('')

    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (!res.ok || !data.token) {
        setLoginError(data.error || 'Invalid credentials')
        return
      }

      sessionStorage.setItem('admin_token', data.token)
      setToken(data.token)
      setPassword('')
    } catch (err) {
      console.error('Login request failed:', err)
      setLoginError('Unable to connect to login service.')
    } finally {
      setLoginLoading(false)
    }
  }

  // Logout handler
  function handleLogout() {
    sessionStorage.removeItem('admin_token')
    setToken(null)
    setSuccessInfo(null)
  }

  // Upload handler
  async function handleUpload(e) {
    e.preventDefault()
    setUploadError('')
    setSuccessInfo(null)

    if (!resourceTitle.trim()) {
      setUploadError('Resource title is required.')
      return
    }

    if (!selectedFile) {
      setUploadError('Please select a file to upload.')
      return
    }

    if (!isNewCollection && !selectedCollectionId) {
      setUploadError('Please select an existing collection or create a new one.')
      return
    }

    if (isNewCollection && !newColTitle.trim()) {
      setUploadError('New collection title is required.')
      return
    }

    const currentToken = getValidToken()
    if (!currentToken) {
      handleLogout()
      setLoginError('Session expired. Please log in again.')
      return
    }

    setUploadLoading(true)

    try {
      // Step 1: Request presigned upload URL from serverless function
      const signRes = await fetch('/api/admin-sign-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ filename: selectedFile.name }),
      })

      if (signRes.status === 401) {
        handleLogout()
        setLoginError('Session expired. Please log in again.')
        return
      }

      const signData = await signRes.json()
      if (!signRes.ok || !signData.signedUrl || !signData.path || !signData.token) {
        throw new Error(signData.error || 'Failed to generate signed upload URL.')
      }

      // Step 2: Upload file directly to Supabase Storage via SDK uploadToSignedUrl
      const { error: uploadError } = await supabase.storage
        .from('resources')
        .uploadToSignedUrl(signData.path, signData.token, selectedFile)

      if (uploadError) {
        console.error('Supabase uploadToSignedUrl error:', uploadError)
        throw new Error(uploadError.message || 'Direct storage upload failed.')
      }

      // Step 3: Insert database row via serverless function
      const createRes = await fetch('/api/admin-create-resource', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          collectionId: isNewCollection ? undefined : selectedCollectionId,
          newCollection: isNewCollection
            ? {
                title: newColTitle.trim(),
                slug: newColSlug.trim() || undefined,
                excerpt: newColExcerpt.trim() || undefined,
              }
            : undefined,
          title: resourceTitle.trim(),
          description: resourceDesc.trim() || undefined,
          filePath: signData.path,
        }),
      })

      if (createRes.status === 401) {
        handleLogout()
        setLoginError('Session expired. Please log in again.')
        return
      }

      const createData = await createRes.json()
      if (!createRes.ok || !createData.resource) {
        throw new Error(createData.error || 'Failed to save resource record in database.')
      }

      // Success feedback
      setSuccessInfo({
        title: createData.resource.title,
        id: createData.resource.id,
      })

      // Reset form
      setResourceTitle('')
      setResourceDesc('')
      setSelectedFile(null)
      const fileInput = document.getElementById('admin-file-input')
      if (fileInput) fileInput.value = ''

      if (isNewCollection) {
        setIsNewCollection(false)
        setNewColTitle('')
        setNewColSlug('')
        setNewColExcerpt('')
      }

      // Refresh data
      await loadCollections()
    } catch (err) {
      console.error('Upload failed:', err)
      setUploadError(err.message || 'An error occurred during upload.')
    } finally {
      setUploadLoading(false)
    }
  }

  // Delete handler
  async function handleDelete(resourceId, title) {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    const currentToken = getValidToken()
    if (!currentToken) {
      handleLogout()
      setLoginError('Session expired. Please log in again.')
      return
    }

    setDeletingId(resourceId)

    try {
      const res = await fetch('/api/admin-delete-resource', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ resourceId }),
      })

      if (res.status === 401) {
        handleLogout()
        setLoginError('Session expired. Please log in again.')
        return
      }

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete resource.')
      }

      // Re-fetch collections
      await loadCollections()
    } catch (err) {
      console.error('Delete failed:', err)
      alert(`Delete failed: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-12 py-12 md:py-20 max-w-4xl mx-auto">
      {/* Top back navigation */}
      <div className="flex items-center justify-between mb-8">
        {navigate && (
          <button
            type="button"
            onClick={() => navigate('/')}
            className="font-mono text-xs text-space-muted hover:text-space-accent transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            ← Back to portfolio
          </button>
        )}

        {token && (
          <div className="flex items-center gap-4">
            {navigate && (
              <button
                type="button"
                onClick={() => navigate('/blog')}
                className="font-mono text-xs text-space-accent hover:underline cursor-pointer"
              >
                View Resources (/blog) ↗
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="font-mono text-xs text-space-muted hover:text-rose-400 transition-colors cursor-pointer border border-space-surface-2 px-3 py-1 rounded-lg bg-space-surface"
            >
              Log out
            </button>
          </div>
        )}
      </div>

      {/* Screen 1: Password Form (When unauthenticated) */}
      {!token ? (
        <div className="max-w-md mx-auto mt-16 bg-space-surface border border-space-surface-2 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="mb-6">
            <span className="font-mono text-xs uppercase tracking-wider text-space-accent">
              utility // restricted
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-medium text-space-text mt-2">
              Admin Access
            </h1>
            <p className="font-body text-sm text-space-muted mt-2">
              Enter master password to manage database-backed resources.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-password"
                className="block font-mono text-xs text-space-muted mb-2 uppercase tracking-wide"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-space-bg border border-space-surface-2 text-space-text font-mono text-sm px-4 py-2.5 rounded-lg focus:border-space-accent focus:outline-hidden transition-colors"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-space-accent text-space-bg font-mono font-medium text-xs py-3 rounded-lg hover:bg-space-accent/90 transition-all cursor-pointer disabled:opacity-50"
            >
              {loginLoading ? 'Authenticating...' : 'Authenticate →'}
            </button>
          </form>
        </div>
      ) : (
        /* Screen 2: Authenticated Management Panel */
        <div className="space-y-12">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2 h-2 rounded-full bg-space-accent animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-wider text-space-accent">
                Session Active // 2h Token
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-medium text-space-text">
              Resource Management
            </h1>
            <p className="font-body text-space-muted text-sm mt-1">
              Upload documents directly to Supabase Storage and register them in the database.
            </p>
          </div>

          {/* Success Notification Banner */}
          {successInfo && (
            <div className="p-4 rounded-xl bg-space-accent/10 border border-space-accent/40 text-space-accent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="font-body text-sm">
                <span className="font-medium">✓ Upload Successful:</span> "{successInfo.title}" is now live.
              </div>
              {navigate && (
                <button
                  type="button"
                  onClick={() => navigate('/blog')}
                  className="font-mono text-xs underline hover:text-white cursor-pointer shrink-0"
                >
                  View in Resources on /blog ↗
                </button>
              )}
            </div>
          )}

          {/* Upload Form Card */}
          <div className="bg-space-surface border border-space-surface-2 rounded-2xl p-6 sm:p-8">
            <h2 className="font-display text-xl font-medium text-space-text mb-6">
              Upload New Resource
            </h2>

            <form onSubmit={handleUpload} className="space-y-6">
              {/* Collection Selection Toggle */}
              <div>
                <label className="block font-mono text-xs uppercase text-space-muted mb-2 tracking-wide">
                  Target Collection
                </label>
                <div className="flex items-center gap-4 mb-3">
                  <button
                    type="button"
                    onClick={() => setIsNewCollection(false)}
                    className={`font-mono text-xs px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      !isNewCollection
                        ? 'bg-space-accent text-space-bg border-space-accent font-medium'
                        : 'bg-space-surface-2 text-space-muted border-space-surface-2 hover:text-space-text'
                    }`}
                  >
                    Existing Collection
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewCollection(true)}
                    className={`font-mono text-xs px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      isNewCollection
                        ? 'bg-space-accent text-space-bg border-space-accent font-medium'
                        : 'bg-space-surface-2 text-space-muted border-space-surface-2 hover:text-space-text'
                    }`}
                  >
                    + Create New Collection
                  </button>
                </div>

                {!isNewCollection ? (
                  collections.length > 0 ? (
                    <select
                      value={selectedCollectionId}
                      onChange={(e) => setSelectedCollectionId(e.target.value)}
                      className="w-full bg-space-bg border border-space-surface-2 text-space-text font-body text-sm px-4 py-2.5 rounded-lg focus:border-space-accent focus:outline-hidden cursor-pointer"
                    >
                      {collections.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.title} ({col.resources?.length || 0} items)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-mono text-xs text-space-muted italic">
                      No collections exist yet. Select "Create New Collection" above.
                    </p>
                  )
                ) : (
                  <div className="space-y-3 p-4 rounded-xl bg-space-bg border border-space-surface-2">
                    <div>
                      <span className="block font-mono text-[11px] text-space-muted mb-1">
                        Collection Title *
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Sem 6 Library"
                        value={newColTitle}
                        onChange={(e) => setNewColTitle(e.target.value)}
                        className="w-full bg-space-surface border border-space-surface-2 text-space-text font-body text-sm px-3.5 py-2 rounded-lg focus:border-space-accent focus:outline-hidden"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="block font-mono text-[11px] text-space-muted mb-1">
                          Slug (optional)
                        </span>
                        <input
                          type="text"
                          placeholder="e.g. sem6-library"
                          value={newColSlug}
                          onChange={(e) => setNewColSlug(e.target.value)}
                          className="w-full bg-space-surface border border-space-surface-2 text-space-text font-mono text-xs px-3.5 py-2 rounded-lg focus:border-space-accent focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <span className="block font-mono text-[11px] text-space-muted mb-1">
                          Excerpt (optional)
                        </span>
                        <input
                          type="text"
                          placeholder="Short summary..."
                          value={newColExcerpt}
                          onChange={(e) => setNewColExcerpt(e.target.value)}
                          className="w-full bg-space-surface border border-space-surface-2 text-space-text font-body text-sm px-3.5 py-2 rounded-lg focus:border-space-accent focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Resource Title */}
              <div>
                <label
                  htmlFor="resource-title"
                  className="block font-mono text-xs uppercase text-space-muted mb-2 tracking-wide"
                >
                  Resource Document Title *
                </label>
                <input
                  id="resource-title"
                  type="text"
                  placeholder="e.g. Microprocessor Unit 1 Lecture Notes"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  className="w-full bg-space-bg border border-space-surface-2 text-space-text font-body text-sm px-4 py-2.5 rounded-lg focus:border-space-accent focus:outline-hidden"
                />
              </div>

              {/* Resource Description */}
              <div>
                <label
                  htmlFor="resource-desc"
                  className="block font-mono text-xs uppercase text-space-muted mb-2 tracking-wide"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="resource-desc"
                  rows={2}
                  placeholder="Brief context, topics covered, or notes..."
                  value={resourceDesc}
                  onChange={(e) => setResourceDesc(e.target.value)}
                  className="w-full bg-space-bg border border-space-surface-2 text-space-text font-body text-sm px-4 py-2.5 rounded-lg focus:border-space-accent focus:outline-hidden resize-none"
                />
              </div>

              {/* File Input */}
              <div>
                <label
                  htmlFor="admin-file-input"
                  className="block font-mono text-xs uppercase text-space-muted mb-2 tracking-wide"
                >
                  Document File (PDF or Image) *
                </label>
                <input
                  id="admin-file-input"
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full font-mono text-xs text-space-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-mono file:text-xs file:font-medium file:bg-space-surface-2 file:text-space-accent hover:file:bg-space-surface-2/80 cursor-pointer"
                />
                {selectedFile && (
                  <p className="font-mono text-xs text-space-accent mt-2">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {uploadError && (
                <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs">
                  {uploadError}
                </div>
              )}

              <button
                type="submit"
                disabled={uploadLoading}
                className="w-full sm:w-auto bg-space-accent text-space-bg font-mono font-medium text-xs px-6 py-3 rounded-lg hover:bg-space-accent/90 transition-all cursor-pointer disabled:opacity-50"
              >
                {uploadLoading ? 'Uploading & Saving...' : 'Upload Resource ↗'}
              </button>
            </form>
          </div>

          {/* Section: Existing Resources List with Delete Buttons */}
          <div className="bg-space-surface border border-space-surface-2 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-space-surface-2">
              <h2 className="font-display text-xl font-medium text-space-text">
                Existing Collections & Resources
              </h2>
              <button
                type="button"
                onClick={loadCollections}
                disabled={loadingData}
                className="font-mono text-xs text-space-muted hover:text-space-accent transition-colors cursor-pointer"
              >
                {loadingData ? 'Refreshing...' : '↻ Refresh'}
              </button>
            </div>

            {fetchError && (
              <p className="font-mono text-xs text-rose-400">{fetchError}</p>
            )}

            {collections.length === 0 ? (
              <p className="font-mono text-xs text-space-muted">
                No collections found in database.
              </p>
            ) : (
              <div className="space-y-6">
                {collections.map((col) => (
                  <div
                    key={col.id}
                    className="p-4 sm:p-5 rounded-xl bg-space-bg border border-space-surface-2"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-display text-lg font-medium text-space-text">
                          {col.title}
                        </h3>
                        {col.excerpt && (
                          <p className="font-body text-xs text-space-muted mt-0.5">
                            {col.excerpt}
                          </p>
                        )}
                      </div>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-space-surface-2 text-space-accent border border-space-surface-2">
                        slug: {col.slug}
                      </span>
                    </div>

                    {/* Resources list */}
                    {col.resources && col.resources.length > 0 ? (
                      <div className="space-y-2 mt-4">
                        {col.resources.map((res) => (
                          <div
                            key={res.id}
                            className="p-3 rounded-lg bg-space-surface border border-space-surface-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-body text-sm font-medium text-space-text truncate">
                                {res.title}
                              </p>
                              {res.description && (
                                <p className="font-body text-xs text-space-muted truncate mt-0.5">
                                  {res.description}
                                </p>
                              )}
                              <a
                                href={res.file_path}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-[10px] text-space-accent hover:underline block truncate mt-1"
                              >
                                {res.file_path}
                              </a>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDelete(res.id, res.title)}
                              disabled={deletingId === res.id}
                              className="font-mono text-xs px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                            >
                              {deletingId === res.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="font-mono text-xs text-space-muted italic mt-2">
                        No resources in this collection.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
