import { Hono } from 'hono';
import { cleanNotes, LIMITS, normalise, type Kind, type Recipe } from '../shared/recipe';
import { badId, err, isKind, readBody, safeJson, stamps, type AppEnv } from './common';

type Row = {
  id: string;
  user_id: string;
  kind: Kind;
  name: string;
  settings: string;
  notes: string;
  created_at: number;
  updated_at: number;
};

const toRecipe = (r: Row): Recipe => ({
  id: r.id,
  kind: r.kind,
  name: r.name,
  settings: normalise(r.kind, safeJson(r.settings)),
  notes: r.notes ?? '',
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

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
  const bad = badId(c, id);
  if (bad) return bad;
  const { body, error } = await readBody(c, 'recipe');
  if (error) return error;

  const kind = body.kind;
  if (!isKind(kind)) return c.json(err('Unknown recipe type.', 'BAD_KIND'), 400);
  const name = (typeof body.name === 'string' ? body.name : '').trim().slice(0, LIMITS.name) || 'Untitled';
  const settings = JSON.stringify(normalise(kind, body.settings));
  // Apps from before notes existed don't send them: leave whatever is stored alone.
  const notes = cleanNotes(body.notes);
  const { createdAt, updatedAt } = stamps(body);
  const userId = c.get('userId');
  const db = c.env.DB;

  // Fast path, the common autosave: one primary-key lookup.
  const updated = await db
    .prepare(
      `UPDATE recipe SET kind = ?3, name = ?4, settings = ?5, notes = COALESCE(?6, notes), updated_at = ?7
       WHERE id = ?1 AND user_id = ?2 AND updated_at <= ?7 RETURNING *`,
    )
    .bind(id, userId, kind, name, settings, notes, updatedAt)
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
      `INSERT INTO recipe (id, user_id, kind, name, settings, notes, created_at, updated_at)
       SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8
       WHERE (SELECT COUNT(*) FROM recipe WHERE user_id = ?2) < ?9
       ON CONFLICT (id) DO NOTHING
       RETURNING *`,
    )
    .bind(id, userId, kind, name, settings, notes ?? '', createdAt, updatedAt, LIMITS.recipesPerUser)
    .first<Row>();
  if (inserted) return c.json({ recipe: toRecipe(inserted) }, 201);
  return c.json(err(`You've reached the limit of ${LIMITS.recipesPerUser} recipes. Delete some old ones first.`, 'LIMIT'), 403);
});

/** Deletes the recipe and every bake made from it. */
recipes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const bad = badId(c, id);
  if (bad) return bad;
  const userId = c.get('userId');
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM bake WHERE recipe_id = ?1 AND user_id = ?2').bind(id, userId),
    c.env.DB.prepare('DELETE FROM recipe WHERE id = ?1 AND user_id = ?2').bind(id, userId),
  ]);
  return c.body(null, 204);
});
