import { Hono } from 'hono';
import { ID_RE, KINDS, LIMITS, normalise, type Kind, type Recipe } from '../shared/recipe';

type Row = {
  id: string;
  user_id: string;
  kind: Kind;
  name: string;
  settings: string;
  created_at: number;
  updated_at: number;
};

export type AppEnv = { Bindings: Env; Variables: { userId: string } };

const toRecipe = (r: Row): Recipe => ({
  id: r.id,
  kind: r.kind,
  name: r.name,
  settings: normalise(r.kind, safeJson(r.settings)),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

const err = (message: string, code: string) => ({ message, code });

export const recipes = new Hono<AppEnv>();

recipes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM recipe WHERE user_id = ?1 ORDER BY updated_at DESC LIMIT ?2',
  )
    .bind(c.get('userId'), LIMITS.recipesPerUser)
    .all<Row>();
  return c.json({ recipes: results.map(toRecipe) });
});

/**
 * Idempotent upsert keyed by a client-generated id, so the app can create recipes optimistically
 * and replay queued saves after being offline. Last write wins by `updatedAt`.
 */
recipes.put('/:id', async (c) => {
  const id = c.req.param('id');
  if (!ID_RE.test(id)) return c.json(err('Bad recipe id.', 'BAD_ID'), 400);
  const raw = await c.req.text();
  if (raw.length > LIMITS.bodyBytes) return c.json(err('That recipe is too large.', 'TOO_LARGE'), 413);
  const body = safeJson(raw) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') return c.json(err('Bad request.', 'BAD_BODY'), 400);

  const kind = body.kind as Kind;
  if (!KINDS.includes(kind)) return c.json(err('Unknown recipe type.', 'BAD_KIND'), 400);
  const name = (typeof body.name === 'string' ? body.name : '').trim().slice(0, LIMITS.name) || 'Untitled';
  const settings = JSON.stringify(normalise(kind, body.settings));
  const now = Date.now();
  // Never trust a client clock that runs ahead of ours: a future timestamp would block later edits.
  const clampTs = (v: unknown, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.min(Math.floor(v), now) : fallback;
  const updatedAt = clampTs(body.updatedAt, now);
  const createdAt = Math.min(clampTs(body.createdAt, now), updatedAt);
  const userId = c.get('userId');
  const db = c.env.DB;

  // Fast path, the common autosave: one primary-key lookup.
  const updated = await db
    .prepare(
      `UPDATE recipe SET kind = ?3, name = ?4, settings = ?5, updated_at = ?6
       WHERE id = ?1 AND user_id = ?2 AND updated_at <= ?6 RETURNING *`,
    )
    .bind(id, userId, kind, name, settings, updatedAt)
    .first<Row>();
  if (updated) return c.json({ recipe: toRecipe(updated) });

  const existing = await db.prepare('SELECT * FROM recipe WHERE id = ?1').bind(id).first<Row>();
  if (existing) {
    // Someone else's id: don't reveal it exists. Our own but stale: hand back the newer copy.
    if (existing.user_id !== userId) return c.json(err('Recipe not found.', 'NOT_FOUND'), 404);
    return c.json({ recipe: toRecipe(existing) });
  }

  const inserted = await db
    .prepare(
      `INSERT INTO recipe (id, user_id, kind, name, settings, created_at, updated_at)
       SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7
       WHERE (SELECT COUNT(*) FROM recipe WHERE user_id = ?2) < ?8
       ON CONFLICT (id) DO NOTHING
       RETURNING *`,
    )
    .bind(id, userId, kind, name, settings, createdAt, updatedAt, LIMITS.recipesPerUser)
    .first<Row>();
  if (inserted) return c.json({ recipe: toRecipe(inserted) }, 201);
  return c.json(err(`You've reached the limit of ${LIMITS.recipesPerUser} recipes. Delete some old ones first.`, 'LIMIT'), 403);
});

recipes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  if (!ID_RE.test(id)) return c.json(err('Bad recipe id.', 'BAD_ID'), 400);
  await c.env.DB.prepare('DELETE FROM recipe WHERE id = ?1 AND user_id = ?2').bind(id, c.get('userId')).run();
  return c.body(null, 204);
});
