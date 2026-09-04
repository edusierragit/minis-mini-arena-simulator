// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { mage } from "../src/classes/mage";
import { paladin } from "../src/classes/paladin";
import { priest } from "../src/classes/priest";
import { rogue } from "../src/classes/rogue";
import { shaman } from "../src/classes/shaman";
import { getDebuffDefinition } from "../src/data/debuffs";
import { generateChallenge, getConfiguredChallenges } from "../src/game/challengeGenerator";
import { bindingKey, getDuplicateBindings, keyboardEventToBind, mouseEventToBind, wheelEventToBind } from "../src/game/keybindUtils";
import { calculateStats } from "../src/game/scoring";
import {
  getBrowserReservedShortcuts,
  isBrowserReservedShortcut,
  releaseBrowserShortcutLock,
  requestBrowserShortcutLock,
} from "../src/game/browserShortcutLock";
import type { Bindings, PracticeResult } from "../src/types";

describe("keybind normalization", () => {
  it.each([
    [{ key: "q" }, "Q"],
    [{ key: "1" }, "1"],
    [{ key: "q", shiftKey: true }, "Shift+Q"],
    [{ key: "1", ctrlKey: true }, "Ctrl+1"],
    [{ key: "3", altKey: true }, "Alt+3"],
    [{ key: "f", ctrlKey: true, shiftKey: true }, "Ctrl+Shift+F"],
    [{ key: "f", ctrlKey: true, altKey: true, shiftKey: true }, "Ctrl+Alt+Shift+F"],
  ])("normalizes %o as %s", (init, expected) => {
    expect(keyboardEventToBind(new KeyboardEvent("keydown", init))).toBe(expected);
  });

  it("ignores modifiers on their own and Meta combinations", () => {
    expect(keyboardEventToBind(new KeyboardEvent("keydown", { key: "Shift", shiftKey: true }))).toBeNull();
    expect(keyboardEventToBind(new KeyboardEvent("keydown", { key: "k", metaKey: true }))).toBeNull();
  });

  it.each([
    [{ deltaY: -100 }, "WheelUp"],
    [{ deltaY: 100 }, "WheelDown"],
    [{ deltaY: -100, shiftKey: true }, "Shift+WheelUp"],
    [{ deltaY: 100, ctrlKey: true }, "Ctrl+WheelDown"],
    [{ deltaX: -100, shiftKey: true }, "Shift+WheelUp"],
  ])("normalizes wheel input %o as %s", (init, expected) => {
    expect(wheelEventToBind(new WheelEvent("wheel", init))).toBe(expected);
  });

  it.each([
    [{ button: 1 }, "MiddleClick"],
    [{ button: 1, ctrlKey: true }, "Ctrl+MiddleClick"],
    [{ button: 1, altKey: true, shiftKey: true }, "Alt+Shift+MiddleClick"],
    [{ button: 3 }, "Mouse4"],
    [{ button: 4, ctrlKey: true }, "Ctrl+Mouse5"],
    [{ button: 5, altKey: true, shiftKey: true }, "Alt+Shift+Mouse6"],
    [{ button: 7, ctrlKey: true, altKey: true, shiftKey: true }, "Ctrl+Alt+Shift+Mouse8"],
    [{ button: 11 }, "Mouse12"],
    [{ button: 19, ctrlKey: true }, "Ctrl+Mouse20"],
  ])("normalizes bindable mouse input %o as %s", (init, expected) => {
    expect(mouseEventToBind(new MouseEvent("mousedown", init))).toBe(expected);
  });

  it("ignores left-click, right-click, and Meta mouse combinations", () => {
    expect(mouseEventToBind(new MouseEvent("mousedown", { button: 0 }))).toBeNull();
    expect(mouseEventToBind(new MouseEvent("mousedown", { button: 2 }))).toBeNull();
    expect(mouseEventToBind(new MouseEvent("mousedown", { button: 3, metaKey: true }))).toBeNull();
    expect(mouseEventToBind(new MouseEvent("mousedown", { button: 20 }))).toBeNull();
  });

  it("finds every duplicated bind", () => {
    const duplicates = getDuplicateBindings({ a: "Shift+1", b: "Ctrl+2", c: "Shift+1", d: "Ctrl+2" });
    expect([...duplicates].sort()).toEqual(["Ctrl+2", "Shift+1"]);
  });
});

