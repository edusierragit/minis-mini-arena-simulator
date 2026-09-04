// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("anonymous analytics", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    localStorage.clear();
    document.head.innerHTML = "";
    delete window.goatcounter;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    delete window.goatcounter;
  });

  it("stays completely disabled without a configured endpoint", async () => {
    const { initializeAnalytics, trackAnalyticsEvent } = await import("../src/analytics");

    initializeAnalytics();
    trackAnalyticsEvent("class-selected", { class: "mage" });

    expect(document.querySelector("#goatcounter-analytics")).toBeNull();
  });

  it("loads the privacy-friendly client and sends only aggregate event dimensions", async () => {
    vi.stubEnv("VITE_GOATCOUNTER_ENDPOINT", "https://minis-arena.goatcounter.com/count");
    const { initializeAnalytics, trackAnalyticsEvent } = await import("../src/analytics");

    initializeAnalytics();
    trackAnalyticsEvent("practice-started", { rounds: 30, class: "Mage", difficulty: "Normal" });

    const script = document.querySelector<HTMLScriptElement>("#goatcounter-analytics");
    expect(script?.dataset.goatcounter).toBe("https://minis-arena.goatcounter.com/count");
    expect(script?.src).toBe("https://gc.zgo.at/count.v5.js");

    const count = vi.fn();
    window.goatcounter = { count };
    script?.dispatchEvent(new Event("load"));

    expect(count).toHaveBeenNthCalledWith(1, {
      path: "event/site-opened/browser-other/device-desktop/language-en/navigationtype-unknown/os-other/referrer-direct/viewport-standard/visittype-first",
      title: "Site Opened",
      event: true,
      no_session: true,
    });
    expect(count).toHaveBeenNthCalledWith(2, {
      path: "event/practice-started/class-mage/difficulty-normal/rounds-30",
      title: "Practice Started",
      event: true,
      no_session: true,
    });
  });

  it("uses the same-origin Cloudflare endpoint without loading a third-party script", async () => {
    vi.stubEnv("VITE_FIRST_PARTY_ANALYTICS_ENDPOINT", "/api/analytics");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const { initializeAnalytics, trackAnalyticsEvent } = await import("../src/analytics");

    initializeAnalytics();
    trackAnalyticsEvent("practice-started", { class: "mage", difficulty: "normal", rounds: 30 });

    expect(document.querySelector("#goatcounter-analytics")).toBeNull();
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
