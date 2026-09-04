import type { ArenaOpponent } from "../data/opponents";
import type { ArenaTarget, ResultKind, SpellDefinition } from "../types";
import { assetUrl } from "../utils/assets";

interface ArenaFrameProps {
  target: ArenaTarget;
  opponent: ArenaOpponent;
  activeSpell: Pick<SpellDefinition, "name" | "icon" | "macroIcons"> | null;
  incomingCast: {
    name: string;
    icon: string;
    progress: number;
    timingBonus: number;
    isBonusWindow: boolean;
  } | null;
  feedback: ResultKind | null;
}

export function ArenaFrame({ target, opponent, activeSpell, incomingCast, feedback }: ArenaFrameProps) {
  const stateClass = feedback ? `feedback-${feedback}` : activeSpell ? "is-targeted" : "";

  return (
    <div className={`arena-frame ${stateClass}`} data-testid={`arena-frame-${target}`}>
      <div className="arena-index"><span>ARENA</span><strong>{target}</strong></div>
      <img className="wow-icon portrait-icon" src={assetUrl(`icons/classes/${opponent.classId}.jpg`)} alt={opponent.className} />

      <div className={`unit-bars ${incomingCast ? "has-incoming-cast" : ""}`}>
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
        {incomingCast && (
          <div
            className={`frame-cast-bar ${incomingCast.isBonusWindow ? "is-bonus-window" : ""}`}
            role="progressbar"
            aria-label={`${incomingCast.name} cast`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(incomingCast.progress * 100)}
            data-testid="incoming-cast"
          >
            <i style={{ transform: `scaleX(${incomingCast.progress})` }} />
            <span><img src={assetUrl(incomingCast.icon)} alt="" />{incomingCast.name}</span>
            <small>{incomingCast.isBonusWindow ? "MAX WINDOW" : "LATE BONUS"} +{incomingCast.timingBonus}</small>
          </div>
        )}
      </div>

      <div className="status-icons" aria-hidden="true">
        {opponent.statusIcons.map((icon) => <img className="wow-icon" src={assetUrl(icon)} alt="" key={icon} />)}
      </div>

      <div className="challenge-slot">
        {activeSpell ? (
          <div className="challenge-icon-wrap" data-testid="active-challenge-icon">
            {activeSpell.macroIcons ? (
              <div className="challenge-macro-icons" aria-label={activeSpell.name}>
                {activeSpell.macroIcons.map((icon) => (
                  <img className="wow-icon challenge-icon" src={assetUrl(icon)} alt="" key={icon} />
                ))}
              </div>
            ) : (
              <img className="wow-icon challenge-icon" src={assetUrl(activeSpell.icon)} alt={activeSpell.name} />
            )}
            <span>{activeSpell.name}</span>
          </div>
        ) : <div className="empty-challenge-slot" />}
      </div>
    </div>
  );
}
