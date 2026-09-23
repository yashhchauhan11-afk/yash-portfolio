import matter from 'gray-matter'
import { marked } from 'marked'

// Browser polyfill for Buffer required by gray-matter in client-side Vite
if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
  window.Buffer = {
    isBuffer: () => false,
    from: (str) => str,
  }
}
if (typeof globalThis !== 'undefined' && typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = {
    isBuffer: () => false,
    from: (str) => str,
  }
}

// Fallback parser in case gray-matter encounters an engine parsing error in the browser
function parseFallback(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }

  const yaml = match[1]
  const content = match[2]
  const data = {}

  for (const line of yaml.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const colonIdx = trimmed.indexOf(':')
    if (colonIdx === -1) continue

    const key = trimmed.slice(0, colonIdx).trim()
    let val = trimmed.slice(colonIdx + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    data[key] = val
  }
  return { data, content }
}

// Load all markdown files at compile time via Vite import.meta.glob
const rawBlogModules = import.meta.glob('/src/content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export function getAllPosts() {
  const posts = []

  for (const [path, rawContent] of Object.entries(rawBlogModules)) {
    try {
      let parsed
      try {
        parsed = matter(rawContent)
      } catch {
        parsed = parseFallback(rawContent)
      }

      const { data, content } = parsed

      let formattedDate = ''
      if (data.date) {
        if (data.date instanceof Date) {
          formattedDate = data.date.toISOString().split('T')[0]
        } else {
          formattedDate = String(data.date).trim()
        }
      }

      posts.push({
        title: data.title || 'Untitled Post',
        date: formattedDate,
        slug: data.slug || path.split('/').pop().replace(/\.md$/, ''),
        excerpt: data.excerpt || '',
        content,
      })
    } catch (err) {
      console.error(`Failed to parse blog post at ${path}:`, err)
    }
  }

  // Sort newest first
  return posts.sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function getPostBySlug(slug) {
  const posts = getAllPosts()
  return posts.find((p) => p.slug === slug) || null
}

export function renderMarkdown(content) {
  return marked.parse(content || '')
}
