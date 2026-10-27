import { describe, expect, it } from 'vitest';
import { CATEGORIES, defaultFormula, EGG_G, normaliseFormula, STARTERS, type Formula, type Ingredient } from '../../shared/formula';
import { approxCount, calcFormula, equivalent, formulaStages, formulaSummary, formulaVars, multiplier, stepFor, stepMeta, switchMethod } from './formula';

const ing = (name: string, qty: number, o: Partial<Ingredient> = {}): Ingredient => ({ name, qty, role: 'other', unit: 'g', per: 1, optional: false, stage: 0, ...o });
const flour = (name: string, qty: number, o: Partial<Ingredient> = {}) => ing(name, qty, { role: 'flour', ...o });
const water = (qty: number) => ing('Water', qty, { role: 'water', unit: 'ml' });

const bakers = (o: Partial<Formula> = {}): Formula => ({ ...defaultFormula('pizza'), waste: 0, ...o });
const amounts = (o: Partial<Formula> = {}): Formula => ({ ...defaultFormula('cake'), ...o });

const sum = (xs: number[]) => xs.reduce((a, v) => a + v, 0);

describe('baker’s percentages', () => {
  it('makes the flours 100% and everything else a share of them, adding up to the dough', () => {
    const f = bakers({ balls: 4, bw: 275, ingredients: [flour('Tipo 00', 100), water(73), ing('Salt', 2.5), ing('Yeast', 0.08), ing('Olive oil', 2)] });
    const c = calcFormula(f);
    expect(c.total).toBe(1100);
    expect(c.flour).toBeCloseTo(1100 / 1.7758, 6);
    expect(c.rows[1].grams).toBeCloseTo(c.flour * 0.73, 9);
    expect(c.rows[2].grams).toBeCloseTo(c.flour * 0.025, 9);
    expect(c.rows[3].grams).toBeCloseTo(c.flour * 0.0008, 9);
    expect(sum(c.rows.map((r) => r.grams))).toBeCloseTo(c.total, 9);
    expect(c.hydration).toBeCloseTo(73, 9);
    expect(c.portion).toBe(275);
    expect(c.warnings).toEqual([]);
  });

  it('matches the old manual recipe: 626 g flour, 457 g water, 15.7 g salt, 0.5 g yeast', () => {
    const c = calcFormula(bakers({ balls: 4, bw: 275, ingredients: [flour('Flour', 100), water(73), ing('Salt', 2.5), ing('Yeast', 0.08)] }));
    expect(c.flour).toBeCloseTo(626.49, 1);
    expect(c.rows[1].grams).toBeCloseTo(457.34, 1);
    expect(c.rows[2].grams).toBeCloseTo(15.66, 1);
    expect(c.rows[3].grams).toBeCloseTo(0.5, 1);
  });

  it('counts the waste in the dough and keeps decimals', () => {
    const c = calcFormula(bakers({ balls: 3, bw: 250, waste: 2.5, ingredients: [flour('Flour', 100), water(62.5), ing('Salt', 2.75)] }));
    expect(c.total).toBeCloseTo(768.75, 9);
    expect(c.flour).toBeCloseTo(768.75 / 1.6525, 9);
    expect(c.rows[2].pct).toBeCloseTo(2.75, 9);
  });

  it('splits several flours by their shares, and scales shares that don’t add up', () => {
    const c = calcFormula(bakers({ ingredients: [flour('Tipo 00', 80), flour('Wholemeal', 20), water(70)] }));
    expect(c.rows[0].grams / c.flour).toBeCloseTo(0.8, 9);
    expect(c.rows[1].grams / c.flour).toBeCloseTo(0.2, 9);
    expect(c.warnings).toEqual([]);
    const off = calcFormula(bakers({ ingredients: [flour('A', 60), flour('B', 60), water(70)] }));
    expect(off.rows[0].grams / off.flour).toBeCloseTo(0.5, 9);
    expect(off.flour + off.rows[2].grams).toBeCloseTo(off.total, 9);
    expect(off.warnings[0]).toMatch(/add up to 120%/);
  });

  it('takes an enriched dough: eggs, milk and butter are just percentages', () => {
    const f = bakers({ category: 'enriched', balls: 12, bw: 70, ingredients: [flour('Bread flour', 100), ing('Milk', 30, { unit: 'ml', per: 1.03 }), ing('Eggs', 7, { unit: 'each', per: EGG_G }), ing('Butter', 40), ing('Sugar', 12), ing('Salt', 2), ing('Yeast', 1.2)] });
    const c = calcFormula(f);
    const eggs = c.rows[2];
    expect(eggs.grams).toBeCloseTo(c.flour * 0.07, 9);
    // Never rounded to whole eggs: the grams stand, the egg count is a hint.
    expect(eggs.grams).not.toBe(Math.round(eggs.grams / EGG_G) * EGG_G);
    expect(eggs.equiv).toMatch(/^≈ .* egg/);
    expect(sum(c.rows.map((r) => r.grams))).toBeCloseTo(c.total, 9);
    expect(c.hydration).toBeNull(); // milk isn't water
    expect(c.mixWater).toBeNull();
  });

  it('warns without a flour, and gives no grams to divide by', () => {
    const c = calcFormula(bakers({ ingredients: [water(70), ing('Salt', 2)] }));
    expect(c.flour).toBe(0);
    expect(c.rows.every((r) => r.grams === 0)).toBe(true);
    expect(c.warnings[0]).toMatch(/mark one ingredient as the flour/);
  });

  it('lets water, salt and yeast be removed, renamed or set to 0% like anything else', () => {
    const c = calcFormula(bakers({ balls: 1, bw: 500, ingredients: [flour('Flour', 100), ing('Acqua', 0, { role: 'water' }), ing('Salt', 0)] }));
    expect(c.flour).toBe(500);
    expect(c.rows[1].grams).toBe(0);
    expect(c.hydration).toBeNull();
    const dry = calcFormula(bakers({ balls: 1, bw: 500, ingredients: [flour('Flour', 100)] }));
    expect(dry.flour).toBe(500);
    expect(dry.warnings).toEqual([]);
  });

  it('groups a levain as its own stage, with its flour inside the 100%', () => {
    const f = bakers({
      category: 'bread',
      balls: 2,
      bw: 900,
      stages: ['Levain'],
      ingredients: [flour('Bread flour', 80), flour('Bread flour', 20, { stage: 1 }), water(55), ing('Water', 20, { role: 'water', stage: 1 }), ing('Salt', 2)],
    });
    const c = calcFormula(f);
    expect(c.flour).toBeCloseTo(1800 / 1.77, 9);
    expect(c.hydration).toBeCloseTo(75, 9);
    expect(c.stages.map((s) => s.name)).toEqual(['', 'Levain']);
    expect(c.stages[1].total).toBeCloseTo(c.flour * 0.4, 9);
    expect(c.stages[0].total + c.stages[1].total).toBeCloseTo(c.total, 9);
    const view = formulaStages(f, c);
    expect(view[0].title).toBe('Final dough');
    expect(view[1].title).toBe('Levain');
    expect(view[1].items.at(-1)).toMatchObject({ n: 'Total levain', sum: true });
  });

  it('works out the water temperature and the 60% split for a pizza dough', () => {
    const c = calcFormula(bakers({ ingredients: [flour('Flour', 100), water(70), ing('Salt', 2.8)] }));
    expect(c.mixWater).not.toBeNull();
    expect(c.holdBack!.first + c.holdBack!.rest).toBe(Math.round(c.water));
    // Not for a cake, and not without water.
    expect(calcFormula(amounts()).mixWater).toBeNull();
    expect(calcFormula(bakers({ ingredients: [flour('Flour', 100)] })).mixWater).toBeNull();
  });
});

