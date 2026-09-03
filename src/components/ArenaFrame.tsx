import type { ArenaOpponent } from "../data/opponents";
import type { ArenaTarget, ResultKind, SpellDefinition } from "../types";
import { assetUrl } from "../utils/assets";

interface ArenaFrameProps {
  target: ArenaTarget;
  opponent: ArenaOpponent;
  activeSpell: SpellDefinition | null;
  feedback: ResultKind | null;
}

export function ArenaFrame({ target, opponent, activeSpell, feedback }: ArenaFrameProps) {
  const stateClass = feedback ? `feedback-${feedback}` : activeSpell ? "is-targeted" : "";

  return (
    <div className={`arena-frame ${stateClass}`} data-testid={`arena-frame-${target}`}>
      <div className="arena-index"><span>ARENA</span><strong>{target}</strong></div>
      <img className="wow-icon portrait-icon" src={assetUrl(`icons/classes/${opponent.classId}.jpg`)} alt={opponent.className} />

      <div className="unit-bars">
        <div className="health-bar">
          <div className="bar-fill" style={{ width: `${opponent.healthPercent}%` }} />
          <strong>{opponent.name}</strong>
          <span>{opponent.healthPercent}%</span>
        </div>
        <div className="resource-bar">
          <div className="bar-fill" style={{ width: `${opponent.resourcePercent}%`, backgroundColor: opponent.resourceColor }} />
          <span>{opponent.resource}</span>
          <small>{opponent.className}</small>
        </div>
      </div>

      <div className="status-icons" aria-hidden="true">
        {opponent.statusIcons.map((icon) => <img className="wow-icon" src={assetUrl(icon)} alt="" key={icon} />)}
      </div>

      <div className="challenge-slot">
        {activeSpell ? (
          <div className="challenge-icon-wrap" data-testid="active-challenge-icon">
            <img className="wow-icon challenge-icon" src={assetUrl(activeSpell.icon)} alt={activeSpell.name} />
            <span>{activeSpell.name}</span>
          </div>
        ) : <div className="empty-challenge-slot" />}
      </div>
    </div>
  );
}
