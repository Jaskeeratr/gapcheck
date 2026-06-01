import JobFilters, { type JobFiltersProps } from "./JobFilters";

export default function JobBoardHero(props: JobFiltersProps) {
  return (
    <section className="gc-panel-strong rounded-3xl p-6">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-700">Calgary Internship Intelligence</p>
      <h1 className="gc-text-gradient mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Find where you are strong, then close the gap fast
      </h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-600 sm:text-base">
        GapCheck surfaces current listings, predicts your match potential, and helps you decide what to apply to first.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1">Multi-source ingest</span>
        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1">Resume-aware scoring</span>
        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1">Keyword targeting</span>
      </div>
      <JobFilters {...props} />
    </section>
  );
}

