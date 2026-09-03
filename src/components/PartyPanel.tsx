import type { ArenaOpponent } from "../data/opponents";
import { ALLY_TARGETS } from "../game/targets";
import type { ResultKind, SpellDefinition, TargetId } from "../types";
import { AllyFrame } from "./AllyFrame";

interface PartyPanelProps {
  allies: ArenaOpponent[];
  target: TargetId | null;
  spell: SpellDefinition | null;
  feedback: ResultKind | null;
}

export function PartyPanel({ allies, target, spell, feedback }: PartyPanelProps) {
  return (
    <section className="party-shell gladius-shell" aria-label="Friendly party frames">
      <div className="gladius-titlebar party-titlebar">
        <span>PARTY // LEVEL 2</span>
        <i>ALLY SPELLS</i>
      </div>
      <div className="arena-frame-stack">
        {ALLY_TARGETS.map((targetDefinition, index) => {
          const isTarget = target === targetDefinition.id;
          return (
            <AllyFrame
              key={targetDefinition.id}
              targetId={targetDefinition.id}
              label={targetDefinition.label}
              opponent={allies[index]}
              activeSpell={isTarget ? spell : null}
              feedback={isTarget ? feedback : null}
            />
          );
        })}
      </div>
    </section>
  );
}
