import { memo } from "react";
import { Link } from "react-router-dom";

import type { Job } from "../types/job";

type JobCardProps = {
  job: Job;
  matchLabel?: string | null;
  matchClassName?: string;
  matchScore?: number;
  profileKeywords?: string[];
  scoreLocked?: boolean;
  scoring?: boolean;
  tracked?: boolean;
  tracking?: boolean;
  onTrack?: (jobId: string) => void;
};

function getSourceLabel(source?: string | null): string {
  if (!source) return "unknown";
  return source.replace("_", " ").replace("baseline seed", "baseline");
}

function formatPostedDate(rawDate?: string | null): string {
  if (!rawDate) return "Recently";
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return "Recently";
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function extractSkillNames(requiredSkills: unknown, limit = 4): string[] {
  if (!requiredSkills) return [];

  if (Array.isArray(requiredSkills)) {
    return requiredSkills
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "skill" in item) {
          return String((item as { skill?: unknown }).skill ?? "");
        }
        return "";
      })
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, limit);
  }

  if (typeof requiredSkills === "object") {
    return Object.keys(requiredSkills).slice(0, limit);
  }

  return [];
}

function normalizeTerm(value: string): string {
  return value.trim().toLowerCase();
}

function buildEvidence(job: Job, matchScore?: number, profileKeywords: string[] = []): string[] {
  const evidence: string[] = [];
  const skills = extractSkillNames(job.required_skills);
  const searchableText = [job.title, job.company, job.domain, job.role_type, job.description, ...skills]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const normalizedKeywords = Array.from(new Set(profileKeywords.map(normalizeTerm).filter(Boolean)));
  const matchedKeywords = normalizedKeywords.filter((keyword) => searchableText.includes(keyword)).slice(0, 3);
  const missingSkillSignals = skills
    .filter((skill) => !normalizedKeywords.includes(normalizeTerm(skill)))
    .slice(0, 2);

  if (typeof matchScore === "number") {
    evidence.push(`${Math.round(matchScore)}% resume-role alignment`);
  }
  if (matchedKeywords.length > 0) {
    evidence.push(`Matched profile keywords: ${matchedKeywords.join(", ")}`);
  }
  if (missingSkillSignals.length > 0 && typeof matchScore === "number" && matchScore < 85) {
    evidence.push(`Improve next: ${missingSkillSignals.join(", ")}`);
  }
  if (skills.length > 0) {
    evidence.push(`Role signals: ${skills.join(", ")}`);
  }
  if (job.domain) {
    evidence.push(`Domain: ${job.domain}`);
  }

  return evidence.slice(0, 3);
}

function JobCard({
  job,
  matchLabel = null,
  matchClassName = "bg-slate-100 text-slate-700 border-slate-200",
  matchScore,
  profileKeywords = [],
  scoreLocked = false,
  scoring = false,
  tracked = false,
  tracking = false,
  onTrack,
}: JobCardProps) {
  const badgeLabel = scoreLocked ? "Upload Resume to Unlock" : scoring ? "Scoring..." : matchLabel ?? "Unscored";
  const badgeClass = scoreLocked
    ? "bg-slate-100 text-slate-600 border-slate-200"
    : scoring
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : matchClassName;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100/70">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 opacity-70 transition group-hover:opacity-100" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold leading-snug text-slate-900">{job.title}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {job.company}
            {job.location ? ` - ${job.location}` : ""}
          </p>
        </div>

        <span className={`rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">
          Source: {getSourceLabel(job.source)}
        </span>
        {job.role_type ? (
          <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">{job.role_type}</span>
        ) : null}
        {job.domain ? (
          <span className="rounded-md bg-gradient-to-r from-blue-50 to-cyan-50 px-2 py-1 font-medium text-blue-700">{job.domain}</span>
        ) : null}
      </div>

      <div className="mt-4 space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
        {buildEvidence(job, matchScore, profileKeywords).map((item) => (
          <p key={item} className="text-xs font-medium text-slate-600">
            {item}
          </p>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-500">Posted: {formatPostedDate(job.posted_at)}</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onTrack?.(job.id)}
            disabled={tracking}
            className={`inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              tracked
                ? "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tracking ? "Saving..." : tracked ? "Tracked" : "Track Application"}
          </button>
          <Link
            to={`/jobs/${job.id}`}
            className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-700 to-cyan-600 px-3 py-2 text-sm font-semibold text-white transition hover:from-blue-800 hover:to-cyan-700"
          >
            View Match Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export default memo(JobCard);
