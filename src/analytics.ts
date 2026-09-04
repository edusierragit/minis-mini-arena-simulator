export type AnalyticsEventName =
  | "site-opened"
  | "class-selected"
  | "practice-started"
  | "practice-restarted"
  | "session-completed";

type AnalyticsDimensions = Record<string, string | number | boolean>;
const VISITED_STORAGE_KEY = "minis-mini-arena-simulator:visited";

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

function browserFamily(): string {
  const userAgent = navigator.userAgent;
  if ("brave" in navigator) return "brave";
  if (/Edg\//.test(userAgent)) return "edge";
  if (/OPR\//.test(userAgent)) return "opera";
  if (/Firefox\//.test(userAgent)) return "firefox";
  if (/Chrome\//.test(userAgent)) return "chrome";
  if (/Safari\//.test(userAgent)) return "safari";
  return "other";
}

function operatingSystem(): string {
  const userAgent = navigator.userAgent;
  if (/CrOS/.test(userAgent)) return "chromeos";
  if (/Android/.test(userAgent)) return "android";
  if (/iPhone|iPad|iPod/.test(userAgent)) return "ios";
  if (/Windows/.test(userAgent)) return "windows";
  if (/Mac OS X|Macintosh/.test(userAgent)) return "macos";
  if (/Linux/.test(userAgent)) return "linux";
  return "other";
}

function deviceCategory(): string {
  const userAgent = navigator.userAgent;
  if (/iPad|Tablet/.test(userAgent) || (/Android/.test(userAgent) && !/Mobile/.test(userAgent))) return "tablet";
  if (/Mobi|iPhone|iPod|Android/.test(userAgent)) return "mobile";
  return "desktop";
}

function visitType(): string {
  try {
    const returning = localStorage.getItem(VISITED_STORAGE_KEY) === "1";
    localStorage.setItem(VISITED_STORAGE_KEY, "1");
    return returning ? "returning" : "first";
  } catch {
    return "unknown";
  }
}

function navigationType(): string {
  if (typeof performance.getEntriesByType !== "function") return "unknown";
  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (navigation?.type === "reload") return "reload";
  if (navigation?.type === "back_forward") return "back-forward";
  if (navigation?.type === "navigate") return "navigate";
  return "unknown";
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

  const language = navigator.language?.slice(0, 2).toLowerCase();
  const viewport = window.innerWidth < 768 ? "compact" : window.innerWidth >= 1440 ? "wide" : "standard";
  const dimensions: AnalyticsDimensions = {
    referrer,
    browser: browserFamily(),
    os: operatingSystem(),
    device: deviceCategory(),
    language: language && /^[a-z]{2}$/.test(language) ? language : "other",
    viewport,
    visitType: visitType(),
    navigationType: navigationType(),
  };
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

export function initializeAnalytics() {
  const endpoint = configuredFirstPartyEndpoint();
  if (endpoint) sendFirstPartyEvent(endpoint, "site-opened", pageOpenDimensions());
}

export function trackAnalyticsEvent(name: AnalyticsEventName, dimensions: AnalyticsDimensions = {}) {
  const endpoint = configuredFirstPartyEndpoint();
  if (endpoint) sendFirstPartyEvent(endpoint, name, dimensions);
}
