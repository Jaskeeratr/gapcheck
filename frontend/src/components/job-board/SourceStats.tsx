import { memo } from "react";
type SourceStatsProps = {
  sourceCounts: Record<string, number>;
};

const sources = ["greenhouse", "lever", "remotive", "arbeitnow", "remoteok"];

function SourceStats({ sourceCounts }: SourceStatsProps) {
  return (
    <>
      <div className="mb-4 grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-2 lg:grid-cols-5">
        {sources.map((source) => (
          <div key={source} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <span className="capitalize">{source}</span>: {sourceCounts[source] ?? 0}
          </div>
        ))}
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Default view is Calgary/Alberta-first. Switch location focus to Canada + Remote or All Locations when you want a wider board.
      </p>
    </>
  );
}

export default memo(SourceStats);


