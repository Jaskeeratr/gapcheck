import type { CandidateProfile } from "./types";

function formatFileSize(size: number): string {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

type ResumeUploadCardProps = {
  profile: CandidateProfile | null;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  resumeFileName: string | null;
  uploadedAt: string | null;
  userId: string | null;
  uploading: boolean;
  removing: boolean;
  uploadDisabled: boolean;
  onUpload: () => void;
  onRemove: () => void;
  onReviewParsedData: () => void;
};

export default function ResumeUploadCard({
  profile,
  selectedFile,
  setSelectedFile,
  resumeFileName,
  uploadedAt,
  userId,
  uploading,
  removing,
  uploadDisabled,
  onUpload,
  onRemove,
  onReviewParsedData,
}: ResumeUploadCardProps) {
  return (
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

        <label htmlFor="resume-upload" className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 px-5 py-8 text-center transition hover:border-blue-400 hover:from-blue-100 hover:to-cyan-100">
          <span className="rounded-2xl bg-white px-4 py-3 text-2xl shadow-sm">PDF</span>
          <span className="mt-3 text-sm font-bold text-slate-900">{selectedFile ? selectedFile.name : "Choose your resume PDF"}</span>
          <span className="mt-1 text-xs text-slate-500">{selectedFile ? `${formatFileSize(selectedFile.size)} ready to upload` : "Click to select a PDF from your computer"}</span>
        </label>
        <input id="resume-upload" type="file" accept=".pdf,application/pdf" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} className="sr-only" />

        {selectedFile ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-blue-950">{selectedFile.name}</p>
              <p className="text-xs text-blue-700">{formatFileSize(selectedFile.size)} · PDF selected</p>
            </div>
            <button type="button" onClick={() => setSelectedFile(null)} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">Clear</button>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={onUpload} disabled={uploadDisabled} className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-5 py-3 text-sm font-bold text-white transition hover:from-blue-800 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-50">
            {uploading ? "Parsing in backend..." : profile ? "Replace Resume" : "Upload Resume"}
          </button>
          <button onClick={onRemove} disabled={removing || !profile} className="rounded-xl border border-rose-300 bg-white px-5 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">
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
        <button type="button" onClick={onReviewParsedData} disabled={!profile} className="mt-6 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40">
          Review Parsed Data
        </button>
      </div>
    </div>
  );
}

