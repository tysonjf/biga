import { Hono } from 'hono';
import { cleanNotes, cleanStart, ID_RE, LIMITS, normalise, type Bake, type Kind } from '../shared/recipe';
import { badId, err, isKind, readBody, safeJson, stamps, type AppEnv } from './common';

type Row = {
  id: string;
  user_id: string;
  recipe_id: string;
  kind: Kind;
  name: string;
  settings: string;
  start: string;
  notes: string;
  created_at: number;
  updated_at: number;
};

const toBake = (r: Row): Bake => ({
  id: r.id,
  recipeId: r.recipe_id,
  kind: r.kind,
  name: r.name,
  settings: normalise(r.kind, safeJson(r.settings)),
  start: cleanStart(r.start),
  notes: r.notes,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const bakes = new Hono<AppEnv>();

bakes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM bake WHERE user_id = ?1 ORDER BY updated_at DESC LIMIT ?2')
    .bind(c.get('userId'), LIMITS.bakesPerUser)
    .all<Row>();
  return c.json({ bakes: results.map(toBake) });
});

/**
 * Idempotent upsert keyed by a client-generated id, like recipes. A bake belongs to one of your
 * recipes for life: its recipe and preferment are set when it's created and never change.
 */
bakes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const bad = badId(c, id);
  if (bad) return bad;
  const { body, error } = await readBody(c, 'bake');
  if (error) return error;

  const kind = body.kind;
  if (!isKind(kind)) return c.json(err('Unknown recipe type.', 'BAD_KIND'), 400);
  const recipeId = body.recipeId;
  if (typeof recipeId !== 'string' || !ID_RE.test(recipeId)) return c.json(err('Bad recipe id.', 'BAD_ID'), 400);
  const name = (typeof body.name === 'string' ? body.name : '').trim().slice(0, LIMITS.name);
  const settings = JSON.stringify(normalise(kind, body.settings));
  const start = cleanStart(body.start);
  const notes = cleanNotes(body.notes);
  const { createdAt, updatedAt } = stamps(body);
  const userId = c.get('userId');
  const db = c.env.DB;

  const updated = await db
    .prepare(
      `UPDATE bake SET name = ?4, settings = ?5, start = ?6, notes = COALESCE(?7, notes), updated_at = ?8
       WHERE id = ?1 AND user_id = ?2 AND kind = ?3 AND updated_at <= ?8 RETURNING *`,
    )
    .bind(id, userId, kind, name, settings, start, notes, updatedAt)
    .first<Row>();
  if (updated) return c.json({ bake: toBake(updated) });

  const existing = await db.prepare('SELECT * FROM bake WHERE id = ?1').bind(id).first<Row>();
  if (existing) {
    if (existing.user_id !== userId) return c.json(err('Bake not found.', 'NOT_FOUND'), 404);
    return c.json({ bake: toBake(existing) });
  }

  // New bake: only on one of your own recipes, of the same preferment.
  const inserted = await db
    .prepare(
      `INSERT INTO bake (id, user_id, recipe_id, kind, name, settings, start, notes, created_at, updated_at)
       SELECT ?1, ?2, r.id, r.kind, ?5, ?6, ?7, ?8, ?9, ?10
       FROM recipe r
       WHERE r.id = ?3 AND r.user_id = ?2 AND r.kind = ?4
         AND (SELECT COUNT(*) FROM bake WHERE user_id = ?2) < ?11
       ON CONFLICT (id) DO NOTHING
       RETURNING *`,
    )
    .bind(id, userId, recipeId, kind, name, settings, start, notes ?? '', createdAt, updatedAt, LIMITS.bakesPerUser)
    .first<Row>();
  if (inserted) return c.json({ bake: toBake(inserted) }, 201);

  const recipe = await db.prepare('SELECT 1 FROM recipe WHERE id = ?1 AND user_id = ?2 AND kind = ?3').bind(recipeId, userId, kind).first();
  if (!recipe) return c.json(err('The recipe for that bake has been deleted.', 'RECIPE_GONE'), 404);
  return c.json(err(`You've reached the limit of ${LIMITS.bakesPerUser} bakes. Delete some old ones first.`, 'LIMIT'), 403);
});

bakes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const bad = badId(c, id);
  if (bad) return bad;
  await c.env.DB.prepare('DELETE FROM bake WHERE id = ?1 AND user_id = ?2').bind(id, c.get('userId')).run();
  return c.body(null, 204);
});
