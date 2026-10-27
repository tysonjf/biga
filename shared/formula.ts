// A general recipe (the 'manual' kind), shared by the Worker (validation) and the app (editing + maths).
//
// It's one list of ingredients, worked out one of two ways:
// - baker's percentages: each ingredient is a % of the total flour (the flours together are 100%), and
//   the amounts follow from the dough's size: portions × weight per portion, plus waste;
// - amounts: each ingredient is a weight for one batch, scaled by a multiplier, a number of servings
//   or a target batch weight.
// Every amount is a weight in grams inside. Eggs are grams of egg, without the shell: the recipe says
// 34 g, and "about ⅔ egg" is only a hint. An ingredient can prefer another unit for reading (ml,
// litres, kg, or whole items), with how many grams one of that unit weighs.

/** What a recipe is for. It sets the starting ingredients, the yield's wording and the step template. */
export type Category = 'pizza' | 'bread' | 'enriched' | 'pastry' | 'cake' | 'other';
export const CATEGORIES: Category[] = ['pizza', 'bread', 'enriched', 'pastry', 'cake', 'other'];
export const CATEGORY_NAME: Record<Category, string> = {
  pizza: 'Pizza',
  bread: 'Bread',
  enriched: 'Enriched',
  pastry: 'Pastry',
  cake: 'Cake',
  other: 'Recipe',
};
export const CATEGORY_BLURB: Record<Category, string> = {
  pizza: 'Your own ratios: flours, water, salt, yeast and anything else as a % of the flour.',
  bread: 'Loaves and sourdough in baker’s percentages, with a levain or preferment as its own stage.',
  enriched: 'Brioche, maritozzi, cinnamon rolls: eggs, butter, milk and sugar as a % of the flour.',
  pastry: 'Shortcrust, sweet pastry and the like, in baker’s percentages.',
  cake: 'Cakes and bakes by weight, scaled by a multiplier, servings or batch weight.',
  other: 'Anything else by weight: enter the amounts and scale them.',
};
/** What a new recipe of each category is called, after its starting ingredients. */
export const STARTER_NAME: Record<Category, string> = {
  pizza: 'Pizza dough',
  bread: 'Bread',
  enriched: 'Brioche',
  pastry: 'Sweet pastry',
  cake: 'Pound cake',
  other: 'New recipe',
};
/** The categories that are doughs: they get a dough-temperature card and a hydration figure. */
export const DOUGH_CATEGORIES: Category[] = ['pizza', 'bread', 'enriched'];

/** How the amounts are worked out. */
export type Method = 'bakers' | 'amounts';
export const METHODS: Method[] = ['bakers', 'amounts'];

/** How to read an amount. It's always stored in grams; `per` says what one of the unit weighs. */
export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'each';
export const UNITS: Unit[] = ['g', 'kg', 'ml', 'l', 'each'];
export const UNIT_NAME: Record<Unit, string> = { g: 'g', kg: 'kg', ml: 'ml', l: 'litres', each: 'items' };

/** A flour counts toward the 100%; water counts toward the hydration and the water temperature. */
export type Role = 'flour' | 'water' | 'other';
export const ROLES: Role[] = ['flour', 'water', 'other'];

/** Grams per whole egg, without the shell: a large egg is 50–55 g. */
export const EGG_G = 50;

// What a name says an ingredient is. The app follows the name unless you've set the role yourself.
const FLOUR_RE = /\b(flour|farina|semola|semolina|wholemeal|whole[- ]?wheat|rye|spelt|einkorn|manitoba|tipo\s*0{1,2}|00|caputo|durum|khorasan|kamut|bread flour|strong)\b/i;
const NOT_FLOUR_RE = /\b(corn|rice|potato|tapioca|chickpea|almond|coconut|arrowroot)\s*flour\b|\bflour\s*(tortilla|dust)/i;
const WATER_RE = /^(ice[d]? |cold |warm |lukewarm |tepid |hot |filtered )?(water|acqua|eau|wasser|agua|h2o)\b/i;
/** The role a name implies: "Tipo 00" is a flour, "Water" is water, anything else is other. */
export function guessRole(name: string): Role {
  if (WATER_RE.test(name.trim())) return 'water';
  if (FLOUR_RE.test(name) && !NOT_FLOUR_RE.test(name)) return 'flour';
  return 'other';
}

