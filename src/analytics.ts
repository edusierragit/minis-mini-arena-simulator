type AnalyticsEventName =
  | "site-opened"
  | "class-selected"
  | "practice-started"
  | "practice-restarted"
  | "session-completed";

type AnalyticsDimensions = Record<string, string | number | boolean>;

interface GoatCounterVars {
  path: string;
  title: string;
  event: true;
  no_session: true;
}

interface GoatCounterClient {
  count?: (vars: GoatCounterVars) => void;
}

declare global {
  interface Window {
    goatcounter?: GoatCounterClient;
  }
}

const SCRIPT_ID = "goatcounter-analytics";
const MAX_QUEUED_EVENTS = 20;
const queuedEvents: GoatCounterVars[] = [];

function configuredEndpoint(): string | null {
  const value = import.meta.env.VITE_GOATCOUNTER_ENDPOINT?.trim();
  if (!value) return null;

  try {
    const endpoint = new URL(value);
    return endpoint.protocol === "https:" ? endpoint.toString() : null;
  } catch {
    return null;
  }
}

function slug(value: string | number | boolean): string {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";
}

function sendOrQueue(event: GoatCounterVars) {
  if (window.goatcounter?.count) {
    window.goatcounter.count(event);
    return;
  }

  if (queuedEvents.length < MAX_QUEUED_EVENTS) queuedEvents.push(event);
}

function flushQueue() {
  if (!window.goatcounter?.count) return;
  queuedEvents.splice(0).forEach((event) => window.goatcounter?.count?.(event));
}

export function initializeAnalytics() {
  const endpoint = configuredEndpoint();
  if (!endpoint || document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = "https://gc.zgo.at/count.v5.js";
  script.crossOrigin = "anonymous";
  script.integrity = "sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ";
  script.dataset.goatcounter = endpoint;
  script.addEventListener("load", flushQueue, { once: true });
  document.head.appendChild(script);
  trackAnalyticsEvent("site-opened");
}

export function trackAnalyticsEvent(name: AnalyticsEventName, dimensions: AnalyticsDimensions = {}) {
  if (!configuredEndpoint()) return;

  const dimensionPath = Object.entries(dimensions)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${slug(key)}-${slug(value)}`)
    .join("/");
  const path = ["event", name, dimensionPath].filter(Boolean).join("/");

  sendOrQueue({
    path,
    title: name.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" "),
    event: true,
    no_session: true,
  });
}
