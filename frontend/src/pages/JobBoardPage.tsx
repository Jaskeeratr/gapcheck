import { useEffect, useMemo, useState } from "react";

import { api } from "../api/client";
import JobCard from "../components/JobCard";
import type { Job } from "../types/job";

const FALLBACK_JOBS: Job[] = [
  {
    id: "demo-1",
    source: "indeed",
    external_id: "demo-1",
    title: "Data Analyst Intern",
    company: "Suncor Energy",
    location: "Calgary, AB",
    description: "SQL, Python, and dashboarding exposure for weekly operations analytics.",
    required_skills: [{ skill: "SQL", weight: 0.4 }, { skill: "Python", weight: 0.35 }, { skill: "Power BI", weight: 0.25 }],
    experience_required: 1,
    role_type: "internship",
    domain: "data analytics",
    posted_at: new Date().toISOString(),
    scraped_at: new Date().toISOString(),
    is_active: true,
  },
  {
    id: "demo-2",
    source: "ucalgary",
    external_id: "demo-2",
    title: "Software Engineering Co-op",
    company: "Benevity",
    location: "Calgary, AB",
    description: "React, TypeScript, and backend service integration for product teams.",
    required_skills: [{ skill: "React", weight: 0.4 }, { skill: "TypeScript", weight: 0.3 }, { skill: "SQL", weight: 0.3 }],
    experience_required: 0.5,
    role_type: "co-op",
    domain: "web development",
    posted_at: new Date().toISOString(),
    scraped_at: new Date().toISOString(),
    is_active: true,
  },
];

export default function JobBoardPage() {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "indeed" | "linkedin" | "ucalgary">("all");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadJobs(): Promise<void> {
      try {
        setLoading(true);
        setApiError(null);
        const response = await api.get<Job[]>("/jobs", { params: { limit: 200, is_active: true } });
        if (!cancelled) {
          setJobs(response.data);
        }
      } catch {
        if (!cancelled) {
          setApiError("Could not reach backend jobs API. Showing demo jobs for now.");
          setJobs(FALLBACK_JOBS);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadJobs();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const sourceMatches = sourceFilter === "all" || (job.source ?? "").toLowerCase() === sourceFilter;
      if (!sourceMatches) return false;

      if (!normalizedQuery) return true;
      const title = job.title.toLowerCase();
      const company = job.company.toLowerCase();
      const domain = (job.domain ?? "").toLowerCase();
      return title.includes(normalizedQuery) || company.includes(normalizedQuery) || domain.includes(normalizedQuery);
    });
  }, [jobs, query, sourceFilter]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-700">Calgary Internship Intelligence</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Find where you are strong, then close the gap fast
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600 sm:text-base">
          GapCheck surfaces current listings, predicts your match potential, and helps you decide what to apply to first.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search title, company, domain</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ex: data analyst, react, suncor"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-blue-200 transition placeholder:text-slate-400 focus:ring-2"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Source</span>
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value as "all" | "indeed" | "linkedin" | "ucalgary")}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring-2"
            >
              <option value="all">All Sources</option>
              <option value="indeed">Indeed</option>
              <option value="linkedin">LinkedIn</option>
              <option value="ucalgary">UCalgary</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">Job Board</h2>
          <p className="text-sm font-medium text-slate-500">{filteredJobs.length} active roles</p>
        </div>

        {apiError ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            {apiError}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((key) => (
              <div key={key} className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm font-medium text-slate-700">No jobs matched that filter. Try a wider search.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
