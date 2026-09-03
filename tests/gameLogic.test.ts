// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { mage } from "../src/classes/mage";
import { generateChallenge, getConfiguredChallenges } from "../src/game/challengeGenerator";
import { bindingKey, getDuplicateBindings, keyboardEventToBind, wheelEventToBind } from "../src/game/keybindUtils";
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

  it("finds every duplicated bind", () => {
    const duplicates = getDuplicateBindings({ a: "Shift+1", b: "Ctrl+2", c: "Shift+1", d: "Ctrl+2" });
    expect([...duplicates].sort()).toEqual(["Ctrl+2", "Shift+1"]);
  });
});

describe("generic challenge generation", () => {
  const bindings: Bindings = {
    [bindingKey("polymorph", 1)]: "Shift+1",
    [bindingKey("polymorph", 2)]: "Shift+2",
    [bindingKey("counterspell", 3)]: "Ctrl+3",
  };

  it("only uses configured spell/target pairs", () => {
    expect(getConfiguredChallenges(mage, bindings)).toHaveLength(3);
  });

  it("avoids immediately repeating the same pair when alternatives exist", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const challenge = generateChallenge(
      mage,
      bindings,
      { spellId: "polymorph", target: 1 },
      2,
    );
    expect(`${challenge.spellId}:${challenge.target}`).not.toBe("polymorph:1");
    vi.restoreAllMocks();
  });
});

describe("session scoring", () => {
  it("counts outcomes, streaks, accuracy, reaction time, and score", () => {
    const result = (kind: PracticeResult["kind"], reactionMs: number | null): PracticeResult => ({
      challenge: { spellId: "polymorph", target: 1 },
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