describe('amounts', () => {
  const cake = amounts({ servings: 10, ingredients: [ing('Butter', 225), ing('Sugar', 225), ing('Eggs', 200, { unit: 'each', per: 50 }), flour('Flour', 225), ing('Baking powder', 5)] });

  it('scales by a multiplier', () => {
    const c = calcFormula({ ...cake, scale: 'x', x: 1.5 });
    expect(c.mult).toBe(1.5);
    expect(c.base).toBe(880);
    expect(c.total).toBe(1320);
    expect(c.rows[2].grams).toBe(300);
    expect(c.rows[2].equiv).toBe('≈ 6 eggs (50 g each)');
    expect(c.portions).toBe(15);
    expect(c.portion).toBe(88);
  });

  it('scales to a number of servings', () => {
    const c = calcFormula({ ...cake, scale: 'servings', want: 12 });
    expect(c.mult).toBeCloseTo(1.2, 9);
    expect(c.rows[0].grams).toBeCloseTo(270, 9);
    expect(c.rows[2].grams).toBeCloseTo(240, 9);
    expect(c.rows[2].equiv).toBe('≈ 4¾ eggs (50 g each)');
  });

  it('scales to a batch weight', () => {
    const c = calcFormula({ ...cake, scale: 'weight', batch: 1100 });
    expect(c.total).toBeCloseTo(1100, 9);
    expect(sum(c.rows.map((r) => r.grams))).toBeCloseTo(1100, 9);
    expect(multiplier({ ...cake, scale: 'weight', batch: 1100 }, 880)).toBeCloseTo(1.25, 9);
  });

  it('shows baker’s percentages beside the amounts when there’s a flour', () => {
    const c = calcFormula(cake);
    expect(c.rows[0].pct).toBeCloseTo(100, 9); // butter = flour in a pound cake
    expect(c.rows[2].pct).toBeCloseTo((200 / 225) * 100, 9);
    expect(calcFormula(amounts({ ingredients: [ing('Cream', 300), ing('Sugar', 50)] })).rows[0].pct).toBeNull();
  });

  it('stays safe with nothing to divide by', () => {
    expect(calcFormula(amounts({ ingredients: [], scale: 'weight', batch: 500 })).total).toBe(0);
    expect(calcFormula(amounts({ ingredients: [], servings: 0, scale: 'servings', want: 4 } as Partial<Formula>)).mult).toBe(1);
  });
});

