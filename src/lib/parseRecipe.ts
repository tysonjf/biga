// Turns a recipe as you'd paste it from a forum, a book or a message into a general recipe's
// ingredients: "900g Flour", "Water 450 g", "2 large eggs", "Salt 2.5%", with headings such as
// "Biga" or "Final dough" splitting it into stages. Roles (flour, water) and units come from the names.

import { EGG_G, F_LIMITS, guessRole, type Ingredient, type Method, type Unit } from '../../shared/formula';

export type Parsed = {
  method: Method;
  ingredients: Ingredient[];
  stages: string[];
  /** Lines that weren't ingredients or headings: times, temperatures, remarks. */
  notes: string[];
  warnings: string[];
};

type Qty = { value: number; grams: number; unit: Unit; per: number; pct: boolean; rough: boolean };
type Line = { name: string; qty: Qty } | { heading: string };

// Grams in one of each unit we understand. Spoons and cups are volumes of unknown density: taken as
// water, and flagged.
const UNITS: Record<string, { grams: number; unit: Unit; per: number; rough?: boolean }> = {
  g: { grams: 1, unit: 'g', per: 1 },
  gr: { grams: 1, unit: 'g', per: 1 },
  gram: { grams: 1, unit: 'g', per: 1 },
  grams: { grams: 1, unit: 'g', per: 1 },
  kg: { grams: 1000, unit: 'kg', per: 1 },
  kilo: { grams: 1000, unit: 'kg', per: 1 },
  kilos: { grams: 1000, unit: 'kg', per: 1 },
  mg: { grams: 0.001, unit: 'g', per: 1 },
  ml: { grams: 1, unit: 'ml', per: 1 },
  cl: { grams: 10, unit: 'ml', per: 1 },
  dl: { grams: 100, unit: 'ml', per: 1 },
  l: { grams: 1000, unit: 'l', per: 1 },
  litre: { grams: 1000, unit: 'l', per: 1 },
  liter: { grams: 1000, unit: 'l', per: 1 },
  litres: { grams: 1000, unit: 'l', per: 1 },
  liters: { grams: 1000, unit: 'l', per: 1 },
  oz: { grams: 28.35, unit: 'g', per: 1 },
  ounce: { grams: 28.35, unit: 'g', per: 1 },
  ounces: { grams: 28.35, unit: 'g', per: 1 },
  lb: { grams: 453.6, unit: 'g', per: 1 },
  lbs: { grams: 453.6, unit: 'g', per: 1 },
  pound: { grams: 453.6, unit: 'g', per: 1 },
  pounds: { grams: 453.6, unit: 'g', per: 1 },
  tsp: { grams: 5, unit: 'ml', per: 1, rough: true },
  teaspoon: { grams: 5, unit: 'ml', per: 1, rough: true },
  teaspoons: { grams: 5, unit: 'ml', per: 1, rough: true },
  tbsp: { grams: 15, unit: 'ml', per: 1, rough: true },
  tablespoon: { grams: 15, unit: 'ml', per: 1, rough: true },
  tablespoons: { grams: 15, unit: 'ml', per: 1, rough: true },
  cup: { grams: 240, unit: 'ml', per: 1, rough: true },
  cups: { grams: 240, unit: 'ml', per: 1, rough: true },
};
const UNIT_RE = Object.keys(UNITS).sort((a, b) => b.length - a.length).join('|');

const EGG = /\begg|yolk|\bwhite(s)?\b.*egg|albumen/i;
const PIECE_WORDS = /^(large|medium|small|whole|x|pcs?|pieces?|items?|each|cloves?|slices?)\b\.?\s*/i;

// Headings that mean the main mix, and ones that mean a stage of their own.
const MAIN_HEADING = /\b(final|dough|main|refresh|rinfresco|impasto|chiusura|assembly|batter|mix)\b/i;
const STAGE_HEADING = /\b(biga|poolish|levain|starter|preferment|pre-ferment|sponge|tangzhong|yudane|soaker|autolyse|filling|glaze|syrup|topping|icing|frosting|crumble|streusel|custard|cream)\b/i;

/** Grams per ml for liquids named like these. Anything else is read as grams. */
const LIQUIDS: [RegExp, number][] = [
  [/\b(milk|latte|buttermilk)\b/i, 1.03],
  [/\b(oil|olio|evoo)\b/i, 0.92],
  [/\b(honey|miele|syrup|molasses|treacle)\b/i, 1.42],
  [/\b(cream|panna|yoghurt|yogurt)\b/i, 1.01],
  [/\b(water|acqua|beer|wine|juice|stock|broth|coffee|espresso)\b/i, 1],
];

