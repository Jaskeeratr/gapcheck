import type { Dispatch, SetStateAction } from "react";

export type LocationFocus = "calgary_ab" | "canada_remote" | "remote" | "all";
export type SourceFilter = "all" | "baseline_seed" | "greenhouse" | "lever" | "remotive" | "arbeitnow" | "remoteok" | "indeed" | "linkedin" | "ucalgary";

export type JobFiltersProps = {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  domainFilter: string;
  setDomainFilter: Dispatch<SetStateAction<string>>;
  domainOptions: string[];
  locationFocus: LocationFocus;
  setLocationFocus: Dispatch<SetStateAction<LocationFocus>>;
  sourceFilter: SourceFilter;
  setSourceFilter: Dispatch<SetStateAction<SourceFilter>>;
  includeBaseline: boolean;
  setIncludeBaseline: Dispatch<SetStateAction<boolean>>;
  hasResumeProfile: boolean;
  profileKeywords: string[];
  useProfileKeywords: boolean;
  setUseProfileKeywords: Dispatch<SetStateAction<boolean>>;
  ingesting: boolean;
  lastRefreshedAt: string | null;
  onRefreshLiveJobs: () => void;
};

export default function JobFilters({
  query,
  setQuery,
  domainFilter,
  setDomainFilter,
  domainOptions,
  locationFocus,
  setLocationFocus,
  sourceFilter,
  setSourceFilter,
  includeBaseline,
  setIncludeBaseline,
  hasResumeProfile,
  profileKeywords,
  useProfileKeywords,
  setUseProfileKeywords,
  ingesting,
  lastRefreshedAt,
  onRefreshLiveJobs,
}: JobFiltersProps) {
  return (
    <>
      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_190px_190px_190px_auto]">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search title, company, skills, description</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ex: marketing, finance, react, sales"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-blue-200 transition placeholder:text-slate-400 focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Location Focus</span>
          <select value={locationFocus} onChange={(event) => setLocationFocus(event.target.value as LocationFocus)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring-2">
            <option value="calgary_ab">Calgary / Alberta</option>
            <option value="canada_remote">Canada + Remote</option>
            <option value="remote">Remote Only</option>
            <option value="all">All Locations</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Job Family</span>
          <select value={domainFilter} onChange={(event) => setDomainFilter(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring-2">
            <option value="all">All Job Families</option>
            {domainOptions.map((domain) => (
              <option key={domain} value={domain.toLowerCase()}>{domain}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Source</span>
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as SourceFilter)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring-2">
            <option value="all">All Sources</option>
            <option value="baseline_seed">Baseline Roles</option>
            <option value="greenhouse">Greenhouse</option>
            <option value="lever">Lever</option>
            <option value="remotive">Remotive</option>
            <option value="arbeitnow">Arbeitnow</option>
            <option value="remoteok">RemoteOK</option>
            <option value="indeed">Indeed</option>
            <option value="linkedin">LinkedIn</option>
            <option value="ucalgary">UCalgary</option>
          </select>
        </label>

        <div className="flex flex-col justify-end gap-2">
          <button onClick={onRefreshLiveJobs} disabled={ingesting} className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-blue-800 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-60">
            {ingesting ? "Refreshing..." : "Refresh Live Jobs"}
          </button>
          {lastRefreshedAt ? <p className="text-right text-[11px] font-medium text-slate-500">Last refresh {new Date(lastRefreshedAt).toLocaleTimeString()}</p> : null}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input id="include-baseline" type="checkbox" checked={includeBaseline} onChange={(event) => setIncludeBaseline(event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
        <label htmlFor="include-baseline" className="text-sm text-slate-600">Include baseline benchmark roles</label>
      </div>

      {hasResumeProfile ? (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <input id="use-profile-keywords" type="checkbox" checked={useProfileKeywords} onChange={(event) => setUseProfileKeywords(event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            <label htmlFor="use-profile-keywords" className="text-sm text-slate-600">Use profile keywords to personalize listings</label>
          </div>
          {profileKeywords.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {profileKeywords.slice(0, 10).map((keyword) => (
                <span key={keyword} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{keyword}</span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">Add domains/skills on the Resume page to drive keyword targeting.</p>
          )}
        </div>
      ) : null}
    </>
  );
}

