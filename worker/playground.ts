import { Hono } from 'hono';
import { normalise, type Kind, type Playground } from '../shared/recipe';
import { err, isKind, readBody, safeJson, stamps, type AppEnv } from './common';

type Row = { kind: Kind; settings: string; updated_at: number };

const toPlay = (r: Row) => ({ settings: normalise(r.kind, safeJson(r.settings)), updatedAt: r.updated_at });

export const playground = new Hono<AppEnv>();

playground.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT kind, settings, updated_at FROM playground WHERE user_id = ?1')
    .bind(c.get('userId'))
    .all<Row>();
  const out: Playground = { biga: null, poolish: null };
  for (const r of results) out[r.kind] = toPlay(r);
  return c.json({ playground: out });
});

/** Saves the playground for one preferment. Last write wins by `updatedAt`. */
playground.put('/:kind', async (c) => {
  const kind = c.req.param('kind');
  if (!isKind(kind)) return c.json(err('Unknown recipe type.', 'BAD_KIND'), 400);
  const { body, error } = await readBody(c, 'playground');
  if (error) return error;
  const settings = JSON.stringify(normalise(kind, body.settings));
  const { updatedAt } = stamps(body);
  const userId = c.get('userId');
  const db = c.env.DB;

  const saved = await db
    .prepare(
      `INSERT INTO playground (user_id, kind, settings, updated_at) VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT (user_id, kind) DO UPDATE SET settings = excluded.settings, updated_at = excluded.updated_at
       WHERE excluded.updated_at >= playground.updated_at
       RETURNING kind, settings, updated_at`,
    )
    .bind(userId, kind, settings, updatedAt)
    .first<Row>();
  if (saved) return c.json({ play: toPlay(saved) });
  // A newer save got there first: hand it back.
  const current = await db
    .prepare('SELECT kind, settings, updated_at FROM playground WHERE user_id = ?1 AND kind = ?2')
    .bind(userId, kind)
    .first<Row>();
  return c.json({ play: current ? toPlay(current) : null });
});
