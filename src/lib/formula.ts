// The maths for a general recipe (shared/formula.ts): grams for every ingredient, from baker's
// percentages or from scaled amounts, with the flour, water and hydration, each stage's total, how to
// read an amount in its own unit, and the water temperature for a dough.

import {
  DOUGH_CATEGORIES,
  F_FIELDS,
  type Formula,
  type Ingredient,
  type Method,
  type Step,
  type Unit,
} from '../../shared/formula';
import type { Stage } from '../components/IngredientsView';
import { FIRST_HYD, fmtDur, g0, g1, holdBack, num, waterTemp, type WaterTemp } from './dough';

export type Row = Ingredient & {
  /** Where it sits in `f.ingredients`. */
  i: number;
  grams: number;
  /** % of the total flour, or null when the recipe has no flour. */
  pct: number | null;
  /** The amount read in its own unit, when that isn't grams: "≈ ⅔ egg", "250 ml", "1.2 kg". */
  equiv: string | null;
};

export type StageCalc = { index: number; name: string; rows: Row[]; total: number };

export type FormulaCalc = {
  method: Method;
  /** Amounts: what the base recipe is multiplied by. Baker's %: 1. */
  mult: number;
  /** The whole recipe, g: every ingredient, optional ones included. */
  total: number;
  flour: number;
  water: number;
  /** Water as % of the flour; null without flour or water. */
  hydration: number | null;
  rows: Row[];
  stages: StageCalc[];
  /** Grams per portion or serving. */
  portion: number;
  /** How many portions or servings the recipe makes. */
  portions: number;
  /** The base recipe's weight, g (amounts). */
  base: number;
  dough: boolean;
  /** The water temperature for the target dough temperature; null when it isn't a dough or has no water. */
  mixWater: WaterTemp | null;
  /** A wet dough's water in two parts (see dough.ts holdBack). */
  holdBack: { first: number; rest: number } | null;
  warnings: string[];
};

/** Turns the flours' shares into fractions of 1. All zero splits evenly. */
function shares(flours: Ingredient[]) {
  const sum = flours.reduce((a, f) => a + (+f.qty || 0), 0);
  return { sum, of: flours.map((f) => (sum > 0 ? (+f.qty || 0) / sum : 1 / flours.length)) };
}

/** Amounts: what the base recipe is multiplied by, from the scaling you chose. */
export function multiplier(f: Formula, base: number): number {
  if (f.scale === 'servings') return f.servings > 0 ? f.want / f.servings : 1;
  if (f.scale === 'weight') return base > 0 ? f.batch / base : 1;
  return f.x;
}

export function calcFormula(f: Formula): FormulaCalc {
  const warnings: string[] = [];
  const dough = DOUGH_CATEGORIES.includes(f.category);
  const flours = f.ingredients.filter((x) => x.role === 'flour');
  const base = f.ingredients.reduce((a, x) => a + x.qty, 0);
  let grams: number[];
  let mult = 1;
  let total: number;
  let portions: number;

  if (f.method === 'bakers') {
    // The flours together are 100%; everything else is a % of them. The dough's size fixes the flour.
    total = f.balls * f.bw * (1 + f.waste / 100);
    portions = f.balls;
    const sh = shares(flours);
    const others = f.ingredients.filter((x) => x.role !== 'flour').reduce((a, x) => a + x.qty, 0);
    const flourG = flours.length ? total / ((100 + others) / 100) : 0;
    let k = 0;
    grams = f.ingredients.map((x) => (x.role === 'flour' ? flourG * sh.of[k++] : (flourG * x.qty) / 100));
    if (!flours.length) warnings.push('Baker’s percentages are shares of the flour: mark one ingredient as the flour (in its options).');
    else if (flours.length > 1 && Math.abs(sh.sum - 100) > 0.01)
      warnings.push(sh.sum > 0 ? `The flour shares add up to ${+sh.sum.toFixed(1)}%, so they’ve been scaled to 100%.` : 'The flour shares are all 0%, so they’ve been split evenly.');
  } else {
    mult = multiplier(f, base);
    grams = f.ingredients.map((x) => x.qty * mult);
    total = base * mult;
    portions = f.servings * mult;
    if (!f.ingredients.length) warnings.push('Add the ingredients with their amounts for one batch, then scale the batch.');
  }

  const flour = f.ingredients.reduce((a, x, i) => a + (x.role === 'flour' ? grams[i] : 0), 0);
  const water = f.ingredients.reduce((a, x, i) => a + (x.role === 'water' ? grams[i] : 0), 0);
  const hydration = flour > 0 && water > 0 ? (water / flour) * 100 : null;
  const rows: Row[] = f.ingredients.map((x, i) => ({
    ...x,
    i,
    grams: grams[i],
    pct: flour > 0 ? (grams[i] / flour) * 100 : null,
    equiv: equivalent(grams[i], x.unit, x.per, x.name),
  }));
  const names = ['', ...f.stages];
  // Every stage, even one with nothing in it yet, so it can be filled in.
  const stages: StageCalc[] = names.map((name, index) => {
    const mine = rows.filter((r) => Math.min(r.stage, f.stages.length) === index);
    return { index, name, rows: mine, total: mine.reduce((a, r) => a + r.grams, 0) };
  });

  const mixWater = dough && flour > 0 && water >= 1 ? waterTemp({ preFlour: 0, preWater: 0, preTemp: 0, flour, flourT: f.flourT, water, ddt: f.ddt, friction: f.friction }) : null;
  const tiny = rows.filter((r) => r.grams > 0 && r.grams < 0.3);
  if (tiny.length)
    warnings.push(`${tiny.map((r) => r.name || 'An ingredient').join(', ')}: under 0.3 g. Weigh it on a 0.01 g scale, or dissolve 1 g in 100 g of the water and weigh the solution.`);

  return {
    method: f.method,
    mult,
    total,
    flour,
    water,
    hydration,
    rows,
    stages,
    portion: portions > 0 ? total / portions : total,
    portions,
    base,
    dough,
    mixWater,
    holdBack: dough && hydration !== null && f.category === 'pizza' ? holdBack(flour, 0, water, hydration) : null,
    warnings,
  };
}

