import { DEFAULT_SETTINGS } from "../config";
import type { Bindings, PracticeSettings } from "../types";

const STORAGE_KEY = "minis-mini-arena-simulator:v1";
const CONTENT_VERSION = 4;
const REMOVED_ROGUE_SPELLS = new Set(["ambush", "eviscerate", "hemorrhage", "rupture", "deadly-throw"]);
const REMOVED_MAGE_SPELLS = new Set(["scorch", "arcane-barrage", "slow", "frost-nova", "ice-lance"]);
const NEW_ROGUE_DEFAULTS = ["shadowstep-kick", "shadowstep-sap", "shadowstep-cheap-shot"];

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

function migrateRogueBindings(bindings: Bindings): Bindings {
  return Object.entries(bindings).reduce<Bindings>((migrated, [key, binding]) => {
    const [spellId, targetId] = key.split(":");
    if (REMOVED_ROGUE_SPELLS.has(spellId)) return migrated;

    const nextSpellId = spellId === "shadowstep-blind" ? "shadowstep-sap" : spellId;
    const nextKey = `${nextSpellId}:${targetId}`;
    if (!(nextKey in migrated) || spellId !== "shadowstep-blind") migrated[nextKey] = binding;
    return migrated;
  }, {});
}

function removeSpellBindings(bindings: Bindings, removedSpellIds: Set<string>): Bindings {
  return Object.fromEntries(
    Object.entries(bindings).filter(([key]) => !removedSpellIds.has(key.split(":")[0])),
  );
}

export function loadAppState(): StoredState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialState;
    const parsed = JSON.parse(stored) as Partial<PersistedState>;
    const bindingsByClass = parsed.bindingsByClass ?? {};
    const enabledSpellsByClass = parsed.enabledSpellsByClass ?? {};

    const previousContentVersion = parsed.contentVersion ?? 1;
    if (previousContentVersion < CONTENT_VERSION) {
      if (bindingsByClass.rogue) {
        bindingsByClass.rogue = migrateRogueBindings(bindingsByClass.rogue);
      }
      if (enabledSpellsByClass.rogue) {
        const migratedRogueSpells = enabledSpellsByClass.rogue
          .filter((id) => !REMOVED_ROGUE_SPELLS.has(id))
          .map((id) => id === "shadowstep-blind" ? "shadowstep-sap" : id);
        if (!migratedRogueSpells.includes("cheap-shot")) migratedRogueSpells.push("cheap-shot");
        if (previousContentVersion < 2) {
          migratedRogueSpells.push(...NEW_ROGUE_DEFAULTS.filter((id) => !migratedRogueSpells.includes(id)));
        }
        enabledSpellsByClass.rogue = [...new Set(migratedRogueSpells)];
      }
      if (bindingsByClass.mage) {
        bindingsByClass.mage = removeSpellBindings(bindingsByClass.mage, REMOVED_MAGE_SPELLS);
      }
      if (enabledSpellsByClass.mage) {
        enabledSpellsByClass.mage = enabledSpellsByClass.mage.filter((id) => !REMOVED_MAGE_SPELLS.has(id));
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
