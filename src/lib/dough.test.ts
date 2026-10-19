import { describe, expect, it } from 'vitest';
import { DEFAULTS, normalise, type Settings } from '../../shared/recipe';
import {
  afterReady,
  bakeStatus,
  balance,
  blend,
  calc,
  clockChange,
  describeClockChange,
  CHART_MAX,
  directChart,
  directIdy,
  doughVars,
  FIRST_HYD,
  giorilli,
  MODELS,
  nextAt,
  planStart,
  rebalance,
  relDay,
  roomFactor,
  timeline,
  waterTemp,
} from './dough';

const biga = (o: Partial<Settings> = {}) => ({ ...structuredClone(DEFAULTS.biga), ...o });
const poolish = (o: Partial<Settings> = {}) => ({ ...structuredClone(DEFAULTS.poolish), ...o });
const direct = (o: Partial<Settings> = {}) => ({ ...structuredClone(DEFAULTS.direct), ...o });

describe('yeast models', () => {
  it('keeps the original biga chart: 0.3% at 18 °C for 16 h', () => {
    expect(MODELS.biga.idy(18, 16)).toBeCloseTo(0.3, 6);
    expect(MODELS.biga.idy(26, 16)).toBeCloseTo(0.15, 6); // halves every 8 °C
  });

  it('poolish needs roughly a quarter of the biga dose for the same time and temperature', () => {
    const ratio = MODELS.poolish.idy(20, 16) / MODELS.biga.idy(20, 16);
    expect(ratio).toBeGreaterThan(0.2);
    expect(ratio).toBeLessThan(0.35);
  });

  it('defaults to the standard overnight poolish: 0.075% IDY, 14 h at 21 °C', () => {
    expect(DEFAULTS.poolish).toMatchObject({ temp: 21, hours: 14, bh: 100 });
    expect(calc('poolish', poolish()).preIdy * 100).toBeCloseTo(0.075, 6);
  });

  it('matches the classic overnight poolish recipes', () => {
    const near = (got: number, want: number, within: number) => expect(Math.abs(got / want - 1)).toBeLessThanOrEqual(within);
    near(MODELS.poolish.idy(21, 14), 0.07, 0.1); // Hamelman, Bread: 0.07% instant, 12–16 h at ~21 °C
    near(MODELS.poolish.idy(19.5, 13), 0.08, 0.2); // Forkish, Flour Water Salt Yeast: 0.4 g per 500 g, 12–14 h at 18–21 °C
    near(MODELS.poolish.idy(21, 12), 0.1, 0.1); // Modernist Pizza NY poolish: 0.06 g per 60 g
  });

  it('stays within the spread of other published schedules', () => {
    // Weekend Bakery ~0.3% for 8 h at ~20 °C; the Italian pizza rule ~0.04% (1 g fresh yeast per kg) for 16–18 h at 18–20 °C
    expect(MODELS.poolish.idy(20, 8)).toBeGreaterThan(0.15);
    expect(MODELS.poolish.idy(20, 8)).toBeLessThan(0.35);
    expect(MODELS.poolish.idy(19, 17)).toBeGreaterThan(0.04);
    expect(MODELS.poolish.idy(19, 17)).toBeLessThan(0.08);
  });
});

describe('recipe maths', () => {
  it('adds up to the requested dough weight', () => {
    const s = biga();
    const c = calc('biga', s);
    const sum = c.pre.total + c.final.flour + c.final.water + c.final.salt + c.final.oil + c.final.sugar + c.final.yeast;
    expect(sum).toBeCloseTo(c.dough, 6);
    expect(c.dough).toBeCloseTo(4 * 280 * 1.02, 6);
    expect(c.water / c.flour).toBeCloseTo(0.72, 6);
  });

  it('adds sugar to the final mix as a share of the total flour, like oil', () => {
    const c = calc('biga', biga({ oil: 3, sugar: 2 }));
    expect(c.final.sugar / c.flour).toBeCloseTo(0.02, 6);
    expect(c.final.oil / c.flour).toBeCloseTo(0.03, 6);
    const sum = c.pre.total + c.final.flour + c.final.water + c.final.salt + c.final.oil + c.final.sugar + c.final.yeast;
    expect(sum).toBeCloseTo(c.dough, 6);
    expect(c.water / c.flour).toBeCloseTo(0.72, 6); // hydration counts water only
  });

  it('defaults to no sugar and keeps stored sugar in range', () => {
    expect(calc('biga', biga()).final.sugar).toBe(0);
    expect(normalise('poolish', {}).sugar).toBe(0);
    expect(normalise('biga', { sugar: 1.5 }).sugar).toBe(1.5);
    expect(normalise('biga', { sugar: 40 }).sugar).toBe(10);
    expect(normalise('biga', { sugar: -1 }).sugar).toBe(0);
  });

  it('builds a poolish at 100% hydration whatever is stored', () => {
    const c = calc('poolish', poolish({ bh: 45 }));
    expect(c.pre.water).toBeCloseTo(c.pre.flour, 6);
  });

  it('flags a preferment that holds more water than the dough allows', () => {
    const c = calc('poolish', poolish({ bp: 90, hyd: 65 }));
    expect(c.final.water).toBeLessThan(0);
    expect(c.warnings.join(' ')).toMatch(/more water than the whole dough/);
  });
});

