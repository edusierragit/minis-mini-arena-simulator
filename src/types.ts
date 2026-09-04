export type ArenaTarget = 1 | 2 | 3;
export type TargetMode = "arena" | "ally";
export type TargetId = "arena1" | "arena2" | "arena3" | "player" | "party1" | "party2";
export type DispelType = "curse" | "magic" | "poison" | "disease";

export interface SpellDefinition {
  id: string;
  name: string;
  icon: string;
  targetMode: TargetMode;
  description?: string;
  suggestedBindings?: Partial<Record<TargetId, string>>;
  enabledByDefault?: boolean;
  dispels?: DispelType[];
  macroSteps?: string[];
  counterplay?: {
    cueIds: string[];
    castDurationMs: number;
    successWindowMs: number;
  };
}

export interface ClassDefinition {
  id: string;
  name: string;
  icon: string;
  playable: boolean;
  availabilityLabel?: string;
  color: string;
  spells: SpellDefinition[];
}

export type BindingKey = `${string}:${TargetId}`;
export type Bindings = Record<string, string>;

export interface Challenge {
  id: number;
  spellId: string;
  target: TargetId;
  targetMode: TargetMode;
  cueId: string | null;
  counterplay: {
    castDurationMs: number;
    successWindowMs: number;
  } | null;
  startedAt: number;
  elapsedMs: number;
}

export type ResultKind = "correct" | "incorrect" | "missed";

export interface PracticeResult {
  challenge: Pick<Challenge, "spellId" | "target" | "targetMode">;
  kind: ResultKind;
  reactionMs: number | null;
  pressedBind: string | null;
  expectedBind: string;
}

export type DifficultyId = "slow" | "normal" | "fast";

export interface PracticeSettings {
  difficulty: DifficultyId;
  sessionLength: number;
  muted: boolean;
}
