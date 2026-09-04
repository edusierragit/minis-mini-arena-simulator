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

async function groupedCounts(db: D1Database, column: string, condition = "1 = 1") {
  const result = await db.prepare(`
    SELECT ${column} AS value, SUM(count) AS count
    FROM analytics_daily
    WHERE ${condition}
    GROUP BY ${column}
    ORDER BY count DESC
    LIMIT 50
  `).all<CountRow>();
  return result.results;
}

async function clientBreakdowns(db: D1Database) {
  const grouped = async (column: string) => {
    const result = await db.prepare(`
      SELECT ${column} AS value, SUM(count) AS count
      FROM analytics_client_daily
      GROUP BY ${column}
      ORDER BY count DESC
      LIMIT 50
    `).all<CountRow>();
    return result.results;
  };

  try {
    const [browsers, operatingSystems, devices, languages, viewports, visitTypes] = await Promise.all([
      grouped("browser"),
      grouped("operating_system"),
      grouped("device"),
      grouped("language"),
      grouped("viewport"),
      grouped("visit_type"),
    ]);
    return { browsers, operatingSystems, devices, languages, viewports, visitTypes };
  } catch {
    return { browsers: [], operatingSystems: [], devices: [], languages: [], viewports: [], visitTypes: [] };
  }
}

async function navigationBreakdown(db: D1Database) {
  try {
    const result = await db.prepare(`
      SELECT navigation_type AS value, SUM(count) AS count
      FROM analytics_navigation_daily
      GROUP BY navigation_type
      ORDER BY count DESC
    `).all<CountRow>();
    return result.results;
  } catch {
    return [];
  }
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

  const db = env.ANALYTICS_DB;

  try {
    const dailyResult = await db.prepare(`
      SELECT day, event, SUM(count) AS count
      FROM analytics_daily
      GROUP BY day, event
      ORDER BY day ASC, event ASC
    `).all<DailyRow>();

    const [totals, classes, difficulties, rounds, countries, referrers, sources, campaigns, clients, navigationTypes] = await Promise.all([
      groupedCounts(db, "event"),
      groupedCounts(db, "class_id", "class_id != '' AND event = 'class-selected'"),
      groupedCounts(db, "difficulty", "difficulty != '' AND event = 'practice-started'"),
      groupedCounts(db, "rounds", "rounds > 0 AND event = 'practice-started'"),
      groupedCounts(db, "country", "event = 'site-opened'"),
      groupedCounts(db, "referrer", "referrer != ''"),
      groupedCounts(db, "source", "source != ''"),
      groupedCounts(db, "campaign", "campaign != ''"),
      clientBreakdowns(db),
      navigationBreakdown(db),
    ]);

    return jsonResponse({
      generatedAt: new Date().toISOString(),
      window: "all-time",
      totals,
      byDay: dailyResult.results,
      classes,
      difficulties,
      rounds,
      countries,
      referrers,
      sources,
      campaigns,
      navigationTypes,
      ...clients,
    });
  } catch (error) {
    console.error("Failed to load analytics summary", error);
    return jsonResponse({ error: "Unable to load statistics" }, 503);
  }
};
