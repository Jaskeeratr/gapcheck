import type { Dispatch, SetStateAction } from "react";
import type { ProfileProject } from "./types";

type ParsedProjectsEditorProps = {
  projects: ProfileProject[];
  setProjects: Dispatch<SetStateAction<ProfileProject[]>>;
  addProject: () => void;
  parseCommaList: (input: string) => string[];
};

export default function ParsedProjectsEditor({ projects, setProjects, addProject, parseCommaList }: ParsedProjectsEditorProps) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Projects</h2>
        <button onClick={addProject} className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700">Add Project</button>
      </div>
      <div className="space-y-3">
        {projects.map((project, index) => (
          <div key={`proj-${index}`} className="rounded-xl border border-slate-200 p-3">
            <div className="mb-2 flex justify-end">
              <button onClick={() => setProjects((prev) => prev.filter((_, i) => i !== index))} className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700">Remove</button>
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
  );
}

