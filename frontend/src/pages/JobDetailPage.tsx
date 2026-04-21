import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "../api/client";
import type { Job } from "../types/job";

type DevUser = {
  id: string;
};

type GapItem = {
  gap: string;
  impact: "high" | "medium" | "low" | string;
  score_lost: number;
  fix: string;
  timeframe: string;
};

type GapAnalysis = {
  verdict?: string;
  verdict_explanation?: string;
  gaps?: GapItem[];
  strengths?: string[];
  company_insight?: string;
  apply_recommendation?: boolean;
  resume_tip?: string;
  resume_baseline_score?: number;
  role_match_score?: number;
};

type ScoreResponse = {
  overall_score: number;
  skills_score: number;
  experience_score: number;
  education_score: number;
  project_score: number;
  domain_score: number;
  gap_analysis?: GapAnalysis | null;
};

function verdictStyle(verdict?: string): { label: string; className: string } {
  if (verdict === "strong_match") return { label: "Strong Match", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (verdict === "close_miss") return { label: "Close Miss", className: "bg-amber-50 text-amber-800 border-amber-200" };
  if (verdict === "significant_gap") return { label: "Significant Gap", className: "bg-orange-50 text-orange-700 border-orange-200" };
  if (verdict === "not_a_fit") return { label: "Not a Fit", className: "bg-rose-50 text-rose-700 border-rose-200" };
  return { label: "Awaiting Score", className: "bg-slate-100 text-slate-700 border-slate-200" };
}

function barColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 65) return "bg-lime-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

function impactClass(impact?: string): string {
  if (impact === "high") return "bg-rose-100 text-rose-700";
  if (impact === "medium") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

export default function JobDetailPage() {
  const { id: jobId } = useParams<{ id: string }>();

  const [userId, setUserId] = useState<string | null>(null);
  const [hasResumeProfile, setHasResumeProfile] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [score, setScore] = useState<ScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      if (!jobId) {
        setError("Job ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const userResponse = await api.post<DevUser>("/users/dev-bootstrap");
        if (cancelled) return;
        const resolvedUserId = userResponse.data.id;
        setUserId(resolvedUserId);

        const jobResponse = await api.get<Job>(`/jobs/${jobId}`);
        if (cancelled) return;
        setJob(jobResponse.data);

        try {
          await api.get(`/resume/${resolvedUserId}`);
          if (cancelled) return;
          setHasResumeProfile(true);

          setComputing(true);
          const scoreResponse = await api.post<ScoreResponse>("/scores/compute", {
            user_id: resolvedUserId,
            job_id: jobId,
          });
          if (!cancelled) {
            setScore(scoreResponse.data);
          }
        } catch (resumeError: unknown) {
          const status = (resumeError as { response?: { status?: number } })?.response?.status;
          if (!cancelled) {
            setHasResumeProfile(false);
            if (status !== 404) {
              setError("Could not verify resume profile.");
            }
          }
        } finally {
          if (!cancelled) {
            setComputing(false);
          }
        }
      } catch {
        if (!cancelled) {
          setError("Could not load job details.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  async function handleRecompute(): Promise<void> {
    if (!userId || !jobId || !hasResumeProfile) return;
    try {
      setComputing(true);
      setError(null);
      const response = await api.post<ScoreResponse>("/scores/compute", {
        user_id: userId,
        job_id: jobId,
        force_recompute: true,
      });
      setScore(response.data);
    } catch {
      setError("Could not recompute score.");
    } finally {
      setComputing(false);
    }
  }

  const verdict = score?.gap_analysis?.verdict;
  const verdictUi = verdictStyle(verdict);
  const dimensions = useMemo(
    () => [
      { label: "Skills", value: score?.skills_score ?? 0 },
      { label: "Experience", value: score?.experience_score ?? 0 },
      { label: "Education", value: score?.education_score ?? 0 },
      { label: "Projects", value: score?.project_score ?? 0 },
      { label: "Domain", value: score?.domain_score ?? 0 },
    ],
    [score],
  );

  const gaps = score?.gap_analysis?.gaps ?? [];
  const strengths = score?.gap_analysis?.strengths ?? [];

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading match details...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{job?.title ?? "Job Match Breakdown"}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {job?.company ?? "Unknown company"}
              {job?.location ? ` - ${job.location}` : ""}
            </p>
          </div>

          {hasResumeProfile ? (
            <button
              onClick={handleRecompute}
              disabled={computing}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {computing ? "Recomputing..." : "Recompute Score"}
            </button>
          ) : null}
        </div>

        {!hasResumeProfile ? (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
            Upload your resume on the <Link to="/profile" className="underline">Resume page</Link> to unlock full verdict analysis.
          </div>
        ) : null}

        {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
          <h2 className="text-lg font-bold text-slate-900">Score Dimensions</h2>
          <div className="mt-4 space-y-3">
            {dimensions.map((dimension) => (
              <div key={dimension.label}>
                <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>{dimension.label}</span>
                  <span>{Math.round(dimension.value)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full ${barColor(dimension.value)}`}
                    style={{ width: `${Math.max(4, Math.min(100, dimension.value))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {score?.gap_analysis?.resume_baseline_score != null ? (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              Resume Baseline Score: <strong>{Math.round(score.gap_analysis.resume_baseline_score)}%</strong> - Role Match Score:{" "}
              <strong>{Math.round(score.gap_analysis.role_match_score ?? 0)}%</strong>
            </div>
          ) : null}
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900">Verdict</h2>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${verdictUi.className}`}>{verdictUi.label}</div>
            <p className="mt-3 text-sm text-slate-700">{score?.gap_analysis?.verdict_explanation ?? "Awaiting profile-linked score."}</p>
            {score ? <p className="mt-2 text-xs font-semibold text-slate-500">Overall Score: {Math.round(score.overall_score)}%</p> : null}
            {score?.gap_analysis?.apply_recommendation != null ? (
              <p className={`mt-3 text-xs font-semibold ${score.gap_analysis.apply_recommendation ? "text-emerald-700" : "text-amber-700"}`}>
                {score.gap_analysis.apply_recommendation ? "Apply Recommendation: Yes" : "Apply Recommendation: Improve first"}
              </p>
            ) : null}
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">What Needs Work</h2>
          <div className="mt-4 space-y-3">
            {gaps.length === 0 ? (
              <p className="text-sm text-slate-600">No gaps available yet.</p>
            ) : (
              gaps.map((gap, index) => (
                <div key={`${gap.gap}-${index}`} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{gap.gap}</p>
                    <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${impactClass(gap.impact)}`}>{gap.impact}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">Score impact: {gap.score_lost}</p>
                  <p className="mt-2 text-sm text-slate-700">{gap.fix}</p>
                  <p className="mt-1 text-xs text-slate-500">Timeframe: {gap.timeframe}</p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">What Matches Well</h2>
          <ul className="mt-4 space-y-2">
            {strengths.length === 0 ? (
              <li className="text-sm text-slate-600">Strengths will appear after scoring.</li>
            ) : (
              strengths.map((strength, index) => (
                <li key={`${strength}-${index}`} className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {strength}
                </li>
              ))
            )}
          </ul>

          {score?.gap_analysis?.company_insight ? (
            <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Company Insight</p>
              <p className="mt-2 text-sm text-indigo-900">{score.gap_analysis.company_insight}</p>
            </div>
          ) : null}

          {score?.gap_analysis?.resume_tip ? (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Resume Tip</p>
              <p className="mt-2 text-sm text-blue-900">{score.gap_analysis.resume_tip}</p>
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}
