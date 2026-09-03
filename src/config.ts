import type { DifficultyId, PracticeSettings } from "./types";

export const DIFFICULTIES: Record<
  DifficultyId,
  { id: DifficultyId; label: string; windowMs: number; description: string }
> = {
  slow: { id: "slow", label: "Slow", windowMs: 2500, description: "2.5 sec" },
  normal: { id: "normal", label: "Normal", windowMs: 1500, description: "1.5 sec" },
  fast: { id: "fast", label: "Fast", windowMs: 900, description: "0.9 sec" },
};

export const DEFAULT_SETTINGS: PracticeSettings = {
  difficulty: "normal",
  sessionLength: 30,
};

export const SESSION_LENGTHS = [10, 30, 50] as const;
export const FEEDBACK_DELAY_MS = { correct: 360, incorrect: 650, missed: 700 } as const;
