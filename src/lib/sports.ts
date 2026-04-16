export type SportId =
  | "basketball"
  | "football"
  | "rugby"
  | "tennis"
  | "dancing"
  | "fitness"
  | "swimming"
  | "mma";

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
  rugby: {
    id: "rugby",
    name: "Rugby",
    emoji: "🏉",
    member: "Player",
    members: "Players",
    numberLabel: "Jersey #",
    eventSingular: "Match",
    eventPlural: "Matches",
    primary: "0.55 0.18 28",
    primaryFg: "0.98 0.01 28",
    accent: "0.35 0.10 28",
  },
  tennis: {
    id: "tennis",
    name: "Tennis",
    emoji: "🎾",
    member: "Player",
    members: "Players",
    numberLabel: "Ranking #",
    eventSingular: "Match",
    eventPlural: "Matches",
    primary: "0.85 0.20 115",
    primaryFg: "0.20 0.03 115",
    accent: "0.50 0.15 115",
  },
  dancing: {
    id: "dancing",
    name: "Dancing",
    emoji: "💃",
    member: "Dancer",
    members: "Dancers",
    numberLabel: "Recital #",
    eventSingular: "Performance",
    eventPlural: "Performances",
    primary: "0.70 0.22 340",
    primaryFg: "0.98 0.01 340",
    accent: "0.50 0.18 340",
  },
  fitness: {
    id: "fitness",
    name: "Fitness",
    emoji: "💪",
    member: "Member",
    members: "Members",
    numberLabel: "Member #",
    eventSingular: "Session",
    eventPlural: "Sessions",
    primary: "0.65 0.20 260",
    primaryFg: "0.98 0.01 260",
    accent: "0.45 0.15 260",
  },
  swimming: {
    id: "swimming",
    name: "Swimming",
    emoji: "🏊",
    member: "Athlete",
    members: "Athletes",
    numberLabel: "Lane #",
    eventSingular: "Meet",
    eventPlural: "Meets",
    primary: "0.70 0.15 220",
    primaryFg: "0.98 0.01 220",
    accent: "0.50 0.13 220",
  },
  mma: {
    id: "mma",
    name: "MMA",
    emoji: "🥊",
    member: "Fighter",
    members: "Fighters",
    numberLabel: "Weight Class",
    eventSingular: "Bout",
    eventPlural: "Bouts",
    primary: "0.60 0.22 25",
    primaryFg: "0.98 0.01 25",
    accent: "0.20 0.02 25",
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