const num = (s: string) => {
  // "1 1/2", "1/2", "½", "1,5", "1.5"
  const vulgar: Record<string, number> = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125 };
  let total = 0;
  for (const part of s.trim().split(/\s+/)) {
    if (part in vulgar) total += vulgar[part];
    else if (/^\d+\/\d+$/.test(part)) {
      const [a, b] = part.split('/').map(Number);
      total += b ? a / b : 0;
    } else total += parseFloat(part.replace(',', '.'));
  }
  return total;
};

const NUM = String.raw`(\d+(?:[.,]\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+|[¼½¾⅓⅔⅛](?:\s*\d+)?|\d+\s*[¼½¾⅓⅔⅛])`;
// "900g Flour", "900 g of flour", "1.5 kg bread flour", "2 large eggs", "3 eggs", "2.5% salt"
const LEAD = new RegExp(String.raw`^(?:[-•*·]\s*|\d+[.)]\s+)?${NUM}\s*(${UNIT_RE}|%)?\.?\s+(?:of\s+)?(.+)$`, 'i');
// "Flour 900g", "Flour: 900 g", "Flour – 900", "Salt 2.5%", "Eggs x3"
const TRAIL = new RegExp(String.raw`^(.+?)\s*[:–—-]?\s*[x×]?\s*${NUM}\s*(${UNIT_RE}|%)?\.?\s*(?:\(.*\))?$`, 'i');

function qtyOf(value: number, unitWord: string | undefined, name: string): Qty {
  if (unitWord === '%') return { value, grams: value, unit: 'g', per: 1, pct: true, rough: false };
  const u = unitWord ? UNITS[unitWord.toLowerCase()] : undefined;
  if (u) {
    const liquid = LIQUIDS.find(([re]) => re.test(name));
    if (u.unit === 'ml' || u.unit === 'l') {
      const per = liquid?.[1] ?? 1;
      return { value, grams: value * u.grams * per, unit: u.unit, per, pct: false, rough: !!u.rough };
    }
    // A weight: liquids named like water or milk still read nicely in ml.
    const unit: Unit = u.unit === 'g' && liquid && !/^(honey|syrup)/i.test(name) ? 'ml' : u.unit;
    return { value, grams: value * u.grams, unit, per: unit === 'ml' ? (liquid?.[1] ?? 1) : 1, pct: false, rough: !!u.rough };
  }
  // No unit: a count of things ("3 eggs") or, for anything else, grams.
  if (EGG.test(name)) {
    const per = /yolk/i.test(name) ? 18 : /white/i.test(name) ? 33 : EGG_G;
    return { value, grams: value * per, unit: 'each', per, pct: false, rough: false };
  }
  const liquid = LIQUIDS.find(([re]) => re.test(name));
  if (liquid && !/^(honey|syrup)/i.test(name)) return { value, grams: value, unit: 'ml', per: liquid[1], pct: false, rough: false };
  return { value, grams: value, unit: 'g', per: 1, pct: false, rough: false };
}

const tidy = (s: string) => {
  let name = s
    .replace(/^\s*(of|de|di)\s+/i, '')
    .replace(PIECE_WORDS, '')
    .replace(/\s*[-–—:]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!name) return '';
  name = name.charAt(0).toUpperCase() + name.slice(1);
  return name.slice(0, F_LIMITS.ingredientName);
};

