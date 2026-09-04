const EVENT_NAMES = [
  "site-opened",
  "class-selected",
  "practice-started",
  "practice-restarted",
  "session-completed",
] as const;

const CLASS_IDS = new Set(["mage", "rogue", "priest", "paladin", "druid", "shaman"]);
const DIFFICULTIES = new Set(["slow", "normal", "fast"]);
const BROWSERS = new Set(["brave", "chrome", "edge", "firefox", "opera", "safari", "other"]);
const OPERATING_SYSTEMS = new Set(["windows", "macos", "linux", "chromeos", "android", "ios", "other"]);
const DEVICES = new Set(["desktop", "tablet", "mobile"]);
const VIEWPORTS = new Set(["compact", "standard", "wide"]);
const VISIT_TYPES = new Set(["first", "returning", "unknown"]);

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
  browser: string;
  operatingSystem: string;
  device: string;
  language: string;
  viewport: string;
  visitType: string;
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
  const browserCandidate = normalizedToken(dimensions.browser, 16);
  const operatingSystemCandidate = normalizedToken(dimensions.os, 16);
  const deviceCandidate = normalizedToken(dimensions.device, 16);
  const languageCandidate = normalizedToken(dimensions.language, 8);
  const viewportCandidate = normalizedToken(dimensions.viewport, 16);
  const visitTypeCandidate = normalizedToken(dimensions.visitType, 16);

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
    browser: acceptsAcquisition && BROWSERS.has(browserCandidate) ? browserCandidate : "other",
    operatingSystem: acceptsAcquisition && OPERATING_SYSTEMS.has(operatingSystemCandidate) ? operatingSystemCandidate : "other",
    device: acceptsAcquisition && DEVICES.has(deviceCandidate) ? deviceCandidate : "desktop",
    language: acceptsAcquisition && /^[a-z]{2}$/.test(languageCandidate) ? languageCandidate : "other",
    viewport: acceptsAcquisition && VIEWPORTS.has(viewportCandidate) ? viewportCandidate : "standard",
    visitType: acceptsAcquisition && VISIT_TYPES.has(visitTypeCandidate) ? visitTypeCandidate : "unknown",
  };
}