describe('flours', () => {
  const two = [
    { name: 'Bread', pct: 100, fin: 0 },
    { name: 'Tipo 00', pct: 0, fin: 100 },
  ];

  it('uses one blend for both stages by default', () => {
    const c = calc('biga', biga({ flours: [{ name: 'A', pct: 60, fin: 0 }, { name: 'B', pct: 40, fin: 100 }] }));
    expect(c.flours[0].pre / c.pre.flour).toBeCloseTo(0.6, 6);
    expect(c.flours[0].fin / c.final.flour).toBeCloseTo(0.6, 6);
  });

  it('puts each flour where it was asked to go when split by stage', () => {
    const c = calc('biga', biga({ split: true, flours: two }));
    expect(c.flours[0].pre).toBeCloseTo(c.pre.flour, 6);
    expect(c.flours[0].fin).toBe(0);
    expect(c.flours[1].pre).toBe(0);
    expect(c.flours[1].fin).toBeCloseTo(c.final.flour, 6);
    expect(c.warnings).toEqual([]);
    expect(blend(c)).toEqual([75, 25]); // 75% biga
  });

  it('keeps the dough adding up', () => {
    const c = calc('biga', biga({ split: true, flours: two }));
    expect(c.flours.reduce((a, f) => a + f.pre + f.fin, 0)).toBeCloseTo(c.flour, 6);
  });

  it('scales a stage that does not add up to 100%', () => {
    const c = calc('biga', biga({ split: true, flours: [{ name: 'A', pct: 50, fin: 50 }, { name: 'B', pct: 0, fin: 50 }] }));
    expect(c.flours[0].pre).toBeCloseTo(c.pre.flour, 6);
    expect(c.warnings.join(' ')).toMatch(/biga flours add up to 50%/);
  });

  it('blends to exactly 100% after rounding', () => {
    const c = calc('biga', biga({ bp: 70, split: true, flours: [{ name: 'A', pct: 33.3, fin: 0 }, { name: 'B', pct: 33.3, fin: 50 }, { name: 'C', pct: 33.4, fin: 50 }] }));
    expect(blend(c).reduce((a, v) => a + v, 0)).toBeCloseTo(100, 9);
  });
});

describe('flour shares stay at 100%', () => {
  const sum = (v: number[]) => v.reduce((a, b) => a + b, 0);

  it('gives two flours the complement', () => {
    expect(rebalance([100, 0], 0, 70)).toEqual([70, 30]);
    expect(rebalance([70, 30], 1, 45)).toEqual([55, 45]);
  });

  it('never lets one flour go past 100%', () => {
    expect(rebalance([60, 40], 0, 150)).toEqual([100, 0]);
  });

  it('takes an increase from the biggest other flour first', () => {
    expect(rebalance([60, 30, 10], 0, 70)).toEqual([70, 20, 10]);
    expect(rebalance([60, 30, 10], 0, 95)).toEqual([95, 0, 5]);
  });

  it('gives a decrease to the biggest other flour', () => {
    expect(rebalance([60, 30, 10], 0, 50)).toEqual([50, 40, 10]);
    expect(rebalance([60, 30, 10], 2, 5)).toEqual([65, 30, 5]);
  });

  it('leaves small additions alone while the main flour gives way', () => {
    const a = rebalance([100, 0, 0], 1, 5);
    expect(a).toEqual([95, 5, 0]);
    expect(rebalance(a, 2, 5)).toEqual([90, 5, 5]);
  });

  it('repairs shares that were saved out of balance', () => {
    expect(sum(rebalance([100, 30], 1, 35))).toBeCloseTo(100, 9);
    expect(rebalance([100, 30], 1, 35)).toEqual([65, 35]);
    expect(balance([33.3, 33.3, 33.3])).toEqual([33.4, 33.3, 33.3]);
  });

  it('keeps a lone flour at 100%', () => {
    expect(balance([40])).toEqual([100]);
    expect(rebalance([100], 0, 50)).toEqual([100]);
  });
});

describe('final yeast vs proofing room', () => {
  it('leaves the final IDY alone in an 18–24 °C room', () => {
    expect(roomFactor(18)).toBe(1);
    expect(roomFactor(24)).toBe(1);
    expect(calc('biga', biga({ room: 22 })).finalIdy).toBeCloseTo(0.1, 6);
  });

  it('cuts it in a hot room: halved at 32 °C', () => {
    expect(roomFactor(32)).toBeCloseTo(0.5, 6);
    expect(calc('biga', biga({ room: 28 })).finalIdy).toBeLessThan(0.1);
  });
});