describe('reading amounts', () => {
  it('rounds whole items to a quarter or a third', () => {
    expect(approxCount(0.68)).toBe('⅔');
    expect(approxCount(0.5)).toBe('½');
    expect(approxCount(0.3)).toBe('⅓');
    expect(approxCount(0.05)).toBe('< ¼');
    expect(approxCount(0.9)).toBe('1');
    expect(approxCount(1.5)).toBe('1½');
    expect(approxCount(2.2)).toBe('2¼');
    expect(approxCount(3)).toBe('3');
  });

  it('gives the egg equivalent as a hint, from the assumed egg weight', () => {
    expect(equivalent(34, 'each', 50, 'Eggs')).toBe('≈ ⅔ egg (50 g each)');
    expect(equivalent(34, 'each', 55, 'Egg, whole')).toBe('≈ ⅔ egg (55 g each)');
    expect(equivalent(100, 'each', 50, 'Eggs')).toBe('≈ 2 eggs (50 g each)');
    expect(equivalent(36, 'each', 18, 'Egg yolks')).toBe('≈ 2 eggs (18 g each)');
    expect(equivalent(75, 'each', 30, 'Dates')).toBe('≈ 2½ × 30 g');
  });

  it('converts volumes by density and kilos by a thousand, never assuming a ml is a gram', () => {
    expect(equivalent(250, 'ml', 1, 'Water')).toBe('≈ 250 ml');
    expect(equivalent(46, 'ml', 0.92, 'Olive oil')).toBe('≈ 50 ml');
    expect(equivalent(1030, 'l', 1.03, 'Milk')).toBe('≈ 1 l');
    expect(equivalent(1250, 'kg', 1, 'Flour')).toBe('1.25 kg');
    expect(equivalent(50, 'kg', 1, 'Flour')).toBeNull();
    expect(equivalent(500, 'g', 1, 'Flour')).toBeNull();
    expect(equivalent(0, 'each', 50, 'Eggs')).toBeNull();
  });

  it('describes a step’s time and temperature in both scales', () => {
    expect(stepMeta({ text: '', min: 120, tempC: 24, note: '' })).toBe('2 h at 24 °C (75 °F)');
    expect(stepMeta({ text: '', min: 0, tempC: 180, note: '' })).toBe('180 °C (356 °F)');
    expect(stepMeta({ text: '', min: 45, tempC: null, note: '' })).toBe('45 min');
    expect(stepMeta({ text: '', min: 0, tempC: null, note: '' })).toBe('');
  });

  it('summarises a recipe in a line', () => {
    const f = bakers({ balls: 4, bw: 260, ingredients: [flour('Flour', 100), water(65), ing('Salt', 2.8)] });
    expect(formulaSummary(f, calcFormula(f))).toBe('4 × 260 g · 65% hydration · 1040 g');
    const c = amounts({ servings: 10, scale: 'x', x: 1.5, ingredients: [ing('Butter', 225), ing('Sugar', 225)] });
    expect(formulaSummary(c, calcFormula(c))).toBe('× 1.5 · 15 servings · 675 g');
  });

  it('names the amounts for sums: flour, water, dough, portions and each ingredient', () => {
    const f = bakers({ balls: 4, bw: 250, ingredients: [flour('Tipo 00', 100), water(60), ing('Fine sea salt', 2), ing('Olive oil', 3)] });
    const vars = Object.fromEntries(formulaVars(calcFormula(f)).map((v) => [v.name, v.value]));
    expect(vars.dough).toBe(1000);
    expect(vars.flour).toBe(Math.round(1000 / 1.65));
    expect(vars.water).toBe(Math.round((1000 / 1.65) * 0.6));
    expect(vars.portions).toBe(4);
    expect(vars.balls).toBe(4);
    expect(vars.hydration).toBe(60);
    expect(vars.fine).toBe(Math.round((1000 / 1.65) * 0.02));
    expect(vars.olive).toBe(Math.round((1000 / 1.65) * 0.03));
    expect(vars.tipo).toBe(Math.round(1000 / 1.65)); // a flour by name too
  });
});

