import type { PracticeStats } from "../game/scoring";

interface PracticeHUDProps {
  stats: PracticeStats;
  currentRound: number;
  sessionLength: number;
  remainingRatio: number;
  paused: boolean;
  muted: boolean;
  onPauseToggle: () => void;
  onMuteToggle: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export function PracticeHUD({
  stats,
  currentRound,
  sessionLength,
  remainingRatio,
  paused,
  muted,
  onPauseToggle,
  onMuteToggle,
  onRestart,
  onExit,
}: PracticeHUDProps) {
  return (
    <>
      <header className="practice-topbar">
        <div className="practice-brand"><span>MINI&apos;S MINI</span><strong>ARENA SIMULATOR</strong></div>
        <div className="hud-actions">
          <button type="button" onClick={onMuteToggle} aria-pressed={muted}>{muted ? "Sound off" : "Sound on"}</button>
          <button type="button" onClick={onPauseToggle}>{paused ? "Resume" : "Pause"} <kbd>Esc</kbd></button>
          <button type="button" onClick={onRestart}>Restart</button>
          <button type="button" onClick={onExit}>Binds</button>
        </div>
      </header>

      <section className="stats-strip" aria-label="Practice statistics">
        <div><span>Score</span><strong>{stats.score.toLocaleString()}</strong></div>
        <div><span>Streak</span><strong className="streak-value">{stats.currentStreak}</strong></div>
        <div><span>Accuracy</span><strong>{Math.round(stats.accuracy)}%</strong></div>
        <div><span>Avg. reaction</span><strong>{stats.averageReactionMs ? `${stats.averageReactionMs}ms` : "—"}</strong></div>
        <div className="round-stat"><span>Challenge</span><strong>{currentRound}<small> / {sessionLength}</small></strong></div>
      </section>

      <div className="reaction-meter" aria-hidden="true">
        <div className="reaction-meter-fill" style={{ transform: `scaleX(${Math.max(0, remainingRatio)})` }} />
      </div>
    </>
  );
}
