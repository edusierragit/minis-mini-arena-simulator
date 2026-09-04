import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { DIFFICULTIES, SESSION_LENGTHS } from "../config";
import { bindingKey, getDuplicateBindings, keyboardEventToBind, mouseEventToBind, wheelEventToBind } from "../game/keybindUtils";
import { getTargetDefinition, getTargetsForMode } from "../game/targets";
import { getBrowserReservedShortcuts } from "../game/browserShortcutLock";
import type { Bindings, ClassDefinition, PracticeSettings, TargetId } from "../types";
import { assetUrl } from "../utils/assets";

interface KeybindConfiguratorProps {
  classDefinition: ClassDefinition;
  bindings: Bindings;
  enabledSpellIds: string[];
  settings: PracticeSettings;
  onBindingsChange: (bindings: Bindings) => void;
  onEnabledSpellsChange: (spellIds: string[]) => void;
  onSettingsChange: (settings: PracticeSettings) => void;
  onBack: () => void;
  onStart: () => void;
}

interface CapturingBind {
  spellId: string;
  target: TargetId;
}

export function KeybindConfigurator({
  classDefinition,
  bindings,
  enabledSpellIds,
  settings,
  onBindingsChange,
  onEnabledSpellsChange,
  onSettingsChange,
  onBack,
  onStart,
}: KeybindConfiguratorProps) {
  const [capturing, setCapturing] = useState<CapturingBind | null>(null);
  const captureSurfaceRef = useRef<HTMLDivElement>(null);
  const suppressMouseButtonRef = useRef<number | null>(null);
  const suppressClearTimerRef = useRef<number | null>(null);
  const enabledSet = useMemo(() => new Set(enabledSpellIds), [enabledSpellIds]);
  const duplicates = useMemo(() => getDuplicateBindings(bindings), [bindings]);
  const activeBindings = useMemo(
    () => Object.fromEntries(Object.entries(bindings).filter(([key]) => enabledSet.has(key.split(":")[0]))),
    [bindings, enabledSet],
  );
  const activeDuplicates = useMemo(() => getDuplicateBindings(activeBindings), [activeBindings]);
  const reservedShortcuts = useMemo(
    () => getBrowserReservedShortcuts(Object.values(activeBindings)),
    [activeBindings],
  );
  const totalBinds = classDefinition.spells.length * 3;
  const configuredCount = classDefinition.spells.reduce(
    (count, spell) => count + getTargetsForMode(spell.targetMode).filter((target) => bindings[bindingKey(spell.id, target.id)]).length,
    0,
  );
  const activeConfiguredCount = classDefinition.spells.reduce(
    (count, spell) => count + (enabledSet.has(spell.id)
      ? getTargetsForMode(spell.targetMode).filter((target) => bindings[bindingKey(spell.id, target.id)]).length
      : 0),
    0,
  );

  useLayoutEffect(() => {
    const captureSurface = captureSurfaceRef.current;
    if (!capturing || !captureSurface) return;

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

    const captureMouse = (event: MouseEvent) => {
      const capturedBind = mouseEventToBind(event);
      if (!capturedBind) return;
      event.preventDefault();
      event.stopPropagation();
      suppressMouseButtonRef.current = event.button;
      commitBind(capturedBind);
    };

    window.addEventListener("keydown", captureKey, true);
    captureSurface.addEventListener("wheel", captureWheel, { capture: true, passive: false });
    captureSurface.addEventListener("mousedown", captureMouse, true);
    return () => {
      window.removeEventListener("keydown", captureKey, true);
      captureSurface.removeEventListener("wheel", captureWheel, true);
      captureSurface.removeEventListener("mousedown", captureMouse, true);
    };
  }, [bindings, capturing, onBindingsChange]);

  useLayoutEffect(() => {
    const preventBindableMouseNavigation = (event: MouseEvent) => {
      if (!mouseEventToBind(event) || event.button !== suppressMouseButtonRef.current) return;
      event.preventDefault();
      event.stopPropagation();

      if (event.type === "auxclick") {
        suppressMouseButtonRef.current = null;
      } else {
        if (suppressClearTimerRef.current !== null) window.clearTimeout(suppressClearTimerRef.current);
        suppressClearTimerRef.current = window.setTimeout(() => {
          suppressMouseButtonRef.current = null;
          suppressClearTimerRef.current = null;
        }, 0);
      }
    };

    // Keep browser Back/Forward and middle-button autoscroll suppressed after
    // capture commits on mousedown and the overlay disappears before mouseup.
    window.addEventListener("mouseup", preventBindableMouseNavigation, true);
    window.addEventListener("auxclick", preventBindableMouseNavigation, true);
    return () => {
      window.removeEventListener("mouseup", preventBindableMouseNavigation, true);
      window.removeEventListener("auxclick", preventBindableMouseNavigation, true);
      if (suppressClearTimerRef.current !== null) window.clearTimeout(suppressClearTimerRef.current);
    };
  }, []);

  const clearBind = (spellId: string, target: TargetId) => {
    const updated = { ...bindings };
    delete updated[bindingKey(spellId, target)];
    onBindingsChange(updated);
    if (capturing?.spellId === spellId && capturing.target === target) setCapturing(null);
  };

  const applySuggested = () => {
    const suggested: Bindings = {};
    classDefinition.spells.forEach((spell) => {
      getTargetsForMode(spell.targetMode).forEach((target) => {
        const bind = spell.suggestedBindings?.[target.id];
        if (bind) suggested[bindingKey(spell.id, target.id)] = bind;
      });
    });
    onBindingsChange(suggested);
  };

  const toggleSpell = (spellId: string) => {
    onEnabledSpellsChange(
      enabledSet.has(spellId)
        ? enabledSpellIds.filter((id) => id !== spellId)
        : [...enabledSpellIds, spellId],
    );
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
          <strong>Click a slot, then press keys, scroll or use a mouse button.</strong>
          <span>WheelUp/Down, MiddleClick, Mouse4+ and Ctrl / Alt / Shift are supported.</span>
        </div>
        <div className="config-actions">
          <button type="button" className="small-button" onClick={applySuggested}>Use suggested</button>
          <button type="button" className="small-button danger-button" onClick={resetBinds}>Reset binds</button>
        </div>
      </section>

      <section className="bind-list" aria-label={`${classDefinition.name} ability bindings`}>
        {classDefinition.spells.map((spell) => {
          const isEnabled = enabledSet.has(spell.id);
          return (
            <article className={`spell-row ${isEnabled ? "is-enabled" : "is-disabled"}`} key={spell.id}>
              <div className="spell-identity">
                <img className="wow-icon spell-icon" src={assetUrl(spell.icon)} alt="" />
                <div className="spell-copy">
                  <div className="spell-title-line">
                    <h2>{spell.name}</h2>
                    <span className={`target-mode-chip mode-${spell.targetMode}`}>{spell.targetMode === "arena" ? "ENEMY" : "ALLY · LEVEL 2"}</span>
                    {spell.macroSteps && <span className="target-mode-chip macro-chip">MACRO</span>}
                    {spell.counterplay && <span className="target-mode-chip timing-chip">TIMING · ADVANCED</span>}
                  </div>
                  <p>{spell.description}</p>
                  {spell.macroSteps && (
                    <span className="macro-steps">{spell.macroSteps.join(" → ").toUpperCase()}</span>
                  )}
                  {spell.dispels && (
                    <span className="dispel-types">REMOVES {spell.dispels.join(" · ").toUpperCase()}</span>
                  )}
                  <button
                    type="button"
                    className={`spell-toggle ${isEnabled ? "is-on" : ""}`}
                    onClick={() => toggleSpell(spell.id)}
                    aria-pressed={isEnabled}
                    aria-label={`${isEnabled ? "Disable" : "Enable"} ${spell.name} in practice`}
                    data-testid={`toggle-${spell.id}`}
                  ><i />{isEnabled ? "Enabled" : "Disabled"}</button>
                </div>
              </div>

              <div className="arena-bindings">
                {getTargetsForMode(spell.targetMode).map((target) => {
                  const key = bindingKey(spell.id, target.id);
                  const value = bindings[key] ?? "";
                  const isCapturing = capturing?.spellId === spell.id && capturing.target === target.id;
                  const isDuplicate = Boolean(value && duplicates.has(value));

                  return (
                    <div className={`bind-control ${isDuplicate ? "has-duplicate" : ""}`} key={target.id}>
                      <label>{target.compactLabel}</label>
                      <div className="bind-input-group">
                        <button
                          type="button"
                          className={`bind-input ${isCapturing ? "is-capturing" : ""}`}
                          onClick={() => setCapturing({ spellId: spell.id, target: target.id })}
                          data-testid={`bind-${spell.id}-${target.position}`}
                          aria-label={`${spell.name} ${target.label} bind${value ? `: ${value}` : ""}`}
                        >
                          {isCapturing ? <span>Press keys…</span> : value || <em>Not set</em>}
                        </button>
                        {value && (
                          <button
                            type="button"
                            className="clear-bind"
                            aria-label={`Clear ${spell.name} ${target.label}`}
                            onClick={() => clearBind(spell.id, target.id)}
                          >×</button>
                        )}
                      </div>
                      {isDuplicate && <small className="duplicate-note">Duplicate bind</small>}
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
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
          <small>{enabledSpellIds.length}/{classDefinition.spells.length} abilities enabled</small>
          {activeDuplicates.size > 0 && <span>Resolve duplicate binds in enabled abilities to start.</span>}
          {enabledSpellIds.length > 0 && activeConfiguredCount === 0 && <span>Configure at least one enabled ability bind.</span>}
          {reservedShortcuts.length > 0 && (
            <small className="reserved-bind-note">
              Protected fullscreen will activate for {reservedShortcuts.join(", ")}.
            </small>
          )}
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={onStart}
          disabled={enabledSpellIds.length === 0 || activeConfiguredCount === 0 || activeDuplicates.size > 0}
          data-testid="start-practice"
        >Start Practice <span>→</span></button>
      </footer>
      {capturing && (
        <div className="bind-capture-surface" ref={captureSurfaceRef} role="dialog" aria-modal="true" aria-label="Capturing keybind">
          <div className="capture-toast">
            <span>CAPTURING</span>
            <strong>{classDefinition.spells.find((spell) => spell.id === capturing.spellId)?.name}</strong>
            <small>{getTargetDefinition(capturing.target).label} · Press keys, scroll, or a mouse button · Esc cancels</small>
          </div>
        </div>
      )}
    </main>
  );
}
