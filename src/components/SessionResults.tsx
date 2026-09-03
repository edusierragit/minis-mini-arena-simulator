import type { PracticeStats } from "../game/scoring";

interface SessionResultsProps {
  stats: PracticeStats;
  total: number;
  onAgain: () => void;
  onChangeBinds: () => void;
  onChangeClass: () => void;
}

export function SessionResults({ stats, total, onAgain, onChangeBinds, onChangeClass }: SessionResultsProps) {
  return (
    <main className="screen results-screen">
      <section className="results-card">
        <p className="eyebrow">SESSION COMPLETE</p>
        <h1>{stats.accuracy >= 90 ? "Arena ready." : stats.accuracy >= 70 ? "Getting sharp." : "Run it back."}</h1>
        <p className="results-subtitle">{total} challenges · Best streak {stats.bestStreak}</p>

        <div className="results-score">
          <span>Score</span>
          <strong>{stats.score.toLocaleString()}</strong>
        </div>

        <div className="results-grid">
          <div className="correct-result"><strong>{stats.correct}</strong><span>Correct</span></div>
          <div className="incorrect-result"><strong>{stats.incorrect}</strong><span>Incorrect</span></div>
          <div className="missed-result"><strong>{stats.missed}</strong><span>Missed</span></div>
          <div><strong>{Math.round(stats.accuracy)}%</strong><span>Accuracy</span></div>
          <div><strong>{stats.averageReactionMs ? `${stats.averageReactionMs}ms` : "—"}</strong><span>Avg. reaction</span></div>
          <div><strong>{stats.bestStreak}</strong><span>Best streak</span></div>
        </div>

        <div className="results-actions">
          <button type="button" className="primary-button" onClick={onAgain} data-testid="practice-again">Practice Again <span>→</span></button>
          <button type="button" className="small-button" onClick={onChangeBinds}>Change Binds</button>
          <button type="button" className="text-button" onClick={onChangeClass}>Change Class</button>
        </div>
      </section>
    </main>
  );
}
