export interface ArenaOpponent {
  name: string;
  classId: string;
  className: string;
  resource: "Mana" | "Energy" | "Rage" | "Runic Power";
  resourceColor: string;
  healthPercent: number;
  resourcePercent: number;
  statusIcons: string[];
}

const names = ["Morthos", "Vexia", "Thalgrim", "Seraphine", "Krag", "Nyx", "Aldren", "Slyfox", "Graves", "Vaelor"];

const archetypes = [
  { classId: "warrior", className: "Warrior", resource: "Rage" as const, resourceColor: "#c41e3a" },
  { classId: "priest", className: "Priest", resource: "Mana" as const, resourceColor: "#245fd9" },
  { classId: "rogue", className: "Rogue", resource: "Energy" as const, resourceColor: "#d6c52f" },
  { classId: "death-knight", className: "Death Knight", resource: "Runic Power" as const, resourceColor: "#37b8cf" },
  { classId: "paladin", className: "Paladin", resource: "Mana" as const, resourceColor: "#245fd9" },
  { classId: "hunter", className: "Hunter", resource: "Mana" as const, resourceColor: "#245fd9" },
  { classId: "warlock", className: "Warlock", resource: "Mana" as const, resourceColor: "#245fd9" },
  { classId: "shaman", className: "Shaman", resource: "Mana" as const, resourceColor: "#245fd9" },
  { classId: "druid", className: "Druid", resource: "Mana" as const, resourceColor: "#245fd9" },
];

const statusPool = [
  "icons/status/pvp-trinket.jpg",
  "icons/status/power-word-shield.jpg",
  "icons/status/renew.jpg",
  "icons/status/ice-block.jpg",
  "icons/status/bloodlust.jpg",
];

export function createOpponentTeam(): ArenaOpponent[] {
  const shuffled = [...archetypes].sort(() => Math.random() - 0.5).slice(0, 3);
  const nameOffset = Math.floor(Math.random() * names.length);

  return shuffled.map((archetype, index) => ({
    ...archetype,
    name: names[(nameOffset + index * 3) % names.length],
    healthPercent: 76 + Math.floor(Math.random() * 25),
    resourcePercent: 48 + Math.floor(Math.random() * 51),
    statusIcons: [
      statusPool[(nameOffset + index) % statusPool.length],
      statusPool[(nameOffset + index + 2) % statusPool.length],
    ],
  }));
}

export function createAllyTeam(): ArenaOpponent[] {
  const teammates = [...archetypes].sort(() => Math.random() - 0.5).slice(0, 2);
  const allyArchetypes = [
    { classId: "mage", className: "Mage", resource: "Mana" as const, resourceColor: "#245fd9" },
    ...teammates,
  ];

  return allyArchetypes.map((archetype, index) => ({
    ...archetype,
    name: index === 0 ? "Mini" : names[(index * 4 + Math.floor(Math.random() * names.length)) % names.length],
    healthPercent: 68 + Math.floor(Math.random() * 33),
    resourcePercent: 42 + Math.floor(Math.random() * 57),
    statusIcons: [statusPool[(index + 1) % statusPool.length]],
  }));
}
