import { Hono } from 'hono';
import { normaliseTopping, TOPPING_LIMITS, type Topping } from '../shared/topping';
import { badId, err, safeJson, stamps, type AppEnv } from './common';

type Row = {
  id: string;
  user_id: string;
  name: string;
  data: string;
  created_at: number;
  updated_at: number;
};

const toTopping = (r: Row): Topping => ({
  id: r.id,
  name: r.name,
  data: normaliseTopping(safeJson(r.data)),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const toppings = new Hono<AppEnv>();

toppings.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM topping WHERE user_id = ?1 ORDER BY updated_at DESC LIMIT ?2')
    .bind(c.get('userId'), TOPPING_LIMITS.toppingsPerUser)
    .all<Row>();
  return c.json({ toppings: results.map(toTopping) });
});

/** Idempotent upsert keyed by a client-generated id; last write wins by `updatedAt`. Same rules as recipes. */
toppings.put('/:id', async (c) => {
  const id = c.req.param('id');
  const bad = badId(c, id);
  if (bad) return bad;
  // Toppings carry a method and notes, so they get a bigger limit than readBody's.
  const raw = await c.req.text();
  if (raw.length > TOPPING_LIMITS.bodyBytes) return c.json(err('That topping is too large.', 'TOO_LARGE'), 413);
  const body = safeJson(raw) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') return c.json(err('Bad request.', 'BAD_BODY'), 400);

  const name = (typeof body.name === 'string' ? body.name : '').trim().slice(0, TOPPING_LIMITS.name) || 'Untitled';
  const data = JSON.stringify(normaliseTopping(body.data));
  const { createdAt, updatedAt } = stamps(body);
  const userId = c.get('userId');
  const db = c.env.DB;

  const updated = await db
    .prepare(
      `UPDATE topping SET name = ?3, data = ?4, updated_at = ?5
       WHERE id = ?1 AND user_id = ?2 AND updated_at <= ?5 RETURNING *`,
    )
    .bind(id, userId, name, data, updatedAt)
    .first<Row>();
  if (updated) return c.json({ topping: toTopping(updated) });

  const existing = await db.prepare('SELECT * FROM topping WHERE id = ?1').bind(id).first<Row>();
  if (existing) {
    if (existing.user_id !== userId) return c.json(err('Topping not found.', 'NOT_FOUND'), 404);
    return c.json({ topping: toTopping(existing) });
  }

  const inserted = await db
    .prepare(
      `INSERT INTO topping (id, user_id, name, data, created_at, updated_at)
       SELECT ?1, ?2, ?3, ?4, ?5, ?6
       WHERE (SELECT COUNT(*) FROM topping WHERE user_id = ?2) < ?7
       ON CONFLICT (id) DO NOTHING
       RETURNING *`,
    )
    .bind(id, userId, name, data, createdAt, updatedAt, TOPPING_LIMITS.toppingsPerUser)
    .first<Row>();
  if (inserted) return c.json({ topping: toTopping(inserted) }, 201);
  return c.json(err(`You've reached the limit of ${TOPPING_LIMITS.toppingsPerUser} toppings. Delete some old ones first.`, 'LIMIT'), 403);
});

toppings.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const bad = badId(c, id);
  if (bad) return bad;
  await c.env.DB.prepare('DELETE FROM topping WHERE id = ?1 AND user_id = ?2').bind(id, c.get('userId')).run();
  return c.body(null, 204);
});
