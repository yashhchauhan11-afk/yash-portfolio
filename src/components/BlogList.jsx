export default function BlogList({ navigate }) {
  return (
    <div className="min-h-screen bg-space-bg text-space-text px-6 md:px-16 py-16 flex flex-col items-start justify-center max-w-4xl mx-auto">
      {navigate && (
        <button
          type="button"
          onClick={() => navigate('/')}
          className="font-mono text-xs text-space-muted hover:text-space-accent mb-8 flex items-center gap-2 transition-colors cursor-pointer"
        >
          ← Back to portfolio
        </button>
      )}

      <p className="font-mono text-xs uppercase tracking-wider text-space-accent mb-2">
        Articles & Notes
      </p>

      <h1 className="font-display text-4xl md:text-6xl font-medium mb-4">
        Blog — coming soon
      </h1>

      <p className="font-body text-space-muted text-lg max-w-lg mb-8 leading-relaxed">
        Deep dives into systems automation, quantitative experiments, and building
        for the web. Check back shortly.
      </p>

      {navigate && (
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-full bg-space-accent text-space-bg font-body font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Return to home
        </button>
      )}
    </div>
  )
}
