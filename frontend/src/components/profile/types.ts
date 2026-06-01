export type ExperienceItem = {
  title: string;
  company: string;
  duration: string;
  highlights: string[];
};

export type ProfileProject = {
  name: string;
  tech_stack: string[];
  domain: string;
  description: string;
};

export type ProfileEducation = {
  degree?: string;
  program?: string;
  university?: string;
  year?: number | null;
};

export type CandidateProfile = {
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

