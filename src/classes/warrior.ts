import type { ClassDefinition } from "../types";

/** WotLK 3.3.5a Warrior arena and party mobility training data. */
export const warrior: ClassDefinition = {
  id: "warrior",
  name: "Warrior",
  icon: "icons/classes/warrior.jpg",
  playable: true,
  color: "#c69b6d",
  spells: [
    {
      id: "shield-bash",
      name: "Shield Bash",
      icon: "icons/warrior/shield-bash.jpg",
      targetMode: "arena",
      description: "Interrupt a specific arena enemy.",
      suggestedBindings: { arena1: "Ctrl+1", arena2: "Ctrl+2", arena3: "Ctrl+3" },
      enabledByDefault: true,
    },
    {
      id: "charge",
      name: "Charge",
      icon: "icons/warrior/charge.jpg",
      targetMode: "arena",
      description: "Charge a specific arena enemy.",
      suggestedBindings: { arena1: "Shift+1", arena2: "Shift+2", arena3: "Shift+3" },
      enabledByDefault: true,
    },
    {
      id: "intercept",
      name: "Intercept",
      icon: "icons/warrior/intercept.jpg",
      targetMode: "arena",
      description: "Intercept a specific arena enemy.",
      suggestedBindings: { arena1: "1", arena2: "2", arena3: "3" },
      enabledByDefault: true,
    },
    {
      id: "intervene",
      name: "Intervene",
      icon: "icons/warrior/intervene.jpg",
      targetMode: "ally",
      targetIds: ["party1", "party2"],
      description: "Intervene to Party 1 or Party 2 without changing enemy target.",
      suggestedBindings: { party1: "Shift+F1", party2: "Shift+F2" },
      enabledByDefault: true,
    },
  ],
};
