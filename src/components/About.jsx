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

        {/* 
          TODO FOR YASH:
          Rewrite this placeholder section with your personal bio, real background,
          and exact journey. Do not invent unverified biographical claims.
        */}
        <div className="space-y-6 font-body text-space-muted text-base md:text-lg leading-relaxed">
          <p>
            I am a CSE and IoT engineering student at Government Engineering College (GEC)
            Patan, affiliated with Gujarat Technological University (GTU).
          </p>
          <p>
            My current focus is at the intersection of automation architectures, market
            microstructure, and quantitative modeling — exploring order-flow forecasting and
            resilient data pipelines.
          </p>
          <p>
            I build practical software, intelligent workflows, and automated tools designed
            to bridge complex backend systems with clean, responsive user experiences.
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
            <span className="text-space-text">CSE & IoT Engineering</span>
          </div>
          <div className="p-4 rounded-xl bg-space-surface border border-space-surface-2">
            <span className="text-space-accent block text-xs uppercase mb-1">Current Focus</span>
            <span className="text-space-text">Automation & Quant Systems</span>
          </div>
        </div>
      </div>
    </section>
  )
}
