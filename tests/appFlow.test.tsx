// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { mage } from "../src/classes/mage";
import { GladiusPanel } from "../src/components/GladiusPanel";
import { createOpponentTeam } from "../src/data/opponents";
import type { ArenaTarget } from "../src/types";

function chooseMage() {
  fireEvent.click(screen.getByTestId("mage-class-card"));
}

function capture(testId: string, init: KeyboardEventInit) {
  fireEvent.click(screen.getByTestId(testId));
  fireEvent.keyDown(window, init);
}

function captureWheel(testId: string, init: WheelEventInit): WheelEvent {
  fireEvent.click(screen.getByTestId(testId));
  const event = new WheelEvent("wheel", { ...init, bubbles: true, cancelable: true });
  fireEvent(screen.getByRole("dialog", { name: "Capturing keybind" }), event);
  return event;
}

function captureMiddleClick(testId: string, init: MouseEventInit = {}): MouseEvent {
  fireEvent.click(screen.getByTestId(testId));
  const event = new MouseEvent("mousedown", { ...init, button: 1, bubbles: true, cancelable: true });
  fireEvent(screen.getByRole("dialog", { name: "Capturing keybind" }), event);
  return event;
}

function captureExtraMouse(testId: string, button: number, init: MouseEventInit = {}): MouseEvent {
  fireEvent.click(screen.getByTestId(testId));
  const event = new MouseEvent("mousedown", { ...init, button, bubbles: true, cancelable: true });
  fireEvent(screen.getByRole("dialog", { name: "Capturing keybind" }), event);
  return event;
}

function suggestedEvent(spell: string, target: number): KeyboardEventInit {
  if (spell === "Frostbolt (Rank 1)") return { key: String(target) };
  if (spell === "Polymorph") return { key: String(target), shiftKey: true };
  if (spell === "Counterspell") return { key: String(target), ctrlKey: true };
  if (spell === "Deep Freeze") return { key: String(target), altKey: true };
  const letter = ["q", "w", "e"][target - 1];
  if (spell === "Frost Nova") return { key: letter, shiftKey: true };
  return { key: ["z", "x", "c"][target - 1], ctrlKey: true };
}