describe('water temperature', () => {
  const base = { preFlour: 600, preWater: 270, preTemp: 18, flour: 400, flourT: 22, water: 410, ddt: 25, friction: 4 };

  it('lands the mix on the target (energy balance round-trip)', () => {
    const w = waterTemp(base)!;
    const C = (m: number, c: number) => m * c;
    const heat = C(600, 1.6) * 18 + C(270, 4.18) * 18 + C(400, 1.6) * 22 + C(410, 4.18) * w.water;
    const cap = C(600, 1.6) + C(270, 4.18) + C(400, 1.6) + C(410, 4.18);
    expect(heat / cap + 4).toBeCloseTo(25, 6);
  });

  it('needs warmer water for a fridge-cold preferment', () => {
    expect(waterTemp({ ...base, preTemp: 4 })!.water).toBeGreaterThan(waterTemp(base)!.water + 10);
  });

  it('counts the preferment at its ferment temperature unless told otherwise', () => {
    const c = calc('biga', biga());
    expect(c.preTemp).toBe(18);
    const same = calc('biga', biga({ preT: 18 }));
    expect(same.mixWater!.water).toBeCloseTo(c.mixWater!.water, 9);
  });

  it('needs warmer water for a biga held back in the fridge, cooler for one left out', () => {
    const asFermented = calc('biga', biga()).mixWater!.water;
    const fridge = calc('biga', biga({ preT: 4 }));
    const room = calc('biga', biga({ preT: 24 })).mixWater!.water;
    expect(fridge.preTemp).toBe(4);
    expect(fridge.mixWater!.water).toBeGreaterThan(asFermented + 10);
    expect(room).toBeLessThan(asFermented);
    // Still lands on the target: the energy balance round-trip with the cold biga.
    const s = biga({ preT: 4 });
    const w = fridge.mixWater!.water;
    const cPre = fridge.pre.flour * 1.6 + fridge.pre.water * 4.18;
    const cFlour = fridge.final.flour * 1.6;
    const cWater = fridge.final.water * 4.18;
    const mixed = (cPre * 4 + cFlour * s.flourT + cWater * w) / (cPre + cFlour + cWater) + s.friction;
    expect(mixed).toBeCloseTo(s.ddt, 6);
  });

  it('asks for ice in a hot kitchen with a fast mixer', () => {
    const w = waterTemp({ ...base, preTemp: 28, flourT: 32, friction: 8, water: 150 })!;
    expect(w.water).toBeLessThan(2);
    expect(w.ice).toBeGreaterThan(0);
    expect(w.ice).toBeLessThanOrEqual(150);
  });
});

describe("biga water: Giorilli's rule", () => {
  it('is 55 − (room + flour)', () => {
    expect(giorilli(21, 21).water).toBe(13);
    expect(giorilli(25, 22).water).toBe(8);
  });

  it('works it out for a biga from its room and flour temperatures, not for a poolish', () => {
    expect(calc('biga', biga({ room: 24, flourT: 20 })).bigaWater).toMatchObject({ water: 11, cold: false, tooHot: false });
    expect(calc('poolish', poolish()).bigaWater).toBeNull();
  });

  it('asks for iced water in a hot kitchen and warns about hot water in a cold one', () => {
    expect(giorilli(30, 28)).toMatchObject({ water: -3, cold: true });
    expect(giorilli(8, 6)).toMatchObject({ water: 41, tooHot: true });
  });
});

describe('recipe amounts by name', () => {
  it('names the amounts in whole grams, as the Recipe card shows them', () => {
    const s = biga({ oil: 2 });
    const c = calc('biga', s);
    const v = Object.fromEntries(doughVars('biga', s, c).map((x) => [x.name, x.value]));
    expect(v).toMatchObject({ flour: Math.round(c.flour), water: Math.round(c.water), biga: Math.round(c.pre.total), oil: Math.round(c.final.oil) });
    expect(v).toMatchObject({ balls: 4, hydration: 72 });
    expect(Object.keys(Object.fromEntries(doughVars('poolish', poolish(), calc('poolish', poolish())).map((x) => [x.name, 1])))).toContain('poolish');
  });
});

