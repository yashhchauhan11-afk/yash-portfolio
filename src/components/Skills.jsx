import { lazy, Suspense, useRef } from 'react'

const SkillsConstellation = lazy(() => import('./SkillsConstellation'))

export const SKILLS_DATA = [
  {
    category: 'Web Development',
    description:
      'Building responsive interfaces and full-stack web applications, from frontend experiences to APIs and data-driven backend workflows.',
    items: [
      'HTML',
      'CSS',
      'JavaScript',
      'React',
      'Bootstrap',
      'Tailwind CSS',
      'Vite',
      'Node.js',
      'Express.js',
      'MongoDB',
    ],
  },
  {
    category: 'Java & Computer Science',
    description:
      'Building a strong computer-science foundation through Java, completed DSA, and problem-solving with a focus on understanding how systems work underneath the abstractions.',
    items: [
      'Java',
      'Object-Oriented Programming',
      'Data Structures & Algorithms',
      'Collections',
      'Problem Solving',
    ],
  },
  {
    category: 'Quantitative Computing',
    description:
      'Exploring quantitative computing through Python, combining mathematics, statistics, market data, and computational methods to understand how quantitative trading and research systems are built.',
    groups: [
      {
        label: 'Currently Using',
        items: ['Python', 'NumPy', 'Pandas', 'SciPy', 'Jupyter Notebook'],
      },
      {
        label: 'Currently Learning',
        items: ['Statsmodels', 'scikit-learn', 'Matplotlib'],
      },
      {
        label: 'Research Areas',
        items: [
          'Market Microstructure',
          'Order Flow / OFI',
          'Time-Series Analysis',
          'Statistical Modeling',
          'Stochastic Processes',
          'Hawkes Processes',
          'Options & Greeks',
          'Volatility / Implied Volatility',
          'Systematic Risk',
        ],
      },
    ],
  },
  {
    category: 'AI & Automation',
    description:
      'Building AI-powered workflows that connect models, APIs, automation platforms, and real-world business processes.',
    items: [
      'Generative AI APIs',
      'Gemini API',
      'OpenRouter',
      'n8n',
      'Webhooks',
      'Prompt Engineering',
      'API Integration',
      'Twilio',
      'WhatsApp Business API',
      'Telegram Bot API',
    ],
  },
  {
    category: 'Developer Tools & Platforms',
    description:
      'Using modern developer tooling to build, test, version, debug, and deploy projects.',
    items: [
      'Git',
      'GitHub',
      'VS Code',
      'IntelliJ IDEA',
      'Eclipse',
      'Postman',
      'MySQL Workbench',
      'Vercel',
      'Chrome DevTools',
    ],
  },
]

export const EXPLORING_NEXT = [
  { name: 'C++', note: 'performance-oriented systems' },
  { name: 'Linux', note: 'systems and research environment' },
  { name: 'SQL', note: 'market-data querying' },
  { name: 'Polars', note: 'high-performance data processing' },
  { name: 'PyArrow', note: 'columnar data workflows' },
  { name: 'DuckDB', note: 'analytical research queries' },
  { name: 'QuantLib', note: 'quantitative finance / derivatives' },
  { name: 'kdb+ / q', note: 'future market-data and time-series exploration' },
  { name: 'Low-latency networking', note: 'future systems exploration' },
]

export const SKILL_DESCRIPTIONS = {
  React: 'Component-driven frontend interfaces, reactive state management, and modern SPA architecture.',
  'Node.js': 'Event-driven JavaScript runtime powering backend services, REST APIs, and tooling.',
  Java: 'Core object-oriented language for foundational systems programming and algorithmic problem solving.',
  'Data Structures & Algorithms': 'Trees, graphs, dynamic programming, and complexity analysis for efficient computational design.',
  Python: 'Primary computational language for quantitative modeling, scientific computing, and statistical analysis.',
  NumPy: 'Vectorized array computing and linear algebra foundations for quantitative time-series models.',
  'Gemini API': 'Multimodal and structured LLM inference integrated into automation pipelines and assistants.',
  n8n: 'Node-based workflow automation orchestrating webhooks, external APIs, and business data streams.',
  Git: 'Distributed version control, branch management, and collaborative code workflows.',
  Vercel: 'Serverless hosting, edge functions, and automated CI/CD deployment pipelines.',
}

