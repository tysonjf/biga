import type { Kind, Settings } from '../../shared/recipe';

/* ---------- preferment yeast models ---------- */

export type Model = {
  kind: Kind;
  name: string;
  temps: number[];
  hours: number[];
  /** Instant dry yeast as % of the preferment's flour for `t` °C over `h` hours. */
  idy: (t: number, h: number) => number;
  ready: string;
  note: string;
};

const range = (from: number, to: number, step = 1) =>
  Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => from + i * step);

// Both models share one shape: a reference point (A % IDY at T0 °C for H0 h), yeast activity
// doubling every D °C, and yeast scaling as (H0/h)^k for longer or shorter ferments.
const model = (A: number, T0: number, H0: number, D: number, k: number) => (t: number, h: number) =>
  A * Math.pow(H0 / h, k) * Math.pow(2, (T0 - t) / D);

export const MODELS: Record<Kind, Model> = {
  biga: {
    kind: 'biga',
    name: 'Biga',
    temps: range(14, 28),
    hours: range(8, 48, 2),
    idy: model(0.3, 18, 16, 8, 1.2),
    ready:
      'Ready when it has roughly doubled, looks puffy with an open, stringy web when torn, and smells sweet, yogurty and lightly alcoholic. Sharply sour, wet or sagging means it went too far.',
    note: 'About 0.3% IDY at 18 °C for 16 hours, doubling in activity every 8 °C and scaling down for longer ferments.',
  },
  poolish: {
    kind: 'poolish',
    name: 'Poolish',
    temps: range(14, 28),
    hours: range(6, 30, 2),
    // Anchored on the classic overnight poolish: Hamelman uses 0.07% instant yeast and Forkish 0.08%
    // for 12–16 h at about 21 °C. That's also the middle of the published schedules overall.
    idy: model(0.075, 21, 14, 8, 1.5),
    ready:
      'Ready when it has risen 2–3×, is covered in bubbles and has domed with the centre just starting to dip, leaving tide marks on the container. Fully collapsed, soupy or smelling of acetone means it went too far.',
    note: 'About 0.075% IDY at 21 °C for 14 hours, the classic overnight poolish (Hamelman uses 0.07%, Forkish 0.08%), doubling in activity every 8 °C and scaling down for longer ferments. Wet preferments ferment faster, so that’s roughly a quarter of a biga’s dose. Published schedules disagree by about ±50%, so trust the bubbles over the clock.',
  },
};

export const nearest = (list: number[], v: number) =>
  list.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));

/* ---------- final dough proofing ---------- */

// The final dough IDY is set for balls proofing in an 18–24 °C room. Warmer rooms speed the
// yeast up (roughly ×2 per 8 °C), so the final IDY is cut back to keep at least ~2 h of proof.
export const ROOM_MIN = 18;
export const ROOM_MAX = 24;
export const roomFactor = (room: number) => (room > ROOM_MAX ? Math.pow(2, -(room - ROOM_MAX) / 8) : 1);

/* ---------- water temperature ---------- */

// Specific heats, kJ/(kg·K). Flour is ~1.6, water 4.18; ice melting absorbs 334 kJ/kg.
const C_FLOUR = 1.6;
const C_WATER = 4.18;
const L_ICE = 334;
export const FRIDGE_WATER = 4;

// Real temperature rise of the dough during the final mix (not the ×3/×4 "friction factor").
export const MIXERS = [
  { id: 'hand', label: 'By hand', rise: 1 },
  { id: 'fork', label: 'Fork mixer', rise: 2 },
  { id: 'stand', label: 'Stand mixer', rise: 5 },
  { id: 'spiral', label: 'Spiral mixer', rise: 6 },
] as const;
export const WATER_MAX = 38;

export type WaterTemp = {
  /** Water temperature that lands the dough on the target, °C. */
  water: number;
  /** When the water would need to be below ~2 °C: grams of ice to swap in for fridge-cold water. */
  ice: number | null;
  tooHot: boolean;
};

/**
 * Energy balance for the final mix: preferment + flour + water, each at its own temperature,
 * plus the heat the mixer adds. Weighted by mass × specific heat, so it stays honest when most of
 * the water is already locked up in a stiff biga.
 */
export function waterTemp(p: {
  preFlour: number;
  preWater: number;
  preTemp: number;
  flour: number;
  flourT: number;
  water: number;
  ddt: number;
  friction: number;
}): WaterTemp | null {
  if (p.water < 1) return null;
  const cPre = p.preFlour * C_FLOUR + p.preWater * C_WATER;
  const cFlour = p.flour * C_FLOUR;
  const cWater = p.water * C_WATER;
  const total = cPre + cFlour + cWater;
  const water = (total * (p.ddt - p.friction) - cPre * p.preTemp - cFlour * p.flourT) / cWater;
  let ice: number | null = null;
  if (water < 2) {
    // Replace part of the fridge-cold water with ice; melting soaks up the extra heat.
    ice = (p.water * C_WATER * (FRIDGE_WATER - water)) / (C_WATER * FRIDGE_WATER + L_ICE);
    ice = Math.min(p.water, Math.max(0, ice));
  }
  return { water, ice, tooHot: water > WATER_MAX };
}