describe('holding back water', () => {
  const hydAfterFirst = (kind: 'biga' | 'poolish' | 'direct', s: Settings) => {
    const c = calc(kind, s);
    return (c.pre.water + c.holdBack!.first) / c.flour;
  };

  it('brings the whole dough to 60% first, counting the preferment’s water, then the rest', () => {
    for (const [kind, s] of [['biga', biga()], ['poolish', poolish()], ['direct', direct()]] as const) {
      const c = calc(kind, s);
      expect(c.holdBack).not.toBeNull();
      expect(c.holdBack!.first + c.holdBack!.rest).toBe(Math.round(c.final.water));
      expect(hydAfterFirst(kind, s)).toBeCloseTo(FIRST_HYD / 100, 2);
    }
  });

  it('holds nothing back from a dough that isn’t wetter than 60%', () => {
    expect(calc('biga', biga({ hyd: 60 })).holdBack).toBeNull();
    expect(calc('direct', direct({ hyd: 58 })).holdBack).toBeNull();
  });

  it('holds nothing back when the preferment already brings the dough past 60%', () => {
    // A 65% share of 100% poolish is 65% hydration before any more water goes in.
    expect(calc('poolish', poolish({ bp: 65, hyd: 75 })).holdBack).toBeNull();
  });
});

