# Biga

An installable app (PWA) for planning biga and poolish pizza doughs to the hour. It works out the yeast, the water temperature and the timeline, and keeps your recipes in sync across devices.

- **Frontend:** React SPA (Vite, TanStack Router + Query). Optimistic updates, autosave, works offline.
- **Backend:** one Cloudflare Worker (Hono) serving the static app and `/api/*`.
- **Database:** Cloudflare D1, free plan.
- **Auth:** Better Auth with email + password, with Cloudflare Turnstile and rate limiting against bots.

## Deploy to your Cloudflare account

Deploys run from GitHub Actions (`.github/workflows/deploy.yml`) on every push to `main`, or by hand from **Actions → Deploy → Run workflow**. The first run creates the D1 database, applies the migrations and deploys the Worker.

### 1. Cloudflare API token and account ID

- Cloudflare dashboard → **My Profile → API Tokens → Create Token**.
  - Use the **Edit Cloudflare Workers** template.
  - Add **Account → D1 → Edit**.
  - Create the token and copy it.
- Find your **Account ID** on **Workers & Pages → Overview**, in the right-hand column.
- While you're there, note your **workers.dev subdomain**. The app will live at `https://biga.<subdomain>.workers.dev`.

### 2. Turnstile widget (bot check)

- Dashboard → **Turnstile → Add widget**.
- Hostname: `biga.<subdomain>.workers.dev`, plus your custom domain if you add one later.
- Widget mode: **Managed**.
- Copy the **site key** and **secret key**.

### 3. Two random secrets

```sh
openssl rand -base64 32   # → BETTER_AUTH_SECRET
openssl rand -base64 32   # → PASSWORD_PEPPER
```

> ⚠️ Never change `PASSWORD_PEPPER` once people have signed up. Every existing password stops working.

### 4. Add them to GitHub

Repo → **Settings → Secrets and variables → Actions**.

| Kind | Name | Value |
|---|---|---|
| Secret | `CLOUDFLARE_API_TOKEN` | token from step 1 |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | account ID from step 1 |
| Secret | `BETTER_AUTH_SECRET` | random string from step 3 |
| Secret | `PASSWORD_PEPPER` | random string from step 3 |
| Secret | `TURNSTILE_SECRET_KEY` | Turnstile secret key |
| Variable | `TURNSTILE_SITE_KEY` | Turnstile site key |
| Variable | `APP_URL` *(optional)* | e.g. `https://biga.<subdomain>.workers.dev` |

### 5. Run it

Push to `main`, or run the **Deploy** workflow by hand. Open the URL that `wrangler deploy` prints in the log. On your phone:

- **iOS:** Share → Add to Home Screen.
- **Android:** ⋮ → Install app.

### Deploying from your own machine instead

```sh
pnpm install
pnpm exec wrangler login
pnpm exec wrangler d1 create biga-db
pnpm exec wrangler secret put BETTER_AUTH_SECRET
pnpm exec wrangler secret put PASSWORD_PEPPER
pnpm exec wrangler secret put TURNSTILE_SECRET_KEY
# put your Turnstile site key in wrangler.jsonc → vars.TURNSTILE_SITE_KEY
pnpm run deploy      # build, migrate D1, deploy
```

## Bot and abuse protection

Everything here runs on free plans, and none of it uses D1 writes.

1. **Cloudflare Turnstile**, through Better Auth's `captcha` plugin, on sign-up and sign-in.
   - It runs in "interaction-only" mode, so most people never see it.
   - The token is checked before any password hashing or database work.
   - With real keys, tokens are also pinned to your hostname and the `auth` action.
2. **Workers rate-limit bindings** (`wrangler.jsonc → ratelimits`), checked before Better Auth runs:
   - 20 auth requests a minute per IP.
   - 3 sign-ups a minute per IP.
   - 5 sign-in attempts a minute **per email**, which slows credential stuffing that rotates IPs.
   - 60 recipe writes per 10 s per user, which protects the D1 write quota.
3. **Better Auth's own limiter**, switched on explicitly. Workers don't set `NODE_ENV`, so without that it stays off. It reads `cf-connecting-ip` to get the caller's IP.
4. **Password rules** (NIST SP 800-63B-4):
   - At least 12 characters and no composition rules.
   - Passwords seen in known breaches are rejected via Have I Been Pwned. Only 5 characters of a SHA-1 hash leave the Worker.
