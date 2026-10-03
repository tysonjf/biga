# Setup checklist

Everything you need to do to get Biga live on your Cloudflare account. Work top to bottom and tick things off as you go. It takes about 20 minutes, and every step uses free plans.

You'll copy a few values along the way. Keep them in a password manager as you go. The ones marked 🔒 are secret.

| Value | From step | Example |
|---|---|---|
| Cloudflare Account ID | 2 | `0123456789abcdef0123456789abcdef` |
| workers.dev subdomain | 2 | `tyson` → app at `https://biga.tyson.workers.dev` |
| 🔒 Cloudflare API token | 3 | `xxxxxxxx…` |
| Turnstile site key | 4 | `0x4AAAAAAA…` |
| 🔒 Turnstile secret key | 4 | `0x4AAAAAAA…` |
| 🔒 `BETTER_AUTH_SECRET` | 5 | random, 44 characters |
| 🔒 `PASSWORD_PEPPER` | 5 | random, 44 characters |

---

## 1. Put the code on `main`

The repo was empty, so `claude/recipe-app-cloudflare-auth-0ncsu5` is currently its only branch and its default. Deploys run from `main`.

- [ ] On GitHub, open the repo → **Branches** → **New branch**. Name it `main`, with source `claude/recipe-app-cloudflare-auth-0ncsu5`.

  Or, from a local clone:

  ```sh
  git fetch origin
  git push origin origin/claude/recipe-app-cloudflare-auth-0ncsu5:refs/heads/main
  ```
- [ ] Repo → **Settings → General → Default branch** → switch it to `main`.
- [ ] Optional: delete the `claude/…` branch once `main` exists.

> Creating `main` may start the **Deploy** workflow straight away. It will fail with "Missing repository secret" until you finish step 6. That's expected; just re-run it at step 7.

## 2. Cloudflare account, Account ID and workers.dev subdomain

- [ ] Sign up or log in at <https://dash.cloudflare.com>. The free plan is fine.
- [ ] Open **Workers & Pages**. If it asks you to choose a **workers.dev subdomain**, pick one now. Deploys fail until you have one.
- [ ] Write down your **subdomain**. It's on the Workers & Pages overview, for example `tyson.workers.dev`.
- [ ] Write down your **Account ID**. It's shown in the right-hand column of Workers & Pages, or in the URL: `dash.cloudflare.com/<account-id>/…`.

Your app's address will be **`https://biga.<subdomain>.workers.dev`**. You need it for steps 4 and 6.

## 3. Cloudflare API token (lets GitHub deploy for you)

- [ ] Dashboard → profile icon (top right) → **My Profile → API Tokens → Create Token**.
- [ ] Next to **Edit Cloudflare Workers**, click **Use template**.
- [ ] Under **Permissions**, click **+ Add more** and add **Account → D1 → Edit**. The template doesn't include database access, and the deploy needs it.
- [ ] **Account Resources:** pick your account. Leave **Zone Resources** as the template set it.
- [ ] **Continue to summary → Create Token**, then copy the token. Cloudflare only shows it once.

## 4. Turnstile widget (the "are you human" check)

- [ ] Dashboard → **Turnstile** (left sidebar; search for it if hidden) → **Add widget**.
- [ ] Name: `Biga`.
- [ ] Hostname: `biga.<subdomain>.workers.dev`, using your subdomain from step 2. Don't include `https://`.
- [ ] Widget mode: **Managed**. Leave pre-clearance off.
- [ ] **Create**, then copy the **Site Key** and the **Secret Key**.

## 5. Generate two random secrets

Run this twice, once for each secret:

```sh
openssl rand -base64 32
```

No terminal? Use your password manager's generator: 40+ random characters, letters and numbers.

- [ ] First result → **`BETTER_AUTH_SECRET`**. It signs login cookies. Changing it later signs everyone out, but nothing is lost.
- [ ] Second result → **`PASSWORD_PEPPER`**. It's mixed into every password hash.

> ⚠️ **Never change or lose `PASSWORD_PEPPER` after anyone has signed up.** Every existing password stops working, and there's no way back without the old value. Store it somewhere safe.

## 6. Add everything to GitHub

Repo → **Settings → Secrets and variables → Actions**.

**Secrets** tab → **New repository secret**, once for each:

- [ ] `CLOUDFLARE_API_TOKEN`: token from step 3.
- [ ] `CLOUDFLARE_ACCOUNT_ID`: Account ID from step 2.
- [ ] `BETTER_AUTH_SECRET`: from step 5.
- [ ] `PASSWORD_PEPPER`: from step 5.
- [ ] `TURNSTILE_SECRET_KEY`: Turnstile secret key from step 4.

**Variables** tab → **New repository variable**:

- [ ] `TURNSTILE_SITE_KEY`: Turnstile site key from step 4.
- [ ] `APP_URL`: `https://biga.<subdomain>.workers.dev`. Optional but recommended: it pins login cookies and the Turnstile check to that exact address.

Names must match exactly; they're case-sensitive.

## 7. Deploy

