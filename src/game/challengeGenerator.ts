import type { Bindings, Challenge, ClassDefinition, TargetId, TargetMode } from "../types";
import { bindingKey } from "./keybindUtils";
import { getTargetsForMode } from "./targets";

interface ChallengeCandidate {
  spellId: string;
  target: TargetId;
  targetMode: TargetMode;
}

export function getConfiguredChallenges(
  classDefinition: ClassDefinition,
  bindings: Bindings,
  enabledSpellIds?: string[],
): ChallengeCandidate[] {
  const enabled = enabledSpellIds ? new Set(enabledSpellIds) : null;
  return classDefinition.spells.flatMap((spell) =>
    enabled && !enabled.has(spell.id)
      ? []
      : getTargetsForMode(spell.targetMode)
        .filter((target) => Boolean(bindings[bindingKey(spell.id, target.id)]))
        .map((target) => ({ spellId: spell.id, target: target.id, targetMode: spell.targetMode })),
  );
}

export function generateChallenge(
  classDefinition: ClassDefinition,
  bindings: Bindings,
  enabledSpellIds: string[] | undefined,
  previous: Pick<Challenge, "spellId" | "target"> | null,
  id: number,
): Challenge {
  const allCandidates = getConfiguredChallenges(classDefinition, bindings, enabledSpellIds);
  if (allCandidates.length === 0) throw new Error("Cannot create a challenge without configured bindings.");

  const nonRepeating = previous && allCandidates.length > 1
    ? allCandidates.filter((candidate) => candidate.spellId !== previous.spellId || candidate.target !== previous.target)
    : allCandidates;
  const choice = nonRepeating[Math.floor(Math.random() * nonRepeating.length)];

  return {
    id,
    spellId: choice.spellId,
    target: choice.target,
    targetMode: choice.targetMode,
    startedAt: performance.now(),
    elapsedMs: 0,
  };
}
