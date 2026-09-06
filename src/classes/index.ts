import type { ClassDefinition } from "../types";
import { deathKnight } from "./deathKnight";
import { druid } from "./druid";
import { hunter } from "./hunter";
import { mage } from "./mage";
import { paladin } from "./paladin";
import { priest } from "./priest";
import { rogue } from "./rogue";
import { shaman } from "./shaman";
import { warlock } from "./warlock";
import { warrior } from "./warrior";

export const classDefinitions: ClassDefinition[] = [
  mage,
  rogue,
  priest,
  paladin,
  druid,
  shaman,
  warrior,
  warlock,
  hunter,
  deathKnight,
];

export function getClassDefinition(classId: string): ClassDefinition | undefined {
  return classDefinitions.find((classDefinition) => classDefinition.id === classId);
}
