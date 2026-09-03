import { classDefinitions } from "../classes";
import { assetUrl } from "../utils/assets";

interface ClassSelectorProps {
  onSelect: (classId: string) => void;
}

export function ClassSelector({ onSelect }: ClassSelectorProps) {
  return (
    <main className="screen class-screen">
      <div className="title-block">
        <p className="eyebrow">WOTLK ARENA WARM-UP</p>
        <h1>Mini&apos;s Mini<br /><span>Arena Simulator</span></h1>
        <p className="subtitle">Train the bind. Hit the target. Queue sharper.</p>
      </div>

      <section className="class-grid" aria-label="Choose a class">
        {classDefinitions.map((classDefinition) => (
          <button
            key={classDefinition.id}
            type="button"
            className={`class-card ${classDefinition.playable ? "is-playable" : "is-locked"}`}
            disabled={!classDefinition.playable}
            onClick={() => onSelect(classDefinition.id)}
            data-testid={`${classDefinition.id}-class-card`}
            style={{ "--class-color": classDefinition.color } as React.CSSProperties}
          >
            <img src={assetUrl(classDefinition.icon)} alt="" />
            <span className="class-card-copy">
              <strong>{classDefinition.name}</strong>
              <small>{classDefinition.playable ? "PLAYABLE" : "COMING SOON"}</small>
            </span>
          </button>
        ))}
      </section>

      <p className="keyboard-note">Desktop keyboard recommended · No game client connection</p>
    </main>
  );
}