/* ---------- recipe ---------- */

export type Line = { name: string; sub?: string; grams: number; small?: boolean };

export type FlourLine = {
  name: string;
  /** Fraction of the preferment's flour and of the final dough's flour. */
  preShare: number;
  finShare: number;
  /** Grams in the preferment and in the final dough. */
  pre: number;
  fin: number;
};

export type Calc = {
  model: Model;
  temp: number;
  hours: number;
  /** Preferment IDY as a fraction of preferment flour, boost included. */
  preIdy: number;
  /** Final IDY as % of total flour after the room adjustment. */
  finalIdy: number;
  dough: number;
  flour: number;
  water: number;
  pre: { flour: number; water: number; yeast: number; total: number };
  final: { flour: number; water: number; salt: number; oil: number; yeast: number };
  /** Flours are set separately for the preferment and the final dough. */
  split: boolean;
  flours: FlourLine[];
  mixWater: WaterTemp | null;
  warnings: string[];
};

/** Turns percentages into fractions of 1. All zero splits evenly. */
function mix(pcts: number[]) {
  const sum = pcts.reduce((a, v) => a + (+v || 0), 0);
  return { sum, of: pcts.map((v) => (sum > 0 ? (+v || 0) / sum : 1 / pcts.length)) };
}
const off100 = (sum: number) => Math.abs(sum - 100) > 0.01;
const rescaled = (sum: number) => (sum > 0 ? `add up to ${+sum.toFixed(1)}%, so they've been scaled to 100%` : `are all 0%, so they've been split evenly`);

/** Each flour's share of all the flour in the dough, %, rounded to 0.1 and summing to exactly 100. */
export function blend(c: Calc): number[] {
  const raw = c.flours.map((f) => ((f.pre + f.fin) / c.flour) * 100);
  const out = raw.map((v) => Math.round(v * 10) / 10);
  const big = raw.indexOf(Math.max(...raw));
  out[big] = Math.round((out[big] + 100 - out.reduce((a, v) => a + v, 0)) * 10) / 10;
  return out;
}

const r1 = (v: number) => Math.round(v * 10) / 10;

/**
 * Makes a column of flour shares add up to exactly 100%. The biggest of the other flours (usually
 * the main flour) makes up the difference: it takes any shortfall, and an excess comes off the
 * biggest flours first. Ties go to the flour higher in the list. The flour at index `keep` is left
 * as it is. A single flour is always 100%.
 */
export function balance(pcts: number[], keep = -1): number[] {
  if (pcts.length < 2) return pcts.map(() => 100);
  const out = pcts.map((p) => r1(Math.min(100, Math.max(0, +p || 0))));
  const others = out
    .map((_, j) => j)
    .filter((j) => j !== keep)
    .sort((a, b) => out[b] - out[a] || a - b);
  let diff = r1(100 - out.reduce((a, p) => a + p, 0));
  if (diff > 0) out[others[0]] = r1(out[others[0]] + diff);
  for (const j of others) {
    if (diff >= 0) break;
    const take = Math.min(out[j], -diff);
    out[j] = r1(out[j] - take);
    diff = r1(diff + take);
  }
  return out;
}

/** Sets flour `i` to `v`% and lets the others make up the difference (see `balance`). */
export const rebalance = (pcts: number[], i: number, v: number) => balance(pcts.map((p, j) => (j === i ? v : p)), i);

