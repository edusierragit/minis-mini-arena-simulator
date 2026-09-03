import type { ClassDefinition } from "../types";
import { mage } from "./mage";

const comingSoon = [
  ["rogue", "Rogue", "#fff468"],
  ["priest", "Priest", "#ffffff"],
  ["warrior", "Warrior", "#c69b6d"],
  ["warlock", "Warlock", "#9482c9"],
  ["druid", "Druid", "#ff7c0a"],
  ["paladin", "Paladin", "#f48cba"],
  ["shaman", "Shaman", "#0070dd"],
  ["hunter", "Hunter", "#aad372"],
  ["death-knight", "Death Knight", "#c41e3a"],
] as const;

export const classDefinitions: ClassDefinition[] = [
  mage,
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
