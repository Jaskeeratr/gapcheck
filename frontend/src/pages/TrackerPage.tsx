export default function TrackerPage() {
  const columns = [
    { title: "Applied", color: "border-sky-200 bg-sky-50" },
    { title: "Phone Screen", color: "border-violet-200 bg-violet-50" },
    { title: "Interview", color: "border-amber-200 bg-amber-50" },
    { title: "Rejected", color: "border-rose-200 bg-rose-50" },
    { title: "Offer", color: "border-emerald-200 bg-emerald-50" },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Application Tracker</h1>
        <p className="mt-2 text-sm text-slate-600">
          Track each application stage and compare outcomes to your predicted match score.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        {columns.map((column) => (
          <article key={column.title} className={`rounded-2xl border p-4 ${column.color}`}>
            <h2 className="text-sm font-bold text-slate-800">{column.title}</h2>
            <div className="mt-3 space-y-2">
              <div className="rounded-xl border border-white/60 bg-white/80 p-3 text-xs text-slate-500">No items yet</div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
