export const PROJECTS = [
  {
    id: 1,
    title: 'Missed-Call Lead-Recovery Workflow',
    category: 'n8n Automation',
    description:
      'Automated workflow capturing missed inbound calls, enriching lead context, and triggering instant CRM sync and messaging follow-ups via n8n.',
    tags: ['n8n', 'Webhooks', 'CRM Integration', 'Automation'],
  },
  {
    id: 2,
    title: 'Campus Platform',
    category: 'Full-Stack & AI',
    description:
      'Unified campus hub consolidating student academics, campus event management, and an AI-driven viva examination simulator.',
    tags: ['React', 'Firebase', 'AI Simulator', 'Tailwind'],
  },
  {
    id: 3,
    title: 'Order-Flow Imbalance Forecasting',
    category: 'Quant Research',
    description:
      'Quantitative research pipeline analyzing high-frequency limit order book dynamics and order-flow imbalance using Hawkes point processes.',
    tags: ['Python', 'Market Microstructure', 'Hawkes Processes', 'Statistics'],
  },
]

export const PROJECTS_OUTPUT = [
  '[1] missed-call lead-recovery workflow — n8n automation',
  '[2] campus platform — academics + events + ai viva simulator',
  '[3] order-flow imbalance forecasting — quant research',
  '',
  '(edit this list in Projects.jsx with your real projects)',
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
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