/* ---------- reading amounts ---------- */

/** Grams as the recipe shows them: whole above 10 g, finer below. */
export const grams = (v: number) => (v < 10 ? g1(v) : g0(v));

// Whole items come to the nearest quarter or third: ⅔ of an egg, not 0.68.
const FRACS: [number, string][] = [
  [0, ''],
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [1 / 2, '½'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
  [1, ''],
];

/** A count to the nearest quarter or third, with a fraction character: "⅔", "2", "2½". */
export function approxCount(v: number): string {
  if (v < 1 / 8) return '< ¼';
  const whole = Math.floor(v);
  const rest = v - whole;
  const [frac, glyph] = FRACS.reduce((a, b) => (Math.abs(b[0] - rest) < Math.abs(a[0] - rest) ? b : a));
  const n = whole + (frac === 1 ? 1 : 0);
  return frac === 0 || frac === 1 ? String(n) : `${n || ''}${glyph}`;
}

const trim = (v: number, dec: number) => String(Number(v.toFixed(dec)));

/**
 * How an amount reads in the ingredient's own unit, as a hint beside the grams. Items: "≈ ⅔ egg
 * (50 g each)". Volumes: "≈ 250 ml". Kilos: "1.25 kg". Null for grams.
 */
export function equivalent(g: number, unit: Unit, per: number, name = ''): string | null {
  if (unit === 'g' || !(g > 0)) return null;
  if (unit === 'kg') return g >= 100 ? `${trim(g / 1000, g >= 10_000 ? 1 : 2)} kg` : null;
  const p = per > 0 ? per : 1;
  if (unit === 'ml') return `≈ ${trim(g / p, g / p < 10 ? 1 : 0)} ml`;
  if (unit === 'l') return `≈ ${trim(g / p / 1000, 2)} l`;
  const n = g / p;
  const count = approxCount(n);
  const egg = /\begg/i.test(name);
  const what = egg ? (n > 1.125 ? 'eggs' : 'egg') : '×';
  return egg ? `≈ ${count} ${what} (${trim(p, 1)} g each)` : `≈ ${count} × ${trim(p, 1)} g`;
}

/** °C as "24 °C (75 °F)". */
export const fmtTemp = (c: number) => `${num(c, 1)} °C (${Math.round((c * 9) / 5 + 32)} °F)`;

/** A step's time and temperature, for its heading: "2 h at 24 °C (75 °F)". */
export function stepMeta(st: Step): string {
  const parts = [st.min > 0 ? fmtDur(st.min) : '', st.tempC !== null ? `${st.min > 0 ? 'at ' : ''}${fmtTemp(st.tempC)}` : ''].filter(Boolean);
  return parts.join(' ');
}

/** Everything but the empty steps, numbered as shown. */
export const realSteps = (steps: Step[]) => steps.filter((s) => s.text.trim() || s.min > 0 || s.tempC !== null);

/* ---------- summaries ---------- */

/** One line for the title and the home screen: "4 × 260 g · 65% hydration · 1061 g" or "× 1.5 · 15 servings · 1.6 kg". */
export function formulaSummary(f: Formula, c: FormulaCalc): string {
  const hyd = c.hydration !== null ? ` · ${num(c.hydration, 1)}% hydration` : '';
  if (f.method === 'bakers') return `${f.balls} × ${Math.round(f.bw)} g${hyd} · ${g0(c.total)}`;
  const n = Number.isInteger(c.portions) ? c.portions : +c.portions.toFixed(1);
  return `× ${num(c.mult, 2)} · ${n} ${n === 1 ? 'serving' : 'servings'}${hyd} · ${c.total >= 10_000 ? `${trim(c.total / 1000, 1)} kg` : g0(c.total)}`;
}

/* ---------- the ingredient lists ---------- */

/** The ingredient lists for the Ingredients card's full-screen view, one per stage. */
export function formulaStages(f: Formula, c: FormulaCalc): Stage[] {
  const label = (r: Row) => (r.name || 'Ingredient') + (r.optional ? ' (optional)' : '');
  const shown = c.stages.filter((st) => st.index === 0 || st.rows.length);
  return shown.map((st) => ({
    key: `s${st.index}`,
    title: st.index === 0 ? (shown.length > 1 ? (c.dough ? 'Final dough' : 'Main mix') : c.dough ? 'Dough' : 'Ingredients') : st.name || `Stage ${st.index}`,
    items: [
      ...st.rows.map((r) => ({
        n: label(r),
        sub: [r.pct !== null && f.method === 'bakers' ? `${num(r.pct, r.pct < 1 ? 3 : 1)}% of flour` : '', r.equiv ?? ''].filter(Boolean).join(' · ') || undefined,
        tag: r.equiv ?? undefined,
        g: grams(r.grams),
      })),
      ...(shown.length > 1 ? [{ n: `Total ${st.index === 0 ? (c.dough ? 'dough' : '') : (st.name || 'stage').toLowerCase()}`.trim(), g: g0(st.total), sum: true }] : []),
    ],
  }));
}

/* ---------- names for sums ---------- */

export type FormulaVar = { name: string; value: number; unit: string };

const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, ' ').trim().split(' ')[0] ?? '';

