// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { mage } from "../src/classes/mage";
import { paladin } from "../src/classes/paladin";
import { priest } from "../src/classes/priest";
import { shaman } from "../src/classes/shaman";
import { getDebuffDefinition } from "../src/data/debuffs";
import { generateChallenge, getConfiguredChallenges } from "../src/game/challengeGenerator";
import { bindingKey, getDuplicateBindings, keyboardEventToBind, mouseEventToBind, wheelEventToBind } from "../src/game/keybindUtils";
import { calculateStats } from "../src/game/scoring";
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
  ])("normalizes middle-click input %o as %s", (init, expected) => {
    expect(mouseEventToBind(new MouseEvent("mousedown", init))).toBe(expected);
  });

  it("finds every duplicated bind", () => {
    const duplicates = getDuplicateBindings({ a: "Shift+1", b: "Ctrl+2", c: "Shift+1", d: "Ctrl+2" });
    expect([...duplicates].sort()).toEqual(["Ctrl+2", "Shift+1"]);
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
