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

The game does **not** send or store configured keys or mouse buttons, IP addresses, player names, answers, scores, reaction times, user-agent strings, or local storage contents. The first-party database stores one counter per day and category combination rather than individual event records.

Collection is disabled when the browser sends Do Not Track (`DNT: 1`). Players can also use the **Stats: on/off** control on the class-selection screen; that choice stays in their own browser. Global Privacy Control is also compatible with this design: no personal information is sold or shared in the first place.

Analytics failures never prevent the game from loading or running. The statistics are used only to understand adoption and improve the trainer.