describe('direct dough', () => {
  it('is mixed all at once: no preferment, every ingredient in the one mix', () => {
    const s = direct();
    const c = calc('direct', s);
    expect(c.pre).toEqual({ flour: 0, water: 0, yeast: 0, total: 0 });
    expect(c.final.flour).toBeCloseTo(c.flour, 9);
    expect(c.final.water).toBeCloseTo(c.flour * 0.65, 9);
    expect(c.final.yeast).toBeCloseTo(c.flour * c.preIdy, 9);
    const sum = c.final.flour + c.final.water + c.final.salt + c.final.oil + c.final.sugar + c.final.yeast;
    expect(sum).toBeCloseTo(c.dough, 6);
    expect(c.bigaWater).toBeNull();
    expect(c.warnings).toEqual([]);
  });

  it('reproduces Craig’s yeast chart at a steady temperature, fridge to warm kitchen', () => {
    // Hours to the end point for a fresh-yeast %, straight from Craig's table; IDY is a third of fresh.
    const craig: [number, number, number][] = [
      [40, 67, 0.5],
      [40, 40, 1],
      [45, 60, 0.3],
      [60, 40, 0.1],
      [65, 21, 0.15],
      [70, 14, 0.15],
      [70, 8, 0.3],
      [75, 7, 0.2],
    ];
    for (const [F, hours, fresh] of craig) {
      const C = (F - 32) / 1.8;
      // Held at one temperature the whole time, in Craig's reference dough (63%, 2.8% salt).
      const s = direct({ ddt: C, room: C, hyd: 63, salt: 2.8, proof: 0 });
      expect(Math.abs(directIdy(s, C, hours) / (fresh / 3) - 1)).toBeLessThan(0.12);
    }
  });

  it('cold ferments the balls: the fridge hours count toward the yeast', () => {
    const room = calc('direct', direct({ hours: 2, proof: 120 })).preIdy;
    const cold = (o: Partial<Settings>) => calc('direct', direct({ hours: 2, fridge: true, fridgeRest: 60, fridgeH: 44, fridgeT: 4, temper: 180, ...o })).preIdy;
    expect(cold({})).toBeLessThan(room);
    expect(cold({ fridgeH: 72 })).toBeLessThan(cold({}));
    expect(cold({ fridgeT: 2 })).toBeGreaterThan(cold({}));
    expect(cold({ fridgeT: 7 })).toBeLessThan(cold({}));
  });

  it('lands a 48-hour cold dough near the 0.08% IDY such a recipe uses', () => {
    // 4 × 280 g at 73%, 2.5% salt: 2 h bulk, ball, 1 h rest, 44 h at 4 °C, 3 h out.
    const s = direct({ bw: 280, hyd: 73, salt: 2.5, hours: 2, fridge: true, fridgeRest: 60, fridgeH: 44, fridgeT: 4, temper: 180 });
    expect(Math.abs((calc('direct', s).preIdy * 100) / 0.08 - 1)).toBeLessThan(0.25);
  });

  it('cold bulks on the fridge rows of the chart, slower than the room', () => {
    const fridge = calc('direct', direct({ temp: 4, hours: 48, proof: 240 }));
    const room = calc('direct', direct({ temp: 21, hours: 48, proof: 240 }));
    expect(fridge.preIdy).toBeGreaterThan(room.preIdy * 3);
    expect(fridge.preIdy * 100).toBeGreaterThan(0.05);
    expect(fridge.preIdy * 100).toBeLessThan(0.3);
  });

  it('counts the dough cooling down in the fridge: a warm start needs less yeast', () => {
    const warm = directIdy(direct({ ddt: 26 }), 4, 24);
    const cool = directIdy(direct({ ddt: 18 }), 4, 24);
    expect(warm).toBeLessThan(cool);
  });

  it('counts a longer ball proof as more ferment, so less yeast', () => {
    const two = calc('direct', direct({ hours: 4, proof: 120 }));
    const six = calc('direct', direct({ hours: 4, proof: 360 }));
    expect(six.final.yeast).toBeLessThan(two.final.yeast);
  });

  it('draws the chart with the same numbers as the recipe', () => {
    const s = direct({ hours: 2, fridge: true, fridgeH: 48, ddt: 24 });
    const chart = directChart(s);
    for (const [t, h] of [[21, 2], [4, 48], [30, 1], [12, 96]] as const) expect(chart(t, h)).toBeCloseTo(directIdy(s, t, h), 9);
  });

  it('says so when a cell is off Craig’s chart', () => {
    // An hour from mixing to baking can't raise a dough.
    const c = calc('direct', direct({ ddt: 16, room: 16, temp: 16, hours: 1, proof: 0 }));
    expect(c.preIdy * 100).toBeGreaterThan(CHART_MAX);
    expect(c.warnings.join(' ')).toMatch(/too short for the dough to rise/);
    expect(calc('direct', direct({ temp: 32, hours: 96 })).warnings.join(' ')).toMatch(/longer than Craig’s chart goes/);
  });

  it('takes its yeast from the chart, boost included, and ignores the preferment settings', () => {
    const s = direct({ temp: 21, hours: 6, boost: 20, fy: 0.5, bp: 50 });
    const c = calc('direct', s);
    expect(c.preIdy * 100).toBeCloseTo(directIdy(s, 21, 6) * 1.2, 9);
    expect(c.finalIdy).toBeCloseTo(c.preIdy * 100, 9);
    expect(c.pre.flour).toBe(0);
  });

  it('works out the water for the one mix', () => {
    const c = calc('direct', direct());
    // No preferment to warm or cool it: flour, water and mixer heat land on the target.
    const s = direct();
    const w = c.mixWater!.water;
    const cf = c.flour * 1.6;
    const cw = c.final.water * 4.18;
    expect((cf * s.flourT + cw * w) / (cf + cw) + s.friction).toBeCloseTo(s.ddt, 6);
  });

  it('keeps flours in one blend', () => {
    const s = direct({ split: true, flours: [{ name: 'A', pct: 80, fin: 20 }, { name: 'B', pct: 20, fin: 80 }] });
    const c = calc('direct', s);
    expect(c.split).toBe(false);
    expect(c.flours[0].fin / c.flour).toBeCloseTo(0.8, 9);
  });

  it('balls the dough when the chart’s bulk is up, then proofs the balls', () => {
    const start = new Date(2026, 9, 20, 9, 0);
    const s = direct({ hours: 6, proof: 120, mix: 30, bulk: 45 });
    const tl = timeline('direct', s, start);
    expect(tl.steps.map((st) => st.key)).toEqual(['start', 'ball', 'bake']);
    expect(tl.steps[1].at.getHours()).toBe(15);
    expect(tl.bake.getHours()).toBe(17);
    expect(afterReady('direct', s)).toBe(120);
    expect(afterReady('biga', biga({ mix: 30, bulk: 45, proof: 120 }))).toBe(195);
  });

  it('holds the balls in the fridge to bake later', () => {
    const start = new Date(2026, 9, 20, 9, 0);
    const tl = timeline('direct', direct({ hours: 4, fridge: true, fridgeRest: 60, fridgeH: 24, temper: 120 }), start);
    expect(tl.steps.map((st) => st.key)).toEqual(['start', 'ball', 'fridge', 'out', 'bake']);
    expect(tl.bake.getTime() - start.getTime()).toBe((4 * 60 + 60 + 24 * 60 + 120) * 60_000);
  });

  it('is bulk fermenting until it’s balled', () => {
    const start = new Date(2026, 9, 20, 9, 0);
    const tl = timeline('direct', direct({ hours: 6 }), start);
    expect(bakeStatus('direct', tl, new Date(2026, 9, 20, 11, 0)).title).toBe('Bulk fermenting');
    expect(bakeStatus('direct', tl, new Date(2026, 9, 20, 16, 0)).title).toBe('Balls proofing');
  });

  it('names its amounts without a preferment', () => {
    const s = direct();
    const names = doughVars('direct', s, calc('direct', s)).map((v) => v.name);
    expect(names).toContain('flour');
    expect(names).not.toContain('direct');
  });

  it('is a recipe type of its own', () => {
    expect(normalise('direct', {})).toEqual(DEFAULTS.direct);
  });
});

