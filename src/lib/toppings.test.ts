import { describe, expect, it } from 'vitest';
import { normaliseTopping, TOPPING_LIMITS, WHENS } from '../../shared/topping';
import { CLASSICS } from './classics';
import { amount, fromClassic, matches, plural, summary } from './toppings';

const item = (qty: number, unit: string) => ({ qty, unit });

describe('amounts', () => {
  it('scales weights by the number of pizzas', () => {
    expect(amount(item(80, 'g'), 1)).toBe('80 g');
    expect(amount(item(80, 'g'), 3)).toBe('240 g');
    expect(amount(item(7.5, 'g'), 1)).toBe('7.5 g');
    expect(amount(item(12.5, 'g'), 2)).toBe('25 g');
  });

  it('writes counts and spoons in quarters', () => {
    expect(amount(item(0.5, 'tbsp'), 1)).toBe('½ tbsp');
    expect(amount(item(0.5, 'tbsp'), 3)).toBe('1½ tbsp');
    expect(amount(item(0.25, 'tsp'), 3)).toBe('¾ tsp');
    expect(amount(item(1, 'egg yolk'), 1)).toBe('1 egg yolk');
    expect(amount(item(1, 'egg yolk'), 2)).toBe('2 egg yolks');
  });

  it('pluralises only units it knows', () => {
    expect(plural('leaf', 4)).toBe('leaves');
    expect(plural('basil leaf', 2)).toBe('basil leaves');
    expect(plural('fillet', 1)).toBe('fillet');
    expect(plural('medium', 2)).toBe('medium');
    expect(amount(item(3, ''), 2)).toBe('6');
  });

  it('treats a missing amount as to taste', () => {
    expect(amount(item(0, 'pinch'), 4)).toBe('a pinch');
    expect(amount(item(0, ''), 1)).toBe('to taste');
    expect(amount(item(0, 'g'), 1)).toBe('to taste');
    expect(amount(item(0, 'drizzle'), 1)).toBe('a drizzle');
  });
});

describe('topping data', () => {
  it('normalises junk into a valid topping', () => {
    const d = normaliseTopping({ base: 'blue', items: [null, { name: 'Basil', qty: -3, when: 'later' }, 'x'], steps: ['a', 4], notes: 9 });
    expect(d.base).toBe('red');
    expect(d.items).toEqual([{ name: 'Basil', qty: 0, unit: '', when: 'top', note: '' }]);
    expect(d.steps).toEqual(['a']);
    expect(d.notes).toBe('');
  });

  it('caps lists and text at the limits', () => {
    const d = normaliseTopping({
      items: Array.from({ length: 50 }, () => ({ name: 'x'.repeat(200), qty: 1, unit: 'g', when: 'top' })),
      steps: Array.from({ length: 50 }, () => 'y'.repeat(900)),
    });
    expect(d.items).toHaveLength(TOPPING_LIMITS.items);
    expect(d.items[0].name).toHaveLength(TOPPING_LIMITS.itemName);
    expect(d.steps).toHaveLength(TOPPING_LIMITS.steps);
    expect(d.steps[0]).toHaveLength(TOPPING_LIMITS.step);
  });

  it('summarises the main ingredients without salt and oil', () => {
    const s = summary([
      { name: 'San Marzano tomatoes, crushed', qty: 80, unit: 'g', when: 'base', note: '' },
      { name: 'Fine sea salt', qty: 1, unit: 'g', when: 'base', note: '' },
      { name: 'Fior di latte (drained)', qty: 90, unit: 'g', when: 'top', note: '' },
      { name: 'Extra-virgin olive oil', qty: 5, unit: 'g', when: 'finish', note: '' },
    ]);
    expect(s).toBe('San Marzano tomatoes · Fior di latte');
  });

  it('leads with what sets a pizza apart', () => {
    const s = summary([
      { name: 'Peeled San Marzano tomatoes, hand-crushed', qty: 75, unit: 'g', when: 'base', note: '' },
      { name: 'Fior di latte, drained', qty: 80, unit: 'g', when: 'top', note: '' },
      { name: 'Salame piccante (Napoli), sliced', qty: 45, unit: 'g', when: 'top', note: '' },
      { name: 'Fresh basil', qty: 3, unit: 'leaf', when: 'top', note: '' },
      { name: 'chilli oil', qty: 3, unit: 'g', when: 'finish', note: '' },
    ]);
    expect(s).toBe('Salame piccante · Chilli oil');
  });

  it('searches names and ingredients, ignoring accents and case', () => {
    const t = { name: 'Patate e Rosmarino', items: [{ name: 'Yukon Gold potato', qty: 1, unit: '', when: 'top' as const, note: '' }] };
    expect(matches('potato', t)).toBe(true);
    expect(matches('ROSMARINO patate', t)).toBe(true);
    expect(matches('tomato', t)).toBe(false);
    expect(matches('', t)).toBe(true);
  });
});

describe('the built-in toppings', () => {
  it('have unique ids, at least one ingredient and step, and valid stages', () => {
    const ids = new Set<string>();
    for (const c of CLASSICS) {
      expect(ids.has(c.id), c.id).toBe(false);
      ids.add(c.id);
      expect(c.id).toMatch(/^[a-z0-9-]+$/);
      expect(c.items.length, c.id).toBeGreaterThan(0);
      expect(c.steps.length, c.id).toBeGreaterThan(0);
      for (const i of c.items) expect(WHENS, `${c.id}: ${i.name}`).toContain(i.when);
    }
  });

  it('survive being copied into your own toppings unchanged', () => {
    for (const c of CLASSICS) {
      const d = fromClassic(c);
      expect(normaliseTopping(d), c.id).toEqual(d);
    }
  });
});
