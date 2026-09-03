import type { ArenaTarget, TargetId, TargetMode } from "../types";

export interface TrainingTargetDefinition {
  id: TargetId;
  label: string;
  compactLabel: string;
  mode: TargetMode;
  position: 1 | 2 | 3;
}

export const ARENA_TARGETS: TrainingTargetDefinition[] = [
  { id: "arena1", label: "Arena 1", compactLabel: "Arena 1", mode: "arena", position: 1 },
  { id: "arena2", label: "Arena 2", compactLabel: "Arena 2", mode: "arena", position: 2 },
  { id: "arena3", label: "Arena 3", compactLabel: "Arena 3", mode: "arena", position: 3 },
];

export const ALLY_TARGETS: TrainingTargetDefinition[] = [
  { id: "player", label: "Self", compactLabel: "Self", mode: "ally", position: 1 },
  { id: "party1", label: "Party 1", compactLabel: "Party 1", mode: "ally", position: 2 },
  { id: "party2", label: "Party 2", compactLabel: "Party 2", mode: "ally", position: 3 },
];

export function getTargetsForMode(mode: TargetMode): TrainingTargetDefinition[] {
  return mode === "arena" ? ARENA_TARGETS : ALLY_TARGETS;
}

export function getTargetDefinition(targetId: TargetId): TrainingTargetDefinition {
  const target = [...ARENA_TARGETS, ...ALLY_TARGETS].find((candidate) => candidate.id === targetId);
  if (!target) throw new Error(`Unknown training target: ${targetId}`);
  return target;
}

export function getArenaTargetNumber(targetId: TargetId): ArenaTarget | null {
  const target = getTargetDefinition(targetId);
  return target.mode === "arena" ? target.position : null;
}
