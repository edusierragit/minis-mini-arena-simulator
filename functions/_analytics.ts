const EVENT_NAMES = [
  "site-opened",
  "class-selected",
  "practice-started",
  "practice-restarted",
  "session-completed",
] as const;

const CLASS_IDS = new Set(["mage", "rogue", "priest", "paladin", "druid", "shaman"]);
const DIFFICULTIES = new Set(["slow", "normal", "fast"]);

export type AnalyticsEventName = typeof EVENT_NAMES[number];

export interface AnalyticsRecord {
  event: AnalyticsEventName;
  classId: string;
  difficulty: string;
  rounds: number;
  country: string;
  referrer: string;
  source: string;
  campaign: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizedToken(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .slice(0, maxLength)
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizedCountry(value: unknown): string {
  if (typeof value !== "string") return "XX";
  const country = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(country) ? country : "XX";
}

export function normalizeAnalyticsPayload(payload: unknown, country?: unknown): AnalyticsRecord | null {
  if (!isRecord(payload) || !EVENT_NAMES.includes(payload.event as AnalyticsEventName)) return null;
  const event = payload.event as AnalyticsEventName;
  const dimensions = isRecord(payload.dimensions) ? payload.dimensions : {};

  const classCandidate = normalizedToken(dimensions.class, 24);
  const difficultyCandidate = normalizedToken(dimensions.difficulty, 16);
  const roundsCandidate = typeof dimensions.rounds === "number"
    ? Math.trunc(dimensions.rounds)
    : Number(dimensions.rounds);

  const acceptsClass = event !== "site-opened";
  const acceptsPracticeSettings = event === "practice-started"
    || event === "practice-restarted"
    || event === "session-completed";
  const acceptsAcquisition = event === "site-opened";

  return {
    event,
    classId: acceptsClass && CLASS_IDS.has(classCandidate) ? classCandidate : "",
    difficulty: acceptsPracticeSettings && DIFFICULTIES.has(difficultyCandidate) ? difficultyCandidate : "",
    rounds: acceptsPracticeSettings && Number.isInteger(roundsCandidate) && roundsCandidate >= 1 && roundsCandidate <= 100
      ? roundsCandidate
      : 0,
    country: normalizedCountry(country),
    referrer: acceptsAcquisition ? normalizedToken(dimensions.referrer, 100) || "direct" : "",
    source: acceptsAcquisition ? normalizedToken(dimensions.source, 60) : "",
    campaign: acceptsAcquisition ? normalizedToken(dimensions.campaign, 80) : "",
  };
}