- [ ] Repo → **Actions → Deploy → Run workflow**. Pick branch `main` and run it. From now on every push to `main` deploys automatically.
- [ ] Wait for both jobs (**check** and **deploy**) to go green, about 2–3 minutes.
- [ ] Open the **deploy** job log, step **Deploy the Worker**. Near the end it prints the live URL.

The first run also creates the `biga-db` D1 database and its tables. Later runs only apply new migrations.

## 8. Check it works

- [ ] Open the URL on your computer. You should see the sign-in screen with the dough ball.
- [ ] Use **Create account** to sign up with a real email and a 12+ character password.
  - Most of the time Turnstile is invisible; sometimes it shows a checkbox.
- [ ] Create a biga recipe and change a few numbers. Reload the page: your changes should still be there, and the recipe opens locked (tap **Edit** to change it).
- [ ] On your phone, open the same URL and sign in.
  - **iPhone (Safari):** Share → **Add to Home Screen** → keep "Open as Web App" on.
  - **Android (Chrome):** ⋮ menu → **Install app** / **Add to Home screen**.
- [ ] Open it from the home screen. It should go full screen with no browser bars, and your recipe should be there.

## 9. Keep an eye on the first few sign-ins

The free plan allows 10 ms of CPU per request, and password hashing is tuned to fit inside it.

- [ ] Cloudflare dashboard → **Workers & Pages → biga → Logs** (or **Observability**). Look for `Exceeded CPU` or error `1102` on `/api/auth/sign-in` or `sign-up`.
- [ ] If you see them, edit `wrangler.jsonc` and change `"PASSWORD_ITERATIONS": "100000"` to `"60000"`, then push to `main`. Existing accounts keep working.

---

## Troubleshooting

| What you see | Fix |
|---|---|
| Workflow: `Missing repository secret …` | Add that secret in step 6. The name must match exactly. Then re-run the workflow. |
| Workflow: `TURNSTILE_SECRET_KEY is set but the TURNSTILE_SITE_KEY variable isn't` | Add `TURNSTILE_SITE_KEY` under the **Variables** tab, not Secrets. |
| Workflow: `Authentication error [code: 10000]` | The API token is missing **D1 → Edit**, or `CLOUDFLARE_ACCOUNT_ID` is wrong. Redo step 3 or check step 2. |
| Workflow: mentions registering a **workers.dev subdomain** | Open **Workers & Pages** in the dashboard once and choose a subdomain (step 2). |
| Workflow: error about **ratelimits** / rate limiting not being available | Delete the whole `"ratelimits": [ … ],` block from `wrangler.jsonc` and push. The app falls back to Better Auth's built-in limiter. |
| Sign-up/sign-in says **"We couldn't confirm you're human"** every time | The Turnstile widget's hostname must be exactly your app's hostname (step 4), and the site key and secret must come from the **same** widget. If you set `APP_URL`, it must be that same address. |
| Sign-up fails with **"Failed to check password"** | The breached-password service (Have I Been Pwned) didn't answer. Try again in a minute. To switch the check off, set `"BREACHED_PASSWORD_CHECK": "off"` in `wrangler.jsonc` and push. |
| "Too many attempts. Wait a minute" | Rate limiting working as intended. Wait 60 seconds. |
| Phone app doesn't show your latest changes | Open the app; a **"A new version is ready → Reload"** bar appears. Or **Settings → Check for updates**. |
| Someone forgot their password | There's no reset flow yet (it needs an email provider; see below). As a last resort you can delete the account, **which deletes their recipes too**: `pnpm exec wrangler d1 execute biga-db --remote --command "DELETE FROM \"user\" WHERE email='them@example.com'"`, then they sign up again. |

---

## Later (optional)

**Your own domain** (about $10/year). It unlocks Cloudflare's free firewall features for extra bot protection.

- [ ] Add the domain to Cloudflare. Then **Workers & Pages → biga → Settings → Domains & Routes → Add → Custom domain**, for example `biga.yourdomain.com`.
- [ ] Add the new hostname to the Turnstile widget (step 4), and change the `APP_URL` variable to the new address.
- [ ] **Security → WAF → Rate limiting rules:** one free rule on paths containing `/api/auth/`, about 20 requests per 10 seconds per IP, action **Block**.
- [ ] **Security → Bots → Bot Fight Mode:** try it on. If the installed app starts failing to sign in or save, turn it off again.
- [ ] Add `"workers_dev": false` to `wrangler.jsonc` so the old `workers.dev` address can't be used to get around the firewall.

**Email**, for password reset and email verification:

- [ ] Sign up for an email provider, for example Resend's free tier (100 emails/day; needs your own domain).
- [ ] Ask for Better Auth's `sendResetPassword` and `emailVerification` to be wired up. That also allows making sign-up messages generic.

---

## Running it locally (only if you want to change the code)

You need Node 22+ and pnpm.

```sh
pnpm install
cp .dev.vars.example .dev.vars   # local-only secrets, never committed
pnpm db:migrate:local            # create the local database
pnpm dev                         # http://localhost:5173
```

`pnpm test` checks the dough maths. `pnpm typecheck` checks types. `pnpm build && pnpm preview` runs the production build with offline support.