function parseLine(raw: string): Line | null {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  let m = LEAD.exec(text);
  if (m) {
    const name = tidy(m[3]);
    // "90% Biga (24h cf)" is a heading in a grams recipe; decided later from the whole text.
    if (name && !/^(and|then|until|for|at|minutes?|mins?|hours?|h|sec|seconds?|°c|°f|c|f|degrees)\b/i.test(name)) return { name, qty: qtyOf(num(m[1]), m[2], name) };
  }
  m = TRAIL.exec(text);
  if (m) {
    const name = tidy(m[1]);
    if (name) return { name, qty: qtyOf(num(m[2]), m[3], name) };
  }
  return { heading: text.replace(/^[#*\-•\s]+|[:\s*#]+$/g, '').trim() };
}

const roleOf = guessRole;

/** One ingredient as a line: a quick way to add "900g flour", "Salt 2.8%" or just "Semolina". */
export function toIngredient(l: { name: string; qty: Qty }, method: Method, stage: number): Ingredient {
  const q = l.qty;
  const egg = EGG.test(l.name);
  return {
    name: l.name,
    role: roleOf(l.name),
    qty: +(method === 'bakers' ? q.value : q.grams).toFixed(3),
    unit: method === 'bakers' && q.unit === 'g' && egg ? 'each' : q.unit,
    per: egg && (q.unit === 'each' || q.unit === 'g') ? (q.unit === 'each' ? q.per : /yolk/i.test(l.name) ? 18 : /white/i.test(l.name) ? 33 : EGG_G) : q.per,
    optional: /optional/i.test(l.name),
    stage,
  };
}

/**
 * The ingredient one typed line describes, for the quick-add field. In baker's percentages a bare
 * number or a % is the percentage ("Salt 2.8"); otherwise the amount is in grams or its unit. A name
 * on its own is an ingredient with no amount yet.
 */
export function parseIngredientLine(text: string, method: Method, stage = 0): Ingredient | null {
  const l = parseLine(text);
  if (!l) return null;
  if ('heading' in l) return l.heading ? toIngredient({ name: tidy(l.heading), qty: { value: 0, grams: 0, unit: 'g', per: 1, pct: false, rough: false } }, method, stage) : null;
  if (method === 'bakers' && !l.qty.pct && l.qty.unit !== 'g') return toIngredient({ ...l, qty: { ...l.qty, pct: true } }, method, stage);
  return toIngredient(l, method, stage);
}

/** Parses pasted text into ingredients and stages. Null when there's nothing that looks like an ingredient. */
export function parseRecipe(text: string): Parsed | null {
  const lines = text.split(/\r?\n/).map(parseLine).filter((l): l is Line => l !== null);
  const items = lines.filter((l): l is Extract<Line, { name: string }> => 'name' in l);
  if (!items.length) return null;
  // A recipe is in percentages only when nothing is in grams.
  const method: Method = items.every((l) => l.qty.pct) ? 'bakers' : 'amounts';

  type Block = { heading: string; items: { name: string; qty: Qty }[] };
  const blocks: Block[] = [{ heading: '', items: [] }];
  const notes: string[] = [];
  // Headings on consecutive lines ("Refresh", then "(48h cf) usually 24h") are one heading.
  const heading = (text: string) => {
    const last = blocks.at(-1)!;
    if (!text) return;
    if (last.heading && !last.items.length) last.heading += ` · ${text}`;
    else blocks.push({ heading: text, items: [] });
  };
  for (const l of lines) {
    if ('heading' in l) heading(l.heading);
    // "90% Biga (24h cf)": a heading with a percentage in it.
    else if (method === 'amounts' && l.qty.pct) heading(l.name);
    else blocks.at(-1)!.items.push(l);
  }
  // A heading with nothing under it is a remark ("Stone: 450 °C"), kept for the notes.
  const groups = blocks.filter((b, i) => {
    if (b.items.length) return true;
    if (b.heading && i > 0) notes.push(b.heading);
    return false;
  });

  // Which group is the main mix: the one that says so, else the last. The rest are stages.
  let main = groups.findIndex((g) => MAIN_HEADING.test(g.heading) && !STAGE_HEADING.test(g.heading));
  if (main < 0) main = groups.length - 1;
  const stageGroups = groups.filter((_, i) => i !== main).slice(0, F_LIMITS.stages);
  const stages = stageGroups.map((g, i) => stageName(g.heading) || `Stage ${i + 1}`);

  const warnings: string[] = [];
  const ingredients: Ingredient[] = [];
  const push = (l: { name: string; qty: Qty }, stage: number) => {
    if (ingredients.length >= F_LIMITS.ingredients) return;
    if (l.qty.rough) warnings.push(`${l.name}: cups and spoons were read as water (${Math.round(l.qty.grams)} g). Check the grams.`);
    ingredients.push(toIngredient(l, method, stage));
  };
  for (const l of groups[main].items) push(l, 0);
  stageGroups.forEach((g, i) => g.items.forEach((l) => push(l, i + 1)));

  if (!ingredients.some((x) => x.role === 'flour')) warnings.push('No flour was recognised. Mark the flour in its options for baker’s percentages and hydration.');
  return { method, ingredients, stages, notes, warnings };
}

/** "90% Biga (24h cf)" → "Biga"; "For the poolish:" → "Poolish". */
function stageName(heading: string): string {
  const m = STAGE_HEADING.exec(heading);
  const base = m ? m[1] : heading.replace(/^(for|per)\s+(the|il|la|lo)?\s*/i, '').replace(/\(.*?\)/g, '').replace(/\d+(\.\d+)?\s*%/g, '').trim();
  const name = base.charAt(0).toUpperCase() + base.slice(1);
  return name.slice(0, F_LIMITS.stageName);
}
