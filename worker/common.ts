import type { Context } from 'hono';
import { ID_RE, KINDS, LIMITS, type Kind } from '../shared/recipe';

export type AppEnv = { Bindings: Env; Variables: { userId: string } };

export function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

export const err = (message: string, code: string) => ({ message, code });

/** The JSON body of a write, or an error response. */
export async function readBody(c: Context<AppEnv>, what: string) {
  const raw = await c.req.text();
  if (raw.length > LIMITS.bodyBytes) return { error: c.json(err(`That ${what} is too large.`, 'TOO_LARGE'), 413) };
  const body = safeJson(raw);
  if (!body || typeof body !== 'object') return { error: c.json(err('Bad request.', 'BAD_BODY'), 400) };
  return { body: body as Record<string, unknown> };
}

export const badId = (c: Context<AppEnv>, id: string) => (ID_RE.test(id) ? null : c.json(err('Bad id.', 'BAD_ID'), 400));

export const isKind = (v: unknown): v is Kind => KINDS.includes(v as Kind);

/**
 * Client timestamps for last-write-wins. Never trust a client clock that runs ahead of ours: a
 * future timestamp would block later edits.
 */
export function stamps(body: Record<string, unknown>) {
  const now = Date.now();
  const clampTs = (v: unknown, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.min(Math.floor(v), now) : fallback;
  const updatedAt = clampTs(body.updatedAt, now);
  return { updatedAt, createdAt: Math.min(clampTs(body.createdAt, now), updatedAt) };
}