describe('switching between percentages and amounts', () => {
  it('keeps the grams when going to amounts, and the ratios when coming back', () => {
    const f = bakers({ balls: 4, bw: 260, ingredients: [flour('Flour', 100), water(65), ing('Salt', 2.8), ing('Eggs', 7, { unit: 'each', per: 50 })] });
    const before = calcFormula(f);
    const a = switchMethod(f, 'amounts')!;
    expect(a.method).toBe('amounts');
    expect(a.servings).toBe(4);
    expect(a.x).toBe(1);
    const mid = calcFormula(a);
    mid.rows.forEach((r, i) => expect(r.grams).toBeCloseTo(before.rows[i].grams, 1));
    const b = switchMethod(a, 'bakers')!;
    expect(b.method).toBe('bakers');
    expect(b.balls).toBe(4);
    expect(b.bw).toBe(260);
    expect(b.ingredients.map((x) => x.qty)).toEqual([100, 65, 2.8, 7]);
    expect(switchMethod(f, 'bakers')).toBe(f);
  });

  it('refuses to go to percentages without a flour', () => {
    expect(switchMethod(amounts({ ingredients: [ing('Cream', 300)] }), 'bakers')).toBeNull();
  });

  it('steps finely for a pinch and coarsely for a kilo', () => {
    expect(stepFor(0.1, 'bakers', 'other')).toBe(0.05);
    expect(stepFor(2.8, 'bakers', 'other')).toBe(0.1);
    expect(stepFor(65, 'bakers', 'other')).toBe(5);
    expect(stepFor(50, 'bakers', 'flour')).toBe(5);
    expect(stepFor(5, 'amounts', 'other')).toBe(0.5);
    expect(stepFor(225, 'amounts', 'other')).toBe(10);
  });
});

