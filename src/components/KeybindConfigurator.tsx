import { useEffect, useMemo, useState } from "react";
import { DIFFICULTIES, SESSION_LENGTHS } from "../config";
import { bindingKey, getDuplicateBindings, keyboardEventToBind, wheelEventToBind } from "../game/keybindUtils";
import type { ArenaTarget, Bindings, ClassDefinition, PracticeSettings } from "../types";
import { assetUrl } from "../utils/assets";

interface KeybindConfiguratorProps {
  classDefinition: ClassDefinition;
  bindings: Bindings;
  settings: PracticeSettings;
  onBindingsChange: (bindings: Bindings) => void;
  onSettingsChange: (settings: PracticeSettings) => void;
  onBack: () => void;
  onStart: () => void;
}

interface CapturingBind {
  spellId: string;
  target: ArenaTarget;
}

export function KeybindConfigurator({
  classDefinition,
  bindings,
  settings,
  onBindingsChange,
  onSettingsChange,
  onBack,
  onStart,
}: KeybindConfiguratorProps) {
  const [capturing, setCapturing] = useState<CapturingBind | null>(null);
  const duplicates = useMemo(() => getDuplicateBindings(bindings), [bindings]);
  const totalBinds = classDefinition.spells.length * 3;
  const configuredCount = classDefinition.spells.reduce(
    (count, spell) => count + ([1, 2, 3] as ArenaTarget[]).filter((target) => bindings[bindingKey(spell.id, target)]).length,
    0,
  );

  useEffect(() => {
    if (!capturing) return;

    const commitBind = (capturedBind: string) => {
      onBindingsChange({
        ...bindings,
        [bindingKey(capturing.spellId, capturing.target)]: capturedBind,
      });
      setCapturing(null);
    };

    const captureKey = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.key === "Escape") {
        setCapturing(null);
        return;
      }
      if (event.repeat) return;

      const capturedBind = keyboardEventToBind(event);
      if (!capturedBind) return;
      commitBind(capturedBind);
    };

    const captureWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const capturedBind = wheelEventToBind(event);
      if (capturedBind) commitBind(capturedBind);
    };

    window.addEventListener("keydown", captureKey, true);
    window.addEventListener("wheel", captureWheel, { capture: true, passive: false });
    return () => {
      window.removeEventListener("keydown", captureKey, true);
      window.removeEventListener("wheel", captureWheel, true);
    };
  }, [bindings, capturing, onBindingsChange]);

  const clearBind = (spellId: string, target: ArenaTarget) => {
    const updated = { ...bindings };
    delete updated[bindingKey(spellId, target)];
    onBindingsChange(updated);
    if (capturing?.spellId === spellId && capturing.target === target) setCapturing(null);
  };

  const applySuggested = () => {
    const suggested: Bindings = {};
    classDefinition.spells.forEach((spell) => {
      ([1, 2, 3] as ArenaTarget[]).forEach((target) => {
        const bind = spell.suggestedBindings?.[target];
        if (bind) suggested[bindingKey(spell.id, target)] = bind;
      });
    });
    onBindingsChange(suggested);
  };

  const resetBinds = () => {
    if (window.confirm("Clear every configured bind for this class?")) {
      onBindingsChange({});
      setCapturing(null);
    }
  };

  return (
    <main className="screen config-screen">
      <header className="screen-header">
        <button type="button" className="text-button" onClick={onBack}>← Classes</button>
        <div>
          <p className="eyebrow">LOADOUT</p>
          <h1>{classDefinition.name} keybinds</h1>
        </div>
        <div className="class-chip" style={{ "--class-color": classDefinition.color } as React.CSSProperties}>
          <img src={assetUrl(classDefinition.icon)} alt="" />
          <span>{classDefinition.name}</span>
        </div>
      </header>

      <section className="config-intro panel-inset">
        <div>
          <strong>Click a slot, then press keys or move the mouse wheel.</strong>
          <span>WheelUp / WheelDown and modifiers are supported. Escape cancels capture.</span>
        </div>
        <div className="config-actions">
          <button type="button" className="small-button" onClick={applySuggested}>Use suggested</button>
          <button type="button" className="small-button danger-button" onClick={resetBinds}>Reset binds</button>
        </div>
      </section>

      <section className="bind-list" aria-label={`${classDefinition.name} ability bindings`}>
        {classDefinition.spells.map((spell) => (
          <article className="spell-row" key={spell.id}>
            <div className="spell-identity">
              <img className="wow-icon spell-icon" src={assetUrl(spell.icon)} alt="" />
              <div>
                <h2>{spell.name}</h2>
                <p>{spell.description}</p>
              </div>
            </div>

            <div className="arena-bindings">
              {([1, 2, 3] as ArenaTarget[]).map((target) => {
                const key = bindingKey(spell.id, target);
                const value = bindings[key] ?? "";
                const isCapturing = capturing?.spellId === spell.id && capturing.target === target;
                const isDuplicate = Boolean(value && duplicates.has(value));

                return (
                  <div className={`bind-control ${isDuplicate ? "has-duplicate" : ""}`} key={target}>
                    <label>Arena {target}</label>
                    <div className="bind-input-group">
                      <button
                        type="button"
                        className={`bind-input ${isCapturing ? "is-capturing" : ""}`}
                        onClick={() => setCapturing({ spellId: spell.id, target })}
                        data-testid={`bind-${spell.id}-${target}`}
                        aria-label={`${spell.name} Arena ${target} bind${value ? `: ${value}` : ""}`}
                      >
                        {isCapturing ? <span>Press keys…</span> : value || <em>Not set</em>}
                      </button>
                      {value && (
                        <button
                          type="button"
                          className="clear-bind"
                          aria-label={`Clear ${spell.name} Arena ${target}`}
                          onClick={() => clearBind(spell.id, target)}
                        >×</button>
                      )}
                    </div>
                    {isDuplicate && <small className="duplicate-note">Duplicate bind</small>}
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </section>

      <section className="practice-options panel-inset">
        <div className="option-group">
          <span className="option-label">Reaction window</span>
          <div className="segmented-control">
            {Object.values(DIFFICULTIES).map((difficulty) => (
              <button
                type="button"
                key={difficulty.id}
                className={settings.difficulty === difficulty.id ? "active" : ""}
                onClick={() => onSettingsChange({ ...settings, difficulty: difficulty.id })}
              >
                {difficulty.label}<small>{difficulty.description}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="option-group">
          <span className="option-label">Session</span>
          <div className="segmented-control compact-segments">
            {SESSION_LENGTHS.map((length) => (
              <button
                type="button"
                key={length}
                className={settings.sessionLength === length ? "active" : ""}
                onClick={() => onSettingsChange({ ...settings, sessionLength: length })}
              >{length}<small>rounds</small></button>
            ))}
          </div>
        </div>
      </section>

      <footer className="config-footer">
        <div className="bind-status">
          <strong>{configuredCount}/{totalBinds}</strong> binds configured
          {duplicates.size > 0 && <span>Resolve duplicate binds to start.</span>}
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={onStart}
          disabled={configuredCount === 0 || duplicates.size > 0}
          data-testid="start-practice"
        >Start Practice <span>→</span></button>
      </footer>
    </main>
  );
}