export const SKILLS_OUTPUT = [
  'web development        html, css, javascript, react, bootstrap, tailwind css, vite, node.js, express.js, mongodb',
  'java & comp science    java, oop, data structures & algorithms, collections, problem solving',
  'quantitative computing',
  '  currently using      python, numpy, pandas, scipy, jupyter notebook',
  '  currently learning   statsmodels, scikit-learn, matplotlib',
  '  research areas       market microstructure, order flow / ofi, time-series, statistical modeling, stochastic processes, hawkes processes, options & greeks, volatility, systematic risk',
  'ai & automation        generative ai apis, gemini api, openrouter, n8n, webhooks, prompt engineering, api integration, twilio, whatsapp api, telegram bot api',
  'developer tools        git, github, vs code, intellij idea, eclipse, postman, mysql workbench, vercel, chrome devtools',
  '',
  'exploring next (upcoming): c++, linux, sql, polars, pyarrow, duckdb, quantlib, kdb+/q, low-latency networking',
]

export default function Skills() {
  const sectionRef = useRef(null)

  return (
    <section
      id="skills"
      ref={sectionRef}
      className="px-6 md:px-16 py-24 border-t border-space-surface-2 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-wider text-space-accent mb-2">
          Capabilities
        </p>
        <h2 className="font-display text-3xl md:text-5xl font-medium mb-4">
          Skills & Technologies
        </h2>
        <p className="font-body text-space-muted text-base md:text-lg max-w-2xl mb-12 leading-relaxed">
          I don't treat a tech stack as a checklist. I learn tools by building with them, understanding what problems they solve, and gradually connecting them into larger systems. My current path spans web engineering, Java and computer science, AI automation, and quantitative computing.
        </p>

        {/* Primary Fast-Scan Flat Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-flow-row-dense gap-6">
          {SKILLS_DATA.map((group) => {
            const isQuant = Boolean(group.groups)
            return (
              <div
                key={group.category}
                className={`bg-space-surface border border-space-surface-2 rounded-2xl p-6 hover:border-space-surface-2/80 transition-colors flex flex-col justify-between ${
                  isQuant ? 'md:col-span-2 lg:col-span-2' : ''
                }`}
              >
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-space-accent mb-2">
                    // {group.category}
                  </div>
                  <p className="font-body text-xs text-space-muted leading-relaxed mb-4">
                    {group.description}
                  </p>

                  {/* Standard category with flat items */}
                  {group.items && (
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((skill) => (
                        <span
                          key={skill}
                          className="font-mono text-xs px-2.5 py-1 rounded-full bg-space-surface-2 text-space-muted border border-space-surface-2"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quantitative Computing with structured subgroups */}
                  {group.groups && (
                    <div className="space-y-4">
                      {group.groups.map((subgroup) => (
                        <div key={subgroup.label}>
                          <div className="font-mono text-[10px] uppercase tracking-wider text-space-accent/80 mb-2">
                            // {subgroup.label}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {subgroup.items.map((skill) => (
                              <span
                                key={skill}
                                className="font-mono text-xs px-2.5 py-1 rounded-full bg-space-surface-2 text-space-muted border border-space-surface-2"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Exploring Next (Aspirational / Future Stack) */}
        <div className="mt-10 rounded-2xl bg-space-surface/50 border border-dashed border-space-warm/40 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-space-warm mb-1">
                // Exploring Next
              </div>
              <h3 className="font-display text-xl md:text-2xl font-medium text-space-text">
                Upcoming Directions & Systems Stack
              </h3>
            </div>
            <p className="font-body text-xs md:text-sm text-space-muted max-w-xl leading-relaxed">
              Building toward the engineering stack behind quantitative research, market-data systems, and eventually low-latency financial infrastructure.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXPLORING_NEXT.map((item) => (
              <span
                key={item.name}
                title={item.note}
                className="font-mono text-xs px-2.5 py-1 rounded-full bg-space-surface-2 text-space-warm border border-space-warm/30 cursor-help transition-colors hover:border-space-warm"
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>

        {/* Supplementary 3D Radial Constellation View (lazy loaded) */}
        <Suspense
          fallback={
            <div className="mt-14 h-72 rounded-2xl bg-space-surface border border-space-surface-2 flex items-center justify-center">
              <div className="font-mono text-xs text-space-muted flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-space-accent animate-ping" />
                Initializing 3D constellation...
              </div>
            </div>
          }
        >
          <SkillsConstellation
            skillsData={SKILLS_DATA}
            skillDescriptions={SKILL_DESCRIPTIONS}
            containerRef={sectionRef}
          />
        </Suspense>

        <p className="text-center font-mono text-xs text-space-muted/70 mt-6">
          Currently exploring the intersection of software, data, AI, and quantitative systems.
        </p>
      </div>
    </section>
  )
}
