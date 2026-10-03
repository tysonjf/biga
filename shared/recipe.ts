// Recipe shape shared by the Worker (validation) and the app (editing + maths).

export type Kind = 'biga' | 'poolish';
export const KINDS: Kind[] = ['biga', 'poolish'];

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
  bp: number; // preferment share, % of total flour
  bh: number; // preferment hydration, % of preferment flour
  boost: number; // ± % on the charted preferment yeast
  fy: number; // final dough IDY, % of total flour, for a 18–24 °C proofing room
  temp: number; // preferment ferment temperature, °C
  hours: number; // preferment ferment time, h
  buf: number; // ± % window on the preferment time
  mix: number; // final mix, min
  bulk: number; // bulk rest, min
  proof: number; // ball proof at room temperature, min
  flours: Flour[];
  split: boolean; // each flour gets its own share of the preferment and of the final dough
  start: string; // preferment mixed at, local "YYYY-MM-DDTHH:mm" ('' = not set)
  ddt: number; // target dough temperature straight after mixing, °C
  room: number; // room temperature where the dough is mixed and the balls proof, °C
  flourT: number; // flour temperature, °C
  friction: number; // temperature rise from mixing, °C
  fridge: boolean; // bake later: short room rest, then the balls go in the fridge
  fridgeRest: number; // room rest before the fridge, min
  fridgeH: number; // hours in the fridge
  temper: number; // out of the fridge before baking, min
};

export type NumKey = { [K in keyof Settings]: Settings[K] extends number ? K : never }[keyof Settings];

export type Field = { label: string; unit: string; step: number; min: number; max: number; dec: number };

export const FIELDS: Record<NumKey, Field> = {
  balls: { label: 'Dough balls', unit: '', step: 1, min: 1, max: 99, dec: 0 },
  bw: { label: 'Ball weight', unit: 'g', step: 5, min: 50, max: 2000, dec: 0 },
  hyd: { label: 'Hydration', unit: '%', step: 0.5, min: 50, max: 90, dec: 1 },
  salt: { label: 'Salt', unit: '%', step: 0.1, min: 0, max: 5, dec: 1 },
  oil: { label: 'Oil', unit: '%', step: 0.5, min: 0, max: 15, dec: 1 },
  waste: { label: 'Waste', unit: '%', step: 0.5, min: 0, max: 25, dec: 1 },
  bp: { label: 'Share of flour', unit: '%', step: 5, min: 10, max: 100, dec: 0 },
  bh: { label: 'Hydration', unit: '%', step: 1, min: 40, max: 125, dec: 0 },
  boost: { label: 'Yeast boost', unit: '%', step: 5, min: -90, max: 300, dec: 0 },
  fy: { label: 'Final dough IDY', unit: '% flour', step: 0.05, min: 0, max: 1, dec: 2 },
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
  fridgeRest: { label: 'Room rest first', unit: 'min', step: 15, min: 0, max: 240, dec: 0 },
  fridgeH: { label: 'In the fridge', unit: 'h', step: 1, min: 1, max: 72, dec: 0 },
  temper: { label: 'Out before baking', unit: 'min', step: 15, min: 0, max: 360, dec: 0 },
};

const COMMON = {
  balls: 4,
  bw: 280,
  waste: 2,
  hyd: 72,
  salt: 2.5,
  oil: 0,
  boost: 0,
  fy: 0.1,
  buf: 15,
  mix: 30,
  bulk: 30,
  proof: 120,
  flours: [{ name: 'Tipo 00', pct: 100, fin: 100 }],
  split: false,
  start: '',
  ddt: 25,
  room: 21,
  flourT: 21,
  friction: 5,
  fridge: false,
  fridgeRest: 60,
  fridgeH: 16,
  temper: 120,
} satisfies Partial<Settings>;

export const DEFAULTS: Record<Kind, Settings> = {
  biga: { ...COMMON, bp: 75, bh: 45, temp: 18, hours: 16 },
  poolish: { ...COMMON, bw: 260, hyd: 68, salt: 2.8, fy: 0.15, bp: 30, bh: 100, temp: 20, hours: 16 },
};

export const KIND_NAME: Record<Kind, string> = { biga: 'Biga', poolish: 'Poolish' };

export const LIMITS = {
  name: 60,
  flourName: 40,
  flours: 8,
  recipesPerUser: 500,
  bodyBytes: 8_000,
};

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
  if (typeof src.fridge === 'boolean') out.fridge = src.fridge;
  if (typeof src.split === 'boolean') out.split = src.split;
  if (typeof src.start === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(src.start)) out.start = src.start;
  if (Array.isArray(src.flours)) {
    const flours = src.flours
      .slice(0, LIMITS.flours)
      .filter((f): f is Record<string, unknown> => !!f && typeof f === 'object')
      .map((f) => {
        const pct = share(f.pct) ?? 0;
        return { name: typeof f.name === 'string' ? f.name.slice(0, LIMITS.flourName) : 'Flour', pct, fin: share(f.fin) ?? pct };
      });
    if (flours.length) out.flours = flours;
  }
  return out;
}

export type Recipe = {
  id: string;
  kind: Kind;
  name: string;
  settings: Settings;
  createdAt: number;
  updatedAt: number;
};

export const ID_RE = /^[A-Za-z0-9_-]{8,40}$/;

export function newId(): string {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 20);
}