export function calc(kind: Kind, s: Settings): Calc {
  const m = MODELS[kind];
  const temp = nearest(m.temps, s.temp);
  const hours = nearest(m.hours, s.hours);
  const hyd = s.hyd / 100;
  const salt = s.salt / 100;
  const oil = s.oil / 100;
  const bp = Math.min(Math.max(s.bp, 0), 100) / 100;
  const bh = (kind === 'poolish' ? 100 : s.bh) / 100;
  const finalIdy = s.fy * roomFactor(s.room);
  const fy = finalIdy / 100;
  const preIdy = (m.idy(temp, hours) * (1 + s.boost / 100)) / 100;

  const dough = s.balls * s.bw * (1 + s.waste / 100);
  const FL = dough / (1 + hyd + salt + oil + fy + preIdy * bp);
  const bF = FL * bp;
  const bW = bF * bh;
  const bY = bF * preIdy;
  const fF = FL - bF;
  const fW = FL * hyd - bW;
  const fS = FL * salt;
  const fO = FL * oil;
  const fY = FL * fy;

  const split = s.split && s.flours.length > 1;
  const preMix = mix(s.flours.map((f) => f.pct));
  const finMix = split ? mix(s.flours.map((f) => f.fin)) : preMix;
  const flours = s.flours.map((f, i) => ({
    name: f.name,
    preShare: preMix.of[i],
    finShare: finMix.of[i],
    pre: bF * preMix.of[i],
    fin: fF * finMix.of[i],
  }));

  const mixWater = waterTemp({
    preFlour: bF,
    preWater: bW,
    preTemp: temp,
    flour: Math.max(fF, 0),
    flourT: s.flourT,
    water: Math.max(fW, 0),
    ddt: s.ddt,
    friction: s.friction,
  });

  const warnings: string[] = [];
  if (!split) {
    if (off100(preMix.sum)) warnings.push(`The flour shares ${rescaled(preMix.sum)}.`);
  } else {
    if (off100(preMix.sum)) warnings.push(`The ${m.name.toLowerCase()} flours ${rescaled(preMix.sum)}.`);
    if (fF > 0.5 && off100(finMix.sum)) warnings.push(`The final dough flours ${rescaled(finMix.sum)}.`);
  }
  if (fW < 0)
    warnings.push(
      `The ${m.name.toLowerCase()} holds more water than the whole dough allows. Lower its share or raise the dough hydration.`,
    );
  else if (fW < FL * 0.05)
    warnings.push(`Only ${Math.round(fW)} g of water is left for the final mix, so it may be hard to bring together. Lower the ${m.name.toLowerCase()} share.`);
  if (bY < 0.3 || (fY > 0 && fY < 0.3))
    warnings.push(
      'Some yeast amounts are under 0.3 g. Weigh them on a 0.01 g scale, or dissolve 1 g of yeast in 100 g of the recipe’s water and weigh the solution (10 g holds 0.1 g of yeast).',
    );

  return {
    model: m,
    temp,
    hours,
    preIdy,
    finalIdy,
    dough,
    flour: FL,
    water: FL * hyd,
    pre: { flour: bF, water: bW, yeast: bY, total: bF + bW + bY },
    final: { flour: fF, water: fW, salt: fS, oil: fO, yeast: fY },
    split,
    flours,
    mixWater,
    warnings,
  };
}

/* ---------- timeline ---------- */

export type Step = { at: Date; title: string; sub?: string; end?: boolean; key: string };

export type Timeline = {
  steps: Step[];
  ready: Date;
  bake: Date;
  window: { early: Date; late: Date } | null;
  /** Minutes from preferment ready to dough ready to bake. */
  after: number;
};

const addMin = (d: Date, m: number) => new Date(d.getTime() + m * 60_000);

export function fmtDur(min: number): string {
  const m = Math.round(min);
  const h = Math.floor(m / 60);
  const r = m % 60;
  return (h ? `${h} h` : '') + (h && r ? ' ' : '') + (r ? `${r} min` : '') || '0 min';
}

/** Minutes from "preferment ready" until the balls are ready to bake. */
export function afterReady(s: Settings): number {
  const balls = s.fridge ? s.fridgeRest + s.fridgeH * 60 + s.temper : s.proof;
  return s.mix + s.bulk + balls;
}

export function timeline(kind: Kind, s: Settings, start: Date): Timeline {
  const m = MODELS[kind];
  const H = nearest(m.hours, s.hours);
  const b = (Math.max(0, s.buf) / 100) * H * 60;
  const ready = addMin(start, H * 60);
  const mixed = addMin(ready, s.mix);
  const balled = addMin(mixed, s.bulk);
  const after = afterReady(s);
  const bake = addMin(ready, after);
  const name = m.name.toLowerCase();
  const steps: Step[] = [
    { key: 'start', at: start, title: `Mix the ${name}`, sub: `${H} h at ${nearest(m.temps, s.temp)} °C` },
    {
      key: 'ready',
      at: ready,
      title: `${m.name} ready, start the final mix`,
      sub: `Mix to ${s.ddt} °C` + (b ? ` · usable from ${fmtClock(addMin(ready, -b))} to ${fmtClock(addMin(ready, b))}` : ''),
    },
    { key: 'ball', at: balled, title: 'Divide and ball', sub: `${fmtDur(s.mix)} mix + ${fmtDur(s.bulk)} bulk` },
  ];
  if (s.fridge) {
    const cold = addMin(balled, s.fridgeRest);
    const out = addMin(cold, s.fridgeH * 60);
    steps.push(
      { key: 'fridge', at: cold, title: 'Balls into the fridge', sub: `After ${fmtDur(s.fridgeRest)} at room temperature` },
      { key: 'out', at: out, title: 'Out of the fridge', sub: `${s.fridgeH} h cold · let them warm up, covered` },
    );
  }
  steps.push({
    key: 'bake',
    at: bake,
    title: 'Ready to bake',
    sub: s.fridge ? `${fmtDur(s.temper)} back at room temperature` : `${fmtDur(s.proof)} ball proof at ${s.room} °C`,
    end: true,
  });
  return {
    steps,
    ready,
    bake,
    window: b ? { early: addMin(bake, -b), late: addMin(bake, b) } : null,
    after,
  };
}

