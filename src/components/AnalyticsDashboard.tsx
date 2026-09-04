import { useState } from "react";

interface CountRow {
  value: string;
  count: number;
}

interface DailyRow {
  day: string;
  event: string;
  count: number;
}

interface AnalyticsSummary {
  generatedAt: string;
  window: "all-time";
  totals: CountRow[];
  byDay: DailyRow[];
  classes: CountRow[];
  difficulties: CountRow[];
  rounds: CountRow[];
  countries: CountRow[];
  referrers: CountRow[];
  sources: CountRow[];
  campaigns: CountRow[];
  browsers: CountRow[];
  operatingSystems: CountRow[];
  devices: CountRow[];
  languages: CountRow[];
  viewports: CountRow[];
  visitTypes: CountRow[];
  navigationTypes: CountRow[];
}

const TOKEN_STORAGE_KEY = "minis-mini-arena-simulator:stats-token";

function getRememberedToken(): string {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) ?? sessionStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function rememberToken(token: string) {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // The dashboard remains usable when persistent browser storage is disabled.
  }
}

function forgetRememberedToken() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}

function totalFor(summary: AnalyticsSummary, event: string): number {
  return summary.totals.find((row) => row.value === event)?.count ?? 0;
}

function breakdownTotal(rows: CountRow[], value: string): number {
  return rows.find((row) => row.value === value)?.count ?? 0;
}

function percentage(part: number, total: number): string {
  return total > 0 ? `${Math.round((part / total) * 100)}%` : "—";
}

function Breakdown({ title, rows }: { title: string; rows: CountRow[] }) {
  return (
    <section className="stats-breakdown">
      <h2>{title}</h2>
      {rows.length === 0 ? <p>No data yet.</p> : (
        <table>
          <tbody>
            {rows.map((row) => (
              <tr key={row.value}>
                <th scope="row">{row.value || "Unknown"}</th>
                <td>{Number(row.count).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function AnalyticsDashboard() {
  const [token, setToken] = useState(getRememberedToken);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadStats = async () => {
    if (!token.trim()) {
      setError("Enter the private dashboard token.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const endpoint = new URL("./api/stats", window.location.href);
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token.trim()}` },
        credentials: "omit",
      });
      if (!response.ok) throw new Error(response.status === 401 ? "Invalid dashboard token." : "Stats are unavailable.");
      const data = await response.json() as AnalyticsSummary;
      rememberToken(token.trim());
      setSummary(data);
    } catch (loadError) {
      setSummary(null);
      setError(loadError instanceof Error ? loadError.message : "Stats are unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const forgetToken = () => {
    forgetRememberedToken();
    setToken("");
    setSummary(null);
    setError("");
  };

  return (
    <main className="screen analytics-screen">
      <section className="analytics-card">
        <p className="eyebrow">PRIVATE FIRST-PARTY ANALYTICS</p>
        <h1>Arena usage</h1>
        <p className="analytics-subtitle">All-time aggregate counters. No IPs, binds, scores, or player identifiers.</p>

        <div className="stats-login">
          <label>
            Dashboard token
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") void loadStats(); }}
              autoComplete="current-password"
            />
          </label>
          <button type="button" className="primary-button" onClick={() => void loadStats()} disabled={loading}>
            {loading ? "Loading…" : "Load stats"}
          </button>
        </div>

        {error && <p className="stats-error" role="alert">{error}</p>}

        {summary && (
          <>
            <div className="analytics-totals" aria-label="Usage totals">
              <div><span>Page opens</span><strong>{totalFor(summary, "site-opened").toLocaleString()}</strong></div>
              <div><span>Fresh loads</span><strong>{breakdownTotal(summary.navigationTypes, "navigate").toLocaleString()}</strong></div>
              <div><span>Reloads</span><strong>{breakdownTotal(summary.navigationTypes, "reload").toLocaleString()}</strong></div>
              <div><span>Class selections</span><strong>{totalFor(summary, "class-selected").toLocaleString()}</strong></div>
              <div><span>Practices started</span><strong>{totalFor(summary, "practice-started").toLocaleString()}</strong></div>
              <div><span>Sessions completed</span><strong>{totalFor(summary, "session-completed").toLocaleString()}</strong></div>
              <div><span>Practice restarts</span><strong>{totalFor(summary, "practice-restarted").toLocaleString()}</strong></div>
              <div>
                <span>Completion rate</span>
                <strong>{percentage(totalFor(summary, "session-completed"), totalFor(summary, "practice-started"))}</strong>
              </div>
            </div>

            <div className="analytics-breakdowns">
              <Breakdown title="Classes" rows={summary.classes} />
              <Breakdown title="Difficulty" rows={summary.difficulties} />
              <Breakdown title="Session length" rows={summary.rounds} />
              <Breakdown title="Countries" rows={summary.countries} />
              <Breakdown title="Referrers" rows={summary.referrers} />
              <Breakdown title="Campaign sources" rows={summary.sources} />
            </div>

            <h2 className="analytics-section-title">Anonymous audience breakdown · Page opens are not unique people</h2>
            <div className="analytics-breakdowns">
              <Breakdown title="Browsers" rows={summary.browsers} />
              <Breakdown title="Devices" rows={summary.devices} />
              <Breakdown title="Operating systems" rows={summary.operatingSystems} />
              <Breakdown title="Languages" rows={summary.languages} />
              <Breakdown title="Viewport" rows={summary.viewports} />
              <Breakdown title="Visit type" rows={summary.visitTypes} />
              <Breakdown title="Page load type" rows={summary.navigationTypes} />
            </div>
            <p className="analytics-section-note">Page load types start with this beta update and do not backfill earlier opens.</p>

            <section className="stats-breakdown daily-breakdown">
              <h2>Daily activity</h2>
              <table>
                <thead><tr><th>Day</th><th>Event</th><th>Count</th></tr></thead>
                <tbody>
                  {summary.byDay.map((row) => (
                    <tr key={`${row.day}:${row.event}`}><td>{row.day}</td><td>{row.event}</td><td>{row.count}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>
            <p className="stats-updated">Updated {new Date(summary.generatedAt).toLocaleString()}</p>
          </>
        )}

        <div className="stats-actions">
          <a className="stats-back" href={window.location.pathname}>← Back to the game</a>
          {token && (
            <button type="button" className="stats-forget" onClick={forgetToken}>
              Forget saved token
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
