import type { ClassDefinition } from "../types";

/**
 * WotLK 3.3.5a Mage training data.
 * Spell icons use the original client texture names and are bundled in public/icons.
 */
export const mage: ClassDefinition = {
  id: "mage",
  name: "Mage",
  icon: "icons/classes/mage.jpg",
  playable: true,
  color: "#69ccf0",
  spells: [
    {
      id: "polymorph",
      name: "Polymorph",
      icon: "icons/mage/polymorph.jpg",
      targetMode: "arena",
      description: "Transform the selected arena enemy.",
      suggestedBindings: { 1: "Shift+1", 2: "Shift+2", 3: "Shift+3" },
    },
    {
      id: "counterspell",
      name: "Counterspell",
      icon: "icons/mage/counterspell.jpg",
      targetMode: "arena",
      description: "Interrupt the selected arena enemy.",
      suggestedBindings: { 1: "Ctrl+1", 2: "Ctrl+2", 3: "Ctrl+3" },
    },
    {
      id: "deep-freeze",
      name: "Deep Freeze",
      icon: "icons/mage/deep-freeze.jpg",
      targetMode: "arena",
      description: "Stun the selected arena enemy.",
      suggestedBindings: { 1: "Alt+1", 2: "Alt+2", 3: "Alt+3" },
    },
    {
      id: "frost-nova",
      name: "Frost Nova",
      icon: "icons/mage/frost-nova.jpg",
      targetMode: "arena",
      description: "Practice an arena-targeted root macro bind.",
      suggestedBindings: { 1: "Shift+Q", 2: "Shift+W", 3: "Shift+E" },
    },
    {
      id: "spellsteal",
      name: "Spellsteal",
      icon: "icons/mage/spellsteal.jpg",
      targetMode: "arena",
      description: "Steal a magic effect from the selected arena enemy.",
      suggestedBindings: { 1: "Ctrl+Z", 2: "Ctrl+X", 3: "Ctrl+C" },
    },
  ],
};
