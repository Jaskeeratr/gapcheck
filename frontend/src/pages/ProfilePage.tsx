import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import { api } from "../api/client";

type DevUser = {
  id: string;
};

type ExperienceItem = {
  title: string;
  company: string;
  duration: string;
  highlights: string[];
};

type ProfileProject = {
  name: string;
  tech_stack: string[];
  domain: string;
  description: string;
};

type ProfileEducation = {
  degree?: string;
  program?: string;
  university?: string;
  year?: number | null;
};

type CandidateProfile = {
  id: string;
  user_id: string;
  resume_text?: string | null;
  skills?: string[] | null;
  experience_years?: number | null;
  internship_count?: number | null;
  experience_items?: ExperienceItem[] | null;
  projects?: ProfileProject[] | null;
  education?: ProfileEducation | null;
  domains?: string[] | null;
};

type ResumeCache = {
  userId: string;
  profile: CandidateProfile;
  uploadedAt: string;
  fileName: string | null;
};

type ProfileTab = "resume" | "parsed";

const PROFILE_CACHE_KEY = "gapcheck_profile_cache_v1";

function readCachedProfile(): ResumeCache | null {
  try {
    const raw = window.localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ResumeCache;
  } catch {
    return null;
  }
}

function writeCachedProfile(payload: ResumeCache): void {
  try {
    window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // no-op
  }
}

function clearCachedProfile(): void {
  try {
    window.localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    // no-op
  }
}

