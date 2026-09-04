# Mini's Mini Arena Simulator

A standalone, Gladius-inspired keyboard reaction trainer for practicing WoW arena and party-target muscle memory. It runs entirely in the browser and neither connects to nor automates World of Warcraft.

Mage, Rogue, Priest, Paladin, Druid, and Shaman are playable. Keyboard keys, modifier combinations, WheelUp, WheelDown, MiddleClick, and extra mouse buttons Mouse4 through Mouse20 are supported when exposed by the browser or mouse driver. Abilities can be enabled or disabled individually; the default Mage pool is Frostbolt Rank 1, Deep Freeze, Counterspell, and Polymorph.

When an enabled bind conflicts with a browser shortcut such as `Ctrl+W`, supported Chromium browsers automatically enter protected fullscreen practice through the Keyboard Lock API. Priest also includes an optional advanced Shadow Word: Death drill with an incoming Gladius cast bar and a larger score bonus for later timing. Rogue includes one-bind arena drills for Shadowstep + Kick, Shadowstep + Blind, and Shadowstep + Cheap Shot, plus party-target Tricks of the Trade practice.

Built by [Eduardo Sierra](https://x.com/eduardo39657119) and **Minimalistic**.

Privacy-friendly usage analytics use a same-origin Cloudflare Pages Function backed by aggregate D1 counters. They cover the practice funnel, acquisition, and broad anonymous client categories; binds and performance results never leave the player's browser. See [PRIVACY.md](PRIVACY.md).

Ally-dispel drills show real WotLK debuff icons on Self, Party 1, or Party 2. Challenges respect dispel categories (Curse, Magic, Poison, and Disease), so a class is only asked to remove effects it can actually dispel. Bundled WotLK success/failure sounds can be muted from the practice HUD.

## Install and run

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

The static output is written to `dist/`.

## Deployment

The canonical deployment runs on Cloudflare Pages. It builds with `npm run build:cloudflare`, publishes `dist/`, and binds the Pages Functions to D1 using `ANALYTICS_DB`. The private dashboard additionally requires the encrypted `ANALYTICS_ADMIN_TOKEN` secret; its value must never be committed. Database schemas are versioned in `migrations/`.

The included GitHub Pages workflow exists only to redirect the previously shared URL to the canonical Cloudflare deployment. It is restricted to this repository and does not run in forks.

## Add game data

- Class and spell definitions live in `src/classes/` (for example `src/classes/mage.ts`).
- Ally-dispel cue definitions live in `src/data/debuffs.ts`.
- Bundled WoW icon assets live in `public/icons/`.
- Bundled WoW UI sounds live in `public/audio/`.
- To add a spell, place its original icon in that class folder and add one `SpellDefinition` entry to the class file. Set `targetMode` to `arena` or `ally`; for a dispel, add the supported `dispels` categories. The generic bind configurator and practice engine will pick it up automatically.
- To add a class, create another data file under `src/classes/`, export a `ClassDefinition`, and register it in `src/classes/index.ts`. The game engine contains no Mage-specific challenge logic.

The included spell icons use the canonical client texture artwork served by the Wowhead/Wowhead CDN for the corresponding WotLK spell records. World of Warcraft and its assets are trademarks and property of Blizzard Entertainment; this fan-made trainer is not affiliated with Blizzard.
