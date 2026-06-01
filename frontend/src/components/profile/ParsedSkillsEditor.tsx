import type { Dispatch, SetStateAction } from "react";
import type { ExperienceItem } from "./types";

type KeywordPreset = { label: string; terms: string[] };

type ParsedSkillsEditorProps = {
  skills: string[];
  setSkills: Dispatch<SetStateAction<string[]>>;
  newSkill: string;
  setNewSkill: Dispatch<SetStateAction<string>>;
  addSkill: () => void;
  domains: string[];
  setDomains: Dispatch<SetStateAction<string[]>>;
  newDomain: string;
  setNewDomain: Dispatch<SetStateAction<string>>;
  addDomain: () => void;
  applyKeywordPreset: (terms: string[]) => void;
  keywordPresets: KeywordPreset[];
  experienceYearsInput: string;
  setExperienceYearsInput: Dispatch<SetStateAction<string>>;
  internshipCountInput: string;
  setInternshipCountInput: Dispatch<SetStateAction<string>>;
  experienceItems: ExperienceItem[];
  setExperienceItems: Dispatch<SetStateAction<ExperienceItem[]>>;
  addExperienceItem: () => void;
  degreeInput: string;
  setDegreeInput: Dispatch<SetStateAction<string>>;
  programInput: string;
  setProgramInput: Dispatch<SetStateAction<string>>;
  universityInput: string;
  setUniversityInput: Dispatch<SetStateAction<string>>;
  yearInput: string;
  setYearInput: Dispatch<SetStateAction<string>>;
  parseCommaList: (input: string) => string[];
};

export default function ParsedSkillsEditor({
  skills,
  setSkills,
  newSkill,
  setNewSkill,
  addSkill,
  domains,
  setDomains,
  newDomain,
  setNewDomain,
  addDomain,
  applyKeywordPreset,
  keywordPresets,
  experienceYearsInput,
  setExperienceYearsInput,
  internshipCountInput,
  setInternshipCountInput,
  experienceItems,
  setExperienceItems,
  addExperienceItem,
  degreeInput,
  setDegreeInput,
  programInput,
  setProgramInput,
  universityInput,
  setUniversityInput,
  yearInput,
  setYearInput,
  parseCommaList,
}: ParsedSkillsEditorProps) {
  return (
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
              <button onClick={() => setSkills((prev) => prev.filter((_, i) => i !== index))} className="text-blue-700/70 hover:text-blue-900" aria-label={`Remove ${skill}`}>x</button>
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
                <button onClick={() => setExperienceItems((prev) => prev.filter((_, i) => i !== index))} className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700">Remove</button>
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
          <h2 className="text-base font-bold text-slate-900">Job Keywords</h2>
          <span className="text-xs text-slate-500">{domains.length} items</span>
        </div>
        <p className="mb-2 text-xs text-slate-500">These keywords personalize your Job Board feed. Add role families, stacks, tools, or target areas.</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {keywordPresets.map((preset) => (
            <button key={preset.label} type="button" onClick={() => applyKeywordPreset(preset.terms)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">+ {preset.label}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {domains.map((domain, index) => (
            <span key={`${domain}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              {domain}
              <button onClick={() => setDomains((prev) => prev.filter((_, i) => i !== index))} className="text-indigo-700/70 hover:text-indigo-900" aria-label={`Remove ${domain}`}>x</button>
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
    </>
  );
}

