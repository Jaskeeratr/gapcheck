export type ApplicationStatus =
  | "applied"
  | "phone_screen"
  | "interview"
  | "rejected"
  | "offer";

export type Application = {
  id: string;
  user_id: string;
  job_id: string;
  status: ApplicationStatus;
  applied_at: string;
  updated_at: string;
  notes?: string | null;
};

