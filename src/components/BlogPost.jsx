import { getPostBySlug, renderMarkdown } from '../content/blogLoader'

export default function BlogPost({ slug, navigate }) {
  const post = getPostBySlug(slug)

  if (!post) {
    return (
      <div className="min-h-screen px-6 md:px-16 py-20 max-w-4xl mx-auto flex flex-col items-start justify-center">
        <p className="font-mono text-xs uppercase tracking-wider text-space-warm mb-3">
          404 — Article Not Found
        </p>
        <h1 className="font-display text-3xl md:text-5xl font-medium mb-4 text-space-text">
          Post doesn't exist yet.
        </h1>
        <p className="font-body text-space-muted text-base md:text-lg mb-8">
          The requested article <code className="font-mono text-space-accent">/blog/{slug}</code> could not be found.
        </p>
        <button
          type="button"
          onClick={() => navigate('/blog')}
          className="font-mono text-xs px-4 py-2 rounded-lg bg-space-surface border border-space-surface-2 text-space-accent hover:border-space-accent transition-colors cursor-pointer"
        >
          ← Back to all posts
        </button>
      </div>
    )
  }

  const htmlContent = renderMarkdown(post.content)

  return (
    <article className="min-h-screen px-6 md:px-16 py-16 md:py-24 max-w-3xl mx-auto">
      <div className="mb-10">
        <button
          type="button"
          onClick={() => navigate('/blog')}
          className="font-mono text-xs text-space-muted hover:text-space-accent mb-8 inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          ← Back to all posts
        </button>

        <div className="flex items-center gap-4 mb-3">
          <time className="font-mono text-xs uppercase tracking-wider text-space-accent">
            {post.date}
          </time>
          <span className="text-space-surface-2">•</span>
          <span className="font-mono text-xs text-space-muted">
            {post.slug}
          </span>
        </div>

        <h1 className="font-display text-3xl md:text-5xl font-medium text-space-text leading-tight mb-6">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="font-body text-space-muted text-lg md:text-xl leading-relaxed border-l-2 border-space-accent/50 pl-4 italic">
            {post.excerpt}
          </p>
        )}
      </div>

      <div className="border-t border-space-surface-2 pt-8 mb-16">
        <div
          className="blog-prose font-body text-space-muted text-base md:text-lg leading-relaxed space-y-6 [&>h2]:font-display [&>h2]:text-2xl [&>h2]:md:text-3xl [&>h2]:text-space-text [&>h2]:font-medium [&>h2]:pt-6 [&>h2]:mb-2 [&>h3]:font-display [&>h3]:text-xl [&>h3]:text-space-text [&>h3]:font-medium [&>h3]:pt-4 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-2 [&>pre]:bg-space-surface [&>pre]:border [&>pre]:border-space-surface-2 [&>pre]:rounded-xl [&>pre]:p-4 [&>pre]:overflow-x-auto [&>pre]:font-mono [&>pre]:text-sm [&>pre]:text-space-text [&>code]:font-mono [&>code]:text-sm [&>code]:bg-space-surface-2 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-space-accent [&>blockquote]:border-l-2 [&>blockquote]:border-space-accent [&>blockquote]:pl-4 [&>blockquote]:italic [&>a]:text-space-accent [&>a]:underline hover:[&>a]:text-space-warm"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      <div className="border-t border-space-surface-2 pt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/blog')}
          className="font-mono text-xs text-space-muted hover:text-space-accent inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          ← Back to all posts
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="font-mono text-xs text-space-muted hover:text-space-accent inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          Portfolio home →
        </button>
      </div>
    </article>
  )
}
