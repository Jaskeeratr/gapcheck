import { Link } from "react-router-dom";

import type { Job } from "../types/job";

type JobCardProps = {
  job: Job;
  matchLabel?: string | null;
  matchClassName?: string;
  scoreLocked?: boolean;
  scoring?: boolean;
};

function getSourceLabel(source?: string | null): string {
  if (!source) return "unknown";
  return source.replace("_", " ");
}

function formatPostedDate(rawDate?: string | null): string {
  if (!rawDate) return "Recently";
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return "Recently";
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function JobCard({
  job,
  matchLabel = null,
  matchClassName = "bg-slate-100 text-slate-700 border-slate-200",
  scoreLocked = false,
  scoring = false,
}: JobCardProps) {
  const badgeLabel = scoreLocked ? "Upload Resume to Unlock" : scoring ? "Scoring..." : matchLabel ?? "Unscored";
  const badgeClass = scoreLocked
    ? "bg-slate-100 text-slate-600 border-slate-200"
    : scoring
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : matchClassName;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {job.company}
            {job.location ? ` - ${job.location}` : ""}
          </p>
        </div>

        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}>
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
          <span className="rounded-md bg-blue-50 px-2 py-1 font-medium text-blue-700">{job.domain}</span>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">Posted: {formatPostedDate(job.posted_at)}</p>
        <Link
          to={`/jobs/${job.id}`}
          className="inline-flex items-center rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          View Match Details
        </Link>
      </div>
    </article>
  );
}
