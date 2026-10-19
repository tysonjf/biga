// Shapes shared by the Worker (validation) and the app (editing + maths).
//
// A recipe is a template: ratios, ferment and timings, plus a written method. It has no clock times.
// Each time you make it you start a bake, which copies the recipe's settings (so it can be tweaked
// without touching the recipe), and adds when the preferment was mixed and notes of its own.
// The playground is a scratch recipe per preferment that saves as you go.

// A direct dough has no preferment: everything is mixed at once and ferments in bulk. A manual
// recipe is a plain baker's-percentage calculator: your own ratios, no yeast chart or schedule.
export type Kind = 'biga' | 'poolish' | 'direct' | 'manual';
export const KINDS: Kind[] = ['biga', 'poolish', 'direct', 'manual'];
/** The kinds with a playground: the ones with a yeast chart to try out. */
export const PLAY_KINDS: Kind[] = ['biga', 'poolish', 'direct'];

/**
 * How the final mix's water temperature is worked out: the heat balance (each ingredient by its weight
 * and specific heat), the bakers' DDT × 3 rule (× 4 with a preferment), or a base number (the
 * Neapolitan rule of 55).
 */
export type WaterRule = 'balance' | 'ddt' | 'base';
export const WATER_RULES: WaterRule[] = ['balance', 'ddt', 'base'];

/** A manual recipe's own ingredient: oil, sugar, malt, anything. */
export type Extra = { name: string; pct: number };

export type Flour = {
  name: string;
  pct: number; // share of the total flour, %; with `split`, share of the preferment's flour
  fin: number; // with `split`: share of the final dough's flour, %
};

export type Settings = {
  balls: number; // dough balls
  bw: number; // ball weight, g
  waste: number; // % extra dough for bowl/bench loss
  hyd: number; // total hydration, % of total flour
  salt: number; // % of total flour
  oil: number; // % of total flour
  sugar: number; // % of total flour, added in the final mix
  bp: number; // preferment share, % of total flour (not used by a direct dough)
  bh: number; // preferment hydration, % of preferment flour (not used by a direct dough)
  boost: number; // ± % on the charted yeast
  idy: number; // a manual recipe's yeast, % of flour
  extras: Extra[]; // a manual recipe's other ingredients, % of flour
  fy: number; // final dough IDY, % of total flour, for a 18–24 °C proofing room (not used by a direct dough)
  temp: number; // preferment ferment temperature, °C; a direct dough's bulk ferment temperature
  hours: number; // preferment ferment time, h; a direct dough's bulk ferment time
  buf: number; // ± % window on the preferment time (a direct dough's bulk)
  mix: number; // final mix, min (a direct dough's bulk starts as it's mixed)
  bulk: number; // bulk rest after the final mix, min (not used by a direct dough)
  proof: number; // ball proof at room temperature, min
  flours: Flour[];
  split: boolean; // each flour gets its own share of the preferment and of the final dough
  ddt: number; // target dough temperature straight after mixing, °C
  room: number; // room temperature where the dough is mixed and the balls proof, °C
  flourT: number; // flour temperature, °C
  friction: number; // temperature rise from mixing, °C
  waterRule: WaterRule; // how the final mix's water temperature is worked out
  waterBase: number; // the base number for the 'base' rule: water = base − room − flour
  /**
   * The preferment's temperature as it goes into the final mix, °C. null = its ferment temperature.
   * Set when it was held back in the fridge, or left out once it was ready.
   */
  preT: number | null;
  fridge: boolean; // bake later: short room rest, then the balls go in the fridge
  fridgeRest: number; // room rest before the fridge, min
  fridgeH: number; // hours in the fridge
  fridgeT: number; // fridge temperature, °C (counts toward a direct dough's yeast)
  temper: number; // out of the fridge before baking, min
  /**
   * Recipes and the playground: when you plan to mix the preferment, local "YYYY-MM-DDTHH:mm".
   * '' = now. Ignored once that schedule is over, so it never goes stale. Bakes keep their own start.
   */
  plan: string;
};

export type NumKey = { [K in keyof Settings]: Settings[K] extends number ? K : never }[keyof Settings];

export type Field = { label: string; unit: string; step: number; min: number; max: number; dec: number };

