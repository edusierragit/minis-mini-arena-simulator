# Privacy

Mini's Mini Arena Simulator stores keybinds and settings only in your browser's local storage. They are never included in analytics.

The canonical Cloudflare deployment uses a same-origin endpoint to increment anonymous daily aggregate counters in Cloudflare D1. The GitHub Pages deployment can temporarily use [GoatCounter](https://www.goatcounter.com/) while the migration is in progress.

The following aggregate activity can be counted:

- site opens and referring hostname;
- country code supplied by Cloudflare;
- selected playable class;
- practice sessions started, restarted, and completed;
- selected difficulty and session length;
- explicitly supplied `utm_source` and `utm_campaign` values.
- broad browser, operating-system and device categories;
- two-letter browser language and coarse viewport size;
- whether that browser has opened the trainer before, without sending a visitor ID.

The game does **not** send or store configured keys or mouse buttons, IP addresses, player names, answers, scores, reaction times, raw user-agent strings, persistent visitor identifiers, or local storage contents. The first-party database stores counters per day and broad category combination rather than individual event records.

Because collection is limited to anonymous aggregate counters and uses no cookies or persistent visitor identifiers, the app does not expose a per-browser analytics switch. Global Privacy Control remains compatible with this design: no personal information is sold or shared in the first place.

Analytics failures never prevent the game from loading or running. The statistics are used only to understand adoption and improve the trainer.
