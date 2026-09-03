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
  fireEvent(window, event);
  return event;
}

function suggestedEvent(spell: string, target: number): KeyboardEventInit {
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
  });

  afterEach(() => cleanup());

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
    fireEvent(window, practiceEvent);
    expect(practiceEvent.defaultPrevented).toBe(true);
    expect(screen.getByTestId("feedback-copy").textContent).toBe("CORRECT");
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

    fireEvent.keyDown(window, { key: "z" });
    expect(screen.getByTestId("feedback-copy").textContent).toMatch(/WRONG · EXPECTED/);

    await act(async () => vi.advanceTimersByTimeAsync(700));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("dialog", { name: "Practice paused" })).not.toBeNull();
    await act(async () => vi.advanceTimersByTimeAsync(3000));
    expect(screen.queryByTestId("feedback-copy")).toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });

    await act(async () => vi.advanceTimersByTimeAsync(1500));
    expect(screen.getByTestId("feedback-copy").textContent).toMatch(/MISSED · EXPECTED/);

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
