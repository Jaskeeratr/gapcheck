import { MetricCounter, MotionCard, Reveal, Stagger } from "../components/motion";

const githubUrl = (import.meta.env.VITE_GITHUB_URL as string | undefined) || "https://github.com/";
const liveDemoUrl = (import.meta.env.VITE_LIVE_DEMO_URL as string | undefined) || "/";

const features = [
  {
    title: "Resume Parsing",
    text: "Turns a PDF resume into editable structured data: skills, projects, experience, education, and target keywords.",
  },
  {
    title: "Match Scoring",
    text: "Compares a candidate profile against job requirements with weighted compatibility dimensions.",
  },
  {
    title: "Gap Analysis",
    text: "Shows missing skills, weak evidence areas, and role-specific improvement opportunities.",
  },
  {
    title: "Project Recommendations",
    text: "Suggests practical portfolio projects that close missing-skill gaps and improve recruiter signal.",
  },
  {
    title: "Job Intelligence",
    text: "Ingests and normalizes job listings so candidates can search, filter, score, and track roles in one place.",
  },
];

const metrics = [
  { label: "Jobs analyzed", value: "300+", detail: "searchable roles per refresh" },
  { label: "Skills tracked", value: "50+", detail: "technical and soft-skill categories" },
  { label: "Recommendation categories", value: "5", detail: "backend, frontend, data, cloud, devops" },
];

const screenshots = ["Dashboard overview", "Resume parsing workspace", "Job match breakdown", "Project recommendation cards"];
const architectureLayers = ["React + TypeScript", "FastAPI", "PostgreSQL", "Claude API", "Job Adapters", "Recommendation Engine"];

export default function AboutGapCheckPage() {
  return (
    <div className="space-y-6">
      <Reveal>
        <section className="gc-panel-strong overflow-hidden rounded-3xl p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <Reveal delay={0.06}>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-700">GapCheck Platform</p>
                <h1 className="gc-text-gradient mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
                  AI-Powered Career Intelligence Platform
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                  Analyze resumes, understand skill gaps, and receive personalized project recommendations.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <a href="/" className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:from-blue-800 hover:to-cyan-700">
                    Enter App
                  </a>
                  <a href="/case-study/gapcheck" className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-100">
                    View Case Study
                  </a>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.14}>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="rounded-2xl bg-slate-950 p-5 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Recruiter Signal</p>
                  <p className="mt-4 text-3xl font-black">From resume to action plan</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    GapCheck makes the candidate evaluation workflow visible: what matches, what is missing, and what to build next.
                  </p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xl font-black text-slate-950"><MetricCounter value={metric.value} /></p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </Reveal>

      <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {features.map((feature) => (
          <MotionCard key={feature.title} className="gc-panel rounded-3xl p-5">
            <div className="mb-4 h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-500 shadow-sm shadow-blue-100" />
            <h2 className="text-base font-bold text-slate-950">{feature.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{feature.text}</p>
          </MotionCard>
        ))}
      </Stagger>

      <Reveal>
        <section className="gc-panel rounded-3xl p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Metrics</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Built to explain fit, not just list jobs</h2>
            </div>
          </div>
          <Stagger className="mt-5 grid gap-4 md:grid-cols-3">
            {metrics.map((metric) => (
              <MotionCard key={metric.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-3xl font-black text-slate-950"><MetricCounter value={metric.value} /></p>
                <p className="mt-2 text-sm font-bold text-slate-700">{metric.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{metric.detail}</p>
              </MotionCard>
            ))}
          </Stagger>
        </section>
      </Reveal>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <article className="gc-panel rounded-3xl p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Architecture Preview</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Production-style full-stack architecture</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              The system separates frontend presentation, backend orchestration, persistence, AI parsing, job ingestion, and recommendation generation.
            </p>
            <Stagger className="mt-5 grid gap-2 sm:grid-cols-2">
              {architectureLayers.map((layer) => (
                <MotionCard key={layer} className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 text-sm font-bold text-blue-900">
                  {layer}
                </MotionCard>
              ))}
            </Stagger>
          </article>
        </Reveal>

        <Reveal delay={0.08}>
          <article className="gc-panel rounded-3xl p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Screenshots Carousel</p>
            <Stagger className="mt-4 flex snap-x gap-4 overflow-x-auto pb-2">
              {screenshots.map((screenshot) => (
                <MotionCard key={screenshot} className="min-w-[260px] snap-start rounded-2xl border border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 sm:min-w-[320px]">
                  <div className="flex h-44 items-center justify-center rounded-xl border border-white/70 bg-white/75 text-center text-sm font-bold text-slate-500 shadow-sm">
                    {screenshot}
                  </div>
                </MotionCard>
              ))}
            </Stagger>
          </article>
        </Reveal>
      </section>

      <Reveal>
        <section className="gc-panel-strong rounded-3xl p-6 sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Next Step</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">See how GapCheck was built</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Review the case study, inspect the code, or open the live demo to evaluate the product from a recruiter perspective.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/case-study/gapcheck" className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-5 py-3 text-sm font-bold text-white transition hover:from-blue-800 hover:to-cyan-700">Case Study</a>
              <a href={githubUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50">GitHub</a>
              <a href={liveDemoUrl} className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-100">Live Demo</a>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