/* ---------- formatting ---------- */

export const g0 = (v: number) => `${Math.round(v)} g`;
export const g1 = (v: number) => `${v < 1 ? v.toFixed(2) : v.toFixed(1)} g`;
export const num = (v: number, dec: number) => String(Number((+v).toFixed(dec)));
export const fmtClock = (d: Date) => d.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' });
export const fmtDay = (d: Date) => d.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
export const fmtWeekday = (d: Date) => d.toLocaleString(undefined, { weekday: 'short' });

const pad = (n: number) => String(n).padStart(2, '0');
export const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Now, rounded down to `step` minutes, so something started "now" has already started. */
export function roundedNow(step = 5): Date {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(Math.floor(d.getMinutes() / step) * step);
  return d;
}

/** A stored "YYYY-MM-DDTHH:mm" start as a Date, or null when it isn't set. */
export function parseStart(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const fmtDate = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

/* ---------- clock changes ---------- */

export type ClockChange = {
  /** The first minute on the new time. */
  at: Date;
  /** How far the clocks move: +60 when they go forward an hour, −60 when they go back. */
  minutes: number;
};

/**
 * The first daylight-saving change between two moments, if any. Schedules are worked out in real
 * elapsed time, so the yeast always gets its hours, but the clock times after a change look an hour
 * off unless you know it's there.
 */
export function clockChange(from: Date, to: Date): ClockChange | null {
  const before = from.getTimezoneOffset();
  if (to.getTimezoneOffset() === before) return null;
  // Binary search, a minute at a time, for the first minute on the new offset.
  let lo = Math.floor(from.getTime() / 60_000);
  let hi = Math.ceil(to.getTime() / 60_000);
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (new Date(mid * 60_000).getTimezoneOffset() === before) lo = mid;
    else hi = mid;
  }
  const at = new Date(hi * 60_000);
  return { at, minutes: before - at.getTimezoneOffset() };
}

/** "Clocks go forward 1 hour at 2:00 am on Sun 4 Oct". */
export function describeClockChange(c: ClockChange): string {
  // The wall-clock time the change happens at, on the old time (2:00 am, not the 3:00 am it becomes).
  const oldWall = new Date(c.at.getTime() - (c.at.getTimezoneOffset() + c.minutes) * 60_000);
  const clock = oldWall.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
  const amount = Math.abs(c.minutes) === 60 ? '1 hour' : fmtDur(Math.abs(c.minutes));
  return `Clocks go ${c.minutes > 0 ? 'forward' : 'back'} ${amount} at ${clock} on ${fmtDate(c.at)}`;
}

/* ---------- where a bake is up to ---------- */

export type BakeStatus = {
  phase: 'planned' | 'running' | 'ready' | 'done';
  title: string;
  /** The step in progress (the last one that has started), if any. */
  current: Step | null;
  next: Step | null;
  /** 0 → 1 from mixing the preferment to ready to bake. */
  progress: number;
};

/** How long after "ready to bake" a bake still counts as on the go. */
export const BAKE_GRACE_MIN = 6 * 60;

export function bakeStatus(kind: Kind, tl: Timeline, now: Date): BakeStatus {
  const { steps } = tl;
  const t = now.getTime();
  const i = steps.findLastIndex((s) => s.at.getTime() <= t);
  const current = i >= 0 ? steps[i] : null;
  const next = steps[i + 1] ?? null;
  const start = steps[0].at.getTime();
  const progress = Math.min(1, Math.max(0, (t - start) / Math.max(1, tl.bake.getTime() - start)));
  if (!current) return { phase: 'planned', title: 'Not started yet', current, next, progress };
  if (current.key === 'bake') {
    const done = t >= tl.bake.getTime() + BAKE_GRACE_MIN * 60_000;
    return { phase: done ? 'done' : 'ready', title: done ? 'Baked' : 'Ready to bake', current, next: null, progress };
  }
  const fridge = steps.some((s) => s.key === 'fridge');
  const titles: Record<string, string> = {
    start: `${MODELS[kind].name} fermenting`,
    ready: 'Final mix and bulk',
    ball: fridge ? 'Balls resting' : 'Balls proofing',
    fridge: 'Balls in the fridge',
    out: 'Balls warming up',
  };
  return { phase: 'running', title: titles[current.key] ?? current.title, current, next, progress };
}
