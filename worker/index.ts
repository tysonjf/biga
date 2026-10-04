import { Hono, type Context } from 'hono';
import { getAuth } from './auth';
import { recipes, type AppEnv } from './recipes';
import { toppings } from './toppings';

const app = new Hono<AppEnv>().basePath('/api');

// API responses are per-user and must never be cached by the browser, CDN or service worker.
app.use('*', async (c, next) => {
  await next();
  c.header('Cache-Control', 'no-store');
  c.header('X-Content-Type-Options', 'nosniff');
});

const ip = (c: Context<AppEnv>) => c.req.header('cf-connecting-ip') ?? 'local';

async function limited(limiter: RateLimit | undefined, key: string) {
  if (!limiter) return false; // binding missing (e.g. removed from config): fall back to Better Auth's limiter
  try {
    const { success } = await limiter.limit({ key });
    return !success;
  } catch {
    return false;
  }
}

const tooMany = (c: Context<AppEnv>, seconds = 60) =>
  c.json({ message: 'Too many attempts. Wait a minute and try again.', code: 'RATE_LIMITED' }, 429, {
    'Retry-After': String(seconds),
    'X-Retry-After': String(seconds),
  });

/* ---------- auth ---------- */

// Cheap, D1-free rate limits in front of the expensive parts (Turnstile check, password hashing).
app.post('/auth/*', async (c, next) => {
  const path = c.req.path.slice('/api/auth'.length);
  const addr = ip(c);
  if (await limited(c.env.AUTH_IP, `auth:${addr}`)) return tooMany(c);
  if (path === '/sign-up/email' && (await limited(c.env.SIGNUP_IP, `signup:${addr}`))) return tooMany(c);
  if (path === '/sign-in/email') {
    const email = await c.req.raw
      .clone()
      .json<{ email?: unknown }>()
      .then((b) => (typeof b.email === 'string' ? b.email.trim().toLowerCase() : ''))
      .catch(() => '');
    // Per-account throttle: slows credential stuffing that rotates IPs against one account.
    if (email && (await limited(c.env.LOGIN_EMAIL, `login:${email}`))) return tooMany(c);
  }
  await next();
});

app.on(['GET', 'POST'], '/auth/*', (c) => getAuth(c.env, new URL(c.req.url).origin).handler(c.req.raw));

/* ---------- public config ---------- */

app.get('/config', (c) =>
  c.json({ turnstileSiteKey: c.env.TURNSTILE_SECRET_KEY ? c.env.TURNSTILE_SITE_KEY || null : null }, 200, {
    'Cache-Control': 'no-store',
  }),
);

/* ---------- recipes and toppings (signed in) ---------- */

for (const path of ['/recipes/*', '/toppings/*']) {
  app.use(path, async (c, next) => {
    const session = await getAuth(c.env, new URL(c.req.url).origin).api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ message: 'Sign in to see your recipes.', code: 'UNAUTHORIZED' }, 401);
    c.set('userId', session.user.id);
    await next();
  });
  app.use(path, async (c, next) => {
    if (c.req.method !== 'GET' && (await limited(c.env.WRITE_USER, `write:${c.get('userId')}`))) return tooMany(c, 10);
    await next();
  });
}
app.route('/recipes', recipes);
app.route('/toppings', toppings);

app.notFound((c) => c.json({ message: 'Not found', code: 'NOT_FOUND' }, 404));
app.onError((e, c) => {
  console.error(e);
  return c.json({ message: 'Something went wrong on our side. Try again.', code: 'SERVER_ERROR' }, 500);
});

export default app;
