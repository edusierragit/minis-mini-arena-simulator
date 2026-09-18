import type { PracticeStats } from "../game/scoring";

interface SessionResultsProps {
  stats: PracticeStats;
  total: number;
  isDemo?: boolean;
  onAgain: () => void;
  onChangeBinds: () => void;
  onChangeClass: () => void;
}

export function SessionResults({ stats, total, isDemo = false, onAgain, onChangeBinds, onChangeClass }: SessionResultsProps) {
  return (
    <main className="screen results-screen">
      <section className="results-card">
        <p className="eyebrow">{isDemo ? "DEMO COMPLETE" : "SESSION COMPLETE"}</p>
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
          <button type="button" className="primary-button" onClick={isDemo ? onChangeBinds : onAgain} data-testid={isDemo ? "configure-after-demo" : "practice-again"}>{isDemo ? "Use my own binds" : "Practice Again"} <span>→</span></button>
          <button type="button" className="small-button" onClick={isDemo ? onAgain : onChangeBinds} data-testid={isDemo ? "demo-again" : undefined}>{isDemo ? "Try demo again" : "Change Binds"}</button>
          <button type="button" className="text-button" onClick={onChangeClass}>{isDemo ? "Back to classes" : "Change Class"}</button>
        </div>
      </section>
    </main>
  );
}