describe('storing a general recipe', () => {
  it('starts every category from a sound recipe', () => {
    for (const cat of CATEGORIES) {
      const f = defaultFormula(cat);
      const c = calcFormula(f);
      expect(normaliseFormula(f)).toEqual(f);
      expect(c.warnings.filter((w) => !/Add the ingredients/.test(w))).toEqual([]);
      if (f.method === 'bakers') expect(sum(f.ingredients.filter((x) => x.role === 'flour').map((x) => x.qty))).toBe(100);
      expect(sum(c.rows.map((r) => r.grams))).toBeCloseTo(c.total, 9);
    }
    expect(STARTERS.cake.method).toBe('amounts');
    expect(STARTERS.enriched.ingredients.find((x) => x.name === 'Eggs')).toMatchObject({ unit: 'each', per: EGG_G });
  });

  it('converts a manual recipe from before: flours, hydration, salt, yeast and extras become ingredients', () => {
    const old = { balls: 4, bw: 275, waste: 0, hyd: 73, salt: 2.5, idy: 0.08, extras: [{ name: 'Olive oil', pct: 2 }], flours: [{ name: 'Caputo', pct: 100, fin: 100 }], ddt: 24, room: 22, flourT: 20, friction: 2 };
    const f = normaliseFormula(old);
    expect(f.category).toBe('pizza');
    expect(f.method).toBe('bakers');
    expect(f.ingredients.map((x) => [x.name, x.role, x.qty])).toEqual([
      ['Caputo', 'flour', 100],
      ['Water', 'water', 73],
      ['Salt', 'other', 2.5],
      ['Yeast', 'other', 0.08],
      ['Olive oil', 'other', 2],
    ]);
    expect(f).toMatchObject({ balls: 4, bw: 275, waste: 0, ddt: 24, room: 22, flourT: 20, friction: 2 });
    // The same numbers as the old calculator gave.
    const c = calcFormula(f);
    expect(c.flour).toBeCloseTo(1100 / 1.7758, 6);
    expect(c.rows[1].grams).toBeCloseTo(c.flour * 0.73, 9);
    // Two flours keep their shares.
    expect(normaliseFormula({ flours: [{ name: 'A', pct: 80 }, { name: 'B', pct: 20 }] }).ingredients.slice(0, 2).map((x) => x.qty)).toEqual([80, 20]);
    // An old manual recipe with nothing stored is the old default.
    expect(normaliseFormula({}).ingredients.map((x) => [x.name, x.qty])).toEqual([
      ['Tipo 00', 100],
      ['Water', 70],
      ['Salt', 2.8],
      ['Yeast', 0.1],
    ]);
  });

  it('keeps what fits and drops what doesn’t', () => {
    const f = normaliseFormula({
      category: 'enriched',
      method: 'amounts',
      stages: ['Levain', 42, 'x'.repeat(99)],
      ingredients: [
        { name: 'Eggs', qty: 150, unit: 'each' },
        { name: 'x'.repeat(99), qty: -5, role: 'flour', unit: 'bucket', per: 0, stage: 9, optional: true },
        'junk',
        { qty: 1e9 },
      ],
      steps: [{ text: 'Mix', min: 1e6, tempC: 9999, note: 7 }, 'junk', { tempC: -5 }],
      scale: 'weight',
      balls: 0,
      bw: 1e6,
      x: 0.01,
      batch: 'big',
    });
    expect(f.category).toBe('enriched');
    expect(f.method).toBe('amounts');
    expect(f.stages).toEqual(['Levain', 'x'.repeat(30)]);
    expect(f.ingredients).toEqual([
      { name: 'Eggs', qty: 150, role: 'other', unit: 'each', per: EGG_G, optional: false, stage: 0 },
      { name: 'x'.repeat(40), qty: 0, role: 'flour', unit: 'g', per: 1, optional: true, stage: 2 },
      { name: 'Ingredient', qty: 100_000, role: 'other', unit: 'g', per: 1, optional: false, stage: 0 },
    ]);
    expect(f.steps).toEqual([
      { text: 'Mix', min: 5760, tempC: 320, note: '' },
      { text: '', min: 0, tempC: -5, note: '' },
    ]);
    expect(f.scale).toBe('weight');
    expect(f).toMatchObject({ balls: 1, bw: 5000, x: 0.1, batch: 1000 });
    // Percentages are capped too.
    expect(normaliseFormula({ method: 'bakers', ingredients: [{ name: 'Sugar', qty: 5000 }] }).ingredients[0].qty).toBe(1000);
  });
});

