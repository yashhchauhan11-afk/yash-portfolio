export const SKILLS_DATA = [
  {
    category: 'Languages',
    items: ['Python', 'JavaScript'],
  },
  {
    category: 'Frontend',
    items: ['React', 'Tailwind CSS'],
  },
  {
    category: 'Backend',
    items: ['Firebase', 'FastAPI'],
  },
  {
    category: 'Automation',
    items: ['n8n', 'Google Apps Script'],
  },
  {
    category: 'Embedded',
    items: ['IoT', 'Sensor Systems'],
  },
]

export const CURRENTLY_LEARNING = 'Order-flow forecasting, Hawkes processes'

export const SKILLS_OUTPUT = [
  'languages     python, javascript',
  'frontend      react, tailwind',
  'backend       firebase, fastapi',
  'automation    n8n, google apps script',
  'embedded      iot, sensor systems',
  '',
  'currently learning: order-flow forecasting, hawkes processes',
]

export default function Skills() {
  return (
    <section id="skills" className="px-6 md:px-16 py-24 border-t border-space-surface-2">
      <div className="max-w-6xl">
        <p className="font-mono text-xs uppercase tracking-wider text-space-accent mb-2">
          Capabilities
        </p>
        <h2 className="font-display text-3xl md:text-5xl font-medium mb-4">
          Skills & Technologies
        </h2>
        <p className="font-body text-space-muted text-lg max-w-xl mb-12 leading-relaxed">
          The stack, tools, and platforms I reach for to engineer resilient solutions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SKILLS_DATA.map((group) => (
            <div
              key={group.category}
              className="bg-space-surface border border-space-surface-2 rounded-2xl p-6 hover:border-space-surface-2 transition-colors"
            >
              <div className="font-mono text-xs uppercase tracking-wider text-space-accent mb-4">
                // {group.category}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.items.map((skill) => (
                  <span
                    key={skill}
                    className="font-mono text-sm px-3 py-1.5 rounded-lg bg-space-surface-2/80 text-space-text border border-space-surface-2"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Currently learning highlight */}
        <div className="mt-8 p-6 rounded-2xl bg-space-surface border border-space-surface-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-space-warm/15 text-space-warm border border-space-warm/30 uppercase tracking-wide">
              Active Focus
            </span>
            <span className="font-body text-space-text text-sm sm:text-base font-medium">
              Currently learning:
            </span>
          </div>
          <p className="font-mono text-sm text-space-muted">
            {CURRENTLY_LEARNING}
          </p>
        </div>
      </div>
    </section>
  )
}
