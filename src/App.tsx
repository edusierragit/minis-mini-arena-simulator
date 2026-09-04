import { useEffect, useMemo, useState } from "react";
import { trackAnalyticsEvent } from "./analytics";
import { getClassDefinition } from "./classes";
import { ClassSelector } from "./components/ClassSelector";
import { KeybindConfigurator } from "./components/KeybindConfigurator";
import { PracticeSession } from "./components/PracticeSession";
import { loadAppState, saveAppState } from "./storage/appStorage";
import {
  getBrowserReservedShortcuts,
  releaseBrowserShortcutLock,
  requestBrowserShortcutLock,
} from "./game/browserShortcutLock";
import type { BrowserShortcutLockStatus } from "./game/browserShortcutLock";
import type { Bindings, PracticeSettings } from "./types";

type Screen = "classes" | "bindings" | "practice";

export default function App() {
  const initial = useMemo(loadAppState, []);
  const initialClass = initial.selectedClassId ? getClassDefinition(initial.selectedClassId) : undefined;
  const [selectedClassId, setSelectedClassId] = useState<string | null>(initialClass?.playable ? initialClass.id : null);
  const [bindingsByClass, setBindingsByClass] = useState<Record<string, Bindings>>(initial.bindingsByClass);
  const [enabledSpellsByClass, setEnabledSpellsByClass] = useState<Record<string, string[]>>(initial.enabledSpellsByClass);
  const [settings, setSettings] = useState<PracticeSettings>(initial.settings);
  const [screen, setScreen] = useState<Screen>(initialClass?.playable ? "bindings" : "classes");
  const [shortcutLockStatus, setShortcutLockStatus] = useState<BrowserShortcutLockStatus>("off");

  const selectedClass = selectedClassId ? getClassDefinition(selectedClassId) : undefined;
  const bindings = selectedClassId ? bindingsByClass[selectedClassId] ?? {} : {};
  const enabledSpellIds = useMemo(() => {
    if (!selectedClassId || !selectedClass) return [];
    const storedIds = enabledSpellsByClass[selectedClassId];
    if (!storedIds) {
      return selectedClass.spells.filter((spell) => spell.enabledByDefault !== false).map((spell) => spell.id);
    }

    const validIds = new Set(selectedClass.spells.map((spell) => spell.id));
    return storedIds.filter((spellId) => validIds.has(spellId));
  }, [enabledSpellsByClass, selectedClass, selectedClassId]);

  useEffect(() => {
    saveAppState({ selectedClassId, bindingsByClass, enabledSpellsByClass, settings });
  }, [bindingsByClass, enabledSpellsByClass, selectedClassId, settings]);

  const selectClass = (classId: string) => {
    const classDefinition = getClassDefinition(classId);
    if (!classDefinition?.playable) return;
    trackAnalyticsEvent("class-selected", { class: classId });
    setSelectedClassId(classId);
    setScreen("bindings");
  };

  const changeBindings = (updatedBindings: Bindings) => {
    if (!selectedClassId) return;
    setBindingsByClass((current) => ({ ...current, [selectedClassId]: updatedBindings }));
  };

  const changeClass = () => {
    void releaseBrowserShortcutLock();
    setShortcutLockStatus("off");
    setSelectedClassId(null);
    setScreen("classes");
  };

  const changeBinds = () => {
    void releaseBrowserShortcutLock();
    setShortcutLockStatus("off");
    setScreen("bindings");
  };

  const startPractice = () => {
    if (!selectedClassId) return;
    const activeBindings = Object.entries(bindings)
      .filter(([key]) => enabledSpellIds.includes(key.split(":")[0]))
      .map(([, binding]) => binding);
    const reservedShortcuts = getBrowserReservedShortcuts(activeBindings);
    if (reservedShortcuts.length > 0) {
      setShortcutLockStatus("requesting");
      void requestBrowserShortcutLock(reservedShortcuts).then(setShortcutLockStatus);
    } else {
      setShortcutLockStatus("off");
    }
    trackAnalyticsEvent("practice-started", {
      class: selectedClassId,
      difficulty: settings.difficulty,
      rounds: settings.sessionLength,
    });
    setScreen("practice");
  };

  if (screen === "classes" || !selectedClass) {
    return <ClassSelector onSelect={selectClass} />;
  }

  if (screen === "practice") {
    return (
      <PracticeSession
        classDefinition={selectedClass}
        bindings={bindings}
        enabledSpellIds={enabledSpellIds}
        settings={settings}
        shortcutLockStatus={shortcutLockStatus}
        onSettingsChange={setSettings}
        onChangeBinds={changeBinds}
        onChangeClass={changeClass}
      />
    );
  }

  return (
    <KeybindConfigurator
      classDefinition={selectedClass}
      bindings={bindings}
      enabledSpellIds={enabledSpellIds}
      settings={settings}
      onBindingsChange={changeBindings}
      onEnabledSpellsChange={(spellIds) => {
        if (!selectedClassId) return;
        setEnabledSpellsByClass((current) => ({ ...current, [selectedClassId]: spellIds }));
      }}
      onSettingsChange={setSettings}
      onBack={changeClass}
      onStart={startPractice}
    />
  );
}
