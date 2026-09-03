export type ArenaTarget = 1 | 2 | 3;

export interface SpellDefinition {
  id: string;
  name: string;
  icon: string;
  targetMode: "arena";
  description?: string;
  suggestedBindings?: Partial<Record<ArenaTarget, string>>;
}

export interface ClassDefinition {
  id: string;
  name: string;
  icon: string;
  playable: boolean;
  color: string;
  spells: SpellDefinition[];
}

export type BindingKey = `${string}:arena${ArenaTarget}`;
export type Bindings = Record<string, string>;

export interface Challenge {
  id: number;
  spellId: string;
  target: ArenaTarget;
  startedAt: number;
  elapsedMs: number;
}

export type ResultKind = "correct" | "incorrect" | "missed";

export interface PracticeResult {
  challenge: Pick<Challenge, "spellId" | "target">;
  kind: ResultKind;
  reactionMs: number | null;
  pressedBind: string | null;
  expectedBind: string;
}

export type DifficultyId = "slow" | "normal" | "fast";

export interface PracticeSettings {
  difficulty: DifficultyId;
  sessionLength: number;
}