export type Ingredient = {
  name: string;
  role: Role;
  /** Baker's percentages: % of the total flour (a flour's share of the flour). Amounts: grams in the base recipe. */
  qty: number;
  unit: Unit;
  /** Grams in one of the unit: g per ml (water 1, oil 0.92) or g per item (an egg 50). Unused for g and kg. */
  per: number;
  optional: boolean;
  /** Which part of the recipe it goes in: 0 = the main mix, 1… = `stages[n − 1]`. */
  stage: number;
};

/** One step of the method. Times are minutes (0 = none); temperatures °C (null = none). */
export type Step = { text: string; min: number; tempC: number | null; note: string };

/** Amounts: scale by a multiplier, to a number of servings, or to a batch weight. */
export type Scale = 'x' | 'servings' | 'weight';
export const SCALES: Scale[] = ['x', 'servings', 'weight'];

export type Formula = {
  category: Category;
  method: Method;
  ingredients: Ingredient[];
  /** Other parts of the recipe (a levain, a tangzhong, a filling). The main mix is always there. */
  stages: string[];
  // Baker's percentages: the dough's size.
  balls: number; // portions
  bw: number; // grams per portion
  waste: number; // % extra for bowl and bench loss
  // Amounts: what the base amounts make, and how they're scaled.
  servings: number; // servings the base amounts make
  scale: Scale;
  x: number; // multiplier
  want: number; // servings wanted
  batch: number; // batch weight wanted, g
  // Dough temperature (doughs only).
  ddt: number; // target dough temperature after mixing, °C
  room: number; // °C
  flourT: number; // °C
  friction: number; // temperature rise from mixing, °C
  steps: Step[];
};

export type FNumKey = { [K in keyof Formula]: Formula[K] extends number ? K : never }[keyof Formula];
export type FField = { label: string; unit: string; step: number; min: number; max: number; dec: number };

export const F_FIELDS: Record<FNumKey, FField> = {
  balls: { label: 'Portions', unit: '', step: 1, min: 1, max: 200, dec: 0 },
  bw: { label: 'Each', unit: 'g', step: 5, min: 5, max: 5000, dec: 0 },
  waste: { label: 'Waste', unit: '%', step: 0.5, min: 0, max: 25, dec: 1 },
  servings: { label: 'Makes', unit: '', step: 1, min: 1, max: 500, dec: 0 },
  x: { label: 'Multiplier', unit: '×', step: 0.25, min: 0.1, max: 50, dec: 2 },
  want: { label: 'Want', unit: '', step: 1, min: 1, max: 500, dec: 0 },
  batch: { label: 'Batch weight', unit: 'g', step: 50, min: 50, max: 100_000, dec: 0 },
  ddt: { label: 'Target dough', unit: '°C', step: 0.5, min: 16, max: 32, dec: 1 },
  room: { label: 'Room', unit: '°C', step: 1, min: 5, max: 40, dec: 0 },
  flourT: { label: 'Flour', unit: '°C', step: 1, min: -5, max: 40, dec: 0 },
  friction: { label: 'Mixer heat', unit: '+°C', step: 1, min: 0, max: 20, dec: 0 },
};

/** What the portions are called, by category. */
export const YIELD_NAME: Record<Category, { many: string; one: string; each: string }> = {
  pizza: { many: 'Dough balls', one: 'ball', each: 'Ball weight' },
  bread: { many: 'Loaves', one: 'loaf', each: 'Loaf weight' },
  enriched: { many: 'Pieces', one: 'piece', each: 'Piece weight' },
  pastry: { many: 'Portions', one: 'portion', each: 'Portion weight' },
  cake: { many: 'Portions', one: 'portion', each: 'Portion weight' },
  other: { many: 'Portions', one: 'portion', each: 'Portion weight' },
};

