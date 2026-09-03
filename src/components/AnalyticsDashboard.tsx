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
  fromDay: string;
  days: number;
  totals: CountRow[];
  byDay: DailyRow[];
  classes: CountRow[];
  difficulties: CountRow[];
  rounds: CountRow[];
  countries: CountRow[];
  referrers: CountRow[];
  sources: CountRow[];
  campaigns: CountRow[];
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
  const [days, setDays] = useState(30);
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
      endpoint.searchParams.set("days", String(days));
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
        <p className="analytics-subtitle">Aggregate counters only. No IPs, binds, scores, or player identifiers.</p>

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
          <label>
            Window
            <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </label>
          <button type="button" className="primary-button" onClick={() => void loadStats()} disabled={loading}>
            {loading ? "Loading…" : "Load stats"}
          </button>
        </div>

        {error && <p className="stats-error" role="alert">{error}</p>}

        {summary && (
          <>
            <div className="analytics-totals" aria-label="Usage totals">
              <div><span>Site opens</span><strong>{totalFor(summary, "site-opened").toLocaleString()}</strong></div>
              <div><span>Class selections</span><strong>{totalFor(summary, "class-selected").toLocaleString()}</strong></div>
              <div><span>Practices started</span><strong>{totalFor(summary, "practice-started").toLocaleString()}</strong></div>
              <div><span>Sessions completed</span><strong>{totalFor(summary, "session-completed").toLocaleString()}</strong></div>
            </div>

            <div className="analytics-breakdowns">
              <Breakdown title="Classes" rows={summary.classes} />
              <Breakdown title="Difficulty" rows={summary.difficulties} />
              <Breakdown title="Session length" rows={summary.rounds} />
              <Breakdown title="Countries" rows={summary.countries} />
              <Breakdown title="Referrers" rows={summary.referrers} />
              <Breakdown title="Campaign sources" rows={summary.sources} />
            </div>

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
