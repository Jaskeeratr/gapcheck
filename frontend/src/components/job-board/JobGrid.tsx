import JobCard from "../JobCard";
import type { Job } from "../../types/job";

type ScoreBadge = {
  label: string;
  className: string;
  score?: number;
};

type JobGridProps = {
  loading: boolean;
  jobs: Job[];
  hasResumeProfile: boolean;
  scoringInProgress: boolean;
  scoreByJobId: Record<string, ScoreBadge>;
  profileKeywords: string[];
  trackedJobIds: Set<string>;
  trackingJobIds: Set<string>;
  onTrack: (jobId: string) => void;
};

export default function JobGrid({
  loading,
  jobs,
  hasResumeProfile,
  scoringInProgress,
  scoreByJobId,
  profileKeywords,
  trackedJobIds,
  trackingJobIds,
  onTrack,
}: JobGridProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((key) => (
          <div key={key} className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm font-medium text-slate-700">No jobs matched that filter. Try a wider search.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          scoreLocked={!hasResumeProfile}
          scoring={hasResumeProfile && scoringInProgress && !scoreByJobId[job.id]}
          matchLabel={scoreByJobId[job.id]?.label}
          matchClassName={scoreByJobId[job.id]?.className}
          matchScore={scoreByJobId[job.id]?.score}
          profileKeywords={profileKeywords}
          tracked={trackedJobIds.has(job.id)}
          tracking={trackingJobIds.has(job.id)}
          onTrack={onTrack}
        />
      ))}
    </div>
  );
}