describe("complete app flow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("offers Mage, Rogue, Priest, Paladin, Druid, and Shaman as playable classes", () => {
    render(<App />);

    ["mage", "rogue", "priest", "paladin", "druid", "shaman"].forEach((classId) => {
      expect((screen.getByTestId(`${classId}-class-card`) as HTMLButtonElement).disabled).toBe(false);
    });
    expect((screen.getByTestId("warrior-class-card") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("link", { name: "Eduardo Sierra" }).getAttribute("href")).toBe(
      "https://x.com/eduardo39657119",
    );
  });

  it("loads Rogue's arena training pool and suggested binds", () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("rogue-class-card"));

    expect(screen.getByRole("heading", { name: "Rogue keybinds" })).not.toBeNull();
    expect(screen.getByTestId("toggle-kick").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("toggle-dismantle").getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Use suggested" }));
    expect(screen.getByTestId("bind-kick-1").textContent).toContain("Ctrl+1");
    expect(screen.getByTestId("bind-blind-2").textContent).toContain("Shift+2");
    expect(screen.getByTestId("toggle-shadowstep").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("toggle-garrote").getAttribute("aria-pressed")).toBe("false");
    expect((screen.getByTestId("start-practice") as HTMLButtonElement).disabled).toBe(false);
  });

  it("never mixes another class's spells into Mage, even with contaminated saved state", () => {
    localStorage.setItem("minis-mini-arena-simulator:v1", JSON.stringify({
      selectedClassId: "mage",
      bindingsByClass: {},
      enabledSpellsByClass: { mage: ["polymorph", "cleanse", "kick", "hex"] },
      settings: { difficulty: "normal", sessionLength: 30, muted: false },
    }));

    render(<App />);
    const mageList = screen.getByRole("region", { name: "Mage ability bindings" });
    expect(within(mageList).getByRole("heading", { name: "Polymorph" })).not.toBeNull();
    expect(within(mageList).queryByRole("heading", { name: "Cleanse" })).toBeNull();
    expect(within(mageList).queryByRole("heading", { name: "Kick" })).toBeNull();
    expect(screen.getByText("1/12 abilities enabled")).not.toBeNull();
  });

  it("captures, replaces, clears, and warns about duplicate modifier binds", () => {
    render(<App />);
    chooseMage();

    capture("bind-polymorph-1", { key: "1", shiftKey: true });
    expect(screen.getByTestId("bind-polymorph-1").textContent).toContain("Shift+1");

    capture("bind-polymorph-1", { key: "f", ctrlKey: true, shiftKey: true });
    expect(screen.getByTestId("bind-polymorph-1").textContent).toContain("Ctrl+Shift+F");

    capture("bind-polymorph-2", { key: "f", ctrlKey: true, shiftKey: true });
    expect(screen.getAllByText("Duplicate bind")).toHaveLength(2);
    expect((screen.getByTestId("start-practice") as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Clear Polymorph Arena 2" }));
    expect(screen.queryByText("Duplicate bind")).toBeNull();
    expect((screen.getByTestId("start-practice") as HTMLButtonElement).disabled).toBe(false);
  });

  it("captures modified wheel binds and recognizes them during practice", () => {
    render(<App />);
    chooseMage();

    const captureEvent = captureWheel("bind-polymorph-1", { deltaY: -100, shiftKey: true });
    expect(captureEvent.defaultPrevented).toBe(true);
    expect(screen.getByTestId("bind-polymorph-1").textContent).toContain("Shift+WheelUp");
    fireEvent.click(screen.getByTestId("start-practice"));

    const practiceEvent = new WheelEvent("wheel", {
      deltaY: -100,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    fireEvent(document.querySelector(".practice-screen")!, practiceEvent);
    expect(practiceEvent.defaultPrevented).toBe(true);
    expect(screen.getByTestId("feedback-copy").textContent).toBe("CORRECT");
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
  });

  it("captures the wheel button with modifiers and recognizes it during practice", () => {
    render(<App />);
    chooseMage();

    const captureEvent = captureMiddleClick("bind-polymorph-2", { ctrlKey: true, altKey: true });
    expect(captureEvent.defaultPrevented).toBe(true);
    expect(screen.getByTestId("bind-polymorph-2").textContent).toContain("Ctrl+Alt+MiddleClick");
    fireEvent.click(screen.getByTestId("start-practice"));

    const practiceEvent = new MouseEvent("mousedown", {
      button: 1,
      ctrlKey: true,
      altKey: true,
      bubbles: true,
      cancelable: true,
    });
    fireEvent(document.querySelector(".practice-screen")!, practiceEvent);
    expect(practiceEvent.defaultPrevented).toBe(true);
    expect(screen.getByTestId("feedback-copy").textContent).toBe("CORRECT");
  });

  it("captures extra mouse buttons with modifiers and blocks browser navigation", () => {
    render(<App />);
    chooseMage();

    const captureEvent = captureExtraMouse("bind-polymorph-3", 3, { ctrlKey: true, shiftKey: true });
    expect(captureEvent.defaultPrevented).toBe(true);
    expect(screen.getByTestId("bind-polymorph-3").textContent).toContain("Ctrl+Shift+Mouse4");

    const releaseEvent = new MouseEvent("mouseup", {
      button: 3,
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    fireEvent(window, releaseEvent);
    expect(releaseEvent.defaultPrevented).toBe(true);

    fireEvent.click(screen.getByTestId("start-practice"));
    const practiceEvent = new MouseEvent("mousedown", {
      button: 3,
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    fireEvent(window, practiceEvent);
    expect(practiceEvent.defaultPrevented).toBe(true);
    expect(screen.getByTestId("feedback-copy").textContent).toBe("CORRECT");
  });

  it("keeps spells loaded while allowing the practice pool to be toggled", () => {
    const view = render(<App />);
    chooseMage();

    expect(screen.getByTestId("toggle-frostbolt-rank-1").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("toggle-spellsteal").getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByTestId("toggle-spellsteal"));
    expect(screen.getByTestId("toggle-spellsteal").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("5/12 abilities enabled")).not.toBeNull();

    view.unmount();
    render(<App />);
    expect(screen.getByTestId("toggle-spellsteal").getAttribute("aria-pressed")).toBe("true");
  });

  it("supports optional ally-target Remove Curse drills", () => {
    render(<App />);
    chooseMage();
    fireEvent.click(screen.getByRole("button", { name: "Use suggested" }));
    ["frostbolt-rank-1", "polymorph", "counterspell", "deep-freeze"].forEach((spellId) => {
      fireEvent.click(screen.getByTestId(`toggle-${spellId}`));
    });
    fireEvent.click(screen.getByTestId("toggle-remove-curse"));
    fireEvent.click(screen.getByTestId("start-practice"));

    expect(screen.getByRole("region", { name: "Friendly party frames" })).not.toBeNull();
    expect(screen.getByTestId("active-ally-challenge-icon")).not.toBeNull();
    expect(document.querySelector(".challenge-callout span")?.textContent).toBe("DISPEL");
    expect(["Hex", "Curse of Tongues", "Curse of Exhaustion"]).toContain(
      document.querySelector(".challenge-callout strong")?.textContent,
    );
    const calloutTarget = document.querySelector(".challenge-callout b")?.textContent;
    const functionKey = calloutTarget === "SELF" ? "F1" : calloutTarget === "PARTY 1" ? "F2" : "F3";
    fireEvent.keyDown(window, { key: functionKey, altKey: true });
    expect(screen.getByTestId("feedback-copy").textContent).toBe("CORRECT");
  });

  it("persists the sound toggle", () => {
    const first = render(<App />);
    chooseMage();
    capture("bind-polymorph-1", { key: "1", shiftKey: true });
    fireEvent.click(screen.getByTestId("start-practice"));
    fireEvent.click(screen.getByRole("button", { name: "Sound on" }));
    expect(screen.getByRole("button", { name: "Sound off" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.keyDown(window, { key: "1", shiftKey: true });
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Binds" }));
    first.unmount();

    render(<App />);
    fireEvent.click(screen.getByTestId("start-practice"));
    expect(screen.getByRole("button", { name: "Sound off" })).not.toBeNull();
  });

  it("persists selected class, binds, and difficulty across remounts", () => {
    const first = render(<App />);
    chooseMage();
    capture("bind-counterspell-3", { key: "3", altKey: true });
    fireEvent.click(screen.getByRole("button", { name: /Fast/ }));
    first.unmount();

    render(<App />);
    expect(screen.getByRole("heading", { name: "Mage keybinds" })).not.toBeNull();
    expect(screen.getByTestId("bind-counterspell-3").textContent).toContain("Alt+3");
    expect(screen.getByRole("button", { name: /Fast/ }).classList.contains("active")).toBe(true);
  });

  it("recognizes wrong input, timeout, pause, restart, and all three arena frames", async () => {
    vi.useFakeTimers();
    render(<App />);
    chooseMage();
    fireEvent.click(screen.getByRole("button", { name: "Use suggested" }));
    fireEvent.click(screen.getByTestId("start-practice"));

    expect(screen.getByTestId("arena-frame-1")).not.toBeNull();
    expect(screen.getByTestId("arena-frame-2")).not.toBeNull();
    expect(screen.getByTestId("arena-frame-3")).not.toBeNull();
    expect(screen.getByTestId("active-challenge-icon")).not.toBeNull();
    expect(screen.queryByRole("region", { name: "Friendly party frames" })).toBeNull();

    fireEvent.keyDown(window, { key: "z" });
    expect(screen.getByTestId("feedback-copy").textContent).toMatch(/WRONG · USE/);

    await act(async () => vi.advanceTimersByTimeAsync(700));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("dialog", { name: "Practice paused" })).not.toBeNull();
    await act(async () => vi.advanceTimersByTimeAsync(3000));
    expect(screen.queryByTestId("feedback-copy")).toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });

    await act(async () => vi.advanceTimersByTimeAsync(1500));
    expect(screen.getByTestId("feedback-copy").textContent).toMatch(/MISSED · USE/);

    fireEvent.click(screen.getByRole("button", { name: "Restart" }));
    const stats = screen.getByRole("region", { name: "Practice statistics" });
    expect(within(stats).getByText("Score").nextElementSibling?.textContent).toBe("0");
  });

  it("recognizes correct binds and completes a full 30-challenge session", async () => {
    vi.useFakeTimers();
    render(<App />);
    chooseMage();
    fireEvent.click(screen.getByRole("button", { name: "Use suggested" }));
    fireEvent.click(screen.getByTestId("start-practice"));

    for (let round = 0; round < 30; round += 1) {
      const callout = document.querySelector(".challenge-callout");
      const spell = callout?.querySelector("strong")?.textContent ?? "";
      const targetText = callout?.querySelector("b")?.textContent ?? "";
      const target = Number(targetText.match(/[123]/)?.[0]);
      fireEvent.keyDown(window, suggestedEvent(spell, target));
      expect(screen.getByTestId("feedback-copy").textContent).toBe("CORRECT");
      await act(async () => vi.advanceTimersByTimeAsync(400));
    }

    expect(screen.getByText("SESSION COMPLETE")).not.toBeNull();
    expect(screen.getByText("Correct").parentElement?.querySelector("strong")?.textContent).toBe("30");
    expect(screen.getByText("Incorrect").parentElement?.querySelector("strong")?.textContent).toBe("0");
    expect(screen.getByText("Missed").parentElement?.querySelector("strong")?.textContent).toBe("0");

    fireEvent.click(screen.getByTestId("practice-again"));
    expect(screen.getByTestId("arena-frame-1")).not.toBeNull();
  });

  it("can place a challenge icon on Arena 1, Arena 2, and Arena 3", () => {
    const opponents = createOpponentTeam();
    const view = render(<GladiusPanel opponents={opponents} target={1} spell={mage.spells[0]} feedback={null} />);

    ([1, 2, 3] as ArenaTarget[]).forEach((target) => {
      view.rerender(<GladiusPanel opponents={opponents} target={target} spell={mage.spells[0]} feedback={null} />);
      const targetFrame = screen.getByTestId(`arena-frame-${target}`);
      expect(within(targetFrame).getByTestId("active-challenge-icon")).not.toBeNull();
    });
  });
});