/**
 * The recipe's amounts by name, for sums in the calculator and the notes: `flour`, `water`, `dough`,
 * `portions` (and `balls`), `hydration`, then each ingredient by the first word of its name.
 */
export function formulaVars(c: FormulaCalc): FormulaVar[] {
  const g = (name: string, v: number) => ({ name, value: Math.round(v), unit: 'g' });
  const out: FormulaVar[] = [g('flour', c.flour), g('water', c.water), g('dough', c.total)];
  out.push({ name: 'portions', value: c.portions, unit: '' }, { name: 'balls', value: c.portions, unit: '' });
  if (c.hydration !== null) out.push({ name: 'hydration', value: c.hydration, unit: '%' });
  const taken = new Set(out.map((v) => v.name));
  for (const r of c.rows) {
    const name = slug(r.name);
    if (name.length < 2 || taken.has(name)) continue;
    taken.add(name);
    out.push(g(name, r.grams));
  }
  return out;
}

/* ---------- editing ---------- */

/**
 * The same recipe worked out the other way. To amounts: the grams as they are now become the base
 * recipe, making the current portions. To baker's percentages: each ingredient's % of the flour; the
 * portions keep their weight. Null when there's no flour to be the 100%.
 */
export function switchMethod(f: Formula, to: Method): Formula | null {
  if (to === f.method) return f;
  const c = calcFormula(f);
  if (to === 'amounts') {
    const ingredients = f.ingredients.map((x, i) => ({ ...x, qty: +c.rows[i].grams.toFixed(2) }));
    const servings = Math.max(1, Math.round(c.portions));
    return { ...f, method: 'amounts', ingredients, servings, want: servings, scale: 'x', x: 1 };
  }
  if (!(c.flour > 0)) return null;
  const ingredients = f.ingredients.map((x, i) => ({ ...x, qty: +((c.rows[i].grams / c.flour) * 100).toFixed(3) }));
  const balls = Math.min(F_FIELDS.balls.max, Math.max(1, Math.round(c.portions)));
  const bw = Math.min(F_FIELDS.bw.max, Math.max(F_FIELDS.bw.min, Math.round(c.total / balls)));
  return { ...f, method: 'bakers', ingredients, balls, bw, waste: 0 };
}

/** The step a stepper takes at this size: fine for a pinch of yeast, coarse for a kilo of flour. */
export function stepFor(v: number, method: Method, role: Ingredient['role']): number {
  if (method === 'bakers') {
    if (role === 'flour') return 5;
    return v < 1 ? 0.05 : v < 5 ? 0.1 : v < 20 ? 0.5 : 5;
  }
  return v < 10 ? 0.5 : v < 100 ? 5 : v < 1000 ? 10 : 50;
}

export { FIRST_HYD };
