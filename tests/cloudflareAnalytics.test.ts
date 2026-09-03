import { describe, expect, it } from "vitest";
import { normalizeAnalyticsPayload } from "../functions/_analytics";
import { onRequestPost } from "../functions/api/analytics";
import type { AnalyticsEnv, D1PreparedStatement } from "../functions/_types";

function requestFor(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://arena.pages.dev/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://arena.pages.dev", ...headers },
    body: JSON.stringify(body),
  });
}

describe("Cloudflare analytics payload validation", () => {
  it("keeps only approved practice dimensions", () => {
    expect(normalizeAnalyticsPayload({
      event: "practice-started",
      dimensions: {
        class: "Mage",
        difficulty: "Normal",
        rounds: 30,
        bind: "Ctrl+WheelUp",
        playerName: "Should never be stored",
      },
    }, "ar")).toEqual({
      event: "practice-started",
      classId: "mage",
      difficulty: "normal",
      rounds: 30,
      country: "AR",
      referrer: "",
      source: "",
      campaign: "",
    });
  });

  it("accepts sanitized acquisition data only for a site open", () => {
    expect(normalizeAnalyticsPayload({
      event: "site-opened",
      dimensions: {
        referrer: "Web.WhatsApp.COM",
        source: "WhatsApp Group",
        campaign: "Launch #1",
        class: "rogue",
      },
    }, "invalid-country")).toEqual({
      event: "site-opened",
      classId: "",
      difficulty: "",
      rounds: 0,
      country: "XX",
      referrer: "web.whatsapp.com",
      source: "whatsapp-group",
      campaign: "launch-1",
    });
  });

  it("rejects unknown events and invalid payloads", () => {
    expect(normalizeAnalyticsPayload({ event: "pressed-bind", dimensions: { bind: "Shift+1" } })).toBeNull();
    expect(normalizeAnalyticsPayload("site-opened")).toBeNull();
  });

  it("writes a validated aggregate counter through a prepared statement", async () => {
    let boundValues: Array<string | number | null> = [];
    const statement: D1PreparedStatement = {
      bind: (...values) => {
        boundValues = values;
        return statement;
      },
      run: async () => ({ results: [], success: true }),
      all: async () => ({ results: [], success: true }),
    };
    const env: AnalyticsEnv = { ANALYTICS_DB: { prepare: () => statement } };

    const response = await onRequestPost({
      request: requestFor({ event: "practice-started", dimensions: { class: "mage", difficulty: "fast", rounds: 30 } }),
      env,
    });

    expect(response.status).toBe(204);
    expect(boundValues.slice(1)).toEqual(["practice-started", "mage", "fast", 30, "XX", "", "", ""]);
  });

  it("honors DNT before touching the database", async () => {
    let prepared = false;
    const env: AnalyticsEnv = {
      ANALYTICS_DB: {
        prepare: () => {
          prepared = true;
          throw new Error("should not prepare a query");
        },
      },
    };

    const response = await onRequestPost({
      request: requestFor({ event: "site-opened" }, { DNT: "1" }),
      env,
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("X-Analytics-Skipped")).toBe("privacy-signal");
    expect(prepared).toBe(false);
  });
});
