import type { ClassDefinition } from "../types";

/** WotLK 3.3.5a Hunter arena and party utility training data. */
export const hunter: ClassDefinition = {
  id: "hunter",
  name: "Hunter",
  icon: "icons/classes/hunter.jpg",
  playable: true,
  color: "#aad372",
  spells: [
    {
      id: "scatter-shot",
      name: "Scatter Shot",
      icon: "icons/hunter/scatter-shot.jpg",
      targetMode: "arena",
      description: "Disorient a specific arena enemy.",
      suggestedBindings: { arena1: "1", arena2: "2", arena3: "3" },
      enabledByDefault: true,
    },
    {
      id: "silencing-shot",
      name: "Silencing Shot",
      icon: "icons/hunter/silencing-shot.jpg",
      targetMode: "arena",
      description: "Silence a specific arena enemy.",
      suggestedBindings: { arena1: "Ctrl+1", arena2: "Ctrl+2", arena3: "Ctrl+3" },
      enabledByDefault: true,
    },
    {
      id: "viper-sting",
      name: "Viper Sting",
      icon: "icons/hunter/viper-sting.jpg",
      targetMode: "arena",
      description: "Apply Viper Sting to a specific mana user.",
      suggestedBindings: { arena1: "Shift+1", arena2: "Shift+2", arena3: "Shift+3" },
      enabledByDefault: true,
    },
    {
      id: "roar-of-sacrifice",
      name: "Roar of Sacrifice",
      icon: "icons/hunter/roar-of-sacrifice.jpg",
      targetMode: "ally",
      description: "Protect Self, Party 1 or Party 2 from critical strikes.",
      suggestedBindings: { player: "Alt+F1", party1: "Alt+F2", party2: "Alt+F3" },
      enabledByDefault: true,
    },
    {
      id: "masters-call",
      name: "Master's Call",
      icon: "icons/hunter/masters-call.jpg",
      targetMode: "ally",
      description: "Remove movement impairing effects from Self, Party 1 or Party 2.",
      suggestedBindings: { player: "Shift+F1", party1: "Shift+F2", party2: "Shift+F3" },
      enabledByDefault: true,
    },
  ],
};
