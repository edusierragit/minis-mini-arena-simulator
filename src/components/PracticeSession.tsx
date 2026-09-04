import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { trackAnalyticsEvent } from "../analytics";
import { DIFFICULTIES, FEEDBACK_DELAY_MS } from "../config";
import { createAllyTeam, createOpponentTeam } from "../data/opponents";
import { getDebuffDefinition } from "../data/debuffs";
import { generateChallenge } from "../game/challengeGenerator";
import { bindingKey, keyboardEventToBind, mouseEventToBind, wheelEventToBind } from "../game/keybindUtils";
import { calculateLateTimingBonus, calculateStats } from "../game/scoring";
import { getArenaTargetNumber, getTargetDefinition } from "../game/targets";
import { hasBrowserCloseShortcut } from "../game/browserShortcutLock";
import { playFeedbackSound, prepareFeedbackAudio } from "../audio/gameAudio";
import type { Bindings, Challenge, ClassDefinition, PracticeResult, PracticeSettings, ResultKind } from "../types";
import type { BrowserShortcutLockStatus } from "../game/browserShortcutLock";
import { GladiusPanel } from "./GladiusPanel";
import { PartyPanel } from "./PartyPanel";
import { PracticeHUD } from "./PracticeHUD";
import { SessionResults } from "./SessionResults";

interface PracticeSessionProps {
  classDefinition: ClassDefinition;
  bindings: Bindings;
  enabledSpellIds: string[];
  settings: PracticeSettings;
  shortcutLockStatus: BrowserShortcutLockStatus;
  onSettingsChange: (settings: PracticeSettings) => void;
  onChangeBinds: () => void;
  onChangeClass: () => void;
}

interface FeedbackState {
  kind: ResultKind;
  expectedBind: string;
  reason: "wrong-bind" | "missed" | null;
  timingBonus: number | null;
}

function getChallengeDurationMs(challenge: Challenge, reactionWindowMs: number): number {
  return challenge.counterplay?.castDurationMs ?? reactionWindowMs;
}

