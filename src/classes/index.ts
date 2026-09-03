import type { ClassDefinition } from "../types";
import { druid } from "./druid";
import { mage } from "./mage";
import { paladin } from "./paladin";
import { priest } from "./priest";
import { shaman } from "./shaman";

const comingSoon = [
  ["rogue", "Rogue", "#fff468"],
  ["warrior", "Warrior", "#c69b6d"],
  ["warlock", "Warlock", "#9482c9"],
  ["hunter", "Hunter", "#aad372"],
  ["death-knight", "Death Knight", "#c41e3a"],
] as const;

export const classDefinitions: ClassDefinition[] = [
  mage,
  priest,
  paladin,
  druid,
  shaman,
  ...comingSoon.map(([id, name, color]) => ({
    id,
    name,
    color,
    playable: false,
    icon: `icons/classes/${id}.jpg`,
    spells: [],
  })),
];

export function getClassDefinition(classId: string): ClassDefinition | undefined {
  return classDefinitions.find((classDefinition) => classDefinition.id === classId);
}
