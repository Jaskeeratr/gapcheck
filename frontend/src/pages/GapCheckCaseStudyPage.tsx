const githubUrl = (import.meta.env.VITE_GITHUB_URL as string | undefined) || "https://github.com/";
const liveDemoUrl = (import.meta.env.VITE_LIVE_DEMO_URL as string | undefined) || "/";

const caseSections = [
  {
    title: "Problem",
    text: "Students and early-career candidates often apply without knowing whether a role is actually aligned with their resume. Generic job boards show listings, but they do not explain the gap between a candidate profile and a job description.",
  },
  {
    title: "Solution",
    text: "GapCheck turns a resume into structured profile data, ingests job listings, scores fit across multiple dimensions, and recommends portfolio projects that directly address missing skills.",
  },
  {
    title: "Results",
    text: "The product gives candidates a fast, recruiter-readable view of strengths, missing skills, match reasoning, application tracking, and next projects to build before applying.",
  },
];

const coreFeatures = [
  "PDF resume upload with backend parsing",
  "Editable structured resume profile",
  "Multi-source job ingestion pipeline",
  "Weighted match scoring by skills, projects, domain, education, and experience",
  "Explainable verdicts and gap analysis",
  "Project recommendations based on missing skills",
  "Application tracker for follow-through",
];

const ownership = [
  "Resume parsing",
  "Match scoring",
  "Recommendation engine",
  "Job ingestion",
  "Frontend UI",
  "Database design",
];

const pipelineSteps = [
  { title: "Resume Parsing", text: "Extracts skills, projects, experience, education, and target keywords from uploaded PDFs." },
  { title: "Job Analysis", text: "Normalizes role requirements from ingested listings into comparable skill and domain signals." },
  { title: "Match Scoring", text: "Computes a compatibility score and verdict using weighted profile-to-role dimensions." },
  { title: "Gap Recommendations", text: "Groups missing skills into practical project recommendations candidates can build." },
];

const screenshotPlaceholders = ["Dashboard screenshot", "Resume parsing screenshot", "Job detail screenshot", "Recommendation screenshot"];
const architectureNodes = ["Frontend", "FastAPI backend", "PostgreSQL", "Claude API", "Airflow", "Recommendation Engine"];

function PlaceholderCard({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-5 text-center">
      <div className="mx-auto flex h-36 items-center justify-center rounded-xl border border-white/70 bg-white/70 text-sm font-bold text-slate-500 shadow-sm">
        {title}
      </div>
      <p className="mt-3 text-xs text-slate-500">Replace with a real product screenshot before sharing broadly.</p>
    </div>
  );
}

export default function GapCheckCaseStudyPage() {
  return (
    <div className="space-y-6">
      <section className="gc-panel-strong overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-700">Project Case Study</p>
            <h1 className="gc-text-gradient mt-3 text-4xl font-black tracking-tight sm:text-5xl">GapCheck</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              An AI-powered career intelligence platform that parses resumes, analyzes job listings, explains match quality, and recommends targeted portfolio projects.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={githubUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-50">GitHub</a>
              <a href={liveDemoUrl} className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:from-blue-800 hover:to-cyan-700">Live Demo</a>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-900">Recruiter 60-second summary</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><strong className="text-slate-950">Problem:</strong> candidates need actionable fit analysis, not just job listings.</li>
              <li><strong className="text-slate-950">Built:</strong> resume parser, scoring engine, ingestion pipeline, tracker, and recommendations.</li>
              <li><strong className="text-slate-950">Stack:</strong> React, TypeScript, FastAPI, PostgreSQL, SQLAlchemy, Alembic, Claude API.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {caseSections.map((section) => (
          <article key={section.title} className="gc-panel rounded-3xl p-5">
            <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{section.text}</p>
          </article>
        ))}
      </section>

      <section className="gc-panel rounded-3xl p-6">
        <h2 className="text-xl font-bold text-slate-900">Architecture</h2>
        <p className="mt-2 text-sm text-slate-600">High-level system map showing how product, AI, ingestion, and persistence layers connect.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          {architectureNodes.map((node) => (
            <div key={node} className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-5 text-center text-sm font-bold text-blue-900">{node}</div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
          Architecture diagram placeholder: connect Frontend to FastAPI backend to PostgreSQL, Claude API, Airflow scheduler, and Recommendation Engine.
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="gc-panel rounded-3xl p-6">
          <h2 className="text-xl font-bold text-slate-900">Core Features</h2>
          <div className="mt-4 grid gap-2">
            {coreFeatures.map((feature) => (
              <div key={feature} className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">{feature}</div>
            ))}
          </div>
        </article>
        <article className="gc-panel rounded-3xl p-6">
          <h2 className="text-xl font-bold text-slate-900">What I Built</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {ownership.map((item) => (
              <div key={item} className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-900">{item}</div>
            ))}
          </div>
        </article>
      </section>

      <section className="gc-panel rounded-3xl p-6">
        <h2 className="text-xl font-bold text-slate-900">AI Pipeline</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {pipelineSteps.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-700 to-cyan-600 text-sm font-black text-white">{index + 1}</span>
              <h3 className="mt-4 text-sm font-bold text-slate-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="gc-panel rounded-3xl p-6">
          <h2 className="text-xl font-bold text-slate-900">Job Ingestion Pipeline</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">Adapter-based ingestion pulls postings from supported sources, normalizes them into the job schema, and upserts active listings into PostgreSQL so the board can refresh without duplicating roles.</p>
        </article>
        <article className="gc-panel rounded-3xl p-6">
          <h2 className="text-xl font-bold text-slate-900">Match Scoring System</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">The scoring layer compares parsed candidate data to normalized role requirements and returns a weighted compatibility score with a verdict, strengths, missing skills, and improvement guidance.</p>
        </article>
        <article className="gc-panel rounded-3xl p-6">
          <h2 className="text-xl font-bold text-slate-900">Project Recommendation Engine</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">Missing skills are grouped into realistic portfolio projects with difficulty, timeline, recruiter impact, tech stack, and a rationale for why the project closes the gap.</p>
        </article>
        <article className="gc-panel rounded-3xl p-6">
          <h2 className="text-xl font-bold text-slate-900">Technical Challenges</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">The hardest parts were keeping resume parsing human-editable, avoiding brittle score explanations, normalizing inconsistent job source data, and making AI outputs structured enough for production UI.</p>
        </article>
      </section>

      <section className="gc-panel rounded-3xl p-6">
        <h2 className="text-xl font-bold text-slate-900">Screenshots</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {screenshotPlaceholders.map((title) => <PlaceholderCard key={title} title={title} />)}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="gc-panel rounded-3xl p-6">
          <h2 className="text-xl font-bold text-slate-900">Tradeoffs</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">The project favors explainable deterministic scoring around structured resume data while using AI for parsing and narrative analysis. That keeps user-facing scores stable and makes the AI layer easier to audit.</p>
        </article>
        <article className="gc-panel rounded-3xl p-6">
          <h2 className="text-xl font-bold text-slate-900">Future Improvements</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">Next steps include authenticated user accounts, richer job source coverage, scheduled ingestion, real screenshot assets, recruiter-mode sharing, and analytics for which recommendations improve score most.</p>
        </article>
      </section>
    </div>
  );
}