describe('manual recipe', () => {
  const manual = (o: Partial<Settings> = {}) => ({ ...structuredClone(DEFAULTS.manual), ...o });

  it('is plain baker’s percentages: every ingredient a share of the flour, adding up to the dough', () => {
    const s = manual({ balls: 4, bw: 275, waste: 0, hyd: 73, salt: 2.5, idy: 0.08, extras: [{ name: 'Olive oil', pct: 2 }] });
    const c = calc('manual', s);
    expect(c.dough).toBe(1100);
    expect(c.flour).toBeCloseTo(1100 / 1.7758, 6);
    expect(c.final.water).toBeCloseTo(c.flour * 0.73, 9);
    expect(c.final.salt).toBeCloseTo(c.flour * 0.025, 9);
    expect(c.final.yeast).toBeCloseTo(c.flour * 0.0008, 9);
    expect(c.extras).toEqual([{ name: 'Olive oil', pct: 2, grams: c.flour * 0.02 }]);
    const sum = c.final.flour + c.final.water + c.final.salt + c.final.yeast + c.extras[0].grams;
    expect(sum).toBeCloseTo(c.dough, 6);
    expect(c.pre.total).toBe(0);
  });

  it('matches the levain-style screenshot: 626 g flour, 457 g water, 15.7 g salt, 0.5 g yeast', () => {
    const c = calc('manual', manual({ balls: 4, bw: 275, waste: 0, hyd: 73, salt: 2.5, idy: 0.08 }));
    expect(c.flour).toBeCloseTo(626.49, 1);
    expect(c.final.water).toBeCloseTo(457.34, 1);
    expect(c.final.salt).toBeCloseTo(15.66, 1);
    expect(c.final.yeast).toBeCloseTo(0.5, 1);
  });

  it('splits the flour by its shares', () => {
    const c = calc('manual', manual({ flours: [{ name: 'Tipo 00', pct: 80, fin: 80 }, { name: 'Wholemeal', pct: 20, fin: 20 }] }));
    expect(c.flours[0].fin / c.flour).toBeCloseTo(0.8, 9);
    expect(c.flours[1].fin / c.flour).toBeCloseTo(0.2, 9);
  });

  it('works out the water temperature and the 60% split, with no chart or warnings', () => {
    const c = calc('manual', manual({ hyd: 73 }));
    expect(c.mixWater).not.toBeNull();
    expect(c.holdBack!.first + c.holdBack!.rest).toBe(Math.round(c.final.water));
    expect(c.bigaWater).toBeNull();
    expect(c.warnings).toEqual([]);
  });

  it('stores its ingredients, in range', () => {
    expect(normalise('manual', {})).toEqual(DEFAULTS.manual);
    const s = normalise('manual', { extras: [{ name: 'Malt', pct: 0.5 }, { pct: 200 }, 'junk', { name: 'x'.repeat(99), pct: -3 }] });
    expect(s.extras).toEqual([
      { name: 'Malt', pct: 0.5 },
      { name: 'Ingredient', pct: 100 },
      { name: 'x'.repeat(40), pct: 0 },
    ]);
    expect(normalise('manual', { idy: 9 }).idy).toBe(5);
  });

  it('leaves the other kinds without extras', () => {
    expect(calc('biga', biga()).extras).toEqual([]);
  });
});

describe('water temperature rules', () => {
  it('uses the heat balance unless told otherwise', () => {
    const c = calc('biga', biga());
    expect(DEFAULTS.biga.waterRule).toBe('balance');
    expect(c.mixWater!.water).toBe(c.waterBy!.balance);
    expect(c.expectC).toBeCloseTo(DEFAULTS.biga.ddt, 9);
  });

  it('does the bakers’ DDT × 3 for a direct dough: the published worked example', () => {
    // DDT 24, room 21, flour 20, a spiral at 26 °F ≈ 14.4 °C friction factor (4.8 °C of real rise)
    const c = calc('direct', direct({ ddt: 24, room: 21, flourT: 20, friction: 4.8, waterRule: 'ddt' }));
    expect(c.ddtN).toBe(3);
    expect(c.waterBy!.ddt).toBeCloseTo(72 - 21 - 20 - 14.4, 9);
    expect(c.mixWater!.water).toBeCloseTo(16.6, 9);
  });

  it('does DDT × 4 with a preferment, counting its temperature, with the same friction factor', () => {
    const c = calc('biga', biga({ ddt: 24, room: 21, flourT: 20, friction: 4.8, temp: 18, waterRule: 'ddt' }));
    expect(c.ddtN).toBe(4);
    expect(c.waterBy!.ddt).toBeCloseTo(96 - 21 - 20 - 18 - 14.4, 9);
    // A biga brought out of the fridge counts at its own temperature.
    expect(calc('biga', biga({ preT: 4, waterRule: 'ddt' })).waterBy!.ddt).toBeCloseTo(calc('biga', biga({ waterRule: 'ddt' })).waterBy!.ddt + 14, 9);
  });

  it('does the rule of 55, and any other base', () => {
    const c = calc('direct', direct({ room: 21, flourT: 20, waterRule: 'base' }));
    expect(c.mixWater!.water).toBe(14);
    expect(calc('direct', direct({ room: 21, flourT: 20, waterRule: 'base', waterBase: 60 })).mixWater!.water).toBe(19);
  });

  it('says what the heat balance expects from another rule’s water', () => {
    const s = direct({ ddt: 24, room: 21, flourT: 20, friction: 8, waterRule: 'ddt' });
    const c = calc('direct', s);
    // A hot mixer: the × 3 rule cools the water 3 °C per degree of friction, the physics about 1.6.
    expect(c.waterBy!.ddt).toBeLessThan(c.waterBy!.balance);
    expect(c.expectC!).toBeLessThan(s.ddt);
  });

  it('turns a rule’s cold answer into ice, like the heat balance does', () => {
    const c = calc('direct', direct({ room: 30, flourT: 30, waterRule: 'base' }));
    expect(c.mixWater!.water).toBe(-5);
    expect(c.mixWater!.ice).toBeGreaterThan(0);
  });

  it('stores the rule and the base in range', () => {
    expect(normalise('biga', { waterRule: 'ddt', waterBase: 60 })).toMatchObject({ waterRule: 'ddt', waterBase: 60 });
    expect(normalise('biga', { waterRule: 'magic', waterBase: 200 })).toMatchObject({ waterRule: 'balance', waterBase: 80 });
  });
});