export const F_LIMITS = {
  ingredients: 40,
  ingredientName: 40,
  stages: 6,
  stageName: 30,
  steps: 40,
  stepText: 600,
  stepNote: 200,
  /** Baker's %: a cake can want 150% sugar; nothing sane needs more than this. */
  pct: 1000,
  /** Grams in one ingredient of the base recipe. */
  grams: 100_000,
  per: 10_000,
  /** Step times, minutes: four days. */
  stepMin: 5760,
  tempC: { min: -30, max: 320 },
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round = (v: number, dec: number) => Number(v.toFixed(dec));
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const str = (v: unknown, max: number, fallback = '') => (typeof v === 'string' ? v.slice(0, max) : fallback);

type Ing = Partial<Ingredient> & { name: string; qty: number };
const ing = (o: Ing): Ingredient => ({ role: 'other', unit: 'g', per: 1, optional: false, stage: 0, ...o });
const flour = (name: string, qty: number): Ingredient => ing({ name, qty, role: 'flour' });
const water = (qty: number): Ingredient => ing({ name: 'Water', qty, role: 'water', unit: 'ml' });
const eggs = (qty: number): Ingredient => ing({ name: 'Eggs', qty, unit: 'each', per: EGG_G });
const milk = (qty: number): Ingredient => ing({ name: 'Milk', qty, unit: 'ml', per: 1.03 });

const step = (text: string, min = 0, tempC: number | null = null, note = ''): Step => ({ text, min, tempC, note });

/** A starting point for each category: the usual ingredients, in the usual proportions. */
export const STARTERS: Record<Category, Pick<Formula, 'method' | 'ingredients' | 'balls' | 'bw' | 'servings' | 'ddt'>> = {
  pizza: {
    method: 'bakers',
    ingredients: [flour('Tipo 00', 100), water(65), ing({ name: 'Salt', qty: 2.8 }), ing({ name: 'Instant yeast', qty: 0.1 })],
    balls: 4,
    bw: 260,
    servings: 4,
    ddt: 25,
  },
  bread: {
    method: 'bakers',
    ingredients: [flour('Bread flour', 100), water(70), ing({ name: 'Salt', qty: 2 }), ing({ name: 'Instant yeast', qty: 0.7 })],
    balls: 2,
    bw: 800,
    servings: 2,
    ddt: 25,
  },
  // A brioche-style dough.
  enriched: {
    method: 'bakers',
    ingredients: [
      flour('Bread flour', 100),
      milk(30),
      eggs(40),
      ing({ name: 'Butter', qty: 40 }),
      ing({ name: 'Sugar', qty: 12 }),
      ing({ name: 'Salt', qty: 2 }),
      ing({ name: 'Instant yeast', qty: 1.2 }),
    ],
    balls: 12,
    bw: 70,
    servings: 12,
    ddt: 26,
  },
  // A sweet shortcrust (pâte sucrée).
  pastry: {
    method: 'bakers',
    ingredients: [flour('Plain flour', 100), ing({ name: 'Butter', qty: 60 }), ing({ name: 'Icing sugar', qty: 30 }), eggs(20), ing({ name: 'Salt', qty: 0.5 })],
    balls: 2,
    bw: 300,
    servings: 8,
    ddt: 20,
  },
  // A pound cake, by weight.
  cake: {
    method: 'amounts',
    ingredients: [
      ing({ name: 'Butter', qty: 225 }),
      ing({ name: 'Sugar', qty: 225 }),
      eggs(200),
      flour('Plain flour', 225),
      ing({ name: 'Baking powder', qty: 5 }),
      ing({ name: 'Salt', qty: 2 }),
      milk(30),
    ],
    balls: 10,
    bw: 90,
    servings: 10,
    ddt: 20,
  },
  other: { method: 'amounts', ingredients: [], balls: 4, bw: 250, servings: 4, ddt: 20 },
};

/** A method to start from, by category. Times and temperatures are typical, not a schedule. */
export const STEP_TEMPLATE: Record<Category, Step[]> = {
  pizza: [
    step('Dissolve the yeast in most of the water. Add the flour and mix until it comes together, then the salt and the rest of the water.'),
    step('Mix until smooth and strong. Check the dough temperature.'),
    step('Bulk ferment, covered.', 120, 24),
    step('Divide and ball.'),
    step('Proof the balls, covered, until puffy.', 120, 22),
    step('Bake on a hot stone or steel.', 2, 300, 'As hot as the oven goes'),
  ],
  bread: [
    step('Mix the flour and water and leave to rest (autolyse).', 30),
    step('Add the salt and yeast or levain and mix until the dough is strong. Check the dough temperature.'),
    step('Bulk ferment, with a fold every 45 minutes for the first two hours.', 180, 24),
    step('Divide, pre-shape, rest, then shape.', 20),
    step('Proof in the basket, or cold-retard overnight.', 90, 24, 'In the fridge: 8–14 h at 4 °C'),
    step('Bake with steam for the first 20 minutes, then uncovered.', 40, 240),
  ],
  enriched: [
    step('Dissolve the yeast in the milk. Add the flour, sugar, salt and eggs and mix until it comes together.'),
    step('Mix until smooth and elastic, then add the soft butter a piece at a time and mix until glossy.', 20),
    step('Bulk ferment, covered, until doubled.', 90, 26),
    step('Chill the dough so it can be shaped.', 60, 4, 'Overnight is fine, and tastes better'),
    step('Divide, shape, and proof until puffy.', 120, 26),
    step('Egg-wash and bake.', 18, 180),
  ],
  pastry: [
    step('Rub or beat the butter into the flour, sugar and salt until it looks like sand.'),
    step('Add the egg and bring it together without working it. Wrap and chill.', 60, 4),
    step('Roll out and line the tin. Chill again.', 30, 4),
    step('Blind-bake.', 20, 170),
  ],
  cake: [
    step('Heat the oven. Line the tin.', 0, 170),
    step('Beat the butter and sugar until pale and fluffy.', 5),
    step('Beat in the eggs one at a time, then fold in the flour, baking powder and salt, then the milk.'),
    step('Bake until a skewer comes out clean.', 55, 170),
    step('Cool in the tin, then turn out.', 15),
  ],
  other: [],
};

/** A fresh recipe for a category. */
export function defaultFormula(category: Category): Formula {
  const st = STARTERS[category];
  return {
    category,
    method: st.method,
    ingredients: structuredClone(st.ingredients),
    stages: [],
    balls: st.balls,
    bw: st.bw,
    waste: 2,
    servings: st.servings,
    scale: 'x',
    x: 1,
    want: st.servings,
    batch: 1000,
    ddt: st.ddt,
    room: 21,
    flourT: 21,
    friction: 5,
    steps: [],
  };
}

const isCategory = (v: unknown): v is Category => CATEGORIES.includes(v as Category);

function cleanIngredient(raw: unknown, method: Method, stages: number): Ingredient | null {
  if (!raw || typeof raw !== 'object') return null;
  const x = raw as Record<string, unknown>;
  const unit = UNITS.includes(x.unit as Unit) ? (x.unit as Unit) : 'g';
  const name = str(x.name, F_LIMITS.ingredientName, 'Ingredient');
  const per = isNum(x.per) && x.per > 0 ? round(clamp(x.per, 0.001, F_LIMITS.per), 3) : unit === 'each' && /egg/i.test(name) ? EGG_G : 1;
  return {
    name,
    role: ROLES.includes(x.role as Role) ? (x.role as Role) : 'other',
    qty: isNum(x.qty) ? round(clamp(x.qty, 0, method === 'bakers' ? F_LIMITS.pct : F_LIMITS.grams), 3) : 0,
    unit,
    per,
    optional: x.optional === true,
    stage: isNum(x.stage) ? clamp(Math.round(x.stage), 0, stages) : 0,
  };
}

function cleanStep(raw: unknown): Step | null {
  if (!raw || typeof raw !== 'object') return null;
  const x = raw as Record<string, unknown>;
  return {
    text: str(x.text, F_LIMITS.stepText),
    min: isNum(x.min) ? Math.round(clamp(x.min, 0, F_LIMITS.stepMin)) : 0,
    tempC: isNum(x.tempC) ? round(clamp(x.tempC, F_LIMITS.tempC.min, F_LIMITS.tempC.max), 1) : null,
    note: str(x.note, F_LIMITS.stepNote),
  };
}

/**
 * A manual recipe from before general recipes: flours with shares, then `hyd`, `salt` and `idy` as
 * fixed fields and `extras` for the rest. It becomes the same recipe as an ingredient list.
 */
function fromLegacy(src: Record<string, unknown>): Formula {
  const out = defaultFormula('pizza');
  const n = (k: string, fallback: number) => (isNum(src[k]) ? src[k] : fallback);
  const flours = Array.isArray(src.flours)
    ? src.flours
        .filter((f): f is Record<string, unknown> => !!f && typeof f === 'object')
        .map((f) => flour(str(f.name, F_LIMITS.ingredientName, 'Flour'), isNum(f.pct) ? f.pct : 0))
    : [];
  if (flours.length === 1) flours[0].qty = 100;
  const extras = Array.isArray(src.extras)
    ? src.extras.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object').map((x) => ing({ name: str(x.name, F_LIMITS.ingredientName, 'Ingredient'), qty: isNum(x.qty) ? x.qty : isNum(x.pct) ? x.pct : 0 }))
    : [];
  out.ingredients = [
    ...(flours.length ? flours : [flour('Tipo 00', 100)]),
    water(n('hyd', 70)),
    ing({ name: 'Salt', qty: n('salt', 2.8) }),
    ing({ name: 'Yeast', qty: n('idy', 0.1) }),
    ...extras,
  ];
  for (const k of ['balls', 'bw', 'waste', 'ddt', 'room', 'flourT', 'friction'] as const) if (isNum(src[k])) out[k] = src[k];
  return out;
}

/** Coerce anything into a valid Formula, filling gaps with defaults. Old manual recipes convert. */
export function normaliseFormula(raw: unknown): Formula {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  // Before general recipes a manual recipe had no ingredient list, just `hyd`, `salt` and `idy`.
  const base = Array.isArray(src.ingredients) ? defaultFormula(isCategory(src.category) ? src.category : 'pizza') : fromLegacy(src);
  const out: Formula = { ...base };
  if (Array.isArray(src.ingredients)) {
    if (METHODS.includes(src.method as Method)) out.method = src.method as Method;
    out.stages = Array.isArray(src.stages) ? src.stages.filter((s): s is string => typeof s === 'string').slice(0, F_LIMITS.stages).map((s) => s.slice(0, F_LIMITS.stageName)) : [];
    out.ingredients = src.ingredients
      .slice(0, F_LIMITS.ingredients)
      .map((x) => cleanIngredient(x, out.method, out.stages.length))
      .filter((x): x is Ingredient => x !== null);
    if (SCALES.includes(src.scale as Scale)) out.scale = src.scale as Scale;
    out.steps = Array.isArray(src.steps) ? src.steps.slice(0, F_LIMITS.steps).map(cleanStep).filter((s): s is Step => s !== null) : [];
  }
  for (const key of Object.keys(F_FIELDS) as FNumKey[]) {
    const v = Array.isArray(src.ingredients) ? src[key] : out[key];
    if (isNum(v)) {
      const f = F_FIELDS[key];
      out[key] = round(clamp(v, f.min, f.max), Math.max(f.dec, 2));
    }
  }
  return out;
}

export const emptyStep = (): Step => step('');
