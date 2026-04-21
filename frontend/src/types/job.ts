export type Job = {
  id: string;
  source?: string | null;
  external_id: string;
  title: string;
  company: string;
  location?: string | null;
  description?: string | null;
  required_skills?: unknown;
  experience_required?: number | null;
  role_type?: string | null;
  domain?: string | null;
  posted_at?: string | null;
  scraped_at: string;
  is_active: boolean;
};
