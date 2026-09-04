import { normalizeAnalyticsPayload } from "../_analytics";
import { jsonResponse } from "../_types";
import type { AnalyticsEnv, PagesHandler } from "../_types";

const MAX_BODY_BYTES = 4096;

interface CloudflareRequest extends Request {
  cf?: { country?: string };
}

function emptyResponse(status = 204, skipped?: string): Response {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (skipped) headers.set("X-Analytics-Skipped", skipped);
  return new Response(null, { status, headers });
}

export const onRequestPost: PagesHandler<AnalyticsEnv> = async ({ request, env }) => {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (origin && origin !== requestUrl.origin) return jsonResponse({ error: "Origin not allowed" }, 403);

  const declaredLength = Number(request.headers.get("Content-Length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) return jsonResponse({ error: "Payload too large" }, 413);
  if (!env.ANALYTICS_DB) return jsonResponse({ error: "Analytics database is not configured" }, 503);

  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) return jsonResponse({ error: "Payload too large" }, 413);

    const cloudflareRequest = request as CloudflareRequest;
    const record = normalizeAnalyticsPayload(JSON.parse(rawBody), cloudflareRequest.cf?.country);
    if (!record) return jsonResponse({ error: "Invalid analytics event" }, 400);

    const day = new Date().toISOString().slice(0, 10);
    await env.ANALYTICS_DB.prepare(`
      INSERT INTO analytics_daily (
        day, event, class_id, difficulty, rounds, country, referrer, source, campaign, count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT (day, event, class_id, difficulty, rounds, country, referrer, source, campaign)
      DO UPDATE SET count = count + 1
    `).bind(
      day,
      record.event,
      record.classId,
      record.difficulty,
      record.rounds,
      record.country,
      record.referrer,
      record.source,
      record.campaign,
    ).run();

    if (record.event === "site-opened") {
      try {
        await env.ANALYTICS_DB.prepare(`
          INSERT INTO analytics_client_daily (
            day, browser, operating_system, device, language, viewport, visit_type, count
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
          ON CONFLICT (day, browser, operating_system, device, language, viewport, visit_type)
          DO UPDATE SET count = count + 1
        `).bind(
          day,
          record.browser,
          record.operatingSystem,
          record.device,
          record.language,
          record.viewport,
          record.visitType,
        ).run();
      } catch (classificationError) {
        // Core counters remain available while the optional classification
        // migration is being applied.
        console.warn("Unable to record anonymous client classification", classificationError);
      }

      try {
        await env.ANALYTICS_DB.prepare(`
          INSERT INTO analytics_navigation_daily (navigation_type, day, count)
          VALUES (?, ?, 1)
          ON CONFLICT (navigation_type, day)
          DO UPDATE SET count = count + 1
        `).bind(record.navigationType, day).run();
      } catch (navigationError) {
        // Page totals keep working until the optional navigation migration exists.
        console.warn("Unable to record navigation classification", navigationError);
      }
    }

    return emptyResponse();
  } catch (error) {
    console.error("Failed to record analytics event", error);
    return jsonResponse({ error: "Unable to record event" }, 503);
  }
};

export const onRequestOptions: PagesHandler<AnalyticsEnv> = async () => emptyResponse();
