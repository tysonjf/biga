# Biga

An installable app (PWA) for planning biga, poolish and direct pizza doughs to the hour. It works out the yeast, the water temperature and the timeline, and keeps your recipes in sync across devices.

## How it's organised

- **Three kinds of dough:** a **biga** (stiff preferment), a **poolish** (runny preferment), or a **direct** dough, with no preferment: everything is mixed at once, ferments in bulk, then is balled. For a direct dough the yeast chart is the bulk ferment, and the schedule goes mix, ball, bake.
- **Recipes** are what you use day to day: the amounts, ferment, timings and notes (the method). The schedule starts **now** and keeps up with the clock, or you can pick when you'll mix the preferment:
  - Pick a time and it means the next time the clock reads it. At 7 pm, 5 pm means 5 pm tomorrow, but a time from the last hour means today, since you've just mixed it.
  - The day shows as Today, Tomorrow or a date, and you can tap it to change it.
  - The chart, the ingredients and the timing all work out from that start. **Now** goes back to the live clock.
  - The plan is saved with the recipe and lapses once its schedule is over, so a recipe never shows yesterday's times.
- **Bakes** are optional, for following one session on the clock. **Start a bake** (at the bottom of a recipe, or in its ⋯ menu) starts at the recipe's planned time, or now, and copies the recipe's settings, so you can tweak that bake without changing the recipe. A bake also records when the preferment was mixed and has its own notes. The bake page shows where you're up to and what's next, live. Bakes still on the go are listed on the home screen.
  - **Bake again** starts a new bake with this bake's settings.
  - **Save these settings to the recipe** copies a bake's tweaks back into the recipe.
- **Recipes and bakes open locked**, so a stray tap while scrolling can't change the amounts. Tap **Edit** to unlock and **Done** to lock again. Some things stay usable while locked, because they aren't the recipe's ratios: when you'll mix, the yeast chart (ferment temperature × time), which are scheduling, and the notes.
- **The playground** is a free calculator, one for biga and one for poolish. It saves as you go and never changes your recipes. **Save as recipe** turns it into a recipe.
- **Notes** (a recipe's notes, a bake's notes) are rich text: headings, numbered steps, bullets and checklists. They're stored as Markdown. The editor loads only on recipe and bake pages.
  - **Sums in the notes:** end a line with `=` and the answer shows after it, worked out live: `4 x 280 =` shows 1120. The answer isn't saved into the text, so it keeps up when you change the sum or the recipe. A line with an answer already typed after the `=` is left alone.
  - Sums can use the recipe's amounts by name, in whole grams as the Recipe card shows them: `flour`, `water`, `biga` or `poolish`, `salt`, `oil`, `sugar`, `dough`, `balls` and `hydration` (a percentage, so `flour × hydration%`). `Salt: flour × 2.5% =` follows the recipe.
  - `*italics*` only kick in when the stars hug the words, as in Markdown, so `2 * 4 * 3` stays a sum.
- **The calculator** sits at the bottom of a recipe: a keypad, the answer as you type, and your last few sums (tap one to use its answer). It knows the same names as the notes; tap an amount to put it in. Percent works like a phone calculator: `500 + 10%` is 550.
- **Toppings** is the second tab: researched recipes for the Italian classics (red and white) and celebrated contemporary pizzas, scaled to however many pizzas you're making, plus your own topping recipes, written from scratch or copied from a classic and changed.

- **Frontend:** React SPA (Vite, TanStack Router + Query). Optimistic updates, autosave, works offline.
- **Backend:** one Cloudflare Worker (Hono) serving the static app and `/api/*`.
- **Database:** Cloudflare D1, free plan.
- **Auth:** Better Auth with email + password, with Cloudflare Turnstile and rate limiting against bots.

## Deploy to your Cloudflare account

**→ Follow [SETUP.md](SETUP.md).** It's a step-by-step checklist covering everything from creating `main` to installing the app on your phone, plus troubleshooting.

In short: deploys run from GitHub Actions (`.github/workflows/deploy.yml`) on every push to `main`, or by hand from **Actions → Deploy → Run workflow**. The first run creates the D1 database, applies the migrations and deploys the Worker. You only need to add a few secrets to the repo first.

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
- **Poolish yeast:** about 0.075% IDY at 21 °C for 14 h, with the same 8 °C doubling and a steeper time curve (×(14/h)^1.5). New poolish recipes start there.
  - That's the classic overnight poolish: Hamelman's *Bread* uses 0.07% instant yeast and Forkish's *Flour Water Salt Yeast* 0.08%, for 12–16 h at about 21 °C. It's also the middle of the published schedules overall (Modernist Pizza, King Arthur, Weekend Bakery, Calvel, the Italian "1 g fresh yeast per kg" rule).
  - Wet preferments ferment faster, so this is roughly a quarter of a biga's dose.
  - The sources disagree with each other by about ±50%. Trust the bubbles over the clock.
