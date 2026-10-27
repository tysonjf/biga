import { DEFAULTS, normalise, type DoughKind, type Settings, type WaterRule } from '../../shared/recipe';
import { doughMultiplier, eqHours, freshForEqHours, IDY_PER_FRESH, rateAt, stretch, tauHours, type Segment } from './craig';

/* ---------- preferment yeast models ---------- */

export type Model = {
  kind: DoughKind;
  /** What ferments on the chart: the preferment, or for a direct dough the whole dough. */
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

export const MODELS: Record<DoughKind, Model> = {
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
  direct: {
    kind: 'direct',
    name: 'Dough',
    // From the fridge to a hot kitchen; rows at FRIDGE_MAX and below are a cold bulk in the fridge.
    temps: range(2, 32),
    hours: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72, 96],
    // The default schedule; a recipe's chart follows its own (see directChart).
    idy: (t, h) => directIdy(DEFAULTS.direct, t, h),
    ready:
      'Ready to ball when it has about doubled, feels airy and slightly domed, and shows bubbles on the sides and bottom of the container.',
    note: 'Craig’s yeast chart from pizzamaking.com, for a dough that about doubles, worked out over the whole schedule: the bulk, the balls, and any time in the fridge, following the dough’s own temperature as it cools down in the fridge and warms up again afterwards (the first warm hours in the fridge do a lot of the work). A 4 °C fridge runs at about a twelfth of room speed. Salt, oil and sugar slow it a little, water speeds it up. Home recipes such as Forkish’s or King Arthur’s use 1.5–3× more yeast for a bigger rise.',
  },
};

export const nearest = (list: number[], v: number) =>
  list.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));

/**
 * The ferment's temperature and time. From the chart they snap to its grid; with the yeast set by
 * hand they're whatever you set (2–32 °C, 1–96 h), a fridge biga included, and the chart is a guide.
 */
export function fermentOf(kind: DoughKind, s: Settings): { temp: number; hours: number; onChart: boolean } {
  const m = MODELS[kind];
  if (s.yeast === 'manual') {
    const temp = Math.round(s.temp);
    const hours = Math.round(s.hours);
    return { temp, hours, onChart: m.temps.includes(temp) && m.hours.includes(hours) };
  }
  return { temp: nearest(m.temps, s.temp), hours: nearest(m.hours, s.hours), onChart: true };
}

/** A direct dough: one mix, no preferment. */
export const noPreferment = (kind: DoughKind) => kind === 'direct';

/* ---------- direct dough yeast ---------- */

/** A chart temperature this cold is the fridge: a cold bulk. */
export const FRIDGE_MAX = 8;
/** A chart cell outside these (IDY, % of flour) is off Craig's chart: too much to rise, or too little to weigh. */
export const CHART_MIN = 0.003;
export const CHART_MAX = 1.5;

/** What happens after a direct dough's bulk: the balls proof, or rest, go in the fridge and warm up again. */
function afterBulk(s: Settings): Segment[] {
  return s.fridge
    ? [
        { envC: s.room, hours: s.fridgeRest / 60, pieceG: s.bw },
        { envC: s.fridgeT, hours: s.fridgeH, pieceG: s.bw },
        { envC: s.room, hours: s.temper / 60, pieceG: s.bw },
      ]
    : [{ envC: s.room, hours: s.proof / 60, pieceG: s.bw }];
}

const idyFor = (s: Settings, eq: number) =>
  freshForEqHours(eq) * doughMultiplier({ hyd: s.hyd, salt: s.salt, oil: s.oil, sugar: s.sugar }) * IDY_PER_FRESH;

/**
 * A direct dough's IDY (% of flour) for a bulk of `h` hours at `t` °C, then the rest of its schedule:
 * Craig's chart over the dough's own temperature, from the mixer onwards.
 */
export function directIdy(s: Settings, t: number, h: number): number {
  const bulk = stretch(s.ddt, t, h, tauHours(s.balls * s.bw * (1 + s.waste / 100)));
  return idyFor(s, bulk.eq + eqHours(afterBulk(s), roundC(bulk.endC)));
}

