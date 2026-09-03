import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DIFFICULTIES, FEEDBACK_DELAY_MS } from "../config";
import { createOpponentTeam } from "../data/opponents";
import { generateChallenge } from "../game/challengeGenerator";
import { bindingKey, keyboardEventToBind, wheelEventToBind } from "../game/keybindUtils";
import { calculateStats } from "../game/scoring";
import type { Bindings, Challenge, ClassDefinition, PracticeResult, PracticeSettings, ResultKind } from "../types";
import { GladiusPanel } from "./GladiusPanel";
import { PracticeHUD } from "./PracticeHUD";
import { SessionResults } from "./SessionResults";

interface PracticeSessionProps {
  classDefinition: ClassDefinition;
  bindings: Bindings;
  settings: PracticeSettings;
  onChangeBinds: () => void;
  onChangeClass: () => void;
}

interface FeedbackState {
  kind: ResultKind;
  expectedBind: string;
}

export function PracticeSession({
  classDefinition,
  bindings,
  settings,
  onChangeBinds,
  onChangeClass,
}: PracticeSessionProps) {
  const reactionWindowMs = DIFFICULTIES[settings.difficulty].windowMs;
  const [opponents, setOpponents] = useState(createOpponentTeam);
  const [challenge, setChallenge] = useState<Challenge>(() =>
    generateChallenge(classDefinition, bindings, null, Date.now()),
  );
  const [results, setResults] = useState<PracticeResult[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [remainingMs, setRemainingMs] = useState(reactionWindowMs);
  const settledRef = useRef(false);

  const stats = useMemo(() => calculateStats(results, reactionWindowMs), [results, reactionWindowMs]);
  const activeSpell = classDefinition.spells.find((spell) => spell.id === challenge?.spellId) ?? null;

  const settleChallenge = useCallback((kind: ResultKind, pressedBind: string | null) => {
    if (!challenge || feedback || paused || settledRef.current) return;
    settledRef.current = true;

    const elapsed = Math.min(
      reactionWindowMs,
      Math.round(challenge.elapsedMs + performance.now() - challenge.startedAt),
    );
    const expectedBind = bindings[bindingKey(challenge.spellId, challenge.target)];
    const finalKind: ResultKind = kind === "missed"
      ? "missed"
      : pressedBind === expectedBind ? "correct" : "incorrect";

    setResults((previous) => [
      ...previous,
      {
        challenge: { spellId: challenge.spellId, target: challenge.target },
        kind: finalKind,
        reactionMs: finalKind === "missed" ? null : elapsed,
        pressedBind,
        expectedBind,
      },
    ]);
    setFeedback({ kind: finalKind, expectedBind });
    setRemainingMs(Math.max(0, reactionWindowMs - elapsed));
  }, [bindings, challenge, feedback, paused, reactionWindowMs]);

  useEffect(() => {
    if (!challenge || feedback || paused || finished) return;

    const updateRemaining = () => {
      const elapsed = challenge.elapsedMs + performance.now() - challenge.startedAt;
      setRemainingMs(Math.max(0, reactionWindowMs - elapsed));
    };
    updateRemaining();
    const interval = window.setInterval(updateRemaining, 40);
    const timeoutDelay = Math.max(0, reactionWindowMs - challenge.elapsedMs);
    const timeout = window.setTimeout(() => settleChallenge("missed", null), timeoutDelay);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [challenge, feedback, finished, paused, reactionWindowMs, settleChallenge]);

  useEffect(() => {
    if (!feedback || !challenge) return;

    const delay = FEEDBACK_DELAY_MS[feedback.kind];
    const transition = window.setTimeout(() => {
      if (results.length >= settings.sessionLength) {
        setFinished(true);
        setFeedback(null);
        return;
      }

      const next = generateChallenge(classDefinition, bindings, challenge, challenge.id + 1);
      settledRef.current = false;
      setChallenge(next);
      setRemainingMs(reactionWindowMs);
      setFeedback(null);
    }, delay);

    return () => window.clearTimeout(transition);
  }, [bindings, challenge, classDefinition, feedback, reactionWindowMs, results.length, settings.sessionLength]);

  const togglePause = useCallback(() => {
    if (!challenge || feedback || finished) return;

    if (paused) {
      setChallenge((current) => ({ ...current, startedAt: performance.now() }));
      setPaused(false);
    } else {
      const now = performance.now();
      setChallenge((current) => ({
        ...current,
        elapsedMs: current.elapsedMs + now - current.startedAt,
        startedAt: now,
      }));
      setPaused(true);
    }
  }, [challenge, feedback, finished, paused]);

  useEffect(() => {
    if (finished) return;

    const handlePracticeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        togglePause();
        return;
      }
      if (paused || feedback || !challenge) return;

      // Practice owns the keyboard while a challenge is live.
      event.preventDefault();
      event.stopPropagation();
      if (event.repeat) return;

      const pressedBind = keyboardEventToBind(event);
      if (pressedBind) settleChallenge("incorrect", pressedBind);
    };

    const handlePracticeWheel = (event: WheelEvent) => {
      // A non-passive listener is required to stop Ctrl+wheel browser zoom.
      event.preventDefault();
      event.stopPropagation();
      if (paused || feedback || !challenge) return;

      const pressedBind = wheelEventToBind(event);
      if (pressedBind) settleChallenge("incorrect", pressedBind);
    };

    window.addEventListener("keydown", handlePracticeKey, true);
    window.addEventListener("wheel", handlePracticeWheel, { capture: true, passive: false });
    return () => {
      window.removeEventListener("keydown", handlePracticeKey, true);
      window.removeEventListener("wheel", handlePracticeWheel, true);
    };
  }, [challenge, feedback, finished, paused, settleChallenge, togglePause]);

  const restart = useCallback(() => {
    const next = generateChallenge(classDefinition, bindings, null, Date.now());
    settledRef.current = false;
    setOpponents(createOpponentTeam());
    setResults([]);
    setFeedback(null);
    setPaused(false);
    setFinished(false);
    setRemainingMs(reactionWindowMs);
    setChallenge(next);
  }, [bindings, classDefinition, reactionWindowMs]);

  if (finished) {
    return (
      <SessionResults
        stats={stats}
        total={results.length}
        onAgain={restart}
        onChangeBinds={onChangeBinds}
        onChangeClass={onChangeClass}
      />
    );
  }

  const feedbackCopy = feedback?.kind === "correct"
    ? "CORRECT"
    : feedback?.kind === "incorrect"
      ? `WRONG · EXPECTED ${feedback.expectedBind}`
      : feedback?.kind === "missed"
        ? `MISSED · EXPECTED ${feedback.expectedBind}`
        : null;

  return (
    <main className="practice-screen">
      <PracticeHUD
        stats={stats}
        currentRound={Math.min(results.length + (feedback ? 0 : 1), settings.sessionLength)}
        sessionLength={settings.sessionLength}
        remainingRatio={remainingMs / reactionWindowMs}
        paused={paused}
        onPauseToggle={togglePause}
        onRestart={restart}
        onExit={onChangeBinds}
      />

      <div className="practice-stage">
        <div className={`challenge-callout ${feedback ? `is-${feedback.kind}` : ""}`} aria-live="assertive">
          {feedbackCopy ? (
            <strong data-testid="feedback-copy">{feedbackCopy}</strong>
          ) : (
            <>
              <span>CAST</span>
              <strong>{activeSpell?.name}</strong>
              <i>ON</i>
              <b>ARENA {challenge.target}</b>
            </>
          )}
        </div>

        <GladiusPanel
          opponents={opponents}
          target={challenge.target}
          spell={activeSpell}
          feedback={feedback?.kind ?? null}
        />

        <p className="practice-hint">Press the configured spell + target bind. No clicking required.</p>
      </div>

      {paused && (
        <div className="pause-overlay" role="dialog" aria-modal="true" aria-label="Practice paused">
          <div>
            <p className="eyebrow">TRAINING PAUSED</p>
            <h2>Catch your breath.</h2>
            <button type="button" className="primary-button" onClick={togglePause}>Resume <kbd>Esc</kbd></button>
          </div>
        </div>
      )}
    </main>
  );
}
