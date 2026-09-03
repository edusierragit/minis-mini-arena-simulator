import type { DispelType } from "../types";

export interface DebuffDefinition {
  id: string;
  name: string;
  icon: string;
  dispelType: DispelType;
}

/** WotLK PvP effects used as visual cues for ally-dispel challenges. */
export const trainingDebuffs: DebuffDefinition[] = [
  { id: "hex", name: "Hex", icon: "icons/debuffs/hex.jpg", dispelType: "curse" },
  { id: "curse-of-tongues", name: "Curse of Tongues", icon: "icons/debuffs/curse-of-tongues.jpg", dispelType: "curse" },
  { id: "curse-of-exhaustion", name: "Curse of Exhaustion", icon: "icons/debuffs/curse-of-exhaustion.jpg", dispelType: "curse" },
  { id: "fear", name: "Fear", icon: "icons/debuffs/fear.jpg", dispelType: "magic" },
  { id: "polymorph", name: "Polymorph", icon: "icons/debuffs/polymorph.jpg", dispelType: "magic" },
  { id: "hammer-of-justice", name: "Hammer of Justice", icon: "icons/debuffs/hammer-of-justice.jpg", dispelType: "magic" },
  { id: "frost-nova", name: "Frost Nova", icon: "icons/debuffs/frost-nova.jpg", dispelType: "magic" },
  { id: "crippling-poison", name: "Crippling Poison", icon: "icons/debuffs/crippling-poison.jpg", dispelType: "poison" },
  { id: "wound-poison", name: "Wound Poison", icon: "icons/debuffs/wound-poison.jpg", dispelType: "poison" },
  { id: "devouring-plague", name: "Devouring Plague", icon: "icons/debuffs/devouring-plague.jpg", dispelType: "disease" },
  { id: "frost-fever", name: "Frost Fever", icon: "icons/debuffs/frost-fever.jpg", dispelType: "disease" },
];

export function getDebuffDefinition(debuffId: string): DebuffDefinition | null {
  return trainingDebuffs.find((debuff) => debuff.id === debuffId) ?? null;
}
