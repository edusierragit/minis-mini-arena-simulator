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

let ownsFullscreen = false;

export function isBrowserReservedShortcut(binding: string): boolean {
  return RESERVED_SHORTCUTS.has(binding);
}

export function getBrowserReservedShortcuts(bindings: Iterable<string>): string[] {
  return [...new Set([...bindings].filter(isBrowserReservedShortcut))];
}

/**
 * Request fullscreen synchronously from the Start button's user gesture, then
 * ask Chromium's Keyboard Lock API to route reserved shortcuts to the game.
 */
export function requestBrowserShortcutLock(): Promise<BrowserShortcutLockStatus> {
  const keyboard = (navigator as NavigatorWithKeyboard).keyboard;
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
      await keyboard.lock();
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