/** How warm the dough is when it's balled, to 0.1 °C: the chart works out what follows once per temperature. */
const roundC = (c: number) => Math.round(c * 10) / 10;

/**
 * The whole chart for a direct dough's schedule, fast: each row's bulk is walked once, hour by hour,
 * and what comes after only depends on how warm the dough is when it's balled.
 */
export function directChart(s: Settings): (t: number, h: number) => number {
  const bulkG = s.balls * s.bw * (1 + s.waste / 100);
  const tau = tauHours(bulkG);
  const after = afterBulk(s);
  const rows = new Map<number, { eq: number[]; endC: number[] }>();
  const tails = new Map<number, number>();
  const tail = (c: number) => {
    const k = roundC(c);
    let v = tails.get(k);
    if (v === undefined) tails.set(k, (v = eqHours(after, k)));
    return v;
  };
  return (t, h) => {
    if (!Number.isInteger(h) || h < 0 || h > 96) return directIdy(s, t, h);
    let row = rows.get(t);
    if (!row) {
      row = { eq: [0], endC: [s.ddt] };
      for (let i = 1; i <= 96; i++) {
        const step = stretch(row.endC[i - 1], t, 1, tau);
        row.eq.push(row.eq[i - 1] + step.eq);
        row.endC.push(step.endC);
      }
      rows.set(t, row);
    }
    return idyFor(s, row.eq[h] + tail(row.endC[h]));
  };
}

/** How fast yeast works at `t` °C next to 21 °C: "a 4 °C fridge runs at about a twelfth of room speed". */
export const yeastSpeed = rateAt;

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
/** A fridge, °C: for chilled water, and a preferment held back in it. */
export const FRIDGE = 4;
export const FRIDGE_WATER = FRIDGE;

// Real temperature rise of the dough during the final mix (not the ×3/×4 "friction factor").
export const MIXERS = [
  { id: 'hand', label: 'By hand', rise: 1 },
  { id: 'fork', label: 'Fork mixer', rise: 2 },
  { id: 'stand', label: 'Stand mixer', rise: 5 },
  { id: 'spiral', label: 'Spiral mixer', rise: 6 },
] as const;
export const WATER_MAX = 38;

/* ---------- holding back water ---------- */

// A wet dough mixes strong faster at a lower hydration: bring it together at 60%, counting the
// preferment's water, then drizzle in the rest as it mixes (bassinage).
export const FIRST_HYD = 60;

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
type Mix = {
  preFlour: number;
  preWater: number;
  preTemp: number;
  flour: number;
  flourT: number;
  water: number;
  ddt: number;
  friction: number;
};

const heat = (p: Mix) => {
  const cPre = p.preFlour * C_FLOUR + p.preWater * C_WATER;
  const cFlour = p.flour * C_FLOUR;
  const cWater = p.water * C_WATER;
  return { cPre, cFlour, cWater, total: cPre + cFlour + cWater };
};

export function waterTemp(p: Mix): WaterTemp | null {
  if (p.water < 1) return null;
  const { cPre, cFlour, cWater, total } = heat(p);
  return finishWater((total * (p.ddt - p.friction) - cPre * p.preTemp - cFlour * p.flourT) / cWater, p.water);
}

/** The dough temperature the heat balance expects from water at `waterC`, °C. */
export function doughTempFrom(p: Mix, waterC: number): number {
  const { cPre, cFlour, cWater, total } = heat(p);
  return (cPre * p.preTemp + cFlour * p.flourT + cWater * waterC) / total + p.friction;
}

/** Water at a temperature: below 2 °C, part of it as ice; over WATER_MAX, too hot for the yeast. */
function finishWater(water: number, grams: number): WaterTemp {
  let ice: number | null = null;
  if (water < 2) {
    // Replace part of the fridge-cold water with ice; melting soaks up the extra heat. The same as the
    // textbook ice share (T_tap − T_water) / (T_tap + 80).
    ice = (grams * C_WATER * (FRIDGE_WATER - water)) / (C_WATER * FRIDGE_WATER + L_ICE);
    ice = Math.min(grams, Math.max(0, ice));
  }
  return { water, ice, tooHot: water > WATER_MAX };
}