export const FIELDS: Record<NumKey, Field> = {
  balls: { label: 'Dough balls', unit: '', step: 1, min: 1, max: 99, dec: 0 },
  bw: { label: 'Ball weight', unit: 'g', step: 5, min: 50, max: 2000, dec: 0 },
  hyd: { label: 'Hydration', unit: '%', step: 0.5, min: 50, max: 90, dec: 1 },
  salt: { label: 'Salt', unit: '%', step: 0.1, min: 0, max: 5, dec: 1 },
  oil: { label: 'Oil', unit: '%', step: 0.5, min: 0, max: 15, dec: 1 },
  sugar: { label: 'Sugar', unit: '%', step: 0.5, min: 0, max: 10, dec: 1 },
  waste: { label: 'Waste', unit: '%', step: 0.5, min: 0, max: 25, dec: 1 },
  bp: { label: 'Share of flour', unit: '%', step: 5, min: 10, max: 100, dec: 0 },
  bh: { label: 'Hydration', unit: '%', step: 1, min: 40, max: 125, dec: 0 },
  boost: { label: 'Yeast boost', unit: '%', step: 5, min: -90, max: 300, dec: 0 },
  fy: { label: 'Final dough IDY', unit: '% flour', step: 0.05, min: 0, max: 1, dec: 2 },
  idy: { label: 'Yeast', unit: '%', step: 0.01, min: 0, max: 5, dec: 3 },
  temp: { label: 'Ferment temp', unit: '°C', step: 1, min: 2, max: 32, dec: 0 },
  hours: { label: 'Ferment time', unit: 'h', step: 1, min: 1, max: 96, dec: 0 },
  buf: { label: 'Ready window', unit: '± %', step: 5, min: 0, max: 50, dec: 0 },
  mix: { label: 'Final mix', unit: 'min', step: 5, min: 0, max: 240, dec: 0 },
  bulk: { label: 'Bulk', unit: 'min', step: 5, min: 0, max: 480, dec: 0 },
  proof: { label: 'Ball proof', unit: 'min', step: 15, min: 0, max: 1440, dec: 0 },
  ddt: { label: 'Target dough', unit: '°C', step: 0.5, min: 16, max: 32, dec: 1 },
  room: { label: 'Room', unit: '°C', step: 1, min: 5, max: 40, dec: 0 },
  flourT: { label: 'Flour', unit: '°C', step: 1, min: -5, max: 40, dec: 0 },
  friction: { label: 'Mixer heat', unit: '+°C', step: 1, min: 0, max: 20, dec: 0 },
  waterBase: { label: 'Base number', unit: '', step: 1, min: 40, max: 80, dec: 0 },
  fridgeRest: { label: 'Room rest first', unit: 'min', step: 15, min: 0, max: 240, dec: 0 },
  fridgeH: { label: 'In the fridge', unit: 'h', step: 1, min: 1, max: 96, dec: 0 },
  fridgeT: { label: 'Fridge', unit: '°C', step: 1, min: 1, max: 12, dec: 0 },
  temper: { label: 'Out before baking', unit: 'min', step: 15, min: 0, max: 360, dec: 0 },
};

/** The preferment's temperature at the final mix. Not in FIELDS, because it can be unset. */
export const PRE_T: Field = { label: 'Temperature', unit: '°C', step: 1, min: 0, max: 40, dec: 0 };

const COMMON = {
  balls: 4,
  bw: 280,
  waste: 2,
  hyd: 72,
  salt: 2.5,
  oil: 0,
  sugar: 0,
  boost: 0,
  idy: 0.1,
  extras: [],
  fy: 0.1,
  buf: 15,
  mix: 30,
  bulk: 30,
  proof: 120,
  flours: [{ name: 'Tipo 00', pct: 100, fin: 100 }],
  split: false,
  ddt: 25,
  room: 21,
  flourT: 21,
  friction: 5,
  waterRule: 'balance',
  waterBase: 55,
  preT: null,
  fridge: false,
  fridgeRest: 60,
  fridgeH: 16,
  fridgeT: 4,
  temper: 120,
  plan: '',
} satisfies Partial<Settings>;

export const DEFAULTS: Record<Kind, Settings> = {
  biga: { ...COMMON, bp: 75, bh: 45, temp: 18, hours: 16 },
  // The standard overnight poolish: 12–16 h at room temperature (about 21 °C).
  poolish: { ...COMMON, bw: 260, hyd: 68, salt: 2.8, fy: 0.15, bp: 30, bh: 100, temp: 21, hours: 14 },
  // A same-day dough: everything mixed at once, a bulk ferment at room temperature, then balls.
  direct: { ...COMMON, bw: 260, hyd: 65, salt: 2.8, fy: 0, bp: 75, bh: 45, temp: 21, hours: 6 },
  // Your own ratios: flours, water, salt, yeast and whatever else, as % of the flour.
  manual: { ...COMMON, hyd: 70, salt: 2.8, fy: 0, bp: 75, bh: 45, temp: 21, hours: 8, idy: 0.1 },
};

