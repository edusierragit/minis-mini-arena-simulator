// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("anonymous analytics", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    localStorage.clear();
    document.head.innerHTML = "";
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("stays completely disabled without a configured endpoint", async () => {
    const { initializeAnalytics, trackAnalyticsEvent } = await import("../src/analytics");

    initializeAnalytics();
    trackAnalyticsEvent("class-selected", { class: "mage" });

    expect(document.head.querySelectorAll("script")).toHaveLength(0);
  });

  it("uses the same-origin Cloudflare endpoint without loading a third-party script", async () => {
    vi.stubEnv("VITE_FIRST_PARTY_ANALYTICS_ENDPOINT", "/api/analytics");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const { initializeAnalytics, trackAnalyticsEvent } = await import("../src/analytics");

    initializeAnalytics();
    trackAnalyticsEvent("practice-started", { class: "mage", difficulty: "normal", rounds: 30 });

    expect(document.head.querySelectorAll("script")).toHaveLength(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:3000/api/analytics");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      event: "site-opened",
      dimensions: {
        referrer: "direct",
        browser: "other",
        os: "other",
        device: "desktop",
        language: "en",
        viewport: "standard",
        visitType: "first",
        navigationType: "unknown",
      },
    });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      event: "practice-started",
      dimensions: { class: "mage", difficulty: "normal", rounds: 30 },
    });
  });

  it("counts anonymous aggregate usage even when DNT is enabled", async () => {
    vi.stubEnv("VITE_FIRST_PARTY_ANALYTICS_ENDPOINT", "/api/analytics");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(navigator, "doNotTrack", { configurable: true, value: "1" });
    const { initializeAnalytics } = await import("../src/analytics");

    initializeAnalytics();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    Object.defineProperty(navigator, "doNotTrack", { configurable: true, value: null });
  });
});
