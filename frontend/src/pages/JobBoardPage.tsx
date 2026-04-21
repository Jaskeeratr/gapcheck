import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

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

type DevUser = {
  id: string;
};

type ScoreResponse = {
  overall_score: number;
  gap_analysis?: {
    verdict?: string;
  } | null;
};

type ScoreBadge = {
  label: string;
  className: string;
};

function badgeForScore(overallScore: number): ScoreBadge {
  if (overallScore >= 90) return { label: "Elite Match", className: "bg-emerald-100 text-emerald-800 border-emerald-300" };
  if (overallScore >= 80) return { label: "Strong Match", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (overallScore >= 70) return { label: "Competitive", className: "bg-lime-50 text-lime-700 border-lime-200" };
  if (overallScore >= 60) return { label: "Promising", className: "bg-amber-50 text-amber-800 border-amber-200" };
  if (overallScore >= 50) return { label: "Developing", className: "bg-orange-50 text-orange-700 border-orange-200" };
  if (overallScore >= 35) return { label: "Reach", className: "bg-rose-50 text-rose-700 border-rose-200" };
  return { label: "Low Fit", className: "bg-rose-100 text-rose-800 border-rose-300" };
}

function unscoredBadge(): ScoreBadge {
  return { label: "Unscored", className: "bg-slate-100 text-slate-700 border-slate-200" };
}

export default function JobBoardPage() {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "indeed" | "linkedin" | "ucalgary">("all");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasResumeProfile, setHasResumeProfile] = useState(false);
  const [scoreByJobId, setScoreByJobId] = useState<Record<string, ScoreBadge>>({});
  const [scoringInProgress, setScoringInProgress] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapUserAndProfile(): Promise<void> {
      try {
        const userResponse = await api.post<DevUser>("/users/dev-bootstrap");
        const id = userResponse.data.id;
        if (cancelled) return;
        setUserId(id);

        try {
          await api.get(`/resume/${id}`);
          if (!cancelled) {
            setHasResumeProfile(true);
          }
        } catch (error: unknown) {
          const status = (error as { response?: { status?: number } })?.response?.status;
          if (!cancelled && status === 404) {
            setHasResumeProfile(false);
          }
        }
      } catch {
        if (!cancelled) {
          setApiError("Could not initialize user session from backend.");
        }
      }
    }

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

    bootstrapUserAndProfile();
    loadJobs();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function computeScoresForBoard(): Promise<void> {
      if (!userId || !hasResumeProfile || jobs.length === 0) {
        return;
      }

      setScoringInProgress(true);
      const subset = jobs;
      const settled = await Promise.allSettled(
        subset.map((job) =>
          api.post<ScoreResponse>("/scores/compute", {
            user_id: userId,
            job_id: job.id,
          }),
        ),
      );

      if (cancelled) return;

      const nextMap: Record<string, ScoreBadge> = {};
      settled.forEach((result, index) => {
        const job = subset[index];
        if (result.status !== "fulfilled") {
          nextMap[job.id] = unscoredBadge();
          return;
        }
        const data = result.value.data;
        if (typeof data.overall_score === "number") {
          nextMap[job.id] = badgeForScore(data.overall_score);
        } else {
          nextMap[job.id] = unscoredBadge();
        }
      });

      setScoreByJobId(nextMap);
      setScoringInProgress(false);
    }

    computeScoresForBoard();
    return () => {
      cancelled = true;
    };
  }, [jobs, userId, hasResumeProfile]);

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

        {!hasResumeProfile ? (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
            Upload your resume on the{" "}
            <Link to="/profile" className="underline decoration-2 underline-offset-2">
              Resume page
            </Link>{" "}
            to unlock full multi-level scoring.
          </div>
        ) : null}

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
              <JobCard
                key={job.id}
                job={job}
                scoreLocked={!hasResumeProfile}
                scoring={hasResumeProfile && scoringInProgress && !scoreByJobId[job.id]}
                matchLabel={scoreByJobId[job.id]?.label}
                matchClassName={scoreByJobId[job.id]?.className}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