- **Flours:** by default each flour goes into the preferment and the final dough in the same proportion.
  - Turn on **Set flours per stage** to give each flour its own share of each stage, for example all the bread flour in the biga and all the Tipo 00 in the final dough.
  - The Dough card then shows the overall blend that results.
  - The shares in each stage always add up to 100%. Changing one moves the biggest of the other flours, which is usually the main one.
- **Holding back water:** when the dough is wetter than 60%, the final dough's Water line (and the Dough temperature card) splits it in two. The first part brings the whole dough to 60%, counting the preferment's water, so it mixes strong; drizzle in the rest as it mixes (bassinage). The two parts add up to the water shown.
- **Oil and sugar:** both are a percentage of the total flour and go into the final mix. Like salt, they're on top of the hydration, which counts water only.
  - A little sugar (1–2%) helps a home oven brown the crust, and keeps an all-biga dough from coming out pale after a long fridge rest.
- **Dough temperature:** the ball timings assume the dough comes off the mixer at 24–26 °C and the balls proof in an 18–24 °C room.
  - **Biga water** uses Giorilli's rule: water = 55 − (room + flour), in °C, which lands a biga at about 18–20 °C. At a 21 °C room and 21 °C flour that's 13 °C. When the rule asks for less than 2 °C the app says to use iced water; above 38 °C it warns, since the yeast goes straight into that water.
  - The final dough's water temperature comes from a mass-weighted energy balance across preferment, flour, water and mixer heat.
  - The preferment counts at its ferment temperature unless you say otherwise under **Biga (or Poolish) into the mix**: **Fridge** (4 °C) for one held back in the fridge, **Room** for one left out once it was ready, or a probed temperature. It stays usable while the recipe is locked, since it's about the day, not the recipe. A cold biga needs much warmer water, so expect the 38 °C warning: let it sit out for a while first.
  - The classic "×4" rule of thumb gets it wrong when most of the water is already in a stiff biga.
  - When the water would need to be below 2 °C, the app gives an ice amount instead.
  - It warns above 38 °C, because that water lands directly on live yeast.
- **Hot rooms:** above 24 °C, the final-dough IDY is cut by half for every 8 °C, so the balls still get their 2 hours.
- **Clock changes:** schedules run on real elapsed time, so a 12 h biga always gets 12 hours. When daylight saving starts or ends during a schedule, the clock times after it move by an hour. The schedule and the yeast chart then say so, for example "Clocks go forward 1 hour at 2:00 am on Sun 4 Oct".
- **Bake later:** rest the balls about 1 h at room temperature, then refrigerate. Take them out about 2 h before baking.
  - Most doughs hold up to about 48 h in the fridge.
  - All-biga doughs hold only 12–16 h before they run out of sugar.

The maths lives in `src/lib/dough.ts`, with tests in `src/lib/dough.test.ts`. The tests run in Sydney time so the clock-change cases are real.

## Toppings

- Amounts are per pizza, for a 30–33 cm pizza from a 250–280 g ball, and scale with the **Pizzas** count (remembered on the device).
- Each ingredient goes on at one of three points: the **base** (sauce or cream), **before the bake**, or **after the bake** (cured meats, rocket, burrata, raw oil).
- The built-in recipes live in `src/lib/classics.ts`. Each one lists the sources it was checked against.
- Your own toppings sync like dough recipes: saved as you type, offline first, stored in the `topping` table.

## Development

```sh
pnpm install
cp .dev.vars.example .dev.vars
pnpm db:migrate:local
pnpm dev                 # http://localhost:5173 (app + Worker + local D1)
pnpm test                # dough maths, topping scaling and data
pnpm typecheck
pnpm build && pnpm preview   # production build, service worker included
```

- `.dev.vars.example` uses Cloudflare's Turnstile test keys, which always pass. If the Worker can't reach Cloudflare to check them, leave `TURNSTILE_SECRET_KEY` empty to switch the captcha off locally.
- Set `BREACHED_PASSWORD_CHECK=off` in `.dev.vars` to work offline.
- After changing `wrangler.jsonc`, run `pnpm cf-typegen`.
- After changing the artwork in `scripts/icons.mjs`, run `pnpm icons`. It regenerates the icons and the iOS launch screens.

### Layout

```
src/            React app: routes/ (home, recipe, bake, playground, toppings), components/ (Dough.tsx holds
                the calculator cards every page shares; Calculator.tsx the keypad; NotesMath.ts the sums in notes),
                lib/ (dough maths, math.ts for sums, toppings, query + offline cache, auth client)
shared/         recipe, bake, playground and topping types + validation, used by app and Worker
worker/         Hono API: auth.ts (Better Auth), password.ts, recipes.ts, bakes.ts, playground.ts, toppings.ts
migrations/     D1 schema. 0003_bakes adds bakes and the playground, and turns any recipe start time from the
                last week into a bake so a schedule in progress isn't lost. 0003_toppings adds toppings
                (two 0003s because both shipped separately; they touch different tables). 0004_direct_dough
                rebuilds recipe, bake and playground to allow 'direct', in an order that keeps every bake
public/         icons, iOS launch screens, _headers (CSP + caching)
```
