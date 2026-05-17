export type SportId = "basketball" | "football";

export interface SportConfig {
  id: SportId;
  name: string;
  emoji: string;
  // Terminology
  member: string; // singular: "Player"
  members: string; // plural: "Players"
  numberLabel: string; // "Jersey #"
  eventSingular: string; // "Match"
  eventPlural: string; // "Matches"
  // Theme — OKLCH triplets used inside oklch(...) in CSS vars
  primary: string; // accent color
  primaryFg: string; // text on primary
  accent: string; // secondary accent
}

export const SPORTS: Record<SportId, SportConfig> = {
  basketball: {
    id: "basketball",
    name: "Basketball",
    emoji: "🏀",
    member: "Player",
    members: "Players",
    numberLabel: "Jersey #",
    eventSingular: "Match",
    eventPlural: "Matches",
    primary: "0.68 0.19 45",
    primaryFg: "0.15 0.02 50",
    accent: "0.25 0.02 50",
  },
  football: {
    id: "football",
    name: "Football",
    emoji: "⚽",
    member: "Player",
    members: "Players",
    numberLabel: "Jersey #",
    eventSingular: "Match",
    eventPlural: "Matches",
    primary: "0.62 0.17 145",
    primaryFg: "0.98 0.01 145",
    accent: "0.45 0.12 145",
  },
};

export const SPORT_LIST: SportConfig[] = Object.values(SPORTS);

export function getSport(id: string | null | undefined): SportConfig {
  if (id && id in SPORTS) return SPORTS[id as SportId];
  return SPORTS.basketball;
}

export function applySportTheme(sport: SportConfig) {
  const root = document.documentElement;
  root.style.setProperty("--primary", `oklch(${sport.primary})`);
  root.style.setProperty("--primary-foreground", `oklch(${sport.primaryFg})`);
  root.style.setProperty("--accent", `oklch(${sport.accent})`);
  root.style.setProperty("--ring", `oklch(${sport.primary})`);
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
