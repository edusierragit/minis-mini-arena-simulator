import { useEffect, useMemo, useState } from "react";
import { getClassDefinition } from "./classes";
import { ClassSelector } from "./components/ClassSelector";
import { KeybindConfigurator } from "./components/KeybindConfigurator";
import { PracticeSession } from "./components/PracticeSession";
import { loadAppState, saveAppState } from "./storage/appStorage";
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

  const selectedClass = selectedClassId ? getClassDefinition(selectedClassId) : undefined;
  const bindings = selectedClassId ? bindingsByClass[selectedClassId] ?? {} : {};
  const enabledSpellIds = selectedClassId && selectedClass
    ? enabledSpellsByClass[selectedClassId]
      ?? selectedClass.spells.filter((spell) => spell.enabledByDefault !== false).map((spell) => spell.id)
    : [];

  useEffect(() => {
    saveAppState({ selectedClassId, bindingsByClass, enabledSpellsByClass, settings });
  }, [bindingsByClass, enabledSpellsByClass, selectedClassId, settings]);

  const selectClass = (classId: string) => {
    const classDefinition = getClassDefinition(classId);
    if (!classDefinition?.playable) return;
    setSelectedClassId(classId);
    setScreen("bindings");
  };

  const changeBindings = (updatedBindings: Bindings) => {
    if (!selectedClassId) return;
    setBindingsByClass((current) => ({ ...current, [selectedClassId]: updatedBindings }));
  };

  const changeClass = () => {
    setSelectedClassId(null);
    setScreen("classes");
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
        onSettingsChange={setSettings}
        onChangeBinds={() => setScreen("bindings")}
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
      onStart={() => setScreen("practice")}
    />
  );
}
