export default function JobDetailPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Job Match Breakdown</h1>
        <p className="mt-2 text-sm text-slate-600">
          This screen will show the 5-dimension score plus ranked gaps once you compute a score for a selected role.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
          <h2 className="text-lg font-bold text-slate-900">Score Dimensions</h2>
          <div className="mt-4 space-y-3">
            {["Skills", "Experience", "Education", "Projects", "Domain"].map((label) => (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>{label}</span>
                  <span>--%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900">Verdict</h2>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Awaiting Score</p>
            <p className="mt-2 text-sm text-slate-600">
              Upload your profile, pick a job, and compute score to generate personalized gap analysis.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
