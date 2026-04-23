// Client-side coach session storage (localStorage)
// Stores a simple coach session object so the coach UI knows who is logged in.

const KEY = "coach_session_v1";

export interface CoachSession {
  coachId: string;
  username: string;
  displayName: string;
  clubUserId: string;
  clubName?: string;
  token: string; // simple opaque token (coach id, server validates against DB)
}

export function getCoachSession(): CoachSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CoachSession;
  } catch {
    return null;
  }
}

export function setCoachSession(s: CoachSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearCoachSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function generateCoachPassword(): string {
  // Simple 10-char alnum password (avoid ambiguous chars)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz";
  let out = "";
  const arr = new Uint8Array(10);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
    for (let i = 0; i < arr.length; i++) out += chars[arr[i] % chars.length];
  } else {
    for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function slugifyClubName(name: string): string {
  // Transliterate-ish + lowercase + alnum only
  return name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20) || "club";
}
