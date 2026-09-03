# Mini's Mini Arena Simulator

A standalone, Gladius-inspired keyboard reaction trainer for practicing WoW arena and party-target muscle memory. It runs entirely in the browser and neither connects to nor automates World of Warcraft.

Mage, Rogue, Priest, Paladin, Druid, and Shaman are playable. Keyboard keys, modifier combinations, WheelUp, WheelDown, MiddleClick, and extra mouse buttons Mouse4 through Mouse20 are supported when exposed by the browser or mouse driver. Abilities can be enabled or disabled individually; the default Mage pool is Frostbolt Rank 1, Deep Freeze, Counterspell, and Polymorph.

Built by [Eduardo Sierra](https://x.com/eduardo39657119) and **Minimalistic**.

Optional, privacy-friendly usage analytics are supported through GoatCounter. Copy `.env.example` to `.env.production` and set the public `VITE_GOATCOUNTER_ENDPOINT`. Only aggregate visits, total site opens, class selections, and session lifecycle events are recorded; binds and performance results never leave the player's browser. See [PRIVACY.md](PRIVACY.md).

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

## Deploy free on GitHub Pages

1. Push the project to a GitHub repository whose default branch is `main`.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Push to `main`, or run the included **Deploy to GitHub Pages** workflow manually.

Vite uses relative asset paths, so the same build also works when uploaded to Vercel or another static host.

## Add game data

- Class and spell definitions live in `src/classes/` (for example `src/classes/mage.ts`).
- Ally-dispel cue definitions live in `src/data/debuffs.ts`.
- Bundled WoW icon assets live in `public/icons/`.
- Bundled WoW UI sounds live in `public/audio/`.
- To add a spell, place its original icon in that class folder and add one `SpellDefinition` entry to the class file. Set `targetMode` to `arena` or `ally`; for a dispel, add the supported `dispels` categories. The generic bind configurator and practice engine will pick it up automatically.
- To add a class, create another data file under `src/classes/`, export a `ClassDefinition`, and register it in `src/classes/index.ts`. The game engine contains no Mage-specific challenge logic.

The included spell icons use the canonical client texture artwork served by the Wowhead/Wowhead CDN for the corresponding WotLK spell records. World of Warcraft and its assets are trademarks and property of Blizzard Entertainment; this fan-made trainer is not affiliated with Blizzard.
