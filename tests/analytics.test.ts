// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("anonymous analytics", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    document.head.innerHTML = "";
    delete window.goatcounter;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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
      path: "event/site-opened",
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
});
