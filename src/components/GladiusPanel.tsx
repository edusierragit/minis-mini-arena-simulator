import type { ArenaOpponent } from "../data/opponents";
import type { ArenaTarget, ResultKind, SpellDefinition } from "../types";
import { ArenaFrame } from "./ArenaFrame";

interface GladiusPanelProps {
  opponents: ArenaOpponent[];
  target: ArenaTarget | null;
  spell: Pick<SpellDefinition, "name" | "icon" | "macroIcons"> | null;
  incomingCast?: {
    name: string;
    icon: string;
    progress: number;
    timingBonus: number;
    isBonusWindow: boolean;
  } | null;
  feedback: ResultKind | null;
}

export function GladiusPanel({ opponents, target, spell, incomingCast = null, feedback }: GladiusPanelProps) {
  return (
    <section className="gladius-shell" aria-label="Enemy arena frames">
      <div className="gladius-titlebar">
        <span>GLADIUS // TRAINING</span>
        <i>3v3</i>
      </div>
      <div className="arena-frame-stack">
        {opponents.map((opponent, index) => {
          const frameTarget = (index + 1) as ArenaTarget;
          const isTarget = target === frameTarget;
          return (
            <ArenaFrame
              key={`${opponent.name}-${frameTarget}`}
              target={frameTarget}
              opponent={opponent}
              activeSpell={isTarget ? spell : null}
              incomingCast={isTarget ? incomingCast : null}
              feedback={isTarget ? feedback : null}
            />
          );
        })}
      </div>
    </section>
  );
}
