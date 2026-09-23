import { getAllPosts } from '../content/blogLoader'

export default function BlogList({ navigate }) {
  const posts = getAllPosts()

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

      <div className="max-w-2xl mb-12">
        <p className="font-mono text-xs uppercase tracking-wider text-space-accent mb-2">
          Writing & Notes
        </p>
        <h1 className="font-display text-4xl md:text-6xl font-medium mb-4 text-space-text">
          Articles & Essays.
        </h1>
        <p className="font-body text-space-muted text-lg leading-relaxed">
          Deep dives into systems automation, quantitative experiments, and building for the web.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="bg-space-surface border border-space-surface-2 rounded-2xl p-8 max-w-xl">
          <p className="font-mono text-xs text-space-accent mb-2">status: draft queue empty</p>
          <p className="font-body text-space-muted text-sm">
            Posts are being drafted. Add markdown files to{' '}
            <code className="font-mono text-space-accent">src/content/blog/*.md</code> to publish.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, idx) => (
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
    </div>
  )
}
