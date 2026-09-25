export default function About() {
  return (
    <section id="about" className="px-6 md:px-16 py-24 border-t border-space-surface-2">
      <div className="max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-wider text-space-accent mb-2">
          Background
        </p>
        <h2 className="font-display text-3xl md:text-5xl font-medium mb-6">
          About Me
        </h2>

        <div className="space-y-6 font-body text-space-muted text-base md:text-lg leading-relaxed">
          <p>
            I'm Yash, a Computer Science Engineering student who learns by
            exploring, building, and occasionally breaking things just to understand
            how they work. I'm drawn to AI, automation, data, and the systems
            underneath them, turning experiments into projects and projects into
            better questions. I'm also exploring quantitative technology — where
            math, algorithms, data, and software meet — with an eye toward
            quantitative trading and research.
          </p>
          <p>
            Currently exploring quantitative technology — digging into market
            microstructure, order flow, time-series and stochastic processes,
            options, statistics, and systematic risk to understand how quantitative
            trading systems work from the inside. Alongside the research, I'm
            building the engineering foundation with Python, Java, and C++ for where
            I want to go next.
          </p>
          <p>
            Curiosity drives most of what I build. I'm fascinated by how the best
            engineers and technology companies turn difficult ideas into real
            systems — and I naturally end up asking, 'How did they build this, and
            where could I fit into the picture?' Every project is my way of getting
            closer: understanding the technology, experimenting with it, and
            eventually building something that earns its own place.
          </p>
        </div>

        {/* Quick summary highlights */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-sm">
          <div className="p-4 rounded-xl bg-space-surface border border-space-surface-2">
            <span className="text-space-accent block text-xs uppercase mb-1">Education</span>
            <span className="text-space-text">GEC Patan / GTU</span>
          </div>
          <div className="p-4 rounded-xl bg-space-surface border border-space-surface-2">
            <span className="text-space-accent block text-xs uppercase mb-1">Discipline</span>
            <span className="text-space-text">Computer Science Engineering</span>
          </div>
          <div className="p-4 rounded-xl bg-space-surface border border-space-surface-2">
            <span className="text-space-accent block text-xs uppercase mb-1">Current Focus</span>
            <span className="text-space-text">Quantitative Technology</span>
          </div>
        </div>
      </div>
    </section>
  )
}
