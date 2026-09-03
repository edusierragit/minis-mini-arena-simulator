import type { ArenaTarget, Bindings, Challenge, ClassDefinition } from "../types";
import { bindingKey } from "./keybindUtils";

interface ChallengeCandidate {
  spellId: string;
  target: ArenaTarget;
}

export function getConfiguredChallenges(
  classDefinition: ClassDefinition,
  bindings: Bindings,
): ChallengeCandidate[] {
  return classDefinition.spells.flatMap((spell) =>
    ([1, 2, 3] as ArenaTarget[])
      .filter((target) => Boolean(bindings[bindingKey(spell.id, target)]))
      .map((target) => ({ spellId: spell.id, target })),
  );
}

export function generateChallenge(
  classDefinition: ClassDefinition,
  bindings: Bindings,
  previous: Pick<Challenge, "spellId" | "target"> | null,
  id: number,
): Challenge {
  const allCandidates = getConfiguredChallenges(classDefinition, bindings);
  if (allCandidates.length === 0) throw new Error("Cannot create a challenge without configured bindings.");

  const nonRepeating = previous && allCandidates.length > 1
    ? allCandidates.filter((candidate) => candidate.spellId !== previous.spellId || candidate.target !== previous.target)
    : allCandidates;
  const choice = nonRepeating[Math.floor(Math.random() * nonRepeating.length)];

  return {
    id,
    spellId: choice.spellId,
    target: choice.target,
    startedAt: performance.now(),
    elapsedMs: 0,
  };
}