describe('into a dough recipe', () => {
  const reddit = (): Formula => ({
    ...defaultFormula('pizza'),
    method: 'amounts',
    servings: 6,
    stages: ['Biga'],
    ingredients: [flour('Flour', 100), water(320), ing('Salt', 30), ing('Instant Yeast', 2), flour('Flour', 900, { stage: 1 }), ing('Instant Yeast', 2, { stage: 1 }), { ...water(450), stage: 1 }],
  });

  it('turns a biga recipe in grams into a biga recipe with a schedule: 90% share, 50% hydration, 77% overall', async () => {
    const { toDough } = await import('./formula');
    const f = reddit();
    const r = toDough(f, calcFormula(f))!;
    expect(r.kind).toBe('biga');
    expect(r.settings).toMatchObject({ bp: 90, bh: 50, hyd: 77, salt: 3, oil: 0, sugar: 0, balls: 6, bw: 301, waste: 0, split: false });
    expect(r.settings.flours).toEqual([{ name: 'Flour', pct: 100, fin: 100 }]);
    expect(r.dropped).toEqual([]);
    // The original's yeast is kept, set by hand: 2 g in 900 g of biga flour, 2 g in 1000 g of flour.
    expect(r.settings.yeast).toBe('manual');
    expect(r.settings.idy).toBeCloseTo(0.222, 3);
    expect(r.settings.fy).toBeCloseTo(0.2, 6);
    expect(r.notes[0]).toMatch(/yeast is the original's \(4.0 g\), set by hand/);
  });

  it('knows a poolish by its hydration, a direct dough by having no preferment, and keeps the flours per stage', async () => {
    const { toDough } = await import('./formula');
    const poolish = { ...reddit(), ingredients: [flour('Tipo 00', 700), water(250), ing('Salt', 25), flour('Manitoba', 300, { stage: 1 }), { ...water(300), stage: 1 }, ing('Oil', 20), ing('Milk', 50)] };
    const p = toDough(poolish, calcFormula(poolish))!;
    expect(p.kind).toBe('poolish');
    expect(p.settings).toMatchObject({ bp: 30, bh: 100, hyd: 55, salt: 2.5, oil: 2, split: true });
    expect(p.settings.flours).toEqual([
      { name: 'Tipo 00', pct: 0, fin: 100 },
      { name: 'Manitoba', pct: 100, fin: 0 },
    ]);
    expect(p.dropped).toEqual(['Milk 50 g']);
    const direct = { ...reddit(), stages: [], ingredients: [flour('Flour', 1000), water(650), ing('Salt', 28), ing('Sugar', 10)] };
    const dr = toDough(direct, calcFormula(direct))!;
    expect(dr.kind).toBe('direct');
    expect(dr.settings).toMatchObject({ hyd: 65, salt: 2.8, sugar: 1, yeast: 'chart' });
  });

  it('gives up with no flour or two preferments', async () => {
    const { toDough } = await import('./formula');
    const none = { ...reddit(), ingredients: [water(300)] };
    expect(toDough(none, calcFormula(none))).toBeNull();
    const two = { ...reddit(), stages: ['Biga', 'Poolish'], ingredients: [flour('A', 500), water(300), flour('B', 300, { stage: 1 }), { ...water(150), stage: 1 }, flour('C', 200, { stage: 2 }), { ...water(200), stage: 2 }] };
    expect(toDough(two, calcFormula(two))).toBeNull();
  });
});
