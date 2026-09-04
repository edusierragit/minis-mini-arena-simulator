import { DEFAULT_SETTINGS } from "../config";
import type { Bindings, PracticeSettings } from "../types";

const STORAGE_KEY = "minis-mini-arena-simulator:v1";
const CONTENT_VERSION = 2;
const REMOVED_ROGUE_SPELLS = new Set(["cheap-shot", "ambush", "eviscerate", "hemorrhage", "rupture"]);
const NEW_ROGUE_DEFAULTS = ["shadowstep-kick", "shadowstep-blind", "shadowstep-cheap-shot"];

interface StoredState {
  selectedClassId: string | null;
  bindingsByClass: Record<string, Bindings>;
  enabledSpellsByClass: Record<string, string[]>;
  settings: PracticeSettings;
}

interface PersistedState extends StoredState {
  contentVersion: number;
}

const initialState: StoredState = {
  selectedClassId: null,
  bindingsByClass: {},
  enabledSpellsByClass: {},
  settings: DEFAULT_SETTINGS,
};

export function loadAppState(): StoredState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialState;
    const parsed = JSON.parse(stored) as Partial<PersistedState>;
    const bindingsByClass = parsed.bindingsByClass ?? {};
    const enabledSpellsByClass = parsed.enabledSpellsByClass ?? {};

    if ((parsed.contentVersion ?? 1) < CONTENT_VERSION) {
      if (bindingsByClass.rogue) {
        bindingsByClass.rogue = Object.fromEntries(
          Object.entries(bindingsByClass.rogue).filter(([key]) => !REMOVED_ROGUE_SPELLS.has(key.split(":")[0])),
        );
      }
      if (enabledSpellsByClass.rogue) {
        enabledSpellsByClass.rogue = [
          ...enabledSpellsByClass.rogue.filter((id) => !REMOVED_ROGUE_SPELLS.has(id)),
          ...NEW_ROGUE_DEFAULTS.filter((id) => !enabledSpellsByClass.rogue.includes(id)),
        ];
      }
    }

    return {
      selectedClassId: typeof parsed.selectedClassId === "string" ? parsed.selectedClassId : null,
      bindingsByClass,
      enabledSpellsByClass,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
  } catch {
    return initialState;
  }
}

export function saveAppState(state: StoredState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, contentVersion: CONTENT_VERSION }));
  } catch {
    // The game remains usable if storage is unavailable (for example, strict privacy mode).
  }
}
