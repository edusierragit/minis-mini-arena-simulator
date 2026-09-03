import { DEFAULT_SETTINGS } from "../config";
import type { Bindings, PracticeSettings } from "../types";

const STORAGE_KEY = "minis-mini-arena-simulator:v1";

interface StoredState {
  selectedClassId: string | null;
  bindingsByClass: Record<string, Bindings>;
  settings: PracticeSettings;
}

const initialState: StoredState = {
  selectedClassId: null,
  bindingsByClass: {},
  settings: DEFAULT_SETTINGS,
};

export function loadAppState(): StoredState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialState;
    const parsed = JSON.parse(stored) as Partial<StoredState>;
    return {
      selectedClassId: typeof parsed.selectedClassId === "string" ? parsed.selectedClassId : null,
      bindingsByClass: parsed.bindingsByClass ?? {},
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
  } catch {
    return initialState;
  }
}

export function saveAppState(state: StoredState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The game remains usable if storage is unavailable (for example, strict privacy mode).
  }
}