/**
 * The bakers' friction factor for the DDT rule, °C: three times the mixer's real temperature rise, the
 * way it's measured (FF = 3 × dough − room − flour − water). King Arthur's stand mixer, 22–24 °F, is
 * 12–13 °C; Hamelman's spiral, 26 °F, 14 °C. Hamelman keeps the same factor in the × 4 rule.
 */
export const frictionFactor = (rise: number) => 3 * rise;

/* ---------- biga water: Giorilli's rule ---------- */

// Piergiorgio Giorilli's rule for mixing a biga: water = 55 − (room + flour), in °C. It lands a
// stiff biga, mixed just until there's no dry flour, at about 18–20 °C.
export const GIORILLI_BASE = 55;
/** Below this the rule asks for colder water than a tap or a fridge gives. */
export const ICE_WATER = 2;

export type BigaWater = { water: number; room: number; flour: number; cold: boolean; tooHot: boolean };

export function giorilli(room: number, flour: number): BigaWater {
  const water = GIORILLI_BASE - (room + flour);
  return { water, room, flour, cold: water < ICE_WATER, tooHot: water > WATER_MAX };
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
  /** Preferment IDY as a fraction of preferment flour (a direct dough's flour): the chart's, or set by hand. */
  preIdy: number;
  /** What the chart gives, boost included, as a fraction: the guide when the yeast is set by hand. */
  chartIdy: number;
  /** The yeast is set by hand (`s.idy`), with the chart as a guide. */
  manualYeast: boolean;
  /** The preferment's temperature going into the final mix: as set, or its ferment temperature. */
  preTemp: number;
  /** Final IDY as % of total flour after the room adjustment. */
  finalIdy: number;
  dough: number;
  flour: number;
  water: number;
  pre: { flour: number; water: number; yeast: number; total: number };
  final: { flour: number; water: number; salt: number; oil: number; sugar: number; yeast: number };
  /** Flours are set separately for the preferment and the final dough. */
  split: boolean;
  flours: FlourLine[];
  /** Water for mixing the biga itself (Giorilli); null for a poolish or a direct dough. */
  bigaWater: BigaWater | null;
  mixWater: WaterTemp | null;
  /** The final mix's water by each rule, °C, whichever is chosen. null when there's no water to add. */
  waterBy: Record<WaterRule, number> | null;
  /** The DDT rule's multiplier: 3, or 4 with a preferment. */
  ddtN: number;
  /** The dough temperature the heat balance expects from the water `mixWater` asks for, °C. */
  expectC: number | null;
  /**
   * The final mix's water in two parts: `first` brings the whole dough to FIRST_HYD%, then `rest` is
   * drizzled in. Whole grams that add up to the water shown. null when the dough isn't wetter than that.
   */
  holdBack: { first: number; rest: number } | null;
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

export function calc(kind: DoughKind, s: Settings): Calc {
  const m = MODELS[kind];
  const { temp, hours } = fermentOf(kind, s);
  const hyd = s.hyd / 100;
  const salt = s.salt / 100;
  const oil = s.oil / 100;
  const sugar = s.sugar / 100;
  // A direct dough has no preferment: the chart's yeast goes into the one mix, for all the flour.
  const direct = noPreferment(kind);
  // The chart's yeast, % of the preferment's flour (a direct dough's flour).
  const charted = kind === 'direct' ? directIdy(s, temp, hours) : m.idy(temp, hours);
  const chartIdy = (charted * (1 + s.boost / 100)) / 100;
  const manualYeast = s.yeast === 'manual';
  const useIdy = manualYeast ? s.idy / 100 : chartIdy;
  const bp = direct ? 0 : Math.min(Math.max(s.bp, 0), 100) / 100;
  const bh = (kind === 'poolish' ? 100 : s.bh) / 100;
  const finalIdy = direct ? useIdy * 100 : s.fy * roomFactor(s.room);
  const fy = finalIdy / 100;
  const preIdy = useIdy;

  const dough = s.balls * s.bw * (1 + s.waste / 100);
  const FL = dough / (1 + hyd + salt + oil + sugar + fy + preIdy * bp);
  const bF = FL * bp;
  const bW = bF * bh;
  const bY = bF * preIdy;
  const fF = FL - bF;
  const fW = FL * hyd - bW;
  const fS = FL * salt;
  const fO = FL * oil;
  const fSu = FL * sugar;
  const fY = FL * fy;

  const split = !direct && s.split && s.flours.length > 1;
  const preMix = mix(s.flours.map((f) => f.pct));
  const finMix = split ? mix(s.flours.map((f) => f.fin)) : preMix;
  const flours = s.flours.map((f, i) => ({
    name: f.name,
    preShare: preMix.of[i],
    finShare: finMix.of[i],
    pre: bF * preMix.of[i],
    fin: fF * finMix.of[i],
  }));

  const mixIn: Mix = {
    preFlour: bF,
    preWater: bW,
    preTemp: s.preT ?? temp,
    flour: Math.max(fF, 0),
    flourT: s.flourT,
    water: Math.max(fW, 0),
    ddt: s.ddt,
    friction: s.friction,
  };
  const balance = waterTemp(mixIn);
  // The other rules, for the same mix. DDT: n × DDT − room − flour − friction factor, n = 3, or 4 with a
  // preferment, whose temperature counts too. Base: base − room − flour (the Neapolitan rule of 55).
  const ddtN = direct ? 3 : 4;
  const waterBy = balance
    ? {
        balance: balance.water,
        ddt: ddtN * s.ddt - s.room - s.flourT - (direct ? 0 : mixIn.preTemp) - frictionFactor(s.friction),
        base: s.waterBase - s.room - s.flourT,
      }
    : null;
  const mixWater = balance && waterBy && s.waterRule !== 'balance' ? finishWater(waterBy[s.waterRule], mixIn.water) : balance;

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
  if (kind === 'direct' && charted > CHART_MAX)
    warnings.push(`${hours} h at ${temp} °C is too short for the dough to rise on Craig’s chart: give it longer or somewhere warmer.`);
  else if (kind === 'direct' && charted < CHART_MIN)
    warnings.push(`${hours} h at ${temp} °C is longer than Craig’s chart goes: shorten it or ferment it cooler.`);
  if ((!direct && bY < 0.3) || (fY > 0 && fY < 0.3))
    warnings.push(
      'Some yeast amounts are under 0.3 g. Weigh them on a 0.01 g scale, or dissolve 1 g of yeast in 100 g of the recipe’s water and weigh the solution (10 g holds 0.1 g of yeast).',
    );

  return {
    model: m,
    temp,
    hours,
    preIdy,
    chartIdy,
    manualYeast,
    preTemp: s.preT ?? temp,
    finalIdy,
    dough,
    flour: FL,
    water: FL * hyd,
    pre: { flour: bF, water: bW, yeast: bY, total: bF + bW + bY },
    final: { flour: fF, water: fW, salt: fS, oil: fO, sugar: fSu, yeast: fY },
    split,
    flours,
    bigaWater: kind === 'biga' ? giorilli(s.room, s.flourT) : null,
    mixWater,
    waterBy,
    ddtN,
    expectC: mixWater ? doughTempFrom(mixIn, mixWater.water) : null,
    holdBack: holdBack(FL, bW, fW, s.hyd),
    warnings,
  };
}

export function holdBack(flour: number, preWater: number, water: number, hyd: number) {
  const first = Math.round((flour * FIRST_HYD) / 100 - preWater);
  const all = Math.round(water);
  if (hyd <= FIRST_HYD || first <= 0 || first >= all) return null;
  return { first, rest: all - first };
}

/* ---------- from grams ---------- */

/** The grams of a dough's parts: the preferment's flour, water and yeast, and the final mix's flour, water, salt, oil, sugar and yeast. */
export type Grams = { pf: number; pw: number; py: number; ff: number; fw: number; fs: number; fo: number; fsu: number; fy: number };

export const gramsOf = (c: Calc): Grams => ({
  pf: c.pre.flour,
  pw: c.pre.water,
  py: c.pre.yeast,
  ff: Math.max(c.final.flour, 0),
  fw: Math.max(c.final.water, 0),
  fs: c.final.salt,
  fo: c.final.oil,
  fsu: c.final.sugar,
  fy: c.final.yeast,
});

/**
 * Working backwards: the settings that give these grams, holding the number of balls. The hydration,
 * salt, oil and sugar follow from the flour; the preferment's share and hydration from its flour and
 * water; the ball weight from the whole. Yeast typed in is yeast set by hand.
 */
export function fromGrams(kind: DoughKind, s: Settings, g: Grams): Settings {
  const direct = noPreferment(kind);
  const pf = direct ? 0 : Math.max(0, g.pf);
  const F = pf + Math.max(0, g.ff);
  if (!(F > 0)) return s;
  const pct = (v: number) => (Math.max(0, v) / F) * 100;
  const dough = F + Math.max(0, g.pw) + Math.max(0, g.fw) + Math.max(0, g.fs) + Math.max(0, g.fo) + Math.max(0, g.fsu) + Math.max(0, g.py) + Math.max(0, g.fy);
  const next: Settings = {
    ...s,
    hyd: pct(g.pw + g.fw),
    salt: pct(g.fs),
    oil: pct(g.fo),
    sugar: pct(g.fsu),
    bw: dough / (s.balls * (1 + s.waste / 100)),
  };
  if (!direct && pf > 0) {
    next.bp = (pf / F) * 100;
    if (kind === 'biga') next.bh = (Math.max(0, g.pw) / pf) * 100;
  }
  // The preferment's (a direct dough's) yeast only has a setting when it's set by hand.
  if (s.yeast === 'manual') next.idy = direct ? pct(g.fy) : pf > 0 ? (Math.max(0, g.py) / pf) * 100 : s.idy;
  if (!direct) next.fy = pct(g.fy) / roomFactor(s.room);
  return normalise(kind, next);
}

/**
 * One line of the Recipe card typed in grams. `key` is a part of `Grams`, or a flour line `pf:i` /
 * `ff:i`, which sets that stage's flour so the i-th flour comes to those grams at its share.
 */
export function applyGrams(kind: DoughKind, s: Settings, c: Calc, key: string, grams: number): Settings {
  if (!(grams >= 0)) return s;
  const g = gramsOf(c);
  const [part, idx] = key.split(':');
  if (idx !== undefined) {
    const f = c.flours[+idx];
    const share = part === 'pf' ? f?.preShare : f?.finShare;
    if (!f || !(share > 0)) return s;
    g[part as 'pf' | 'ff'] = grams / share;
  } else if (part in g) g[part as keyof Grams] = grams;
  else return s;
  // Typing a yeast line is choosing to set the yeast by hand; other lines leave the yeast as it was.
  const touchedYeast = part === 'py' || (part === 'fy' && noPreferment(kind));
  const next = fromGrams(kind, { ...s, yeast: touchedYeast ? 'manual' : s.yeast }, g);
  if (!touchedYeast && s.yeast === 'chart') {
    next.yeast = 'chart';
    next.idy = s.idy;
  }
  return next;
}

export type DoughVar = { name: string; value: number; unit: string };

/**
 * The recipe's amounts by name, for sums in the calculator and the notes ("flour × 2% ="). Grams
 * are whole, as the Recipe card shows them, so a sum agrees with what's on screen.
 */
export function doughVars(kind: DoughKind, s: Settings, c: Calc): DoughVar[] {
  const g = (name: string, v: number) => ({ name, value: Math.round(v), unit: 'g' });
  return [
    g('flour', c.flour),
    g('water', c.water),
    ...(noPreferment(kind) ? [] : [g(kind, c.pre.total)]),
    g('salt', c.final.salt),
    g('oil', c.final.oil),
    g('sugar', c.final.sugar),
    g('dough', c.dough),
    { name: 'balls', value: s.balls, unit: '' },
    { name: 'hydration', value: Math.round(s.hyd * 10) / 10, unit: '%' },
  ];
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

/**
 * Minutes from the end of the chart's ferment until the balls are ready to bake: for a preferment,
 * the final mix, bulk and balls; for a direct dough, whose chart is its bulk, just the balls.
 */
export function afterReady(kind: DoughKind, s: Settings): number {
  const balls = s.fridge ? s.fridgeRest + s.fridgeH * 60 + s.temper : s.proof;
  return noPreferment(kind) ? balls : s.mix + s.bulk + balls;
}

export function timeline(kind: DoughKind, s: Settings, start: Date): Timeline {
  const m = MODELS[kind];
  const { temp: T, hours: H } = fermentOf(kind, s);
  const b = (Math.max(0, s.buf) / 100) * H * 60;
  const ready = addMin(start, H * 60);
  const after = afterReady(kind, s);
  const bake = addMin(ready, after);
  const name = m.name.toLowerCase();
  const usable = b ? `usable from ${fmtClock(addMin(ready, -b))} to ${fmtClock(addMin(ready, b))}` : '';
  // A direct dough's chart is its bulk: it's balled when the chart's hours are up.
  const steps: Step[] =
    noPreferment(kind)
      ? [
          { key: 'start', at: start, title: 'Mix the dough', sub: `Mix to ${s.ddt} °C, then ${H} h bulk at ${T} °C${T <= FRIDGE_MAX ? ' in the fridge' : ''}` },
          { key: 'ball', at: ready, title: 'Divide and ball', sub: usable ? `Bulk done · ${usable}` : `After ${H} h bulk` },
        ]
      : [
          { key: 'start', at: start, title: `Mix the ${name}`, sub: `${H} h at ${T} °C` },
          { key: 'ready', at: ready, title: `${m.name} ready, start the final mix`, sub: `Mix to ${s.ddt} °C` + (usable ? ` · ${usable}` : '') },
          { key: 'ball', at: addMin(ready, s.mix + s.bulk), title: 'Divide and ball', sub: `${fmtDur(s.mix)} mix + ${fmtDur(s.bulk)} bulk` },
        ];
  const balled = steps.find((st) => st.key === 'ball')!.at;
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

/* ---------- planned start ---------- */

/** Picking a time this long ago still means today: you've only just mixed it. */
export const PLAN_GRACE_MIN = 60;

/**
 * The next time the clock reads `hhmm` ("17:00"): today, or tomorrow if that's already more than
 * an hour gone. At 7 pm, 5 pm means tomorrow; 6:30 pm means half an hour ago.
 */
export function nextAt(hhmm: string, now: Date): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  if (d.getTime() < now.getTime() - PLAN_GRACE_MIN * 60_000) d.setDate(d.getDate() + 1);
  // setHours on a day the clocks change can land an hour out; ask for the wall time again.
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Where a recipe's schedule starts: its planned mix time while that schedule is still going (up to a
 * few hours after the dough is ready to bake), otherwise now, to the nearest 5 minutes.
 */
export function planStart(kind: DoughKind, s: Settings, now: Date): { start: Date; planned: boolean } {
  const plan = parseStart(s.plan);
  if (plan && timeline(kind, s, plan).bake.getTime() + BAKE_GRACE_MIN * 60_000 > now.getTime()) return { start: plan, planned: true };
  return { start: new Date(Math.round(now.getTime() / 300_000) * 300_000), planned: false };
}

/** "Today", "Tomorrow", "Yesterday" or the date. */
export function relDay(d: Date, now: Date): string {
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(d) - day(now)) / 86_400_000);
  return diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : diff === -1 ? 'Yesterday' : fmtDate(d);
}

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

export function bakeStatus(kind: DoughKind, tl: Timeline, now: Date): BakeStatus {
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
    start: noPreferment(kind) ? 'Bulk fermenting' : `${MODELS[kind].name} fermenting`,
    ready: 'Final mix and bulk',
    ball: fridge ? 'Balls resting' : 'Balls proofing',
    fridge: 'Balls in the fridge',
    out: 'Balls warming up',
  };
  return { phase: 'running', title: titles[current.key] ?? current.title, current, next, progress };
}
