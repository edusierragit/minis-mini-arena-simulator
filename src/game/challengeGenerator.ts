import type { Bindings, Challenge, ClassDefinition, TargetId, TargetMode } from "../types";
import { trainingDebuffs } from "../data/debuffs";
import { bindingKey } from "./keybindUtils";
import { getTargetsForSpell } from "./targets";

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
      : getTargetsForSpell(spell)
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
  const spell = classDefinition.spells.find((candidate) => candidate.id === choice.spellId);
  const compatibleCues = spell?.counterplay
    ? trainingDebuffs.filter((debuff) => spell.counterplay?.cueIds.includes(debuff.id))
    : spell?.dispels
      ? trainingDebuffs.filter((debuff) => spell.dispels?.includes(debuff.dispelType))
      : [];
  const cue = compatibleCues.length
    ? compatibleCues[Math.floor(Math.random() * compatibleCues.length)]
    : null;

  return {
    id,
    spellId: choice.spellId,
    target: choice.target,
    targetMode: choice.targetMode,
    cueId: cue?.id ?? null,
    counterplay: spell?.counterplay
      ? {
          castDurationMs: spell.counterplay.castDurationMs,
          bonusWindowMs: spell.counterplay.bonusWindowMs,
        }
      : null,
    startedAt: performance.now(),
    elapsedMs: 0,
  };
}
