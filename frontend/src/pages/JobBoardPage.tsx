import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import { api } from "../api/client";
import JobBoardHero from "../components/job-board/JobBoardHero";
import JobGrid from "../components/job-board/JobGrid";
import RecommendationTabs from "../components/job-board/RecommendationTabs";
import SourceStats from "../components/job-board/SourceStats";
import type { LocationFocus, SourceFilter } from "../components/job-board/JobFilters";
import type { Application } from "../types/application";
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

type DevUser = { id: string };

type CandidateProfile = {
  skills?: string[] | null;
  domains?: string[] | null;
};

type IngestStats = {
  fetched: number;
  upserted?: number;
  inserted: number;
  updated: number;
  greenhouse_fetched?: number;
  lever_fetched?: number;
  remotive_fetched?: number;
  arbeitnow_fetched?: number;
  remoteok_fetched?: number;
  source_errors?: Record<string, string>;
};

type ScoreResponse = {
  overall_score: number;
  gap_analysis?: { verdict?: string } | null;
};

type ScoreBadge = {
  label: string;
  className: string;
  score?: number;
};

type RecommendationView = "recommended" | "close" | "reach" | "all";

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
  const [domainFilter, setDomainFilter] = useState("all");
  const [locationFocus, setLocationFocus] = useState<LocationFocus>("calgary_ab");
  const [recommendationView, setRecommendationView] = useState<RecommendationView>("recommended");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [includeBaseline, setIncludeBaseline] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [ingestMessage, setIngestMessage] = useState<string | null>(null);
  const [lastIngestStats, setLastIngestStats] = useState<IngestStats | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasResumeProfile, setHasResumeProfile] = useState(false);
  const [profileKeywords, setProfileKeywords] = useState<string[]>([]);
  const [useProfileKeywords, setUseProfileKeywords] = useState(true);
  const [scoreByJobId, setScoreByJobId] = useState<Record<string, ScoreBadge>>({});
  const [scoringInProgress, setScoringInProgress] = useState(false);
  const [trackedJobIds, setTrackedJobIds] = useState<Set<string>>(new Set());
  const [trackingJobIds, setTrackingJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function bootstrapUserAndProfile(): Promise<void> {
      try {
        const userResponse = await api.post<DevUser>("/users/dev-bootstrap");
        const id = userResponse.data.id;
        if (cancelled) return;
        setUserId(id);

        try {
          const profileResponse = await api.get<CandidateProfile>(`/resume/${id}`);
          if (!cancelled) {
            setHasResumeProfile(true);
            const rawTerms = [...(profileResponse.data.domains ?? []), ...(profileResponse.data.skills ?? [])];
            setProfileKeywords(Array.from(new Set(rawTerms.map((value) => value.trim()).filter(Boolean))));
          }
        } catch (error: unknown) {
          const status = (error as { response?: { status?: number } })?.response?.status;
          if (!cancelled && status === 404) {
            setHasResumeProfile(false);
            setProfileKeywords([]);
          }
        }
      } catch {
        if (!cancelled) setApiError("Could not initialize user session from backend.");
      }
    }

    bootstrapUserAndProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadJobs(): Promise<void> {
      try {
        setLoading(true);
        setApiError(null);
        const response = await api.get<Job[]>("/jobs", {
          params: {
            limit: 300,
            is_active: true,
            include_baseline: includeBaseline,
            location_focus: locationFocus,
            user_id: userId ?? undefined,
            use_profile_keywords: Boolean(userId && useProfileKeywords && profileKeywords.length > 0),
          },
        });
        if (!cancelled) setJobs(response.data);
      } catch {
        if (!cancelled) {
          setApiError("Could not reach backend jobs API. Showing demo jobs for now.");
          setJobs(FALLBACK_JOBS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadJobs();
    return () => {
      cancelled = true;
    };
  }, [includeBaseline, locationFocus, userId, useProfileKeywords, profileKeywords.length]);

  useEffect(() => {
    let cancelled = false;
    async function loadApplications(): Promise<void> {
      if (!userId) return;
      try {
        const response = await api.get<Application[]>(`/applications/user/${userId}`);
        if (!cancelled) setTrackedJobIds(new Set(response.data.map((app) => app.job_id)));
      } catch {
        // Application tracking is secondary to the job board feed.
      }
    }
    loadApplications();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function handleTrackApplication(jobId: string): Promise<void> {
    if (!userId) {
      setApiError("Could not initialize user session from backend.");
      return;
    }

    setTrackingJobIds((prev) => new Set(prev).add(jobId));
    try {
      await api.post<Application>("/applications", {
        user_id: userId,
        job_id: jobId,
        status: "applied",
        notes: "Tracked from GapCheck job board",
      });
      setTrackedJobIds((prev) => new Set(prev).add(jobId));
    } catch (unknownError: unknown) {
      let message = "Could not track this application.";
      if (axios.isAxiosError(unknownError)) {
        const detail = unknownError.response?.data?.detail;
        if (typeof detail === "string" && detail.trim()) message = detail;
      }
      setApiError(message);
    } finally {
      setTrackingJobIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  }

  async function handleRefreshLiveJobs(): Promise<void> {
    try {
      setIngesting(true);
      setApiError(null);
      setIngestMessage(null);
      const token = import.meta.env.VITE_JOB_INGEST_TOKEN as string | undefined;
      const headers = token ? { "x-job-ingest-token": token } : undefined;

      let stats: IngestStats | null = null;
      const candidateCalls: Array<{ route: string; method: "post" | "get" }> = [
        { route: "/jobs/ingest-live", method: "post" },
        { route: "/jobs/ingest-live/", method: "post" },
        { route: "/jobs/ingest-live", method: "get" },
        { route: "/jobs/ingest-live/", method: "get" },
        { route: "/admin/jobs/ingest-live", method: "post" },
        { route: "/admin/jobs/ingest-live/", method: "post" },
        { route: "/admin/jobs/ingest-live", method: "get" },
        { route: "/admin/jobs/ingest-live/", method: "get" },
      ];
      const triedStatuses: string[] = [];

      for (const attempt of candidateCalls) {
        try {
          const response = attempt.method === "post" ? await api.post<IngestStats>(attempt.route, null, { headers }) : await api.get<IngestStats>(attempt.route, { headers });
          stats = response.data;
          break;
        } catch (unknownError: unknown) {
          if (!axios.isAxiosError(unknownError)) throw unknownError;
          const status = unknownError.response?.status;
          triedStatuses.push(`${attempt.method.toUpperCase()} ${attempt.route} -> ${status ?? "ERR"}`);
          if (status === 404 || status === 405 || status === 422 || status === 307 || status === 308) continue;
          throw unknownError;
        }
      }

      if (!stats) throw new Error(`No ingest endpoint accepted this request. Tried: ${triedStatuses.join("; ")}`);

      setIngestMessage(
        `Live ingest complete: fetched ${stats.fetched} (Greenhouse ${stats.greenhouse_fetched ?? 0}, Lever ${stats.lever_fetched ?? 0}, Remotive ${stats.remotive_fetched ?? 0}, Arbeitnow ${stats.arbeitnow_fetched ?? 0}, RemoteOK ${stats.remoteok_fetched ?? 0}). Inserted ${stats.inserted}, updated ${stats.updated}.`,
      );
      setLastIngestStats(stats);
      setLastRefreshedAt(new Date().toISOString());

      const refreshed = await api.get<Job[]>("/jobs", {
        params: { limit: 200, is_active: true, include_baseline: includeBaseline, location_focus: locationFocus },
      });
      setJobs(refreshed.data);
    } catch (unknownError: unknown) {
      let message = "Live ingest failed.";
      if (axios.isAxiosError(unknownError)) {
        const detail = unknownError.response?.data?.detail;
        if (typeof detail === "string" && detail.trim()) message = `Live ingest failed: ${detail}`;
        else if (unknownError.response?.status) message = `Live ingest failed (HTTP ${unknownError.response.status}).`;
      } else if (unknownError instanceof Error && unknownError.message) {
        message = `Live ingest failed: ${unknownError.message}`;
      }
      setApiError(message);
    } finally {
      setIngesting(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function computeScoresForBoard(): Promise<void> {
      if (!userId || !hasResumeProfile || jobs.length === 0) return;

      setScoringInProgress(true);
      const settled = await Promise.allSettled(jobs.map((job) => api.post<ScoreResponse>("/scores/compute", { user_id: userId, job_id: job.id })));
      if (cancelled) return;

      const nextMap: Record<string, ScoreBadge> = {};
      settled.forEach((result, index) => {
        const job = jobs[index];
        if (result.status !== "fulfilled") {
          nextMap[job.id] = unscoredBadge();
          return;
        }
        const data = result.value.data;
        nextMap[job.id] = typeof data.overall_score === "number" ? { ...badgeForScore(data.overall_score), score: data.overall_score } : unscoredBadge();
      });

      setScoreByJobId(nextMap);
      setScoringInProgress(false);
    }

    computeScoresForBoard();
    return () => {
      cancelled = true;
    };
  }, [jobs, userId, hasResumeProfile]);

  const sourceCounts = useMemo(() => jobs.reduce<Record<string, number>>((counts, job) => {
    const key = job.source ?? "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {}), [jobs]);

  const domainOptions = useMemo(() => Array.from(new Set(jobs.map((job) => job.domain).filter((value): value is string => Boolean(value)))).sort(), [jobs]);

  const recommendationCounts = useMemo(() => jobs.reduce(
    (counts, job) => {
      const score = scoreByJobId[job.id]?.score;
      if (typeof score !== "number") {
        counts.all += 1;
        return counts;
      }
      if (score >= 70) counts.recommended += 1;
      else if (score >= 50) counts.close += 1;
      else counts.reach += 1;
      counts.all += 1;
      return counts;
    },
    { recommended: 0, close: 0, reach: 0, all: 0 },
  ), [jobs, scoreByJobId]);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const nextJobs = jobs.filter((job) => {
      if (sourceFilter !== "all" && (job.source ?? "").toLowerCase() !== sourceFilter) return false;
      if (domainFilter !== "all" && (job.domain ?? "").toLowerCase() !== domainFilter) return false;
      if (!normalizedQuery) return true;
      return [job.title, job.company, job.domain, job.description, job.role_type].some((value) => (value ?? "").toLowerCase().includes(normalizedQuery));
    });

    const filteredByRecommendation = nextJobs.filter((job) => {
      const score = scoreByJobId[job.id]?.score;
      if (!hasResumeProfile || recommendationView === "all" || typeof score !== "number") return true;
      if (recommendationView === "recommended") return score >= 70;
      if (recommendationView === "close") return score >= 50 && score < 70;
      return score < 50;
    });

    return [...filteredByRecommendation].sort((a, b) => {
      const scoreA = scoreByJobId[a.id]?.score ?? -1;
      const scoreB = scoreByJobId[b.id]?.score ?? -1;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime();
    });
  }, [jobs, query, sourceFilter, domainFilter, scoreByJobId, hasResumeProfile, recommendationView]);

  return (
    <div className="space-y-6">
      <JobBoardHero
        query={query}
        setQuery={setQuery}
        domainFilter={domainFilter}
        setDomainFilter={setDomainFilter}
        domainOptions={domainOptions}
        locationFocus={locationFocus}
        setLocationFocus={setLocationFocus}
        sourceFilter={sourceFilter}
        setSourceFilter={setSourceFilter}
        includeBaseline={includeBaseline}
        setIncludeBaseline={setIncludeBaseline}
        hasResumeProfile={hasResumeProfile}
        profileKeywords={profileKeywords}
        useProfileKeywords={useProfileKeywords}
        setUseProfileKeywords={setUseProfileKeywords}
        ingesting={ingesting}
        lastRefreshedAt={lastRefreshedAt}
        onRefreshLiveJobs={handleRefreshLiveJobs}
      />

      <section className="gc-panel rounded-3xl p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">Job Board</h2>
          <p className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-600">{filteredJobs.length} active roles</p>
        </div>

        <RecommendationTabs recommendationView={recommendationView} setRecommendationView={setRecommendationView} recommendationCounts={recommendationCounts} />
        <SourceStats sourceCounts={sourceCounts} />

        {!hasResumeProfile ? (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
            Upload your resume on the <Link to="/profile" className="underline decoration-2 underline-offset-2">Resume page</Link> to unlock full multi-level scoring.
          </div>
        ) : null}

        {apiError ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">{apiError}</div> : null}
        {ingestMessage ? (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {ingestMessage}
            {lastIngestStats?.source_errors && Object.keys(lastIngestStats.source_errors).length > 0 ? <p className="mt-2 text-xs text-emerald-900">Some sources returned errors. Check backend logs before relying on source coverage.</p> : null}
          </div>
        ) : null}

        <JobGrid
          loading={loading}
          jobs={filteredJobs}
          hasResumeProfile={hasResumeProfile}
          scoringInProgress={scoringInProgress}
          scoreByJobId={scoreByJobId}
          profileKeywords={profileKeywords}
          trackedJobIds={trackedJobIds}
          trackingJobIds={trackingJobIds}
          onTrack={handleTrackApplication}
        />
      </section>
    </div>
  );
}

