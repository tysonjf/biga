import { describe, expect, it } from 'vitest';
import { calcFormula, switchMethod } from './formula';
import { parseRecipe } from './parseRecipe';
import { defaultFormula } from '../../shared/formula';

const REDDIT = `Sure:

90% Biga (24h cf)
900g Flour
2g Instant Yeast
450g water

Refresh: 77% total Hydro
(48h Cf) usually 24h

100g Flour
320g water
30g Salt
2g Instant Yeast

Stone: 450dc
90 Sec`;

describe('pasting a recipe', () => {
  it('reads a biga recipe from a forum: two stages, roles from the names, grams as given', () => {
    const p = parseRecipe(REDDIT)!;
    expect(p.method).toBe('amounts');
    expect(p.stages).toEqual(['Biga']);
    expect(p.ingredients.map((x) => [x.name, x.role, x.qty, x.stage])).toEqual([
      ['Flour', 'flour', 100, 0],
      ['Water', 'water', 320, 0],
      ['Salt', 'other', 30, 0],
      ['Instant Yeast', 'other', 2, 0],
      ['Flour', 'flour', 900, 1],
      ['Instant Yeast', 'other', 2, 1],
      ['Water', 'water', 450, 1],
    ]);
    expect(p.ingredients[1].unit).toBe('ml');
    expect(p.notes).toEqual(['Stone: 450dc · 90 Sec']);
    expect(p.warnings).toEqual([]);
  });

  it('switches that recipe to baker’s percentages: 90% biga flour, 77% hydration, 3% salt', () => {
    const p = parseRecipe(REDDIT)!;
    const f = { ...defaultFormula('pizza'), ...p, servings: 4 };
    const c = calcFormula(f);
    expect(c.total).toBe(1804);
    expect(c.hydration).toBeCloseTo(77, 9);
    const b = switchMethod(f, 'bakers')!;
    expect(b.ingredients.map((x) => x.qty)).toEqual([10, 32, 3, 0.2, 90, 0.2, 45]);
    const bc = calcFormula(b);
    expect(bc.hydration).toBeCloseTo(77, 9);
    expect(bc.stages[1].name).toBe('Biga');
    expect(bc.stages[1].total).toBeCloseTo((bc.flour * 135.2) / 100, 6);
  });

  it('takes the amount before or after the name, with or without a unit', () => {
    const p = parseRecipe(`Flour: 500 g\nWater – 325\nSalt 10g\n1 tsp sugar\n2 large eggs\n1.5 kg bread flour\n3 egg yolks\n250 ml milk`)!;
    expect(p.ingredients.map((x) => [x.name, x.qty, x.unit, x.per, x.role])).toEqual([
      ['Flour', 500, 'g', 1, 'flour'],
      ['Water', 325, 'ml', 1, 'water'],
      ['Salt', 10, 'g', 1, 'other'],
      ['Sugar', 5, 'ml', 1, 'other'],
      ['Eggs', 100, 'each', 50, 'other'],
      ['Bread flour', 1500, 'kg', 1, 'flour'],
      ['Egg yolks', 54, 'each', 18, 'other'],
      ['Milk', 257.5, 'ml', 1.03, 'other'],
    ]);
    expect(p.warnings[0]).toMatch(/Sugar: cups and spoons/);
  });

  it('reads a recipe in percentages as baker’s percentages', () => {
    const p = parseRecipe(`Tipo 00 80%\nWholemeal 20%\nWater 65%\nSalt 2.8%\nYeast 0.2%`)!;
    expect(p.method).toBe('bakers');
    expect(p.ingredients.map((x) => [x.name, x.role, x.qty])).toEqual([
      ['Tipo 00', 'flour', 80],
      ['Wholemeal', 'flour', 20],
      ['Water', 'water', 65],
      ['Salt', 'other', 2.8],
      ['Yeast', 'other', 0.2],
    ]);
  });

  it('names stages from their headings and keeps the main mix last by default', () => {
    const p = parseRecipe(`For the poolish:\n200g flour\n200g water\n0.2g yeast\n\nFor the dough:\n800g flour\n450g water\n20g salt`)!;
    expect(p.stages).toEqual(['Poolish']);
    expect(p.ingredients.filter((x) => x.stage === 1).map((x) => x.name)).toEqual(['Flour', 'Water', 'Yeast']);
    const q = parseRecipe(`Levain\n100g starter\n100g flour\n100g water\n\nSoaker\n50g seeds\n50g water\n\nDough\n800g flour`)!;
    expect(q.stages).toEqual(['Levain', 'Soaker']);
    expect(q.ingredients.find((x) => x.name === 'Seeds')!.stage).toBe(2);
  });

  it('warns when nothing is a flour, and gives up on text with no amounts', () => {
    expect(parseRecipe(`Mix everything.\nBake hot.`)).toBeNull();
    expect(parseRecipe(`300g cream\n50g sugar`)!.warnings[0]).toMatch(/No flour/);
    expect(parseRecipe(`200g corn flour\n300g rice flour`)!.ingredients.map((x) => x.role)).toEqual(['other', 'other']);
  });
});
