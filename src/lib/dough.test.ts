import { describe, expect, it } from 'vitest';
import { DEFAULTS, normalise, type Settings } from '../../shared/recipe';
import {
  bakeStatus,
  balance,
  blend,
  calc,
  clockChange,
  describeClockChange,
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

  it('asks for ice in a hot kitchen with a fast mixer', () => {
    const w = waterTemp({ ...base, preTemp: 28, flourT: 32, friction: 8, water: 150 })!;
    expect(w.water).toBeLessThan(2);
    expect(w.ice).toBeGreaterThan(0);
    expect(w.ice).toBeLessThanOrEqual(150);
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
