import type { Classic } from './toppings';

// Placeholder while the researched list is assembled.
export const CLASSICS: Classic[] = [
  {
    id: 'margherita',
    name: 'Margherita',
    italian: 'Pizza Margherita',
    base: 'red',
    era: 'classic',
    origin: 'Naples, 1889',
    blurb: 'Tomato, fior di latte, basil and olive oil.',
    tags: ['vegetarian', 'neapolitan'],
    items: [
      { name: 'San Marzano tomatoes, hand-crushed with salt', qty: 80, unit: 'g', when: 'base', note: '' },
      { name: 'Fior di latte, torn and drained', qty: 90, unit: 'g', when: 'top', note: '' },
      { name: 'Basil', qty: 4, unit: 'leaf', when: 'top', note: '' },
      { name: 'Extra-virgin olive oil', qty: 5, unit: 'g', when: 'finish', note: '' },
    ],
    steps: ['Spread the tomato.', 'Add the cheese and basil.', 'Bake, then drizzle with oil.'],
    tip: 'Drain the mozzarella.',
    sources: [],
  },
];

export const CLASSIC_BY_ID = new Map(CLASSICS.map((c) => [c.id, c]));
