export type AnalyticsEventName =
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

const GOATCOUNTER_SCRIPT_ID = "goatcounter-analytics";
const MAX_QUEUED_EVENTS = 20;
const queuedGoatCounterEvents: GoatCounterVars[] = [];

function configuredGoatCounterEndpoint(): string | null {
  const value = import.meta.env.VITE_GOATCOUNTER_ENDPOINT?.trim();
  if (!value) return null;

  try {
    const endpoint = new URL(value);
    return endpoint.protocol === "https:" ? endpoint.toString() : null;
  } catch {
    return null;
  }
}

function configuredFirstPartyEndpoint(): string | null {
  const value = import.meta.env.VITE_FIRST_PARTY_ANALYTICS_ENDPOINT?.trim();
  if (!value || typeof window === "undefined") return null;

  try {
    const endpoint = new URL(value, window.location.origin);
    return endpoint.origin === window.location.origin ? endpoint.toString() : null;
  } catch {
    return null;
  }
}

function slug(value: string | number | boolean): string {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";
}

function pageOpenDimensions(): AnalyticsDimensions {
  const params = new URLSearchParams(window.location.search);
  let referrer = "direct";

  if (document.referrer) {
    try {
      referrer = new URL(document.referrer).hostname;
    } catch {
      referrer = "other";
    }
  }

  const dimensions: AnalyticsDimensions = { referrer };
  const source = params.get("utm_source");
  const campaign = params.get("utm_campaign");
  if (source) dimensions.source = source;
  if (campaign) dimensions.campaign = campaign;
  return dimensions;
}

function sendFirstPartyEvent(endpoint: string, name: AnalyticsEventName, dimensions: AnalyticsDimensions) {
  const body = JSON.stringify({ event: name, dimensions });

  if (typeof navigator.sendBeacon === "function") {
    try {
      const accepted = navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
      if (accepted) return;
    } catch {
      // Fall through to a keepalive request when Beacon is unavailable.
    }
  }

  void fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    credentials: "omit",
    keepalive: true,
  }).catch(() => {
    // Analytics must never interrupt gameplay.
  });
}

function sendOrQueueGoatCounterEvent(event: GoatCounterVars) {
  if (window.goatcounter?.count) {
    window.goatcounter.count(event);
    return;
  }

  if (queuedGoatCounterEvents.length < MAX_QUEUED_EVENTS) queuedGoatCounterEvents.push(event);
}

function flushGoatCounterQueue() {
  if (!window.goatcounter?.count) return;
  queuedGoatCounterEvents.splice(0).forEach((event) => window.goatcounter?.count?.(event));
}

function initializeGoatCounter(endpoint: string) {
  if (document.getElementById(GOATCOUNTER_SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = GOATCOUNTER_SCRIPT_ID;
  script.async = true;
  script.src = "https://gc.zgo.at/count.v5.js";
  script.crossOrigin = "anonymous";
  script.integrity = "sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ";
  script.dataset.goatcounter = endpoint;
  script.addEventListener("load", flushGoatCounterQueue, { once: true });
  document.head.appendChild(script);
}

export function initializeAnalytics() {
  const firstPartyEndpoint = configuredFirstPartyEndpoint();
  if (firstPartyEndpoint) {
    sendFirstPartyEvent(firstPartyEndpoint, "site-opened", pageOpenDimensions());
    return;
  }

  const goatCounterEndpoint = configuredGoatCounterEndpoint();
  if (!goatCounterEndpoint) return;
  initializeGoatCounter(goatCounterEndpoint);
  trackAnalyticsEvent("site-opened", pageOpenDimensions());
}

export function trackAnalyticsEvent(name: AnalyticsEventName, dimensions: AnalyticsDimensions = {}) {
  const firstPartyEndpoint = configuredFirstPartyEndpoint();
  if (firstPartyEndpoint) {
    sendFirstPartyEvent(firstPartyEndpoint, name, dimensions);
    return;
  }

  if (!configuredGoatCounterEndpoint()) return;
  const dimensionPath = Object.entries(dimensions)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${slug(key)}-${slug(value)}`)
    .join("/");
  const path = ["event", name, dimensionPath].filter(Boolean).join("/");

  sendOrQueueGoatCounterEvent({
    path,
    title: name.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" "),
    event: true,
    no_session: true,
  });
}
