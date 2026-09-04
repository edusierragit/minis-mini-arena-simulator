import { describe, expect, it } from "vitest";
import { normalizeAnalyticsPayload } from "../functions/_analytics";
import { onRequestPost } from "../functions/api/analytics";
import { onRequestGet } from "../functions/api/stats";
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
      browser: "other",
      operatingSystem: "other",
      device: "desktop",
      language: "other",
      viewport: "standard",
      visitType: "unknown",
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
        browser: "Brave",
        os: "Windows",
        device: "Desktop",
        language: "es",
        viewport: "Wide",
        visitType: "First",
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
      browser: "brave",
      operatingSystem: "windows",
      device: "desktop",
      language: "es",
      viewport: "wide",
      visitType: "first",
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

  it("stores only broad client classifications for site opens", async () => {
    const writes: Array<Array<string | number | null>> = [];
    const env: AnalyticsEnv = {
      ANALYTICS_DB: {
        prepare: () => {
          let values: Array<string | number | null> = [];
          const statement: D1PreparedStatement = {
            bind: (...nextValues) => {
              values = nextValues;
              return statement;
            },
            run: async () => {
              writes.push(values);
              return { results: [], success: true };
            },
            all: async () => ({ results: [], success: true }),
          };
          return statement;
        },
      },
    };

    const response = await onRequestPost({
      request: requestFor({
        event: "site-opened",
        dimensions: {
          browser: "brave",
          os: "windows",
          device: "desktop",
          language: "es",
          viewport: "wide",
          visitType: "returning",
        },
      }),
      env,
    });

    expect(response.status).toBe(204);
    expect(writes).toHaveLength(2);
    expect(writes[1].slice(1)).toEqual(["brave", "windows", "desktop", "es", "wide", "returning"]);
  });

  it("counts anonymous aggregate usage even when DNT is enabled", async () => {
    let prepared = false;
    const statement: D1PreparedStatement = {
      bind: () => statement,
      run: async () => ({ results: [], success: true }),
      all: async () => ({ results: [], success: true }),
    };
    const env: AnalyticsEnv = {
      ANALYTICS_DB: {
        prepare: () => {
          prepared = true;
          return statement;
        },
      },
    };

    const response = await onRequestPost({
      request: requestFor({ event: "site-opened" }, { DNT: "1" }),
      env,
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("X-Analytics-Skipped")).toBeNull();
    expect(prepared).toBe(true);
  });

  it("keeps the all-time dashboard available before the optional client migration", async () => {
    const env: AnalyticsEnv = {
      ANALYTICS_ADMIN_TOKEN: "test-token",
      ANALYTICS_DB: {
        prepare: (query) => {
          const statement: D1PreparedStatement = {
            bind: () => statement,
            run: async () => ({ results: [], success: true }),
            all: async () => {
              if (query.includes("analytics_client_daily")) throw new Error("no such table");
              return { results: [], success: true };
            },
          };
          return statement;
        },
      },
    };

    const response = await onRequestGet({
      request: new Request("https://arena.pages.dev/api/stats", {
        headers: { Authorization: "Bearer test-token" },
      }),
      env,
    });
    const body = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.window).toBe("all-time");
    expect(body.browsers).toEqual([]);
    expect(body.visitTypes).toEqual([]);
  });
});