export const KIND_NAME: Record<Kind, string> = { biga: 'Biga', poolish: 'Poolish', direct: 'Direct', manual: 'Manual' };

export const LIMITS = {
  name: 60,
  flourName: 40,
  flours: 8,
  extras: 8,
  notes: 20_000,
  recipesPerUser: 500,
  bakesPerUser: 2_000,
  bodyBytes: 64_000,
};

/** A local date and time, "YYYY-MM-DDTHH:mm". */
export const START_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round = (v: number, dec: number) => Number(v.toFixed(dec));
const share = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? round(clamp(v, 0, 100), 1) : null);

/** Coerce anything into a valid Settings object for `kind`, filling gaps with defaults. */
export function normalise(kind: Kind, raw: unknown): Settings {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const out: Settings = structuredClone(DEFAULTS[kind]);
  for (const key of Object.keys(FIELDS) as NumKey[]) {
    const v = src[key];
    if (typeof v === 'number' && Number.isFinite(v)) {
      const f = FIELDS[key];
      out[key] = round(clamp(v, f.min, f.max), Math.max(f.dec, 2));
    }
  }
  if (kind === 'poolish') out.bh = 100;
  else out.bh = clamp(out.bh, 40, 65);
  if (typeof src.preT === 'number' && Number.isFinite(src.preT)) out.preT = round(clamp(src.preT, PRE_T.min, PRE_T.max), PRE_T.dec);
  if (WATER_RULES.includes(src.waterRule as WaterRule)) out.waterRule = src.waterRule as WaterRule;
  if (typeof src.fridge === 'boolean') out.fridge = src.fridge;
  if (typeof src.split === 'boolean') out.split = src.split;
  if (Array.isArray(src.extras))
    out.extras = src.extras
      .slice(0, LIMITS.extras)
      .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
      .map((x) => ({
        name: typeof x.name === 'string' ? x.name.slice(0, LIMITS.flourName) : 'Ingredient',
        pct: typeof x.pct === 'number' && Number.isFinite(x.pct) ? round(clamp(x.pct, 0, 100), 3) : 0,
      }));
  if (typeof src.plan === 'string' && START_RE.test(src.plan)) out.plan = src.plan;
  if (Array.isArray(src.flours)) {
    const flours = src.flours
      .slice(0, LIMITS.flours)
      .filter((f): f is Record<string, unknown> => !!f && typeof f === 'object')
      .map((f) => {
        const pct = share(f.pct) ?? 0;
        return { name: typeof f.name === 'string' ? f.name.slice(0, LIMITS.flourName) : 'Flour', pct, fin: share(f.fin) ?? pct };
      });
    // A lone flour is the whole dough, whatever was stored.
    if (flours.length === 1) flours[0].pct = flours[0].fin = 100;
    if (flours.length) out.flours = flours;
  }
  return out;
}

export type Recipe = {
  id: string;
  kind: Kind;
  name: string;
  settings: Settings;
  /** The method, as Markdown. */
  notes: string;
  createdAt: number;
  updatedAt: number;
};

export type Bake = {
  id: string;
  recipeId: string;
  kind: Kind;
  /** '' shows the date the preferment was mixed. */
  name: string;
  /** This bake's own copy of the recipe's settings. */
  settings: Settings;
  /** Preferment mixed at, local "YYYY-MM-DDTHH:mm" ('' = not set yet). */
  start: string;
  /** Notes on this bake, as Markdown. */
  notes: string;
  createdAt: number;
  updatedAt: number;
};

/** The playground for one preferment: settings only, saved as you go. */
export type Play = { settings: Settings; updatedAt: number };
export type Playground = Record<Kind, Play | null>;

export const ID_RE = /^[A-Za-z0-9_-]{8,40}$/;

export const cleanStart = (v: unknown) => (typeof v === 'string' && START_RE.test(v) ? v : '');
/** Notes as stored: a string within the limit. Anything else is `null` ("leave the notes as they are"). */
export const cleanNotes = (v: unknown) => (typeof v === 'string' ? v.slice(0, LIMITS.notes) : null);

export function newId(): string {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 20);
}