describe('timeline', () => {
  const start = new Date('2026-10-03T08:00:00');

  it('ends after preferment + mix + bulk + proof', () => {
    const t = timeline('biga', biga(), start);
    expect((t.bake.getTime() - start.getTime()) / 3_600_000).toBeCloseTo(16 + 0.5 + 0.5 + 2, 6);
    expect(t.steps.at(-1)!.title).toBe('Ready to bake');
  });

  it('adds a fridge hold for a later bake', () => {
    const t = timeline('poolish', poolish({ hours: 16, fridge: true, fridgeRest: 60, fridgeH: 16, temper: 120 }), start);
    expect(t.steps.map((s) => s.key)).toEqual(['start', 'ready', 'ball', 'fridge', 'out', 'bake']);
    expect((t.bake.getTime() - start.getTime()) / 3_600_000).toBeCloseTo(16 + 0.5 + 0.5 + 1 + 16 + 2, 6);
  });
});

describe('clock changes', () => {
  // Sydney: clocks go forward at 2:00 am on Sun 4 Oct 2026 and back at 3:00 am on Sun 4 Apr 2027.
  it('gives a 12 h biga its full 12 hours across the change, so 7:30 pm is ready at 8:30 am', () => {
    const start = new Date('2026-10-03T19:30');
    const t = timeline('biga', biga({ hours: 12 }), start);
    expect((t.ready.getTime() - start.getTime()) / 3_600_000).toBe(12);
    expect([t.ready.getHours(), t.ready.getMinutes()]).toEqual([8, 30]);
  });

  it('finds the minute the clocks go forward', () => {
    const c = clockChange(new Date('2026-10-03T19:30'), new Date('2026-10-04T10:30'))!;
    expect(c.minutes).toBe(60);
    expect([c.at.getDate(), c.at.getHours(), c.at.getMinutes()]).toEqual([4, 3, 0]);
    expect(describeClockChange(c)).toMatch(/^Clocks go forward 1 hour at 2:00/);
  });

  it('finds the minute the clocks go back', () => {
    const c = clockChange(new Date('2027-04-03T20:00'), new Date('2027-04-04T11:00'))!;
    expect(c.minutes).toBe(-60);
    expect(describeClockChange(c)).toMatch(/^Clocks go back 1 hour at 3:00/);
  });

  it('says nothing when the clocks stay put', () => {
    expect(clockChange(new Date('2026-10-05T19:30'), new Date('2026-10-06T19:30'))).toBeNull();
  });
});

describe('bake status', () => {
  const start = new Date('2026-10-10T18:00');
  const t = timeline('biga', biga({ hours: 12 }), start); // ready 6:00, balled 7:00, bake 9:00
  const at = (iso: string) => bakeStatus('biga', t, new Date(iso));

  it('follows the bake from plan to plate', () => {
    expect(at('2026-10-10T17:00')).toMatchObject({ phase: 'planned', next: { key: 'start' } });
    expect(at('2026-10-10T20:00')).toMatchObject({ phase: 'running', title: 'Biga fermenting', next: { key: 'ready' } });
    expect(at('2026-10-11T06:30')).toMatchObject({ phase: 'running', title: 'Final mix and bulk', next: { key: 'ball' } });
    expect(at('2026-10-11T08:00')).toMatchObject({ phase: 'running', title: 'Balls proofing', next: { key: 'bake' } });
    expect(at('2026-10-11T09:30')).toMatchObject({ phase: 'ready', next: null });
    expect(at('2026-10-11T16:00')).toMatchObject({ phase: 'done', title: 'Baked' });
  });

  it('tracks progress from mixing to baking', () => {
    expect(at('2026-10-10T17:00').progress).toBe(0);
    expect(at('2026-10-11T01:30').progress).toBeCloseTo(0.5, 6);
    expect(at('2026-10-11T12:00').progress).toBe(1);
  });

  it('knows the balls are in the fridge on a bake-later schedule', () => {
    const f = timeline('biga', biga({ hours: 12, fridge: true }), start);
    expect(bakeStatus('biga', f, new Date('2026-10-11T20:00'))).toMatchObject({ title: 'Balls in the fridge', next: { key: 'out' } });
  });
});

