import { describe, expect, it } from 'vitest';
import { DEFAULTS, normalise, type Settings } from '../../shared/recipe';
import { calc, MODELS, roomFactor, timeline, waterTemp } from './dough';

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
    const s = normalise('biga', { hyd: 999, balls: -3, flours: [{ name: 'x'.repeat(99), pct: 'a' }], start: 'nope', evil: 1 });
    expect(s.hyd).toBe(90);
    expect(s.balls).toBe(1);
    expect(s.flours[0].name).toHaveLength(40);
    expect(s.flours[0].pct).toBe(0);
    expect(s.start).toBe('');
    expect((s as Record<string, unknown>).evil).toBeUndefined();
  });

  it('forces poolish hydration to 100%', () => {
    expect(normalise('poolish', { bh: 50 }).bh).toBe(100);
  });
});
