import { betterAuth } from 'better-auth';
import { captcha } from 'better-auth/plugins';
import { haveIBeenPwned } from 'better-auth/plugins/haveibeenpwned';
import { passwordHasher } from './password';

export const MIN_PASSWORD = 12;

const isTestTurnstileSecret = (s: string) => /^[123]x0{30,}AA$/.test(s);

function createAuth(env: Env, origin: string) {
  const baseURL = env.BETTER_AUTH_URL || origin;
  const turnstile = env.TURNSTILE_SECRET_KEY;
  const prodTurnstile = !!turnstile && !isTestTurnstileSecret(turnstile);

  return betterAuth({
    appName: 'Biga',
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL,
    basePath: '/api/auth',
    emailAndPassword: {
      enabled: true,
      minPasswordLength: MIN_PASSWORD,
      maxPasswordLength: 128,
      autoSignIn: true,
      password: passwordHasher(env.PASSWORD_PEPPER, Number(env.PASSWORD_ITERATIONS) || undefined),
    },
    user: { deleteUser: { enabled: true } },
    session: {
      expiresIn: 60 * 60 * 24 * 60, // 60 days: it's a recipe app on your phone
      updateAge: 60 * 60 * 24, // slide the expiry at most once a day (saves D1 writes)
      // Signed session cache in a cookie: most API calls never touch D1 to check the session.
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    // Workers don't set NODE_ENV, so Better Auth would leave its limiter off. Per-isolate memory
    // storage is weak on its own; the Workers rate-limit bindings in index.ts do the heavy lifting
    // without spending D1 writes.
    rateLimit: { enabled: true, storage: 'memory' },
    advanced: {
      ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] },
      // The schema comes from our D1 migrations; skip the PRAGMA round trips on every cold start.
      database: { validateSchema: false },
      useSecureCookies: baseURL.startsWith('https://'),
    },
    plugins: [
      ...(turnstile
        ? [
            captcha({
              provider: 'cloudflare-turnstile',
              secretKey: turnstile,
              // Test keys report hostname "localhost" and action "test", so only pin these for real keys.
              ...(prodTurnstile ? { allowedHostnames: [new URL(baseURL).hostname], expectedAction: 'auth' } : {}),
            }),
          ]
        : []),
      // k-anonymity check against known breached passwords on sign-up and password change.
      haveIBeenPwned({
        enabled: env.BREACHED_PASSWORD_CHECK !== 'off',
        customPasswordCompromisedMessage: 'That password has shown up in a data breach. Pick a different one.',
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

// One instance per isolate (per origin): creating Better Auth is not free on a 10 ms CPU budget.
const instances = new Map<string, Auth>();

export function getAuth(env: Env, origin: string): Auth {
  const key = env.BETTER_AUTH_URL || origin;
  let auth = instances.get(key);
  if (!auth) {
    auth = createAuth(env, origin);
    instances.set(key, auth);
  }
  return auth;
}