describe('planned start', () => {
  const now = new Date('2026-10-10T19:00');
  const at = (d: Date) => [d.getDate(), d.getHours(), d.getMinutes()];

  it('takes a time as the next time the clock reads it', () => {
    expect(at(nextAt('21:30', now))).toEqual([10, 21, 30]); // later today
    expect(at(nextAt('17:00', now))).toEqual([11, 17, 0]); // already gone: tomorrow
    expect(at(nextAt('06:00', now))).toEqual([11, 6, 0]); // tomorrow morning
  });

  it('reads a time from the last hour as just mixed', () => {
    expect(at(nextAt('18:30', now))).toEqual([10, 18, 30]);
    expect(at(nextAt('17:59', now))).toEqual([11, 17, 59]);
  });

  it('lands on the wall time across a clock change', () => {
    // Clocks go forward overnight: 8:00 am Sunday is still 8:00 am.
    expect(at(nextAt('08:00', new Date('2026-10-03T19:30')))).toEqual([4, 8, 0]);
  });

  it('uses the plan while its schedule is going, then goes back to now', () => {
    const s = biga({ hours: 12, plan: '2026-10-10T17:00' }); // ready to bake 8:00 am
    expect(planStart('biga', s, new Date('2026-10-10T12:00'))).toMatchObject({ planned: true });
    expect(planStart('biga', s, new Date('2026-10-11T07:00'))).toMatchObject({ planned: true });
    const later = planStart('biga', s, new Date('2026-10-12T19:02'));
    expect(later.planned).toBe(false);
    expect(at(later.start)).toEqual([12, 19, 0]); // now, to the nearest 5 minutes
    expect(planStart('biga', biga(), now)).toMatchObject({ planned: false });
  });

  it('names the day relative to now', () => {
    expect(relDay(new Date('2026-10-10T23:00'), now)).toBe('Today');
    expect(relDay(new Date('2026-10-11T05:00'), now)).toBe('Tomorrow');
    expect(relDay(new Date('2026-10-09T23:00'), now)).toBe('Yesterday');
  });
});

describe('normalise', () => {
  it('keeps the preferment temperature at mixing in range, unset by default', () => {
    expect(normalise('biga', {}).preT).toBeNull();
    expect(normalise('biga', { preT: 4 }).preT).toBe(4);
    expect(normalise('biga', { preT: 99 }).preT).toBe(40);
    expect(normalise('poolish', { preT: 'cold' }).preT).toBeNull();
  });

  it('keeps a valid planned start and drops junk', () => {
    expect(normalise('biga', { plan: '2026-10-10T17:00' }).plan).toBe('2026-10-10T17:00');
    expect(normalise('biga', { plan: 'tomorrow' }).plan).toBe('');
  });

  it('clamps junk and fills defaults', () => {
    const s = normalise('biga', { hyd: 999, balls: -3, flours: [{ name: 'x'.repeat(99), pct: 'a' }, { name: 'B', pct: 100 }], start: '2026-10-03T17:00', evil: 1 });
    expect(s.hyd).toBe(90);
    expect(s.balls).toBe(1);
    expect(s.flours[0].name).toHaveLength(40);
    expect(s.flours[0].pct).toBe(0);
    // Recipes no longer carry a start time: that belongs to a bake.
    expect((s as Record<string, unknown>).start).toBeUndefined();
    expect((s as Record<string, unknown>).evil).toBeUndefined();
  });

  it('fills the final dough share from the old single share', () => {
    const s = normalise('biga', { split: true, flours: [{ name: 'A', pct: 70 }, { name: 'B', pct: 30, fin: 100 }] });
    expect(s.split).toBe(true);
    expect(s.flours).toEqual([
      { name: 'A', pct: 70, fin: 70 },
      { name: 'B', pct: 30, fin: 100 },
    ]);
    expect(normalise('biga', {}).split).toBe(false);
  });

  it('makes a lone flour 100%', () => {
    expect(normalise('biga', { flours: [{ name: 'A', pct: 40, fin: 10 }] }).flours).toEqual([{ name: 'A', pct: 100, fin: 100 }]);
  });

  it('forces poolish hydration to 100%', () => {
    expect(normalise('poolish', { bh: 50 }).bh).toBe(100);
  });
});