5. **Generic login errors.** Better Auth answers the same way for "no such user" and "wrong password", and takes the same time for both.

Not done, on purpose:

- **Honeypot fields.** Bots that post straight to the API never see the form, and Turnstile already covers form-filling bots. Honeypots mostly catch password managers.
- **Hard account lockout.** Without an email provider there's no way to unlock an account, so anyone could lock you out.

If you add a custom domain later:

- Add a free WAF rate-limiting rule on `/api/auth/`.
- Try Bot Fight Mode; test the installed app afterwards, because it can challenge API calls.
- Set `"workers_dev": false` so the old `workers.dev` URL can't be used to get around them.

Email verification and password reset need an email provider (for example Resend's free tier). They're the natural next step.

### Password hashing on the free plan

Better Auth's default scrypt hash costs about 90 ms of CPU. The free plan allows 10 ms per request and returns error 1102 when a Worker goes over.

This app uses PBKDF2-SHA256 instead. It runs natively in WebCrypto at 100,000 iterations, which is Cloudflare's cap. The result is then HMAC'd with `PASSWORD_PEPPER`, a secret that lives only in the Worker, so a leaked database alone can't be cracked.

If Workers Logs show "exceeded CPU" on sign-in, lower `PASSWORD_ITERATIONS` in `wrangler.jsonc` (for example to 60000). On a paid plan you can raise it. Existing hashes keep working either way, because each one records its own iteration count.

## The maths

- **Biga yeast:** about 0.3% IDY at 18 °C for 16 h. Activity doubles every 8 °C, and longer ferments need less yeast (×(16/h)^1.2). This is the original chart.
- **Poolish yeast:** about 0.1% IDY at 18 °C for 16 h, with the same 8 °C doubling and a steeper time curve (×(16/h)^1.5).
  - Wet preferments ferment faster, so this is roughly a third of a biga's dose.
  - It's fitted to published schedules (Hamelman, Italian tables, Weekend Bakery, pizzamaking.com), which disagree with each other by ±60%. Trust the bubbles over the clock.
- **Dough temperature:** the ball timings assume the dough comes off the mixer at 24–26 °C and the balls proof in an 18–24 °C room.
  - The water temperature comes from a mass-weighted energy balance across preferment, flour, water and mixer heat.
  - The classic "×4" rule of thumb gets it wrong when most of the water is already in a stiff biga.
  - When the water would need to be below 2 °C, the app gives an ice amount instead.
  - It warns above 38 °C, because that water lands directly on live yeast.
- **Hot rooms:** above 24 °C, the final-dough IDY is cut by half for every 8 °C, so the balls still get their 2 hours.
- **Bake later:** rest the balls about 1 h at room temperature, then refrigerate. Take them out about 2 h before baking.
  - Most doughs hold up to about 48 h in the fridge.
  - All-biga doughs hold only 12–16 h before they run out of sugar.

The maths lives in `src/lib/dough.ts`, with tests in `src/lib/dough.test.ts`.

## Development

```sh
pnpm install
cp .dev.vars.example .dev.vars
pnpm db:migrate:local
pnpm dev                 # http://localhost:5173 (app + Worker + local D1)
pnpm test                # dough maths
pnpm typecheck
pnpm build && pnpm preview   # production build, service worker included
```

- `.dev.vars.example` uses Cloudflare's Turnstile test keys, which always pass.
- Set `BREACHED_PASSWORD_CHECK=off` in `.dev.vars` to work offline.
- After changing `wrangler.jsonc`, run `pnpm cf-typegen`.
- After changing the artwork in `scripts/icons.mjs`, run `pnpm icons`. It regenerates the icons and the iOS launch screens.

### Layout

```
src/            React app: routes/, components/, lib/ (dough maths, query + offline cache, auth client)
shared/         recipe types + validation, used by app and Worker
worker/         Hono API: auth.ts (Better Auth), password.ts, recipes.ts
migrations/     D1 schema
public/         icons, iOS launch screens, _headers (CSP + caching)
```
