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

const TARGET_KEYWORD_PRESETS = [
  { label: "Software Intern", terms: ["software engineering", "python", "sql", "internship", "entry level"] },
  { label: "Frontend", terms: ["frontend", "react", "typescript", "javascript", "web development"] },
  { label: "Data", terms: ["data analyst", "sql", "python", "power bi", "analytics"] },
  { label: "Product", terms: ["product analyst", "product management", "roadmap", "stakeholder", "analytics"] },
  { label: "Marketing", terms: ["marketing", "content", "seo", "campaign", "growth"] },
  { label: "Business/Ops", terms: ["operations", "finance", "customer success", "sales", "project management"] },
];

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

function formatFileSize(size: number): string {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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

  function applyKeywordPreset(terms: string[]): void {
    setDomains((prev) => {
      const existing = new Set(prev.map((item) => item.toLowerCase()));
      const additions = terms.filter((term) => !existing.has(term.toLowerCase()));
      return [...prev, ...additions];
    });
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
      setSelectedFile(null);
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
  const experienceCount = useMemo(() => experienceItems.length, [experienceItems]);
  const hasEducation = Boolean(degreeInput || programInput || universityInput || yearInput);
  const parseQualityItems = [
    { label: "Skills", value: skillsCount, ready: skillsCount > 0 },
    { label: "Projects", value: projectCount, ready: projectCount > 0 },
    { label: "Experience", value: experienceCount, ready: experienceCount > 0 },
    { label: "Keywords", value: domainCount, ready: domainCount > 0 },
  ];
  const completedParseItems = parseQualityItems.filter((item) => item.ready).length + (hasEducation ? 1 : 0);
  const profileCompleteness = Math.round((completedParseItems / 5) * 100);
  const uploadDisabled = uploading || loadingProfile || !selectedFile;

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
          <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-slate-900">Resume PDF</p>
                  <p className="mt-1 text-sm text-slate-500">Upload a PDF. The backend parses it into editable skills, projects, experience, education, and job keywords.</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${profile ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {profile ? "Resume active" : "No resume yet"}
                </span>
              </div>

              <label
                htmlFor="resume-upload"
                className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 px-5 py-8 text-center transition hover:border-blue-400 hover:from-blue-100 hover:to-cyan-100"
              >
                <span className="rounded-2xl bg-white px-4 py-3 text-2xl shadow-sm">PDF</span>
                <span className="mt-3 text-sm font-bold text-slate-900">{selectedFile ? selectedFile.name : "Choose your resume PDF"}</span>
                <span className="mt-1 text-xs text-slate-500">
                  {selectedFile ? `${formatFileSize(selectedFile.size)} ready to upload` : "Click to select a PDF from your computer"}
                </span>
              </label>
              <input
                id="resume-upload"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                className="sr-only"
              />

              {selectedFile ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-950">{selectedFile.name}</p>
                    <p className="text-xs text-blue-700">{formatFileSize(selectedFile.size)} · PDF selected</p>
                  </div>
                  <button type="button" onClick={() => setSelectedFile(null)} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">
                    Clear
                  </button>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={handleUpload} disabled={uploadDisabled} className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-5 py-3 text-sm font-bold text-white transition hover:from-blue-800 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {uploading ? "Parsing in backend..." : profile ? "Replace Resume" : "Upload Resume"}
                </button>

                <button onClick={handleRemoveResume} disabled={removing || !profile} className="rounded-xl border border-rose-300 bg-white px-5 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">
                  {removing ? "Removing..." : "Remove Resume"}
                </button>
              </div>

              {profile ? (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-bold text-emerald-900">Current resume</p>
                  <p className="mt-1 text-sm text-emerald-800">{resumeFileName ?? "Resume stored in backend"}</p>
                  {uploadedAt ? <p className="mt-1 text-xs text-emerald-700">Last uploaded {new Date(uploadedAt).toLocaleString()}</p> : null}
                </div>
              ) : null}

              {userId ? <p className="mt-4 text-xs text-slate-400">Local demo user: {userId}</p> : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
              <p className="text-sm font-bold text-cyan-200">Backend parsing pipeline</p>
              <div className="mt-5 space-y-4">
                {[
                  { step: "1", title: "Upload PDF", text: selectedFile ? "PDF selected and ready." : "Choose a PDF to begin." },
                  { step: "2", title: "Extract resume text", text: profile ? "Resume text has been parsed." : "Backend extracts content after upload." },
                  { step: "3", title: "Normalize profile data", text: profile ? "Skills, projects, experience, and keywords are editable." : "Parsed data appears in the Parsed Data tab." },
                  { step: "4", title: "Power scoring", text: profile ? "Job matches can use your parsed profile." : "Upload once to unlock scoring." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-sm font-black text-slate-950">{item.step}</span>
                    <div>
                      <p className="text-sm font-bold">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-300">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("parsed")}
                disabled={!profile}
                className="mt-6 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Review Parsed Data
              </button>
            </div>
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
                  <div className="mb-3 flex flex-wrap gap-2">
                    {TARGET_KEYWORD_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applyKeywordPreset(preset.terms)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Profile Health</h2>
            <p className="mt-1 text-xs text-slate-500">How much usable scoring data GapCheck has from your resume.</p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-black text-blue-700">{profileCompleteness}%</span>
        </div>

        <div className="mt-5 h-2 rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-gradient-to-r from-blue-700 to-cyan-500" style={{ width: `${profileCompleteness}%` }} />
        </div>

        <ul className="mt-5 space-y-3 text-sm text-slate-600">
          {parseQualityItems.map((item) => (
            <li key={item.label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
              <span className="font-semibold text-slate-700">{item.label}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.ready ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {item.value}
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
            <span className="font-semibold text-slate-700">Education</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${hasEducation ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {hasEducation ? "Ready" : "Missing"}
            </span>
          </li>
        </ul>

        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-bold text-blue-950">Recommended workflow</p>
          <ol className="mt-3 space-y-2 text-xs leading-relaxed text-blue-900">
            <li>1. Upload or replace your PDF resume.</li>
            <li>2. Review parsed data and fix anything the parser missed.</li>
            <li>3. Use Job Keywords to control which roles the board prioritizes.</li>
          </ol>
        </div>
      </aside>
    </div>
  );
}
