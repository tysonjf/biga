import { useCallback, useState } from 'react';
import type { Base, Item, ToppingData } from '../../shared/topping';

/** A built-in topping recipe. Amounts are per pizza: one 30–33 cm pizza from a 250–280 g ball. */
export type Classic = {
  id: string;
  name: string;
  italian?: string;
  base: Base;
  era: 'classic' | 'contemporary';
  origin: string;
  blurb: string;
  tags: string[];
  items: Item[];
  steps: string[];
  tip: string;
  sources: string[];
};

/* ---------- amounts ---------- */

const MEASURES = new Set(['g', 'kg', 'ml', 'l', 'oz', 'lb']);
const SPOONS = new Set(['tsp', 'tbsp']);

// Units are stored singular. Only the last word is pluralised, and only if it's a word we know,
// so a free-typed unit like "medium" is never mangled into "mediums".
const PLURALS: Record<string, string> = {
  leaf: 'leaves',
  fillet: 'fillets',
  slice: 'slices',
  clove: 'cloves',
  sprig: 'sprigs',
  yolk: 'yolks',
  egg: 'eggs',
  clam: 'clams',
  flower: 'flowers',
  blossom: 'blossoms',
  piece: 'pieces',
  olive: 'olives',
  ball: 'balls',
  cup: 'cups',
  handful: 'handfuls',
  pinch: 'pinches',
  potato: 'potatoes',
  tomato: 'tomatoes',
  anchovy: 'anchovies',
  fig: 'figs',
  ring: 'rings',
  strip: 'strips',
  wedge: 'wedges',
  round: 'rounds',
  knob: 'knobs',
  dollop: 'dollops',
  spoonful: 'spoonfuls',
  bunch: 'bunches',
  chilli: 'chillies',
  artichoke: 'artichokes',
  heart: 'hearts',
  mushroom: 'mushrooms',
  shrimp: 'shrimp',
  pear: 'pears',
  half: 'halves',
  quarter: 'quarters',
  link: 'links',
};

export function plural(unit: string, v: number): string {
  const u = unit.trim();
  if (!u || v <= 1) return u;
  const m = /^(.*?)([A-Za-z]+)$/.exec(u);
  if (!m) return u;
  const many = PLURALS[m[2].toLowerCase()];
  if (!many) return u;
  return m[1] + (m[2][0] === m[2][0].toUpperCase() ? many[0].toUpperCase() + many.slice(1) : many);
}

const FRACTIONS: Record<number, string> = { 0.25: '¼', 0.5: '½', 0.75: '¾' };

/** A count to the nearest quarter, written with ¼ ½ ¾. */
function count(v: number): string {
  const r = Math.round(v * 4) / 4;
  if (r === 0) return String(+v.toFixed(2));
  const whole = Math.floor(r);
  const frac = FRACTIONS[r - whole];
  return frac ? (whole ? `${whole}${frac}` : frac) : String(r);
}

/** "85 g", "2½ tbsp", "4 leaves", "a pinch" — the amount for `n` pizzas. */
export function amount(i: Pick<Item, 'qty' | 'unit'>, n = 1): string {
  const u = i.unit.trim();
  if (!(i.qty > 0)) {
    // No amount: "to taste", unless the unit says how much on its own ("pinch", "handful", "drizzle").
    const lower = u.toLowerCase();
    if (!u || MEASURES.has(lower) || SPOONS.has(lower)) return 'to taste';
    return lower === 'pinch' || lower === 'handful' || lower === 'drizzle' ? `a ${lower}` : u;
  }
  const v = i.qty * n;
  if (MEASURES.has(u.toLowerCase())) return `${v >= 20 ? Math.round(v) : +v.toFixed(1)} ${u}`;
  if (SPOONS.has(u.toLowerCase())) return `${count(v)} ${u}`;
  return `${count(v)} ${plural(u, v)}`.trim();
}

/* ---------- lists and search ---------- */

const PLAIN = /^(fine |sea |flaky |coarse )*salt\b|olive oil|\bevoo\b/i;

/** The main ingredients, short: "San Marzano tomatoes · Fior di latte · Basil". */
export function summary(items: Item[]): string {
  return items
    .map((i) => i.name.split(/[,(]/)[0].trim())
    .filter((n) => n && !PLAIN.test(n))
    .join(' · ');
}

export const fold = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function matches(q: string, t: { name: string; italian?: string; tags?: string[]; items: Item[]; origin?: string }) {
  const words = fold(q).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = fold([t.name, t.italian ?? '', t.origin ?? '', ...(t.tags ?? []), ...t.items.map((i) => i.name)].join(' '));
  return words.every((w) => hay.includes(w));
}

/** Copy a classic into editable topping data. */
export function fromClassic(c: Classic): ToppingData {
  return {
    base: c.base,
    items: c.items.map((i) => ({ ...i })),
    steps: [...c.steps],
    notes: c.tip.slice(0, 1000),
    from: c.id,
  };
}

/* ---------- pizza count, remembered on this device ---------- */

export function usePizzaCount() {
  const [n, setN] = useState(() => {
    try {
      const v = Number(localStorage.getItem('biga-pizzas'));
      return v >= 1 && v <= 24 ? Math.round(v) : 1;
    } catch {
      return 1;
    }
  });
  const set = useCallback((v: number) => {
    setN(v);
    try {
      localStorage.setItem('biga-pizzas', String(v));
    } catch {
      /* private mode */
    }
  }, []);
  return [n, set] as const;
}
