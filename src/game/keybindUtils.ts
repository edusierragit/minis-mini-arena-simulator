import type { TargetId } from "../types";

const MODIFIER_KEYS = new Set(["Control", "Alt", "Shift", "Meta"]);

const KEY_ALIASES: Record<string, string> = {
  " ": "Space",
  Esc: "Escape",
  Del: "Delete",
  Left: "ArrowLeft",
  Right: "ArrowRight",
  Up: "ArrowUp",
  Down: "ArrowDown",
};

/** Convert a KeyboardEvent into the single canonical form used by capture and play. */
export function keyboardEventToBind(event: KeyboardEvent): string | null {
  if (MODIFIER_KEYS.has(event.key) || event.metaKey) return null;

  const rawKey = KEY_ALIASES[event.key] ?? event.key;
  const key = rawKey.length === 1 ? rawKey.toUpperCase() : rawKey;
  const parts: string[] = [];

  // This order is intentional and is the normalized storage/display order.
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  parts.push(key);

  return parts.join("+");
}

/** Normalize vertical mouse-wheel directions, including Ctrl/Alt/Shift variants. */
export function wheelEventToBind(event: WheelEvent): string | null {
  if (event.metaKey) return null;

  // Some browsers expose Shift+wheel as horizontal movement, so deltaX is the fallback.
  const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX;
  if (delta === 0) return null;

  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  parts.push(delta < 0 ? "WheelUp" : "WheelDown");
  return parts.join("+");
}

const BINDABLE_MOUSE_BUTTONS: Record<number, string> = {
  1: "MiddleClick",
  3: "Mouse4",
  4: "Mouse5",
  5: "Mouse6",
  6: "Mouse7",
  7: "Mouse8",
};

/** Normalize middle and extra mouse buttons using the same names during capture and play. */
export function mouseEventToBind(event: MouseEvent): string | null {
  const mouseButton = BINDABLE_MOUSE_BUTTONS[event.button];
  if (!mouseButton || event.metaKey) return null;

  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  parts.push(mouseButton);
  return parts.join("+");
}

export function bindingKey(spellId: string, target: TargetId): string {
  return `${spellId}:${target}`;
}

export function getDuplicateBindings(bindings: Record<string, string>): Set<string> {
  const counts = new Map<string, number>();
  Object.values(bindings).forEach((binding) => {
    if (binding) counts.set(binding, (counts.get(binding) ?? 0) + 1);
  });

  return new Set(
    [...counts.entries()].filter(([, count]) => count > 1).map(([binding]) => binding),
  );
}

export function isTextEditingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
}