describe("browser shortcut protection", () => {
  it("detects reserved browser combinations without flagging normal arena binds", () => {
    expect(isBrowserReservedShortcut("Ctrl+W")).toBe(true);
    expect(isBrowserReservedShortcut("Shift+W")).toBe(false);
    expect(getBrowserReservedShortcuts(["Ctrl+W", "Shift+1", "Ctrl+W", "Alt+ArrowLeft"]))
      .toEqual(["Ctrl+W", "Alt+ArrowLeft"]);
  });

  it("enters fullscreen and locks the keyboard when the browser supports it", async () => {
    const lock = vi.fn().mockResolvedValue(undefined);
    const unlock = vi.fn();
    const requestFullscreen = vi.fn().mockImplementation(async () => {
      Object.defineProperty(document, "fullscreenElement", { configurable: true, value: document.documentElement });
    });
    const exitFullscreen = vi.fn().mockImplementation(async () => {
      Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
    });
    Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: requestFullscreen });
    Object.defineProperty(document, "exitFullscreen", { configurable: true, value: exitFullscreen });
    Object.defineProperty(navigator, "keyboard", { configurable: true, value: { lock, unlock } });

    expect(await requestBrowserShortcutLock()).toBe("locked");
    expect(requestFullscreen).toHaveBeenCalledOnce();
    expect(lock).toHaveBeenCalledOnce();

    await releaseBrowserShortcutLock();
    expect(unlock).toHaveBeenCalledOnce();
    expect(exitFullscreen).toHaveBeenCalledOnce();

    Reflect.deleteProperty(navigator, "keyboard");
    Reflect.deleteProperty(document.documentElement, "requestFullscreen");
    Reflect.deleteProperty(document, "exitFullscreen");
    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
  });
});

describe("generic challenge generation", () => {
  const bindings: Bindings = {
    [bindingKey("polymorph", "arena1")]: "Shift+1",
    [bindingKey("polymorph", "arena2")]: "Shift+2",
    [bindingKey("counterspell", "arena3")]: "Ctrl+3",
  };

  it("only uses configured spell/target pairs", () => {
    expect(getConfiguredChallenges(mage, bindings)).toHaveLength(3);
  });

  it("avoids immediately repeating the same pair when alternatives exist", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const challenge = generateChallenge(
      mage,
      bindings,
      undefined,
      { spellId: "polymorph", target: "arena1" },
      2,
    );
    expect(`${challenge.spellId}:${challenge.target}`).not.toBe("polymorph:arena1");
    vi.restoreAllMocks();
  });

  it.each([
    [mage, "remove-curse", ["curse"]],
    [priest, "dispel-magic-ally", ["magic"]],
    [paladin, "cleanse", ["magic", "poison", "disease"]],
    [shaman, "cleanse-spirit", ["curse", "poison", "disease"]],
  ] as const)("only shows debuffs that %s can remove", (classDefinition, spellId, allowedTypes) => {
    const dispelBindings = { [bindingKey(spellId, "party1")]: "Shift+1" };

    for (let index = 0; index < 40; index += 1) {
      const challenge = generateChallenge(classDefinition, dispelBindings, [spellId], null, index);
      const debuff = challenge.cueId ? getDebuffDefinition(challenge.cueId) : null;
      expect(debuff).not.toBeNull();
      expect(allowedTypes).toContain(debuff!.dispelType);
    }
  });

  it("builds Shadow Word: Death as a timed counterplay challenge", () => {
    const challenge = generateChallenge(
      priest,
      { [bindingKey("shadow-word-death", "arena2")]: "2" },
      ["shadow-word-death"],
      null,
      1,
    );

    expect(challenge).toMatchObject({
      spellId: "shadow-word-death",
      target: "arena2",
      targetMode: "arena",
      counterplay: { castDurationMs: 1500, successWindowMs: 300 },
    });
    expect(["polymorph", "fear"]).toContain(challenge.cueId);
  });

  it("treats Rogue Shadowstep macros as one bindable arena action", () => {
    const macro = rogue.spells.find((spell) => spell.id === "shadowstep-kick");
    expect(macro).toMatchObject({
      name: "Shadowstep + Kick",
      targetMode: "arena",
      macroSteps: ["Shadowstep", "Kick"],
    });
    expect(getConfiguredChallenges(
      rogue,
      { [bindingKey("shadowstep-kick", "arena3")]: "Ctrl+Shift+3" },
      ["shadowstep-kick"],
    )).toEqual([{ spellId: "shadowstep-kick", target: "arena3", targetMode: "arena" }]);
  });
});

describe("session scoring", () => {
  it("counts outcomes, streaks, accuracy, reaction time, and score", () => {
    const result = (kind: PracticeResult["kind"], reactionMs: number | null): PracticeResult => ({
      challenge: { spellId: "polymorph", target: "arena1", targetMode: "arena" },
      kind,
      reactionMs,
      pressedBind: kind === "missed" ? null : "Shift+1",
      expectedBind: "Shift+1",
    });
    const stats = calculateStats([
      result("correct", 500),
      result("correct", 700),
      result("incorrect", 900),
      result("correct", 600),
      result("missed", null),
    ], 1500);

    expect(stats).toMatchObject({ correct: 3, incorrect: 1, missed: 1, accuracy: 60, bestStreak: 2, currentStreak: 0 });
    expect(stats.averageReactionMs).toBe(675);
    expect(stats.score).toBeGreaterThan(300);
  });
});
