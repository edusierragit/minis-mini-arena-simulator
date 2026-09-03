import { jsonResponse } from "../_types";
import type { AnalyticsEnv, D1Database, PagesHandler } from "../_types";

interface CountRow {
  value: string;
  count: number;
}

interface DailyRow {
  day: string;
  event: string;
  count: number;
}

async function groupedCounts(db: D1Database, column: string, fromDay: string, condition = "1 = 1") {
  const result = await db.prepare(`
    SELECT ${column} AS value, SUM(count) AS count
    FROM analytics_daily
    WHERE day >= ? AND ${condition}
    GROUP BY ${column}
    ORDER BY count DESC
    LIMIT 50
  `).bind(fromDay).all<CountRow>();
  return result.results;
}

export const onRequestGet: PagesHandler<AnalyticsEnv> = async ({ request, env }) => {
  if (!env.ANALYTICS_DB || !env.ANALYTICS_ADMIN_TOKEN) {
    return jsonResponse({ error: "Stats dashboard is not configured" }, 503);
  }

  if (request.headers.get("Authorization") !== `Bearer ${env.ANALYTICS_ADMIN_TOKEN}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "WWW-Authenticate": "Bearer",
      },
    });
  }

  const requestUrl = new URL(request.url);
  const requestedDays = Number(requestUrl.searchParams.get("days") ?? 30);
  const days = Number.isInteger(requestedDays) ? Math.min(90, Math.max(1, requestedDays)) : 30;
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days + 1);
  const fromDay = start.toISOString().slice(0, 10);
  const db = env.ANALYTICS_DB;

  try {
    const dailyResult = await db.prepare(`
      SELECT day, event, SUM(count) AS count
      FROM analytics_daily
      WHERE day >= ?
      GROUP BY day, event
      ORDER BY day ASC, event ASC
    `).bind(fromDay).all<DailyRow>();

    const [totals, classes, difficulties, rounds, countries, referrers, sources, campaigns] = await Promise.all([
      groupedCounts(db, "event", fromDay),
      groupedCounts(db, "class_id", fromDay, "class_id != ''"),
      groupedCounts(db, "difficulty", fromDay, "difficulty != ''"),
      groupedCounts(db, "rounds", fromDay, "rounds > 0"),
      groupedCounts(db, "country", fromDay),
      groupedCounts(db, "referrer", fromDay, "referrer != ''"),
      groupedCounts(db, "source", fromDay, "source != ''"),
      groupedCounts(db, "campaign", fromDay, "campaign != ''"),
    ]);

    return jsonResponse({
      generatedAt: new Date().toISOString(),
      fromDay,
      days,
      totals,
      byDay: dailyResult.results,
      classes,
      difficulties,
      rounds,
      countries,
      referrers,
      sources,
      campaigns,
    });
  } catch (error) {
    console.error("Failed to load analytics summary", error);
    return jsonResponse({ error: "Unable to load statistics" }, 503);
  }
};
