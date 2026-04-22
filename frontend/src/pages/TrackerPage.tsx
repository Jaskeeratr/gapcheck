import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import type { Application, ApplicationStatus } from "../types/application";
import type { Job } from "../types/job";

type DevUser = { id: string };

type ApplicationCard = Application & {
  job?: Job | null;
};

const columns: Array<{ title: string; status: ApplicationStatus; color: string }> = [
  { title: "Applied", status: "applied", color: "border-sky-200 bg-sky-50" },
  { title: "Phone Screen", status: "phone_screen", color: "border-violet-200 bg-violet-50" },
  { title: "Interview", status: "interview", color: "border-amber-200 bg-amber-50" },
  { title: "Rejected", status: "rejected", color: "border-rose-200 bg-rose-50" },
  { title: "Offer", status: "offer", color: "border-emerald-200 bg-emerald-50" },
];

export default function TrackerPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [cards, setCards] = useState<ApplicationCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTracker(): Promise<void> {
      try {
        setLoading(true);
        setError(null);

        const userResponse = await api.post<DevUser>("/users/dev-bootstrap");
        const id = userResponse.data.id;
        if (cancelled) return;
        setUserId(id);

        const applicationsResponse = await api.get<Application[]>(`/applications/user/${id}`);
        if (cancelled) return;

        const apps = applicationsResponse.data;
        const uniqueJobIds = [...new Set(apps.map((app) => app.job_id))];
        const settledJobs = await Promise.allSettled(uniqueJobIds.map((jobId) => api.get<Job>(`/jobs/${jobId}`)));
        if (cancelled) return;

        const jobMap = new Map<string, Job>();
        settledJobs.forEach((result, index) => {
          if (result.status === "fulfilled") {
            jobMap.set(uniqueJobIds[index], result.value.data);
          }
        });

        setCards(apps.map((app) => ({ ...app, job: jobMap.get(app.job_id) ?? null })));
      } catch (unknownError: unknown) {
        let message = "Could not load tracker data.";
        if (axios.isAxiosError(unknownError)) {
          const detail = unknownError.response?.data?.detail;
          if (typeof detail === "string" && detail.trim()) {
            message = detail;
          }
        }
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTracker();
    return () => {
      cancelled = true;
    };
  }, []);

  const cardsByStatus = useMemo(() => {
    const grouped: Record<ApplicationStatus, ApplicationCard[]> = {
      applied: [],
      phone_screen: [],
      interview: [],
      rejected: [],
      offer: [],
    };
    cards.forEach((card) => grouped[card.status].push(card));
    return grouped;
  }, [cards]);

  return (
    <div className="space-y-6">
      <section className="gc-panel-strong rounded-3xl p-6">
        <h1 className="gc-text-gradient text-2xl font-bold">Application Tracker</h1>
        <p className="mt-2 text-sm text-slate-600">
          Track each application stage and compare outcomes to your predicted match score.
        </p>
        {userId ? <p className="mt-1 text-xs text-slate-500">User ID: {userId}</p> : null}
        {error ? <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        {columns.map((column) => (
          <article key={column.title} className={`rounded-2xl border p-4 shadow-sm ${column.color}`}>
            <h2 className="text-sm font-bold text-slate-800">{column.title}</h2>
            <div className="mt-3 space-y-2">
              {loading ? (
                <div className="rounded-xl border border-white/60 bg-white/80 p-3 text-xs text-slate-500">Loading...</div>
              ) : cardsByStatus[column.status].length === 0 ? (
                <div className="rounded-xl border border-white/60 bg-white/80 p-3 text-xs text-slate-500">No items yet</div>
              ) : (
                cardsByStatus[column.status].map((card) => (
                  <Link key={card.id} to={`/jobs/${card.job_id}`} className="block rounded-xl border border-white/70 bg-white/90 p-3 text-xs text-slate-600 shadow-sm hover:bg-white">
                    <p className="text-sm font-semibold text-slate-800">{card.job?.title ?? "Unknown job"}</p>
                    <p className="mt-1 text-xs text-slate-600">{card.job?.company ?? "Unknown company"}</p>
                    <p className="mt-2 text-[11px] text-slate-500">Updated {new Date(card.updated_at).toLocaleDateString()}</p>
                  </Link>
                ))
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