export function PracticeSession({
  classDefinition,
  bindings,
  enabledSpellIds,
  settings,
  shortcutLockStatus,
  onSettingsChange,
  onChangeBinds,
  onChangeClass,
}: PracticeSessionProps) {
  const reactionWindowMs = DIFFICULTIES[settings.difficulty].windowMs;
  const [opponents, setOpponents] = useState(createOpponentTeam);
  const [allies, setAllies] = useState(() => createAllyTeam(classDefinition.id, classDefinition.name));
  const [challenge, setChallenge] = useState<Challenge>(() =>
    generateChallenge(classDefinition, bindings, enabledSpellIds, null, Date.now()),
  );
  const [results, setResults] = useState<PracticeResult[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [remainingMs, setRemainingMs] = useState(() => getChallengeDurationMs(challenge, reactionWindowMs));
  const settledRef = useRef(false);
  const practiceSurfaceRef = useRef<HTMLElement>(null);
  const closeShortcutConfigured = useMemo(() => {
    const enabledSet = new Set(enabledSpellIds);
    return hasBrowserCloseShortcut(
      Object.entries(bindings)
        .filter(([key]) => enabledSet.has(key.split(":")[0]))
        .map(([, binding]) => binding),
    );
  }, [bindings, enabledSpellIds]);

  const stats = useMemo(() => calculateStats(results, reactionWindowMs), [results, reactionWindowMs]);
  const activeSpell = classDefinition.spells.find((spell) => spell.id === challenge?.spellId) ?? null;
  const activeDebuff = challenge.cueId ? getDebuffDefinition(challenge.cueId) : null;
  const challengeVisual = challenge.counterplay ? activeSpell : activeDebuff ?? activeSpell;
  const challengeDurationMs = getChallengeDurationMs(challenge, reactionWindowMs);
  const counterplayWindowOpen = Boolean(
    challenge.counterplay && remainingMs <= challenge.counterplay.bonusWindowMs,
  );
  const counterplayElapsedMs = challengeDurationMs - remainingMs;
  const liveTimingBonus = calculateLateTimingBonus(counterplayElapsedMs, challengeDurationMs);

  useEffect(() => {
    prepareFeedbackAudio();
  }, []);

  useEffect(() => {
    if (!closeShortcutConfigured) return;
    const warnBeforeClosing = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Browsers ignore custom text, but a non-empty return value activates
      // their native leave-page confirmation when Keyboard Lock is unavailable.
      event.returnValue = true;
    };
    window.addEventListener("beforeunload", warnBeforeClosing);
    return () => window.removeEventListener("beforeunload", warnBeforeClosing);
  }, [closeShortcutConfigured]);

  const settleChallenge = useCallback((kind: ResultKind, pressedBind: string | null) => {
    if (!challenge || feedback || paused || settledRef.current) return;
    settledRef.current = true;

    const durationMs = getChallengeDurationMs(challenge, reactionWindowMs);
    const elapsed = Math.min(
      durationMs,
      Math.round(challenge.elapsedMs + performance.now() - challenge.startedAt),
    );
    const expectedBind = bindings[bindingKey(challenge.spellId, challenge.target)];
    const finalKind: ResultKind = kind === "missed"
      ? "missed"
      : pressedBind === expectedBind ? "correct" : "incorrect";
    const timingBonus = challenge.counterplay && finalKind === "correct"
      ? calculateLateTimingBonus(elapsed, durationMs)
      : undefined;

    setResults((previous) => [
      ...previous,
      {
        challenge: { spellId: challenge.spellId, target: challenge.target, targetMode: challenge.targetMode },
        kind: finalKind,
        reactionMs: finalKind === "missed" || challenge.counterplay ? null : elapsed,
        pressedBind,
        expectedBind,
        timingBonus,
      },
    ]);
    setFeedback({
      kind: finalKind,
      expectedBind,
      reason: kind === "missed" ? "missed" : finalKind === "incorrect" ? "wrong-bind" : null,
      timingBonus: timingBonus ?? null,
    });
    playFeedbackSound(finalKind, settings.muted);
    setRemainingMs(Math.max(0, durationMs - elapsed));
  }, [bindings, challenge, feedback, paused, reactionWindowMs, settings.muted]);

  useEffect(() => {
    if (!challenge || feedback || paused || finished) return;

    const updateRemaining = () => {
      const elapsed = challenge.elapsedMs + performance.now() - challenge.startedAt;
      setRemainingMs(Math.max(0, challengeDurationMs - elapsed));
    };
    updateRemaining();
    const interval = window.setInterval(updateRemaining, 40);
    const timeoutDelay = Math.max(0, challengeDurationMs - challenge.elapsedMs);
    const timeout = window.setTimeout(() => settleChallenge("missed", null), timeoutDelay);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [challenge, challengeDurationMs, feedback, finished, paused, settleChallenge]);

  useEffect(() => {
    if (!feedback || !challenge) return;

    const delay = FEEDBACK_DELAY_MS[feedback.kind];
    const transition = window.setTimeout(() => {
      if (results.length >= settings.sessionLength) {
        trackAnalyticsEvent("session-completed", {
          class: classDefinition.id,
          difficulty: settings.difficulty,
          rounds: settings.sessionLength,
        });
        setFinished(true);
        setFeedback(null);
        return;
      }

      const next = generateChallenge(classDefinition, bindings, enabledSpellIds, challenge, challenge.id + 1);
      settledRef.current = false;
      setChallenge(next);
      setRemainingMs(getChallengeDurationMs(next, reactionWindowMs));
      setFeedback(null);
    }, delay);

    return () => window.clearTimeout(transition);
  }, [bindings, challenge, classDefinition, enabledSpellIds, feedback, reactionWindowMs, results.length, settings.sessionLength]);

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

  useLayoutEffect(() => {
    if (finished) return;
    const practiceSurface = practiceSurfaceRef.current;
    if (!practiceSurface) return;

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

    const handlePracticeMouse = (event: MouseEvent) => {
      const pressedBind = mouseEventToBind(event);
      if (!pressedBind) return;

      event.preventDefault();
      event.stopPropagation();
      if (paused || feedback || !challenge) return;
      settleChallenge("incorrect", pressedBind);
    };

    const preventBindableMouseNavigation = (event: MouseEvent) => {
      if (!mouseEventToBind(event)) return;
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener("keydown", handlePracticeKey, true);
    practiceSurface.addEventListener("wheel", handlePracticeWheel, { capture: true, passive: false });
    window.addEventListener("mousedown", handlePracticeMouse, true);
    window.addEventListener("mouseup", preventBindableMouseNavigation, true);
    window.addEventListener("auxclick", preventBindableMouseNavigation, true);
    return () => {
      window.removeEventListener("keydown", handlePracticeKey, true);
      practiceSurface.removeEventListener("wheel", handlePracticeWheel, true);
      window.removeEventListener("mousedown", handlePracticeMouse, true);
      window.removeEventListener("mouseup", preventBindableMouseNavigation, true);
      window.removeEventListener("auxclick", preventBindableMouseNavigation, true);
    };
  }, [challenge, feedback, finished, paused, settleChallenge, togglePause]);

  const restart = useCallback(() => {
    trackAnalyticsEvent("practice-restarted", {
      class: classDefinition.id,
      difficulty: settings.difficulty,
      rounds: settings.sessionLength,
    });
    const next = generateChallenge(classDefinition, bindings, enabledSpellIds, null, Date.now());
    settledRef.current = false;
    setOpponents(createOpponentTeam());
    setAllies(createAllyTeam(classDefinition.id, classDefinition.name));
    setResults([]);
    setFeedback(null);
    setPaused(false);
    setFinished(false);
    setRemainingMs(getChallengeDurationMs(next, reactionWindowMs));
    setChallenge(next);
  }, [bindings, classDefinition, enabledSpellIds, reactionWindowMs, settings.difficulty, settings.sessionLength]);

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
    ? challenge.counterplay && feedback.timingBonus !== null
      ? feedback.timingBonus >= 80
        ? `PERFECT TIMING · +${100 + feedback.timingBonus}`
        : `CORRECT · +${100 + feedback.timingBonus} · LATER = MORE`
      : "CORRECT"
    : feedback?.kind === "incorrect"
      ? `WRONG · USE ${activeSpell?.name.toUpperCase()} · ${feedback.expectedBind}`
      : feedback?.kind === "missed"
        ? `MISSED · USE ${activeSpell?.name.toUpperCase()} · ${feedback.expectedBind}`
        : null;
  const targetDefinition = getTargetDefinition(challenge.target);
  const arenaTarget = challenge.targetMode === "arena" ? getArenaTargetNumber(challenge.target) : null;
  const allyTarget = challenge.targetMode === "ally" ? challenge.target : null;
  const hasAllyTraining = classDefinition.spells.some(
    (spell) => spell.targetMode === "ally" && enabledSpellIds.includes(spell.id),
  );
  const shortcutProtectionCopy = shortcutLockStatus === "locked"
    ? "Browser shortcuts locked · Ctrl+W protected"
    : shortcutLockStatus === "requesting"
      ? "Requesting browser shortcut protection…"
      : shortcutLockStatus === "fullscreen-only"
        ? "Fullscreen active · Ctrl+W uses the browser's leave-page warning"
        : shortcutLockStatus === "unavailable"
          ? "Ctrl+W uses the browser's leave-page warning"
          : "Press the configured spell + target bind. No clicking required.";

  return (
    <main className="practice-screen" ref={practiceSurfaceRef}>
      <PracticeHUD
        stats={stats}
        currentRound={Math.min(results.length + (feedback ? 0 : 1), settings.sessionLength)}
        sessionLength={settings.sessionLength}
        remainingRatio={remainingMs / challengeDurationMs}
        paused={paused}
        muted={settings.muted}
        onPauseToggle={togglePause}
        onMuteToggle={() => onSettingsChange({ ...settings, muted: !settings.muted })}
        onRestart={restart}
        onExit={onChangeBinds}
      />

      <div className="practice-stage">
        <div className={`challenge-callout ${feedback ? `is-${feedback.kind}` : ""}`} aria-live="assertive">
          {feedbackCopy ? (
            <strong data-testid="feedback-copy">{feedbackCopy}</strong>
          ) : (
            <>
              <span>{activeDebuff && !challenge.counterplay ? "DISPEL" : "CAST"}</span>
              <strong>{challenge.counterplay ? activeSpell?.name : activeDebuff?.name ?? activeSpell?.name}</strong>
              <i>ON</i>
              <b>{targetDefinition.label.toUpperCase()}</b>
            </>
          )}
        </div>

        <div className={`combat-panels ${hasAllyTraining ? "has-party-panel" : ""}`}>
          <GladiusPanel
            opponents={opponents}
            target={arenaTarget}
            spell={challenge.targetMode === "arena" ? challengeVisual : null}
            incomingCast={challenge.counterplay && activeDebuff ? {
              name: activeDebuff.name,
              icon: activeDebuff.icon,
              progress: Math.max(0, Math.min(1, counterplayElapsedMs / challengeDurationMs)),
              timingBonus: liveTimingBonus,
              isBonusWindow: counterplayWindowOpen,
            } : null}
            feedback={feedback?.kind ?? null}
          />
          {hasAllyTraining && (
            <PartyPanel
              allies={allies}
              target={allyTarget}
              spell={challenge.targetMode === "ally" ? challengeVisual : null}
              feedback={feedback?.kind ?? null}
            />
          )}
        </div>

        <p className={`practice-hint shortcut-${shortcutLockStatus}`}>{shortcutProtectionCopy}</p>
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
