// Topping recipe shape shared by the Worker (validation) and the app (editing + scaling).

export type Base = 'red' | 'white' | 'green' | 'other';
export const BASES: Base[] = ['red', 'white', 'green', 'other'];
export const BASE_NAME: Record<Base, string> = { red: 'Red', white: 'White', green: 'Green', other: 'Other' };
export const BASE_SUB: Record<Base, string> = {
  red: 'Tomato base',
  white: 'Bianca, no tomato',
  green: 'Pesto or greens',
  other: 'Cream, purée or sauce',
};

/** When an ingredient goes on: spread first, topped before the bake, or added after it comes out. */
export type When = 'base' | 'top' | 'finish';
export const WHENS: When[] = ['base', 'top', 'finish'];
export const WHEN_NAME: Record<When, string> = { base: 'Base', top: 'Before the bake', finish: 'After the bake' };

export type Item = {
  name: string;
  qty: number; // per pizza; 0 = to taste
  unit: string; // 'g', 'ml', 'leaf', 'pinch', … (singular; pluralised for display)
  when: When;
  note: string;
};

export type ToppingData = {
  base: Base;
  items: Item[];
  steps: string[];
  notes: string;
  from: string; // id of the classic it was copied from ('' = written from scratch)
};

export type Topping = {
  id: string;
  name: string;
  data: ToppingData;
  createdAt: number;
  updatedAt: number;
};

export const TOPPING_LIMITS = {
  name: 60,
  itemName: 120,
  unit: 16,
  note: 120,
  items: 30,
  steps: 20,
  step: 500,
  notes: 1000,
  from: 40,
  toppingsPerUser: 500,
  bodyBytes: 24_000,
};

export const emptyTopping = (): ToppingData => ({ base: 'red', items: [], steps: [], notes: '', from: '' });

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

/** Coerce anything into valid topping data, dropping what doesn't fit. */
export function normaliseTopping(raw: unknown): ToppingData {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const L = TOPPING_LIMITS;
  const out = emptyTopping();
  if (BASES.includes(src.base as Base)) out.base = src.base as Base;
  if (Array.isArray(src.items)) {
    out.items = src.items
      .filter((i): i is Record<string, unknown> => !!i && typeof i === 'object')
      .slice(0, L.items)
      .map((i) => ({
        name: str(i.name, L.itemName),
        qty: typeof i.qty === 'number' && Number.isFinite(i.qty) ? Number(Math.min(10_000, Math.max(0, i.qty)).toFixed(2)) : 0,
        unit: str(i.unit, L.unit),
        when: WHENS.includes(i.when as When) ? (i.when as When) : 'top',
        note: str(i.note, L.note),
      }));
  }
  if (Array.isArray(src.steps)) out.steps = src.steps.filter((s): s is string => typeof s === 'string').slice(0, L.steps).map((s) => s.slice(0, L.step));
  out.notes = str(src.notes, L.notes);
  out.from = str(src.from, L.from);
  return out;
}
