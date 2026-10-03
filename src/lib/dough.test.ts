import { describe, expect, it } from 'vitest';
import { DEFAULTS, normalise, type Settings } from '../../shared/recipe';
import { balance, blend, calc, MODELS, rebalance, roomFactor, timeline, waterTemp } from './dough';

const biga = (o: Partial<Settings> = {}) => ({ ...structuredClone(DEFAULTS.biga), ...o });
const poolish = (o: Partial<Settings> = {}) => ({ ...structuredClone(DEFAULTS.poolish), ...o });

describe('yeast models', () => {
  it('keeps the original biga chart: 0.3% at 18 °C for 16 h', () => {
    expect(MODELS.biga.idy(18, 16)).toBeCloseTo(0.3, 6);
    expect(MODELS.biga.idy(26, 16)).toBeCloseTo(0.15, 6); // halves every 8 °C
  });

  it('poolish needs roughly a third of the biga dose for the same time and temperature', () => {
    expect(MODELS.poolish.idy(18, 16)).toBeCloseTo(0.1, 6);
    const ratio = MODELS.poolish.idy(20, 16) / MODELS.biga.idy(20, 16);
    expect(ratio).toBeGreaterThan(0.25);
    expect(ratio).toBeLessThan(0.45);
  });

  it('matches published poolish schedules within their spread', () => {
    // Weekend Bakery ~0.3% for 8 h at ~20 °C; Hamelman ~0.067% for 12–16 h at ~21 °C
    expect(MODELS.poolish.idy(20, 8)).toBeGreaterThan(0.15);
    expect(MODELS.poolish.idy(20, 8)).toBeLessThan(0.35);
    expect(MODELS.poolish.idy(21, 14)).toBeGreaterThan(0.06);
    expect(MODELS.poolish.idy(21, 14)).toBeLessThan(0.13);
  });
});

describe('recipe maths', () => {
  it('adds up to the requested dough weight', () => {
    const s = biga();
    const c = calc('biga', s);
    const sum = c.pre.total + c.final.flour + c.final.water + c.final.salt + c.final.oil + c.final.yeast;
    expect(sum).toBeCloseTo(c.dough, 6);
    expect(c.dough).toBeCloseTo(4 * 280 * 1.02, 6);
    expect(c.water / c.flour).toBeCloseTo(0.72, 6);
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
    const t = timeline('poolish', poolish({ fridge: true, fridgeRest: 60, fridgeH: 16, temper: 120 }), start);
    expect(t.steps.map((s) => s.key)).toEqual(['start', 'ready', 'ball', 'fridge', 'out', 'bake']);
    expect((t.bake.getTime() - start.getTime()) / 3_600_000).toBeCloseTo(16 + 0.5 + 0.5 + 1 + 16 + 2, 6);
  });
});

describe('normalise', () => {
  it('clamps junk and fills defaults', () => {
    const s = normalise('biga', { hyd: 999, balls: -3, flours: [{ name: 'x'.repeat(99), pct: 'a' }, { name: 'B', pct: 100 }], start: 'nope', evil: 1 });
    expect(s.hyd).toBe(90);
    expect(s.balls).toBe(1);
    expect(s.flours[0].name).toHaveLength(40);
    expect(s.flours[0].pct).toBe(0);
    expect(s.start).toBe('');
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