function parseCommaList(input: string): string[] {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function toNumberOrZero(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeProject(project: Partial<ProfileProject>): ProfileProject {
  return {
    name: project.name ?? "",
    domain: project.domain ?? "",
    description: project.description ?? "",
    tech_stack: Array.isArray(project.tech_stack) ? project.tech_stack : [],
  };
}

function normalizeExperience(item: Partial<ExperienceItem>): ExperienceItem {
  return {
    title: item.title ?? "",
    company: item.company ?? "",
    duration: item.duration ?? "",
    highlights: Array.isArray(item.highlights) ? item.highlights : [],
  };
}

export default function ProfilePage() {
  const [cachedProfile] = useState<ResumeCache | null>(() => readCachedProfile());

  const [activeTab, setActiveTab] = useState<ProfileTab>("resume");
  const [userId, setUserId] = useState<string | null>(() => cachedProfile?.userId ?? null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<CandidateProfile | null>(() => cachedProfile?.profile ?? null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(() => cachedProfile?.fileName ?? null);
  const [uploadedAt, setUploadedAt] = useState<string | null>(() => cachedProfile?.uploadedAt ?? null);

  const [skills, setSkills] = useState<string[]>(() => cachedProfile?.profile?.skills ?? []);
  const [domains, setDomains] = useState<string[]>(() => cachedProfile?.profile?.domains ?? []);
  const [newSkill, setNewSkill] = useState("");
  const [newDomain, setNewDomain] = useState("");

  const [experienceYearsInput, setExperienceYearsInput] = useState<string>(String(cachedProfile?.profile?.experience_years ?? 0));
  const [internshipCountInput, setInternshipCountInput] = useState<string>(String(cachedProfile?.profile?.internship_count ?? 0));
  const [experienceItems, setExperienceItems] = useState<ExperienceItem[]>(
    () => (cachedProfile?.profile?.experience_items ?? []).map((item) => normalizeExperience(item)),
  );

  const [projects, setProjects] = useState<ProfileProject[]>(
    () => (cachedProfile?.profile?.projects ?? []).map((project) => normalizeProject(project)),
  );

  const [degreeInput, setDegreeInput] = useState(cachedProfile?.profile?.education?.degree ?? "");
  const [programInput, setProgramInput] = useState(cachedProfile?.profile?.education?.program ?? "");
  const [universityInput, setUniversityInput] = useState(cachedProfile?.profile?.education?.university ?? "");
  const [yearInput, setYearInput] = useState(cachedProfile?.profile?.education?.year != null ? String(cachedProfile.profile.education?.year) : "");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [message, setMessage] = useState<string | null>(() => (cachedProfile ? "Resume loaded from saved session." : null));
  const [error, setError] = useState<string | null>(null);

  function applyProfileToEditor(nextProfile: CandidateProfile | null): void {
    if (!nextProfile) {
      setSkills([]);
      setDomains([]);
      setExperienceYearsInput("0");
      setInternshipCountInput("0");
      setExperienceItems([]);
      setProjects([]);
      setDegreeInput("");
      setProgramInput("");
      setUniversityInput("");
      setYearInput("");
      return;
    }

    setSkills(nextProfile.skills ?? []);
    setDomains(nextProfile.domains ?? []);
    setExperienceYearsInput(String(nextProfile.experience_years ?? 0));
    setInternshipCountInput(String(nextProfile.internship_count ?? 0));
    setExperienceItems((nextProfile.experience_items ?? []).map((item) => normalizeExperience(item)));
    setProjects((nextProfile.projects ?? []).map((project) => normalizeProject(project)));
    setDegreeInput(nextProfile.education?.degree ?? "");
    setProgramInput(nextProfile.education?.program ?? "");
    setUniversityInput(nextProfile.education?.university ?? "");
    setYearInput(nextProfile.education?.year != null ? String(nextProfile.education.year) : "");
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrapAndLoadProfile(): Promise<void> {
      try {
        setLoadingProfile(true);
        const userResponse = await api.post<DevUser>("/users/dev-bootstrap");
        if (cancelled) return;

        const id = userResponse.data.id;
        setUserId(id);

        try {
          const profileResponse = await api.get<CandidateProfile>(`/resume/${id}`);
          if (!cancelled) {
            const loadedProfile = profileResponse.data;
            setProfile(loadedProfile);
            applyProfileToEditor(loadedProfile);
            setMessage("Resume already on file.");

            const uploadedAtValue = cachedProfile?.userId === id ? cachedProfile.uploadedAt : new Date().toISOString();
            const fileNameValue = cachedProfile?.userId === id ? cachedProfile.fileName : null;
            setUploadedAt(uploadedAtValue);
            setResumeFileName(fileNameValue);

            writeCachedProfile({
              userId: id,
              profile: loadedProfile,
              uploadedAt: uploadedAtValue,
              fileName: fileNameValue,
            });
          }
        } catch (unknownError: unknown) {
          const status = (unknownError as { response?: { status?: number } })?.response?.status;
          if (!cancelled && status !== 404) {
            setError("Could not load profile from backend.");
          }
        }
      } catch {
        if (!cancelled) {
          setError("Could not initialize user session.");
        }
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    }

    bootstrapAndLoadProfile();
    return () => {
      cancelled = true;
    };
  }, [cachedProfile]);

  function addSkill(): void {
    const normalized = newSkill.trim();
    if (!normalized) return;
    if (skills.some((skill) => skill.toLowerCase() === normalized.toLowerCase())) {
      setNewSkill("");
      return;
    }
    setSkills((prev) => [...prev, normalized]);
    setNewSkill("");
  }

  function addDomain(): void {
    const normalized = newDomain.trim();
    if (!normalized) return;
    if (domains.some((domain) => domain.toLowerCase() === normalized.toLowerCase())) {
      setNewDomain("");
      return;
    }
    setDomains((prev) => [...prev, normalized]);
    setNewDomain("");
  }

  function addProject(): void {
    setProjects((prev) => [...prev, normalizeProject({})]);
  }

  function addExperienceItem(): void {
    setExperienceItems((prev) => [...prev, normalizeExperience({})]);
  }

  async function handleUpload(): Promise<void> {
    if (!userId || !selectedFile) {
      setError("Pick a PDF resume file first.");
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF resumes are supported.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setMessage(null);

      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("file", selectedFile);

      const response = await api.post<CandidateProfile>("/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const now = new Date().toISOString();
      const uploadedProfile = response.data;
      setProfile(uploadedProfile);
      applyProfileToEditor(uploadedProfile);
      setResumeFileName(selectedFile.name);
      setUploadedAt(now);
      setMessage("Resume uploaded. Parsing is handled on the backend.");

      writeCachedProfile({
        userId,
        profile: uploadedProfile,
        uploadedAt: now,
        fileName: selectedFile.name,
      });
      setActiveTab("parsed");
    } catch (unknownError: unknown) {
      let friendlyError = "Resume upload failed. Check backend logs and try again.";
      if (axios.isAxiosError(unknownError)) {
        const detail = unknownError.response?.data?.detail;
        if (typeof detail === "string" && detail.trim()) {
          friendlyError = detail;
        }
      }
      setError(friendlyError);
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveParsedData(): Promise<void> {
    if (!userId || !profile) {
      setError("Upload a resume first so we have a profile to edit.");
      return;
    }

    const payload = {
      skills,
      domains,
      experience_years: toNumberOrZero(experienceYearsInput),
      internship_count: Math.max(0, Math.floor(toNumberOrZero(internshipCountInput))),
      experience_items: experienceItems,
      projects,
      education: {
        degree: degreeInput || null,
        program: programInput || null,
        university: universityInput || null,
        year: yearInput ? Number(yearInput) : null,
      },
    };

    try {
      setSaving(true);
      setError(null);
      const response = await api.patch<CandidateProfile>(`/resume/${userId}`, payload);
      const updatedProfile = response.data;
      setProfile(updatedProfile);
      applyProfileToEditor(updatedProfile);
      setMessage("Parsed data updated successfully.");

      writeCachedProfile({
        userId,
        profile: updatedProfile,
        uploadedAt: uploadedAt ?? new Date().toISOString(),
        fileName: resumeFileName,
      });
    } catch {
      setError("Could not save parsed profile fields.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveResume(): Promise<void> {
    if (!userId || !profile) {
      setError("No resume profile exists to remove.");
      return;
    }

    try {
      setRemoving(true);
      setError(null);
      await api.delete(`/resume/${userId}`);

      setProfile(null);
      applyProfileToEditor(null);
      setSelectedFile(null);
      setResumeFileName(null);
      setUploadedAt(null);
      setMessage("Resume removed successfully.");
      clearCachedProfile();
      setActiveTab("resume");
    } catch {
      setError("Could not remove resume profile.");
    } finally {
      setRemoving(false);
    }
  }

  const projectCount = useMemo(() => projects.length, [projects]);
  const skillsCount = useMemo(() => skills.length, [skills]);
  const domainCount = useMemo(() => domains.length, [domains]);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="gc-panel-strong rounded-3xl p-6 lg:col-span-3">
        <h1 className="gc-text-gradient text-2xl font-bold">Candidate Profile</h1>
        <p className="mt-2 text-sm text-slate-600">Upload your PDF resume once. Parsing and score preparation happen in the backend.</p>

        <div className="mt-5 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-sm font-semibold">
          <button onClick={() => setActiveTab("resume")} className={`rounded-lg px-3 py-2 ${activeTab === "resume" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>
            Resume
          </button>
          <button onClick={() => setActiveTab("parsed")} className={`rounded-lg px-3 py-2 ${activeTab === "parsed" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>
            Parsed Data
          </button>
        </div>

        {message ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

        {activeTab === "resume" ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-700">Resume PDF</p>
            <p className="mt-1 text-xs text-slate-500">Upload once, then replace anytime after edits.</p>

            {profile ? (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                Resume on file{resumeFileName ? `: ${resumeFileName}` : ""}
                {uploadedAt ? ` - Uploaded ${new Date(uploadedAt).toLocaleString()}` : ""}
              </div>
            ) : null}

            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className="mt-4 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={handleUpload} disabled={uploading || loadingProfile} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
                {uploading ? "Uploading..." : "Upload"}
              </button>

              <button onClick={handleRemoveResume} disabled={removing || !profile} className="rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60">
                {removing ? "Removing..." : "Remove Resume"}
              </button>
            </div>

            {userId ? <p className="mt-3 text-xs text-slate-500">User ID: {userId}</p> : null}
          </div>
        ) : (
          <div className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-5">
            {!profile ? (
              <p className="text-sm text-slate-600">Upload a resume first, then parsed data will appear here for editing.</p>
            ) : (
              <>
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900">Skills</h2>
                    <span className="text-xs text-slate-500">{skills.length} items</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <span key={`${skill}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {skill}
                        <button onClick={() => setSkills((prev) => prev.filter((_, i) => i !== index))} className="text-blue-700/70 hover:text-blue-900" aria-label={`Remove ${skill}`}>
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Add skill" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    <button onClick={addSkill} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Add</button>
                  </div>
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900">Experience</h2>
                    <button onClick={addExperienceItem} className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700">Add Experience</button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Experience Years</span>
                      <input value={experienceYearsInput} onChange={(e) => setExperienceYearsInput(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Internship Count</span>
                      <input value={internshipCountInput} onChange={(e) => setInternshipCountInput(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    </label>
                  </div>

                  <div className="mt-3 space-y-3">
                    {experienceItems.map((item, index) => (
                      <div key={`exp-${index}`} className="rounded-xl border border-slate-200 p-3">
                        <div className="mb-2 flex justify-end">
                          <button onClick={() => setExperienceItems((prev) => prev.filter((_, i) => i !== index))} className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700">
                            Remove
                          </button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input value={item.title} onChange={(e) => setExperienceItems((prev) => prev.map((entry, i) => (i === index ? { ...entry, title: e.target.value } : entry)))} placeholder="Role title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                          <input value={item.company} onChange={(e) => setExperienceItems((prev) => prev.map((entry, i) => (i === index ? { ...entry, company: e.target.value } : entry)))} placeholder="Company" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                          <input value={item.duration} onChange={(e) => setExperienceItems((prev) => prev.map((entry, i) => (i === index ? { ...entry, duration: e.target.value } : entry)))} placeholder="Duration" className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
                          <input value={item.highlights.join(", ")} onChange={(e) => setExperienceItems((prev) => prev.map((entry, i) => (i === index ? { ...entry, highlights: parseCommaList(e.target.value) } : entry)))} placeholder="Highlights (comma separated)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900">Projects</h2>
                    <button onClick={addProject} className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700">Add Project</button>
                  </div>
                  <div className="space-y-3">
                    {projects.map((project, index) => (
                      <div key={`proj-${index}`} className="rounded-xl border border-slate-200 p-3">
                        <div className="mb-2 flex justify-end">
                          <button onClick={() => setProjects((prev) => prev.filter((_, i) => i !== index))} className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700">
                            Remove
                          </button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input value={project.name} onChange={(e) => setProjects((prev) => prev.map((entry, i) => (i === index ? { ...entry, name: e.target.value } : entry)))} placeholder="Project name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                          <input value={project.domain} onChange={(e) => setProjects((prev) => prev.map((entry, i) => (i === index ? { ...entry, domain: e.target.value } : entry)))} placeholder="Domain" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                          <input value={project.tech_stack.join(", ")} onChange={(e) => setProjects((prev) => prev.map((entry, i) => (i === index ? { ...entry, tech_stack: parseCommaList(e.target.value) } : entry)))} placeholder="Tech stack (comma separated)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
                          <textarea value={project.description} onChange={(e) => setProjects((prev) => prev.map((entry, i) => (i === index ? { ...entry, description: e.target.value } : entry)))} placeholder="Project description" rows={3} className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900">Job Keywords</h2>
                    <span className="text-xs text-slate-500">{domains.length} items</span>
                  </div>
                  <p className="mb-2 text-xs text-slate-500">
                    These keywords personalize your Job Board feed. Add role families, stacks, tools, or target areas.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {domains.map((domain, index) => (
                      <span key={`${domain}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {domain}
                        <button onClick={() => setDomains((prev) => prev.filter((_, i) => i !== index))} className="text-indigo-700/70 hover:text-indigo-900" aria-label={`Remove ${domain}`}>
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="Add keyword (ex: frontend, react, data analyst)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    <button onClick={addDomain} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Add</button>
                  </div>
                </section>

                <section>
                  <h2 className="mb-2 text-base font-bold text-slate-900">Education</h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input value={degreeInput} onChange={(e) => setDegreeInput(e.target.value)} placeholder="Degree" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    <input value={programInput} onChange={(e) => setProgramInput(e.target.value)} placeholder="Program" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    <input value={universityInput} onChange={(e) => setUniversityInput(e.target.value)} placeholder="University" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    <input value={yearInput} onChange={(e) => setYearInput(e.target.value)} placeholder="Study year" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </div>
                </section>

                <button onClick={handleSaveParsedData} disabled={saving} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? "Saving..." : "Save Parsed Data"}
                </button>
              </>
            )}
          </div>
        )}
      </section>

      <aside className="gc-panel rounded-3xl p-6 lg:col-span-2">
        <h2 className="text-lg font-bold text-slate-900">Profile Health</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li className="rounded-lg bg-slate-50 p-3">Skills parsed: {skillsCount}</li>
          <li className="rounded-lg bg-slate-50 p-3">Projects parsed: {projectCount}</li>
          <li className="rounded-lg bg-slate-50 p-3">Domains inferred: {domainCount}</li>
        </ul>
      </aside>
    </div>
  );
}
