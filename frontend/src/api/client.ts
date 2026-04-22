import axios from "axios";

function normalizeBaseUrl(value: string | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "http://127.0.0.1:8000";
  return raw.replace(/\/+$/, "");
}

export const api = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL),
});
