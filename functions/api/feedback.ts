import { jsonResponse } from "../_types";
import type { AnalyticsEnv, PagesHandler } from "../_types";

const MAX_BODY_BYTES = 4096;
const CATEGORIES = new Set(["idea", "confusing", "bug", "other"]);

function compactToken(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .slice(0, maxLength)
    .replace(/[^a-z0-9._/-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeMessage(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, 800);
}

async function ensureFeedbackSchema(env: AnalyticsEnv) {
  if (!env.ANALYTICS_DB) return;
  await env.ANALYTICS_DB.prepare(`
    CREATE TABLE IF NOT EXISTS feedback_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      category TEXT NOT NULL CHECK (category IN ('idea', 'confusing', 'bug', 'other')),
      message TEXT NOT NULL CHECK (length(message) BETWEEN 10 AND 800),
      page TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT '',
      campaign TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'planned', 'done'))
    )
  `).run();
  await env.ANALYTICS_DB.prepare(`
    CREATE INDEX IF NOT EXISTS idx_feedback_messages_created_at
    ON feedback_messages (created_at DESC)
  `).run();
}

async function insertFeedback(
  env: AnalyticsEnv,
  values: [string, string, string, string, string],
) {
  if (!env.ANALYTICS_DB) return;
  const insert = () => env.ANALYTICS_DB!.prepare(`
    INSERT INTO feedback_messages (category, message, page, source, campaign)
    VALUES (?, ?, ?, ?, ?)
  `).bind(...values).run();

  try {
    await insert();
  } catch {
    // A new deployment can receive feedback before its versioned D1 migration
    // is applied. Initialize the fixed schema once, then retry the message.
    await ensureFeedbackSchema(env);
    await insert();
  }
}

export const onRequestPost: PagesHandler<AnalyticsEnv> = async ({ request, env }) => {
  const requestUrl = new URL(request.url);
  if (request.headers.get("Origin") !== requestUrl.origin) {
    return jsonResponse({ error: "Origin not allowed" }, 403);
  }
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return jsonResponse({ error: "JSON required" }, 415);
  }
  if (!env.ANALYTICS_DB) return jsonResponse({ error: "Feedback is not configured" }, 503);

  const declaredLength = Number(request.headers.get("Content-Length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) return jsonResponse({ error: "Payload too large" }, 413);

  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) return jsonResponse({ error: "Payload too large" }, 413);
    const payload = JSON.parse(rawBody) as Record<string, unknown>;

    // A filled honeypot is treated as accepted so simple bots receive no signal.
    if (typeof payload.website === "string" && payload.website.trim()) {
      return jsonResponse({ ok: true }, 201);
    }

    const category = compactToken(payload.category, 20);
    const message = normalizeMessage(payload.message);
    if (!CATEGORIES.has(category) || message.length < 10) {
      return jsonResponse({ error: "Invalid feedback" }, 400);
    }

    await insertFeedback(env, [
      category,
      message,
      compactToken(payload.page, 120),
      compactToken(payload.source, 60),
      compactToken(payload.campaign, 80),
    ]);

    return jsonResponse({ ok: true }, 201);
  } catch (error) {
    console.error("Failed to record feedback", error);
    return jsonResponse({ error: "Unable to save feedback" }, 503);
  }
};

export const onRequestOptions: PagesHandler<AnalyticsEnv> = async () => new Response(null, {
  status: 204,
  headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
});
