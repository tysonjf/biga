// Sums for the calculator and the notes: + − × ÷ ^, brackets and %, with names for the recipe's
// amounts ("flour × 2%"). Percent works the way a phone calculator does: 500 + 10% is 550.

/** Named values a sum can use, lower case: { flour: 1142, water: 822 }. */
export type Vars = Record<string, number>;

type Tok = { k: 'num'; v: number; at: number } | { k: 'id'; v: string; at: number } | { k: 'op'; v: string; at: number } | { k: 'bad'; at: number };

const OPS: Record<string, string> = {
  '+': '+',
  '-': '-',
  '−': '-',
  '–': '-',
  '*': '*',
  '×': '*',
  '·': '*',
  '/': '/',
  '÷': '/',
  '^': '^',
  '%': '%',
  '(': '(',
  ')': ')',
};

// 1,000 is a thousand; 1.5 and .5 are decimals.
const NUM = /^(?:\d{1,3}(?:,\d{3})+(?![\d,])(?:\.\d+)?|\d+(?:\.\d*)?|\.\d+)/;
const WORD = /^[A-Za-z]+/;

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    const rest = src.slice(i);
    const n = NUM.exec(rest);
    if (n) {
      out.push({ k: 'num', v: parseFloat(n[0].replaceAll(',', '')), at: i });
      i += n[0].length;
      continue;
    }
    const w = WORD.exec(rest);
    if (w) {
      const word = w[0].toLowerCase();
      // "4 x 280" multiplies; "280 g" is just grams.
      if (word === 'x') out.push({ k: 'op', v: '*', at: i });
      else if (word !== 'g' || out.at(-1)?.k !== 'num') out.push({ k: 'id', v: word, at: i });
      i += w[0].length;
      continue;
    }
    out.push(OPS[ch] ? { k: 'op', v: OPS[ch], at: i } : { k: 'bad', at: i });
    i++;
  }
  return out;
}

type Val = { v: number; pct: boolean };
type Parsed = { value: number; binary: number; vars: number };

/** Recursive descent over `toks`; null unless every token is used. */
function parse(toks: Tok[], vars: Vars): Parsed | null {
  let i = 0;
  let binary = 0;
  let used = 0;
  const peek = (v: string) => {
    const t = toks[i];
    return t?.k === 'op' && t.v === v;
  };

  // A whole term that is one percentage ("10%") on the right of + or − is a share of the left.
  function expr(): Val | null {
    let left = term();
    if (!left) return null;
    while (peek('+') || peek('-')) {
      const plus = peek('+');
      i++;
      const right = term();
      if (!right) return null;
      binary++;
      const r: number = right.pct ? left.v * right.v : right.v;
      left = { v: plus ? left.v + r : left.v - r, pct: false };
    }
    return left;
  }

  function term(): Val | null {
    let left = unary();
    if (!left) return null;
    while (peek('*') || peek('/')) {
      const times = peek('*');
      i++;
      const right = unary();
      if (!right) return null;
      binary++;
      left = { v: times ? left.v * right.v : left.v / right.v, pct: false };
    }
    return left;
  }

  function unary(): Val | null {
    if (peek('-') || peek('+')) {
      const minus = peek('-');
      i++;
      const x = unary();
      return x && { v: minus ? -x.v : x.v, pct: x.pct };
    }
    return power();
  }

  function power(): Val | null {
    const base = postfix();
    if (!base || !peek('^')) return base;
    i++;
    const exp = unary();
    if (!exp) return null;
    binary++;
    return { v: Math.pow(base.v, exp.v), pct: false };
  }

  function postfix(): Val | null {
    const x = primary();
    if (!x || !peek('%')) return x;
    i++;
    binary++; // "2%" is a sum too, worth answering
    return { v: x.v / 100, pct: true };
  }

  function primary(): Val | null {
    const t = toks[i];
    if (!t) return null;
    if (t.k === 'num') {
      i++;
      return { v: t.v, pct: false };
    }
    if (t.k === 'id') {
      if (!(t.v in vars)) return null;
      i++;
      used++;
      return { v: vars[t.v], pct: false };
    }
    if (t.k === 'op' && t.v === '(') {
      i++;
      const x = expr();
      if (!x || !peek(')')) return null;
      i++;
      return { v: x.v, pct: false };
    }
    return null;
  }

  const out = expr();
  if (!out || i !== toks.length || !Number.isFinite(out.v)) return null;
  return { value: out.v, binary, vars: used };
}

/** The value of a sum, or null when it isn't one (yet). */
export function evaluate(src: string, vars: Vars = {}): number | null {
  const toks = tokenize(src);
  if (!toks.length) return null;
  return parse(toks, vars)?.value ?? null;
}

// Long lines only look back this far for the start of a sum.
const MAX_TOKENS = 48;

/**
 * The answer to a line of notes that ends in "=": the longest run of words before the "=" that
 * makes a sum. "Mix 4 x 280 =" is 1120; "Salt: flour × 2.5% =" uses the recipe's flour. A line
 * with an answer typed after the "=" is left alone, and so is one with nothing to work out
 * ("Step 2 =").
 */
export function trailingMath(line: string, vars: Vars = {}): { expr: string; value: number } | null {
  const text = line.trimEnd();
  if (!text.endsWith('=')) return null;
  let body = text.slice(0, -1);
  if (/[=<>!]$/.test(body)) return null;
  // Only since the last "=": "biga = flour × 75% =".
  body = body.slice(body.lastIndexOf('=') + 1);
  const toks = tokenize(body);
  for (let i = Math.max(0, toks.length - MAX_TOKENS); i < toks.length; i++) {
    // Start on a word boundary, so "1,5 × 2" isn't read as "5 × 2" and "18:00" isn't "00".
    if (i > 0 && /[A-Za-z0-9.,:]/.test(body[toks[i].at - 1] ?? '')) continue;
    const p = parse(toks.slice(i), vars);
    if (!p) continue;
    if (!p.binary && !p.vars) return null;
    return { expr: body.slice(toks[i].at).trim(), value: p.value };
  }
  return null;
}

/** An answer, short: 1120, 22.84, 0.0075. */
export function fmtNum(v: number): string {
  if (!Number.isFinite(v)) return '';
  const a = Math.abs(v);
  const s = a >= 100 ? v.toFixed(1) : a >= 1 ? v.toFixed(2) : a === 0 ? '0' : v.toPrecision(3);
  return String(Number(s));
}
