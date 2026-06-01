import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

import { api } from "../api/client";
import type { Application } from "../types/application";
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

type MissingSkill = {
  name: string;
  category: string;
  confidence: number;
};

type ProjectRecommendation = {
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | string;
  estimated_time: string;
  skills_covered: string[];
  recruiter_impact: string;
  suggested_tech_stack: string[];
  why_this_project_helps: string;
};

type GapAnalysis = {
  verdict?: string;
  verdict_explanation?: string;
  gaps?: GapItem[];
  missing_skills?: MissingSkill[];
  strengths?: string[];
  company_insight?: string;
  apply_recommendation?: boolean;
  resume_tip?: string;
  resume_baseline_score?: number;
  role_match_score?: number;
  project_recommendations?: ProjectRecommendation[];
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

type CandidateProfile = {
  skills?: string[] | null;
  projects?: Array<{ name?: string; tech_stack?: string[]; domain?: string; description?: string }> | null;
  experience_items?: Array<{ title?: string; company?: string; duration?: string; highlights?: string[] }> | null;
  education?: Record<string, unknown> | null;
};

type SkillContribution = {
  name: string;
  contribution: number;
  resumeEvidence: string[];
  jobEvidence: string;
};

type MissingSkillImpact = {
  name: string;
  impact: number;
  jobEvidence: string;
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

function difficultyClass(difficulty?: string): string {
  if (difficulty === "Advanced") return "bg-indigo-100 text-indigo-800 border-indigo-200";
  if (difficulty === "Intermediate") return "bg-blue-100 text-blue-800 border-blue-200";
  return "bg-emerald-100 text-emerald-800 border-emerald-200";
}

function normalizeSkillName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function displaySkillName(value: string): string {
  const normalized = normalizeSkillName(value);
  const aliases: Record<string, string> = {
    postgres: "PostgreSQL",
    postgresql: "PostgreSQL",
    "github actions": "GitHub Actions",
    "ci/cd pipelines": "CI/CD",
    cicd: "CI/CD",
    javascript: "JavaScript",
    typescript: "TypeScript",
    fastapi: "FastAPI",
  };
  return aliases[normalized] ?? value.trim();
}

function extractRequiredSkills(requiredSkills: unknown): Array<{ name: string; weight: number }> {
  if (!requiredSkills) return [];
  const rawItems = Array.isArray(requiredSkills) ? requiredSkills : Object.entries(requiredSkills as Record<string, unknown>);

  return rawItems
    .map((item): { name: string; weight: number } | null => {
      if (typeof item === "string") return { name: displaySkillName(item), weight: 0.1 };
      if (Array.isArray(item)) {
        const [name, weight] = item;
        if (typeof name !== "string") return null;
        return { name: displaySkillName(name), weight: typeof weight === "number" ? weight : 0.1 };
      }
      if (typeof item === "object" && item !== null) {
        const record = item as Record<string, unknown>;
        const name = record.skill ?? record.name ?? record.technology;
        if (typeof name !== "string") return null;
        return { name: displaySkillName(name), weight: typeof record.weight === "number" ? record.weight : 0.1 };
      }
      return null;
    })
    .filter((item): item is { name: string; weight: number } => Boolean(item));
}

function sentenceIncludesSkill(text: string | undefined | null, skill: string): boolean {
  return normalizeSkillName(text ?? "").includes(normalizeSkillName(skill));
}

function findResumeEvidence(profile: CandidateProfile | null, skill: string): string[] {
  if (!profile) return [];
  const evidence = new Set<string>();
  if ((profile.skills ?? []).some((item) => normalizeSkillName(item) === normalizeSkillName(skill))) evidence.add("Profile Skills");

  if ((profile.projects ?? []).some((project) => {
    const techStack = project.tech_stack?.join(" ") ?? "";
    return [project.name, project.domain, project.description, techStack].some((value) => sentenceIncludesSkill(value, skill));
  })) evidence.add("Project");

  if ((profile.experience_items ?? []).some((item) => {
    const highlights = item.highlights?.join(" ") ?? "";
    return [item.title, item.company, item.duration, highlights].some((value) => sentenceIncludesSkill(value, skill));
  })) evidence.add("Experience");

  if (profile.education && sentenceIncludesSkill(Object.values(profile.education).join(" "), skill)) evidence.add("Education");
  return Array.from(evidence);
}

function findJobEvidence(description: string | undefined | null, skill: string): string {
  const normalizedDescription = description ?? "";
  const matchingLine = normalizedDescription
    .split(/\n|\.|;/)
    .map((line) => line.trim())
    .find((line) => sentenceIncludesSkill(line, skill));

  const context = normalizeSkillName(matchingLine ?? normalizedDescription);
  if (context.includes("preferred") || context.includes("nice to have") || context.includes("bonus")) return "Preferred qualifications";
  if (context.includes("responsibilities") || context.includes("you will") || context.includes("build") || context.includes("deliver")) return "Responsibilities";
  return "Required qualifications";
}

function contributionFromWeight(weight: number): number {
  return Math.max(2, Math.round(Math.min(1, Math.max(0.05, weight)) * 35));
}

function contributionBarClass(percent: number): string {
  if (percent >= 8) return "bg-emerald-500";
  if (percent >= 5) return "bg-blue-500";
  return "bg-amber-500";
}

export default function JobDetailPage() {
  const { id: jobId } = useParams<{ id: string }>();

  const [userId, setUserId] = useState<string | null>(null);
  const [hasResumeProfile, setHasResumeProfile] = useState(false);
  const [resumeProfile, setResumeProfile] = useState<CandidateProfile | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [score, setScore] = useState<ScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [tracked, setTracked] = useState(false);
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
          const applicationsResponse = await api.get<Application[]>(`/applications/user/${resolvedUserId}`);
          if (!cancelled) {
            setTracked(applicationsResponse.data.some((app) => app.job_id === jobId));
          }
        } catch {
          if (!cancelled) {
            setTracked(false);
          }
        }

        try {
          const resumeResponse = await api.get<CandidateProfile>(`/resume/${resolvedUserId}`);
          if (cancelled) return;
          setHasResumeProfile(true);
          setResumeProfile(resumeResponse.data);

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
            setResumeProfile(null);
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

  async function handleTrackApplication(): Promise<void> {
    if (!userId || !jobId) return;
    try {
      setTracking(true);
      setError(null);
      await api.post<Application>("/applications", {
        user_id: userId,
        job_id: jobId,
        status: "applied",
        notes: "Tracked from GapCheck match details",
      });
      setTracked(true);
    } catch (unknownError: unknown) {
      let message = "Could not track this application.";
      if (axios.isAxiosError(unknownError)) {
        const detail = unknownError.response?.data?.detail;
        if (typeof detail === "string" && detail.trim()) {
          message = detail;
        }
      }
      setError(message);
    } finally {
      setTracking(false);
    }
  }

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
  const missingSkills = score?.gap_analysis?.missing_skills ?? [];
  const recommendations = score?.gap_analysis?.project_recommendations ?? [];
  const strengths = score?.gap_analysis?.strengths ?? [];
  const scoreBreakdown = useMemo(() => {
    if (!job || !score) {
      return { matched: [] as SkillContribution[], missing: [] as MissingSkillImpact[], weighted: [] as Array<{ name: string; percent: number }> };
    }

    const requiredSkills = extractRequiredSkills(job.required_skills);
    const missingNames = new Set(missingSkills.map((skill) => normalizeSkillName(skill.name)));
    const matched = requiredSkills
      .filter((skill) => !missingNames.has(normalizeSkillName(skill.name)))
      .slice(0, 8)
      .map((skill) => ({
        name: skill.name,
        contribution: contributionFromWeight(skill.weight),
        resumeEvidence: findResumeEvidence(resumeProfile, skill.name),
        jobEvidence: findJobEvidence(job.description, skill.name),
      }));

    const missing = missingSkills.slice(0, 8).map((skill) => {
      const requiredSkill = requiredSkills.find((item) => normalizeSkillName(item.name) === normalizeSkillName(skill.name));
      return {
        name: skill.name,
        impact: contributionFromWeight(requiredSkill?.weight ?? Math.max(0.08, skill.confidence * 0.16)),
        jobEvidence: findJobEvidence(job.description, skill.name),
      };
    });

    const weighted = [...matched.map((skill) => ({ name: skill.name, percent: skill.contribution })), ...missing.map((skill) => ({ name: skill.name, percent: skill.impact }))].slice(0, 10);
    return { matched, missing, weighted };
  }, [job, missingSkills, resumeProfile, score]);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="gc-panel rounded-3xl p-6 lg:col-span-3">
          <div className="h-7 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
        <div className="gc-panel rounded-3xl p-6 lg:col-span-2">
          <div className="h-6 w-1/2 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-40 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="gc-panel-strong rounded-3xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="gc-text-gradient text-2xl font-bold">{job?.title ?? "Job Match Breakdown"}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {job?.company ?? "Unknown company"}
              {job?.location ? ` - ${job.location}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTrackApplication}
              disabled={tracking}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                tracked
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tracking ? "Saving..." : tracked ? "Tracked" : "Track Application"}
            </button>
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
        </div>

        {!hasResumeProfile ? (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
            Upload your resume on the <Link to="/profile" className="underline">Resume page</Link> to unlock full verdict analysis.
          </div>
        ) : null}

        {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <article className="gc-panel rounded-3xl p-5 lg:col-span-3">
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

        <article className="gc-panel rounded-3xl p-5 lg:col-span-2">
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

      <section className="gc-panel rounded-3xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Score Breakdown</h2>
            <p className="mt-1 text-sm text-slate-600">A readable explanation layer on top of the existing match score.</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Final Match Score</p>
            <p className="text-2xl font-black text-blue-950">{score ? `${Math.round(score.overall_score)}%` : "--"}</p>
          </div>
        </div>

        {!score ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            Upload a resume and compute a score to see matched skills, missing skills, and evidence.
          </div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <h3 className="text-sm font-bold text-emerald-950">Matched Skills</h3>
              <div className="mt-3 space-y-3">
                {scoreBreakdown.matched.length === 0 ? (
                  <p className="text-sm text-emerald-800">No structured matched skills were available from this job posting.</p>
                ) : (
                  scoreBreakdown.matched.map((skill) => (
                    <div key={skill.name} className="rounded-xl border border-emerald-100 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-slate-950">{skill.name}</p>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800">+{skill.contribution}%</span>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-500">This skill was found in:</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(skill.resumeEvidence.length > 0 ? skill.resumeEvidence : ["Parsed resume profile"]).map((evidence) => (
                          <span key={evidence} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">{evidence}</span>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">This requirement came from: <strong>{skill.jobEvidence}</strong></p>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
              <h3 className="text-sm font-bold text-amber-950">Missing Skills</h3>
              <div className="mt-3 space-y-3">
                {scoreBreakdown.missing.length === 0 ? (
                  <p className="text-sm text-amber-800">No missing skills were detected in the structured gap analysis.</p>
                ) : (
                  scoreBreakdown.missing.map((skill) => (
                    <div key={skill.name} className="rounded-xl border border-amber-100 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-slate-950">{skill.name}</p>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">Potential +{skill.impact}%</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">This requirement came from: <strong>{skill.jobEvidence}</strong></p>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
              <h3 className="text-sm font-bold text-slate-950">Weight Contribution Visualization</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {scoreBreakdown.weighted.length === 0 ? (
                  <p className="text-sm text-slate-600">Weighted skill contributions appear when the job has structured skill requirements.</p>
                ) : (
                  scoreBreakdown.weighted.map((item) => (
                    <div key={item.name}>
                      <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
                        <span>{item.name}</span>
                        <span>{item.percent}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className={`h-2 rounded-full ${contributionBarClass(item.percent)}`} style={{ width: `${Math.min(100, item.percent * 8)}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <details className="rounded-2xl border border-blue-100 bg-blue-50 p-4 lg:col-span-2">
              <summary className="cursor-pointer text-sm font-bold text-blue-950">Why did I get this score?</summary>
              <p className="mt-3 text-sm leading-7 text-blue-900">
                Your final score is the existing GapCheck compatibility score. This panel explains it by mapping structured job requirements to resume evidence and missing-skill impact. Matched skills raise the score when they appear in your parsed resume projects, experience, education, or skills list. Missing skills estimate possible upside based on the job skill weight and the confidence of the gap analysis.
              </p>
              <p className="mt-2 text-sm leading-7 text-blue-900">
                Dimension scores: Skills {Math.round(score.skills_score)}%, Experience {Math.round(score.experience_score)}%, Education {Math.round(score.education_score)}%, Projects {Math.round(score.project_score)}%, Domain {Math.round(score.domain_score)}%.
              </p>
            </details>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="gc-panel rounded-3xl p-5">
          <h2 className="text-lg font-bold text-slate-900">What Needs Work</h2>
          {missingSkills.length > 0 ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Structured Missing Skills</p>
                <span className="text-xs font-semibold text-amber-700">{missingSkills.length} detected</span>
              </div>
              <div className="space-y-2">
                {missingSkills.map((skill) => (
                  <div key={`${skill.name}-${skill.category}`} className="rounded-xl border border-amber-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                      <span className="text-amber-950">{skill.name}</span>
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">{skill.category}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-amber-100">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                          style={{ width: `${Math.max(8, Math.round(skill.confidence * 100))}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-amber-800">{Math.round(skill.confidence * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : score ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              No missing skills were detected from the structured job requirements.
            </div>
          ) : null}
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

        <article className="gc-panel rounded-3xl p-5">
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

      <section className="gc-panel rounded-3xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Portfolio Project Recommendations</h2>
            <p className="mt-1 text-sm text-slate-600">
              Concrete project ideas generated from the missing skills in this match analysis.
            </p>
          </div>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            Phase 1 engine
          </span>
        </div>

        {computing ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-56 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            Recommendations appear after scoring finds missing skills. If none appear, this role already has strong skill alignment.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {recommendations.map((recommendation) => (
              <article key={recommendation.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-bold leading-6 text-slate-950">{recommendation.title}</h3>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-bold ${difficultyClass(recommendation.difficulty)}`}>
                    {recommendation.difficulty}
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500">Estimated time: {recommendation.estimated_time}</p>
                <p className="mt-3 text-sm text-slate-700">{recommendation.why_this_project_helps}</p>

                <div className="mt-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Skills Covered</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {recommendation.skills_covered.map((skill) => (
                      <span key={skill} className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Suggested Stack</p>
                  <p className="mt-1 text-xs text-slate-600">{recommendation.suggested_tech_stack.join(", ")}</p>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Recruiter Impact</p>
                  <p className="mt-1 text-xs text-slate-700">{recommendation.recruiter_impact}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}



