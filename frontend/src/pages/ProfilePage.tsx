import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import { api } from "../api/client";
import ParsedProjectsEditor from "../components/profile/ParsedProjectsEditor";
import ParsedSkillsEditor from "../components/profile/ParsedSkillsEditor";
import ProfileHealthPanel from "../components/profile/ProfileHealthPanel";
import ResumeUploadCard from "../components/profile/ResumeUploadCard";
import type { CandidateProfile, ExperienceItem, ProfileProject } from "../components/profile/types";

type DevUser = { id: string };

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
    return raw ? (JSON.parse(raw) as ResumeCache) : null;
  } catch {
    return null;
  }
}

function writeCachedProfile(payload: ResumeCache): void {
  try {
    window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Local cache is optional.
  }
}

function clearCachedProfile(): void {
  try {
    window.localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    // Local cache is optional.
  }
}

function parseCommaList(input: string): string[] {
  return input.split(",").map((value) => value.trim()).filter(Boolean);
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
  const [experienceItems, setExperienceItems] = useState<ExperienceItem[]>(() => (cachedProfile?.profile?.experience_items ?? []).map((item) => normalizeExperience(item)));
  const [projects, setProjects] = useState<ProfileProject[]>(() => (cachedProfile?.profile?.projects ?? []).map((project) => normalizeProject(project)));

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
            writeCachedProfile({ userId: id, profile: loadedProfile, uploadedAt: uploadedAtValue, fileName: fileNameValue });
          }
        } catch (unknownError: unknown) {
          const status = (unknownError as { response?: { status?: number } })?.response?.status;
          if (!cancelled && status !== 404) setError("Could not load profile from backend.");
        }
      } catch {
        if (!cancelled) setError("Could not initialize user session.");
      } finally {
        if (!cancelled) setLoadingProfile(false);
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
    if (!skills.some((skill) => skill.toLowerCase() === normalized.toLowerCase())) setSkills((prev) => [...prev, normalized]);
    setNewSkill("");
  }

  function addDomain(): void {
    const normalized = newDomain.trim();
    if (!normalized) return;
    if (!domains.some((domain) => domain.toLowerCase() === normalized.toLowerCase())) setDomains((prev) => [...prev, normalized]);
    setNewDomain("");
  }

  function applyKeywordPreset(terms: string[]): void {
    setDomains((prev) => {
      const existing = new Set(prev.map((item) => item.toLowerCase()));
      return [...prev, ...terms.filter((term) => !existing.has(term.toLowerCase()))];
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

      const response = await api.post<CandidateProfile>("/resume/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const now = new Date().toISOString();
      const uploadedProfile = response.data;
      setProfile(uploadedProfile);
      applyProfileToEditor(uploadedProfile);
      setResumeFileName(selectedFile.name);
      setUploadedAt(now);
      setSelectedFile(null);
      setMessage("Resume uploaded. Parsing is handled on the backend.");
      writeCachedProfile({ userId, profile: uploadedProfile, uploadedAt: now, fileName: selectedFile.name });
      setActiveTab("parsed");
    } catch (unknownError: unknown) {
      let friendlyError = "Resume upload failed. Check backend logs and try again.";
      if (axios.isAxiosError(unknownError)) {
        const detail = unknownError.response?.data?.detail;
        if (typeof detail === "string" && detail.trim()) friendlyError = detail;
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
      writeCachedProfile({ userId, profile: updatedProfile, uploadedAt: uploadedAt ?? new Date().toISOString(), fileName: resumeFileName });
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
          <button onClick={() => setActiveTab("resume")} className={`rounded-lg px-3 py-2 ${activeTab === "resume" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>Resume</button>
          <button onClick={() => setActiveTab("parsed")} className={`rounded-lg px-3 py-2 ${activeTab === "parsed" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>Parsed Data</button>
        </div>

        {message ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

        {activeTab === "resume" ? (
          <ResumeUploadCard
            profile={profile}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            resumeFileName={resumeFileName}
            uploadedAt={uploadedAt}
            userId={userId}
            uploading={uploading}
            removing={removing}
            uploadDisabled={uploadDisabled}
            onUpload={handleUpload}
            onRemove={handleRemoveResume}
            onReviewParsedData={() => setActiveTab("parsed")}
          />
        ) : (
          <div className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-5">
            {!profile ? (
              <p className="text-sm text-slate-600">Upload a resume first, then parsed data will appear here for editing.</p>
            ) : (
              <>
                <ParsedSkillsEditor
                  skills={skills}
                  setSkills={setSkills}
                  newSkill={newSkill}
                  setNewSkill={setNewSkill}
                  addSkill={addSkill}
                  domains={domains}
                  setDomains={setDomains}
                  newDomain={newDomain}
                  setNewDomain={setNewDomain}
                  addDomain={addDomain}
                  applyKeywordPreset={applyKeywordPreset}
                  keywordPresets={TARGET_KEYWORD_PRESETS}
                  experienceYearsInput={experienceYearsInput}
                  setExperienceYearsInput={setExperienceYearsInput}
                  internshipCountInput={internshipCountInput}
                  setInternshipCountInput={setInternshipCountInput}
                  experienceItems={experienceItems}
                  setExperienceItems={setExperienceItems}
                  addExperienceItem={addExperienceItem}
                  degreeInput={degreeInput}
                  setDegreeInput={setDegreeInput}
                  programInput={programInput}
                  setProgramInput={setProgramInput}
                  universityInput={universityInput}
                  setUniversityInput={setUniversityInput}
                  yearInput={yearInput}
                  setYearInput={setYearInput}
                  parseCommaList={parseCommaList}
                />
                <ParsedProjectsEditor projects={projects} setProjects={setProjects} addProject={addProject} parseCommaList={parseCommaList} />
                <button onClick={handleSaveParsedData} disabled={saving} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? "Saving..." : "Save Parsed Data"}
                </button>
              </>
            )}
          </div>
        )}
      </section>

      <ProfileHealthPanel profileCompleteness={profileCompleteness} parseQualityItems={parseQualityItems} hasEducation={hasEducation} />
    </div>
  );
}

