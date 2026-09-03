import type { PracticeResult } from "../types";

export interface PracticeStats {
  score: number;
  correct: number;
  incorrect: number;
  missed: number;
  accuracy: number;
  averageReactionMs: number;
  currentStreak: number;
  bestStreak: number;
}

export function calculateStats(results: PracticeResult[], reactionWindowMs: number): PracticeStats {
  let currentStreak = 0;
  let bestStreak = 0;
  let score = 0;

  for (const result of results) {
    if (result.kind === "correct") {
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
      const speedBonus = Math.max(0, Math.round((reactionWindowMs - (result.reactionMs ?? reactionWindowMs)) / 20));
      score += 100 + speedBonus;
    } else {
      currentStreak = 0;
    }
  }

  const correct = results.filter((result) => result.kind === "correct").length;
  const incorrect = results.filter((result) => result.kind === "incorrect").length;
  const missed = results.filter((result) => result.kind === "missed").length;
  const reactionTimes = results.flatMap((result) => result.reactionMs === null ? [] : [result.reactionMs]);

  return {
    score,
    correct,
    incorrect,
    missed,
    accuracy: results.length ? (correct / results.length) * 100 : 0,
    averageReactionMs: reactionTimes.length
      ? Math.round(reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length)
      : 0,
    currentStreak,
    bestStreak,
  };
}
