import type { ClassDefinition } from "../types";

/** WotLK 3.3.5a Death Knight arena-target training data. */
export const deathKnight: ClassDefinition = {
  id: "death-knight",
  name: "Death Knight",
  icon: "icons/classes/death-knight.jpg",
  playable: true,
  color: "#c41e3a",
  spells: [
    {
      id: "mind-freeze",
      name: "Mind Freeze",
      icon: "icons/death-knight/mind-freeze.jpg",
      targetMode: "arena",
      description: "Interrupt a specific arena enemy.",
      suggestedBindings: { arena1: "Ctrl+1", arena2: "Ctrl+2", arena3: "Ctrl+3" },
      enabledByDefault: true,
    },
    {
      id: "strangulate",
      name: "Strangulate",
      icon: "icons/death-knight/strangulate.jpg",
      targetMode: "arena",
      description: "Silence a specific arena enemy.",
      suggestedBindings: { arena1: "Shift+1", arena2: "Shift+2", arena3: "Shift+3" },
      enabledByDefault: true,
    },
    {
      id: "gnaw",
      name: "Gnaw",
      icon: "icons/death-knight/gnaw.jpg",
      targetMode: "arena",
      description: "Ghoul stun on a specific arena enemy.",
      suggestedBindings: { arena1: "Alt+1", arena2: "Alt+2", arena3: "Alt+3" },
      enabledByDefault: true,
    },
    {
      id: "death-grip",
      name: "Death Grip",
      icon: "icons/death-knight/death-grip.jpg",
      targetMode: "arena",
      description: "Grip a specific arena enemy.",
      suggestedBindings: { arena1: "1", arena2: "2", arena3: "3" },
      enabledByDefault: true,
    },
    {
      id: "chains-of-ice",
      name: "Chains of Ice",
      icon: "icons/death-knight/chains-of-ice.jpg",
      targetMode: "arena",
      description: "Apply Chains of Ice to a specific arena enemy.",
      suggestedBindings: { arena1: "Ctrl+Q", arena2: "Ctrl+W", arena3: "Ctrl+E" },
      enabledByDefault: true,
    },
  ],
};
