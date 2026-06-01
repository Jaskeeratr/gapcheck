type ParseQualityItem = {
  label: string;
  value: number;
  ready: boolean;
};

type ProfileHealthPanelProps = {
  profileCompleteness: number;
  parseQualityItems: ParseQualityItem[];
  hasEducation: boolean;
};

export default function ProfileHealthPanel({ profileCompleteness, parseQualityItems, hasEducation }: ProfileHealthPanelProps) {
  return (
    <aside className="gc-panel rounded-3xl p-6 lg:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Profile Health</h2>
          <p className="mt-1 text-xs text-slate-500">How much usable scoring data GapCheck has from your resume.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-black text-blue-700">{profileCompleteness}%</span>
      </div>

      <div className="mt-5 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-gradient-to-r from-blue-700 to-cyan-500" style={{ width: `${profileCompleteness}%` }} />
      </div>

      <ul className="mt-5 space-y-3 text-sm text-slate-600">
        {parseQualityItems.map((item) => (
          <li key={item.label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
            <span className="font-semibold text-slate-700">{item.label}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.ready ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{item.value}</span>
          </li>
        ))}
        <li className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
          <span className="font-semibold text-slate-700">Education</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${hasEducation ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{hasEducation ? "Ready" : "Missing"}</span>
        </li>
      </ul>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-bold text-blue-950">Recommended workflow</p>
        <ol className="mt-3 space-y-2 text-xs leading-relaxed text-blue-900">
          <li>1. Upload or replace your PDF resume.</li>
          <li>2. Review parsed data and fix anything the parser missed.</li>
          <li>3. Use Job Keywords to control which roles the board prioritizes.</li>
        </ol>
      </div>
    </aside>
  );
}

