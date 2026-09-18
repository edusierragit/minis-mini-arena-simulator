import { useState } from "react";
import { mage } from "../classes/mage";
import type { Bindings, PracticeSettings } from "../types";
import { PracticeSession } from "./PracticeSession";

const DEMO_BINDINGS: Bindings = {
  "polymorph:arena1": "1",
  "polymorph:arena2": "2",
  "polymorph:arena3": "3",
};
const DEMO_SPELLS = ["polymorph"];

export function QuickDemo({ onExit, onConfigure }: { onExit: () => void; onConfigure: () => void }) {
  // Demo preferences and binds never replace a player's saved loadout.
  const [settings, setSettings] = useState<PracticeSettings>({
    difficulty: "slow",
    sessionLength: 5,
    muted: true,
  });

  return (
    <PracticeSession
      classDefinition={mage}
      bindings={DEMO_BINDINGS}
      enabledSpellIds={DEMO_SPELLS}
      settings={settings}
      shortcutLockStatus="off"
      isDemo
      onSettingsChange={setSettings}
      onChangeBinds={onConfigure}
      onChangeClass={onExit}
    />
  );
}
