export const PROJECTS = [
  {
    id: 1,
    era: 'current',
    year: 2026,
    title: 'Missed-Call Lead-Recovery Workflow',
    category: 'AI + Automation + Business Systems',
    description:
      "A working AI-powered customer recovery workflow designed to prevent missed calls from becoming lost leads. It reconnects with customers through WhatsApp, understands their requirements, provides business-specific support, and escalates to a human when the AI can't resolve the request.",
    tags: [
      'n8n',
      'Twilio',
      'WhatsApp API',
      'AI',
      'Automation',
      'Webhooks',
      'Google Workspace',
    ],
  },
  {
    id: 2,
    era: 'current',
    year: 2026,
    title: 'Quantitative R&D',
    category: 'Quantitative Research',
    description:
      'A foundational quantitative research track exploring market microstructure through Order Flow Imbalance analysis and Hawkes self-exciting point processes. Rather than jumping straight into complex trading systems, this project builds the conceptual and engineering fundamentals — limit order book dynamics, statistical validation, and event-driven forecasting — needed to approach advanced quantitative research with confidence.',
    tags: [
      'Python',
      'Market Microstructure',
      'Order Flow Imbalance',
      'Hawkes Processes',
      'Statistics',
    ],
  },
  {
    id: 3,
    era: 'older',
    year: 2024,
    title: 'Spotify Clone',
    category: 'Web Development / Frontend',
    description:
      'An early frontend project reproducing a real-world music-streaming interface — built to strengthen frontend fundamentals and UI implementation skills.',
    tags: [],
  },
  {
    id: 4,
    era: 'older',
    year: 2024,
    title: 'Airbnb Clone',
    category: 'Full-Stack / Web Development',
    description:
      'An early full-stack project experimenting with building a larger, real-world-style web application end to end.',
    tags: [],
  },
]

export const PROJECTS_OUTPUT = [
  '[1] spotify clone — web development / frontend',
  '[2] airbnb clone — full-stack / web development',
  '[3] missed-call lead-recovery workflow — ai + automation + business systems',
  '[4] quantitative r&d — quantitative research',
]

export default function Projects() {
  return (
    <section id="projects" className="px-6 md:px-16 py-24 border-t border-space-surface-2">
      <div className="max-w-6xl">
        <p className="font-mono text-xs uppercase tracking-wider text-space-accent mb-2">
          Featured Work
        </p>
        <h2 className="font-display text-3xl md:text-5xl font-medium mb-4">
          Things I've shipped.
        </h2>
        <p className="font-body text-space-muted text-lg max-w-xl mb-12 leading-relaxed">
          Production systems, workflows, and quantitative research built with intent.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROJECTS.map((project) => (
            <div
              key={project.id}
              className="bg-space-surface border border-space-surface-2 rounded-2xl p-6 md:p-8 flex flex-col justify-between hover:border-space-accent/50 transition-colors group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs text-space-accent">
                    0{project.id}
                  </span>
                  <span className="font-mono text-xs text-space-muted/80 uppercase tracking-wide">
                    {project.category}
                  </span>
                </div>
                <h3 className="font-display text-xl md:text-2xl font-medium mb-3 text-space-text group-hover:text-space-accent transition-colors">
                  {project.title}
                </h3>
                <p className="font-body text-space-muted text-sm leading-relaxed mb-6">
                  {project.description}
                </p>
              </div>

              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-space-surface-2/60">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-xs px-2.5 py-1 rounded-full bg-space-surface-2 text-space-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
