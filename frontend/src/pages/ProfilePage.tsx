export default function ProfilePage() {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
        <h1 className="text-2xl font-bold text-slate-900">Candidate Profile</h1>
        <p className="mt-2 text-sm text-slate-600">
          Upload your PDF resume and validate the extracted skills before scoring.
        </p>

        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">Drop resume PDF here</p>
          <p className="mt-1 text-xs text-slate-500">or click to upload</p>
          <button className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            Upload Resume
          </button>
        </div>
      </section>

      <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h2 className="text-lg font-bold text-slate-900">Profile Health</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li className="rounded-lg bg-slate-50 p-3">Skills parsed: --</li>
          <li className="rounded-lg bg-slate-50 p-3">Projects parsed: --</li>
          <li className="rounded-lg bg-slate-50 p-3">Domains inferred: --</li>
        </ul>
      </aside>
    </div>
  );
}
