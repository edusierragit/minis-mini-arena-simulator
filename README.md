# Mini's Mini Arena Simulator

A standalone, Gladius-inspired keyboard reaction trainer for practicing WoW arena1 / arena2 / arena3 muscle memory. The MVP is Mage-only, runs entirely in the browser, and neither connects to nor automates World of Warcraft.

Keyboard keys, modifier combinations, WheelUp, WheelDown, and MiddleClick are supported. Abilities can be enabled or disabled individually; the default Mage pool is Frostbolt Rank 1, Deep Freeze, Counterspell, and Polymorph. The optional Remove Curse drill adds Self, Party 1, and Party 2 targets as the first ally-training mode.

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

- Mage spell definitions live in `src/classes/mage.ts`.
- Bundled WoW icon assets live in `public/icons/`.
- To add a Mage spell, place its original icon in `public/icons/mage/` and add one `SpellDefinition` entry to `src/classes/mage.ts`. Set `targetMode` to `arena` or `ally`; the generic bind configurator and practice engine will pick it up automatically.
- To add a class, create another data file under `src/classes/`, export a `ClassDefinition`, and register it in `src/classes/index.ts`. The game engine contains no Mage-specific challenge logic.

The included spell icons use the canonical client texture artwork served by the Wowhead/Wowhead CDN for the corresponding WotLK spell records. World of Warcraft and its assets are trademarks and property of Blizzard Entertainment; this fan-made trainer is not affiliated with Blizzard.
