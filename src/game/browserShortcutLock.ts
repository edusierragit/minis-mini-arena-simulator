export type BrowserShortcutLockStatus = "off" | "requesting" | "locked" | "fullscreen-only" | "unavailable";

interface KeyboardLockApi {
  lock(keyCodes?: string[]): Promise<void>;
  unlock(): void;
}

type NavigatorWithKeyboard = Navigator & { keyboard?: KeyboardLockApi };

const RESERVED_SHORTCUTS = new Set([
  "Ctrl+L",
  "Ctrl+N",
  "Ctrl+P",
  "Ctrl+R",
  "Ctrl+S",
  "Ctrl+T",
  "Ctrl+W",
  "Ctrl+Shift+N",
  "Ctrl+Shift+T",
  "Ctrl+Shift+W",
  "Alt+ArrowLeft",
  "Alt+ArrowRight",
]);

const RESERVED_SHORTCUT_KEY_CODES: Record<string, string> = {
  "Ctrl+L": "KeyL",
  "Ctrl+N": "KeyN",
  "Ctrl+P": "KeyP",
  "Ctrl+R": "KeyR",
  "Ctrl+S": "KeyS",
  "Ctrl+T": "KeyT",
  "Ctrl+W": "KeyW",
  "Ctrl+Shift+N": "KeyN",
  "Ctrl+Shift+T": "KeyT",
  "Ctrl+Shift+W": "KeyW",
  "Alt+ArrowLeft": "ArrowLeft",
  "Alt+ArrowRight": "ArrowRight",
};

let ownsFullscreen = false;

export function isBrowserReservedShortcut(binding: string): boolean {
  return RESERVED_SHORTCUTS.has(binding);
}

export function getBrowserReservedShortcuts(bindings: Iterable<string>): string[] {
  return [...new Set([...bindings].filter(isBrowserReservedShortcut))];
}

export function getBrowserReservedShortcutCodes(bindings: Iterable<string>): string[] {
  return [...new Set(
    getBrowserReservedShortcuts(bindings)
      .map((binding) => RESERVED_SHORTCUT_KEY_CODES[binding])
      .filter(Boolean),
  )];
}

export function hasBrowserCloseShortcut(bindings: Iterable<string>): boolean {
  return [...bindings].some((binding) => binding === "Ctrl+W" || binding === "Ctrl+Shift+W");
}

/**
 * Request fullscreen synchronously from the Start button's user gesture, then
 * ask Chromium's Keyboard Lock API to route reserved shortcuts to the game.
 */
export function requestBrowserShortcutLock(bindings: Iterable<string>): Promise<BrowserShortcutLockStatus> {
  const keyboard = (navigator as NavigatorWithKeyboard).keyboard;
  const keyCodes = getBrowserReservedShortcutCodes(bindings);
  const root = document.documentElement;
  let fullscreenRequest: Promise<void> | null = null;

  if (!document.fullscreenElement) {
    if (!root.requestFullscreen) return Promise.resolve("unavailable");
    try {
      ownsFullscreen = true;
      fullscreenRequest = root.requestFullscreen({ navigationUI: "hide" });
    } catch {
      ownsFullscreen = false;
      return Promise.resolve("unavailable");
    }
  }

  return (async () => {
    try {
      if (fullscreenRequest) await fullscreenRequest;
    } catch {
      ownsFullscreen = false;
      return "unavailable";
    }

    if (!keyboard?.lock) return "fullscreen-only";
    try {
      // Request the physical keys explicitly. In Chromium this includes every
      // modifier combination for the key (for example Ctrl+W for "KeyW").
      await keyboard.lock(keyCodes);
      return "locked";
    } catch {
      return "fullscreen-only";
    }
  })();
}

export async function releaseBrowserShortcutLock(): Promise<void> {
  try {
    (navigator as NavigatorWithKeyboard).keyboard?.unlock();
  } catch {
    // The browser may already have released the keyboard after leaving fullscreen.
  }

  if (ownsFullscreen && document.fullscreenElement && document.exitFullscreen) {
    try {
      await document.exitFullscreen();
    } catch {
      // Leaving the page still proceeds if the browser owns fullscreen state.
    }
  }
  ownsFullscreen = false;
}
