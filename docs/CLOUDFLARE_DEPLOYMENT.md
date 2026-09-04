# Cloudflare Pages migration

The migration is intentionally staged so the existing GitHub Pages URL remains playable until the Cloudflare deployment has been verified.

## 1. Create the Pages deployment

1. Create or sign in to a free Cloudflare account.
2. Open **Workers & Pages → Create → Pages → Connect to Git**.
3. Authorize the GitHub repository `edusierragit/minis-mini-arena-simulator`.
4. Use these build settings:
   - Production branch: `main`
   - Build command: `npm run build:cloudflare`
   - Build output directory: `dist`
   - Root directory: leave empty
5. Deploy. Cloudflare will assign a free `*.pages.dev` URL.

The game will load immediately. The analytics endpoint returns `503` until its database binding is configured; this never interrupts gameplay.

## 2. Create and bind the aggregate database

1. In Cloudflare, open **Storage & Databases → D1 SQL database → Create**.
2. Name it `minis-mini-arena-analytics`.
3. Open its SQL console and execute `migrations/0001_analytics.sql`, followed by `migrations/0002_client_breakdowns.sql`, from this repository.
4. Return to the Pages project and open **Settings → Bindings → Add → D1 database**.
5. Set the variable name to exactly `ANALYTICS_DB` and select the database.

## 3. Protect the private dashboard

1. In the Pages project settings, add an encrypted secret named exactly `ANALYTICS_ADMIN_TOKEN`.
2. Use a random value of at least 32 characters. Do not commit it or send it in screenshots.
3. Redeploy the latest commit so both bindings are available.
4. Open `https://YOUR-PROJECT.pages.dev/?stats=1` and enter that token.

The token is kept only in the browser tab's session storage and sent in an `Authorization` header. The dashboard returns only aggregate counters.

## 4. Verify before redirecting

In Brave, visit the `*.pages.dev` game URL and confirm in DevTools → Network that `POST /api/analytics` returns `204`. Select a class and start a practice, then load the private stats dashboard.

Only after this succeeds should the GitHub Pages workflow set `VITE_CANONICAL_DEPLOYMENT_URL` to the final Cloudflare URL. The redirect support is already built into `src/deployment.ts`; it preserves query parameters and fragments, so already-shared links and UTM campaigns continue to work.

## Capacity and failure behavior

Only `/api/*` invokes Pages Functions; all game assets remain static. If the free analytics quota is exhausted, analytics can stop temporarily without taking the game offline. Cloudflare Pages continues to deploy automatically whenever `main` changes.
