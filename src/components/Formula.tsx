// The cards for a general recipe: its ingredients (as baker's percentages or amounts, with the yield
// and scaling), its method (numbered steps with times and temperatures) and, for a dough, the water
// temperature. They read the lock from context like the dough cards.

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import {
  CATEGORIES,
  CATEGORY_NAME,
  F_FIELDS,
  F_LIMITS,
  STEP_TEMPLATE,
  UNITS,
  UNIT_NAME,
  YIELD_NAME,
  emptyStep,
  type Category,
  type FNumKey,
  type Formula,
  type Ingredient,
  type Role,
  type Scale,
  type Unit,
  guessRole,
} from '../../shared/formula';
import { parseIngredientLine } from '../lib/parseRecipe';
import { balance, FIRST_HYD, fmtDur, g0, MIXERS, num, rebalance, WATER_MAX } from '../lib/dough';
import { calcFormula, formulaStages, formulaVars, grams, realSteps, stepFor, stepMeta, switchMethod, type Row } from '../lib/formula';
import { Locked, useLocked } from '../lib/lock';
import { toast } from '../lib/toast';
import { useStoredFlag } from '../lib/useStoredFlag';
import { Stat } from './Dough';
import { Fold, mobileOrder } from './Fold';
import { GramsEdit } from './GramsEdit';
import { Icon } from './Icon';
import { Sheet } from './Sheet';
import { Stepper } from './Stepper';
import { Switch } from './Switch';

export type SetF = Dispatch<SetStateAction<Formula>>;

/** Everything the cards need, worked out once per change. */
export function useFormula(f: Formula, setF: SetF) {
  const c = useMemo(() => calcFormula(f), [f]);
  const set = useCallback(<K extends keyof Formula>(k: K, v: Formula[K]) => setF((p) => ({ ...p, [k]: v })), [setF]);
  const stages = useMemo(() => formulaStages(f, c), [f, c]);
  const vars = useMemo(() => formulaVars(c), [c]);
  const scope = useMemo(() => Object.fromEntries(vars.map((v) => [v.name, v.value])), [vars]);
  return { f, setF, set, c, stages, vars, scope };
}
export type FormulaD = ReturnType<typeof useFormula>;

type StepperProps = Parameters<typeof Stepper>[0];

function FField({ d, k, ...extra }: { d: FormulaD; k: FNumKey } & Partial<StepperProps>) {
  return <Stepper {...F_FIELDS[k]} value={d.f[k]} onChange={(v) => d.set(k, v)} {...extra} />;
}

/** "1h 30m", "20m", "2h": fits a narrow stepper. */
const shortDur = (min: number) => {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return [h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ');
};

const pctText = (v: number) => `${num(v, v < 1 ? 3 : v < 10 ? 2 : 1)}%`;

/** A stepper's `bump` that takes a step suited to the size of the value. */
const adaptive = (step: (v: number) => number, min: number, max: number) => (v: number, dir: 1 | -1) => {
  // Going down takes the step of the range just below, so 1 goes to 0.95, not 0.9.
  const s = step(dir > 0 ? v : Math.max(min, v - 1e-6));
  const next = dir > 0 ? Math.floor(v / s + 1e-9) * s + s : Math.ceil(v / s - 1e-9) * s - s;
  return Math.min(max, Math.max(min, +next.toFixed(3)));
};

/* ---------- ingredients ---------- */

const SCALE_NAME: Record<Scale, string> = { x: 'Multiply', servings: 'To servings', weight: 'To a weight' };
const SCALE_KEY: Record<Scale, FNumKey> = { x: 'x', servings: 'want', weight: 'batch' };

export function FormulaCard({ d, onFull, order }: { d: FormulaD; onFull: () => void; order?: number }) {
  const { f, setF, set, c } = d;
  const locked = useLocked();
  const [opt, setOpt] = useState<number | null>(null);
  const bakers = f.method === 'bakers';
  const yieldName = YIELD_NAME[f.category];
  const flours = f.ingredients.filter((x) => x.role === 'flour').length;
  const focusNew = useRef(false);

  const upd = (i: number, patch: Partial<Ingredient>) => setF((p) => ({ ...p, ingredients: p.ingredients.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  // Flour shares always add up to 100%: changing one moves the biggest of the others.
  const setFlourShare = (i: number, v: number) =>
    setF((p) => {
      const idx = p.ingredients.map((x, j) => (x.role === 'flour' ? j : -1)).filter((j) => j >= 0);
      const col = rebalance(idx.map((j) => p.ingredients[j].qty), idx.indexOf(i), v);
      return { ...p, ingredients: p.ingredients.map((x, j) => (idx.includes(j) ? { ...x, qty: col[idx.indexOf(j)] } : x)) };
    });
  const setQty = (r: Row, v: number) => (bakers && r.role === 'flour' && flours > 1 ? setFlourShare(r.i, v) : upd(r.i, { qty: v }));
  // Working backwards in baker's percentages: type the grams you want and the % follows. For a flour,
  // the whole dough is resized (through the weight per portion) so that flour comes to those grams.
  const setGrams = (r: Row, g: number) => {
    if (!(c.flour > 0) || !(g >= 0)) return;
    if (r.role !== 'flour') return upd(r.i, { qty: +((g / c.flour) * 100).toFixed(3) });
    const share = r.grams / c.flour;
    if (!(share > 0)) return;
    const total = (g / share) * (c.total / c.flour);
    set('bw', Math.min(F_FIELDS.bw.max, Math.max(F_FIELDS.bw.min, +(total / (f.balls * (1 + f.waste / 100))).toFixed(2))));
  };
  const remove = (i: number) =>
    setF((p) => {
      const rest = p.ingredients.filter((_, j) => j !== i);
      if (p.method !== 'bakers' || p.ingredients[i].role !== 'flour') return { ...p, ingredients: rest };
      const idx = rest.map((x, j) => (x.role === 'flour' ? j : -1)).filter((j) => j >= 0);
      const col = balance(idx.map((j) => rest[j].qty));
      return { ...p, ingredients: rest.map((x, j) => (idx.includes(j) ? { ...x, qty: col[idx.indexOf(j)] } : x)) };
    });
  // "900g flour" typed as one line is an ingredient; an empty line adds a blank row to fill in.
  const add = (stage: number, text = '') => {
    const typed = text.trim() ? parseIngredientLine(text, f.method, stage) : null;
    focusNew.current = !typed;
    setF((p) => {
      const x: Ingredient = typed ?? { name: '', role: 'other', qty: p.method === 'bakers' ? 1 : 10, unit: 'g', per: 1, optional: false, stage };
      let ingredients = [...p.ingredients, x];
      // A new flour in baker's percentages takes its share from the others.
      if (p.method === 'bakers' && x.role === 'flour') {
        const idx = ingredients.map((y, j) => (y.role === 'flour' ? j : -1)).filter((j) => j >= 0);
        const col = balance(idx.map((j) => ingredients[j].qty), idx.length - 1);
        ingredients = ingredients.map((y, j) => (idx.includes(j) ? { ...y, qty: col[idx.indexOf(j)] } : y));
      }
      return { ...p, ingredients };
    });
  };
  // The name says what an ingredient is, unless you've set its role yourself.
  const rename = (r: Row, name: string) => {
    const now = guessRole(name);
    upd(r.i, { name, role: r.role === guessRole(r.name) && now !== r.role ? now : r.role });
  };
  const addStage = () => setF((p) => ({ ...p, stages: [...p.stages, ''] }));
  const renameStage = (i: number, name: string) => setF((p) => ({ ...p, stages: p.stages.map((s, j) => (j === i ? name : s)) }));
  // Removing a stage puts its ingredients back in the main mix.
  const removeStage = (i: number) =>
    setF((p) => ({
      ...p,
      stages: p.stages.filter((_, j) => j !== i),
      ingredients: p.ingredients.map((x) => ({ ...x, stage: x.stage === i + 1 ? 0 : x.stage > i + 1 ? x.stage - 1 : x.stage })),
    }));
  const changeMethod = (to: Formula['method']) => {
    if (locked || to === f.method) return;
    const next = switchMethod(f, to);
    if (!next) toast('Baker’s percentages are shares of the flour: mark an ingredient as the flour first (in its options).');
    else setF(next);
  };

  const main = c.stages.length > 1;
  return (
    <section className="card" id="ingredients" aria-labelledby="h-ingredients" style={mobileOrder(order)}>
      <div className="card-h">
        <h2 id="h-ingredients">Ingredients</h2>
        <button type="button" className="btn small" onClick={onFull}>
          <Icon name="expand" size={16} /> Full screen
        </button>
      </div>

      <div className="totals">
        <Stat k={c.dough ? 'Dough' : bakers ? 'Total' : 'Batch'} v={g0(c.total)} plain />
        {c.flour > 0 ? <Stat k="Flour" v={g0(c.flour)} plain /> : <Stat k={`Per ${bakers ? yieldName.one : 'serving'}`} v={g0(c.portion)} plain />}
        {c.hydration !== null ? <Stat k="Hydration" v={`${num(c.hydration, 1)}%`} plain /> : <Stat k={bakers ? 'Per portion' : 'Servings'} v={bakers ? g0(c.portion) : num(c.portions, 1)} plain />}
      </div>

      <div className="segmented" role="radiogroup" aria-label="How the amounts are worked out" data-locked={locked ? '' : undefined}>
        {(['bakers', 'amounts'] as const).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={f.method === m} aria-disabled={locked || undefined} onClick={() => changeMethod(m)}>
            {m === 'bakers' ? 'Baker’s %' : 'Amounts'}
          </button>
        ))}
      </div>

      {bakers ? (
        <div className="grid three">
          <FField d={d} k="balls" label={yieldName.many} />
          <FField d={d} k="bw" label={yieldName.each} />
          <FField d={d} k="waste" />
        </div>
      ) : (
        <>
          <div className="grid">
            <FField d={d} k="servings" unit={f.servings === 1 ? 'serving' : 'servings'} />
            <FField d={d} k={SCALE_KEY[f.scale]} {...(f.scale === 'servings' ? { unit: f.want === 1 ? 'serving' : 'servings' } : {})} />
          </div>
          <div className="chips" role="group" aria-label="How to scale">
            {(['x', 'servings', 'weight'] as const).map((sc) => (
              <button
                key={sc}
                type="button"
                className="chip-btn"
                aria-pressed={f.scale === sc}
                aria-disabled={locked || undefined}
                data-locked={locked ? '' : undefined}
                onClick={() => !locked && set('scale', sc)}
              >
                {SCALE_NAME[sc]}
              </button>
            ))}
          </div>
          <p className="note">
            {f.scale === 'x' ? (
              <>
                Every amount × <b>{num(c.mult, 2)}</b>: {g0(c.base)} for {f.servings} {f.servings === 1 ? 'serving' : 'servings'} becomes {g0(c.total)}.
              </>
            ) : f.scale === 'servings' ? (
              <>
                {f.want} {f.want === 1 ? 'serving' : 'servings'} from a recipe for {f.servings}: every amount × <b>{num(c.mult, 2)}</b>.
              </>
            ) : (
              <>
                A {g0(f.batch)} batch from a {g0(c.base)} recipe: every amount × <b>{num(c.mult, 2)}</b>.
              </>
            )}
          </p>
        </>
      )}

      {c.stages.map((st) => (
        <div key={st.index} className="fstage">
          {main || st.index > 0 ? (
            <div className="sub-h stage-row">
              {st.index === 0 ? (
                <span>{c.dough ? 'Final dough' : 'Main mix'}</span>
              ) : locked ? (
                <span>{st.name || `Stage ${st.index}`}</span>
              ) : (
                <>
                  <input
                    className="tin sname"
                    value={st.name}
                    placeholder={`Stage ${st.index}, e.g. Levain`}
                    maxLength={F_LIMITS.stageName}
                    aria-label="Stage name"
                    autoComplete="off"
                    enterKeyHint="done"
                    onChange={(e) => renameStage(st.index - 1, e.target.value)}
                  />
                  <button type="button" className="xbtn" aria-label={`Remove the stage ${st.name || st.index}`} onClick={() => removeStage(st.index - 1)}>
                    <Icon name="trash" size={18} />
                  </button>
                </>
              )}
              {st.rows.length ? <span className="fsum">{stageLine(st.rows, st.total, st.index === 0, bakers ? c.flour : 0)}</span> : null}
            </div>
          ) : null}
          <ul className="mlist">
            {st.rows.map((r) => (
              <IngredientRow
                key={r.i}
                r={r}
                f={f}
                flours={flours}
                focus={focusNew.current && r.i === f.ingredients.length - 1}
                stage={st.index > 0 ? { name: st.name || `stage ${st.index}`, flour: st.rows.reduce((a, x) => a + (x.role === 'flour' ? x.grams : 0), 0) } : undefined}
                onName={(v) => rename(r, v)}
                onQty={(v) => setQty(r, v)}
                onGrams={bakers ? (g) => setGrams(r, g) : undefined}
                onOptions={() => setOpt(r.i)}
                onRemove={() => remove(r.i)}
              />
            ))}
          </ul>
          {!locked && f.ingredients.length < F_LIMITS.ingredients ? (
            <>
              <QuickAdd method={f.method} onAdd={(text) => add(st.index, text)} />
              {st.index === c.stages.length - 1 && f.stages.length < F_LIMITS.stages ? (
                <div className="btn-row">
                  <button type="button" className="btn small" onClick={addStage}>
                    <Icon name="plus" size={16} /> Add a stage{f.stages.length ? '' : ' (a biga, a poolish, a levain…)'}
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ))}
      {!locked && bakers && flours > 1 ? <p className="note">The flours together are 100%: when you change one share, the biggest of the others makes up the difference.</p> : null}
      {!locked && f.stages.length ? <p className="note">A stage is another part of the recipe, such as a levain, a tangzhong or a filling. Move an ingredient into it from its options. Flour in a stage still counts toward the 100%.</p> : null}
      {c.warnings.length ? <p className="warn">{c.warnings.join(' ')}</p> : null}

      <IngredientOptions
        f={f}
        i={opt}
        onClose={() => setOpt(null)}
        onChange={(patch) => opt !== null && upd(opt, patch)}
        onRole={(role) => {
          if (opt === null) return;
          // A new flour joins the 100%: it starts at 0% and takes a share from the others as you raise it.
          setF((p) => {
            const was = p.ingredients[opt].role;
            let ingredients = p.ingredients.map((x, j) => (j === opt ? { ...x, role } : x));
            if (p.method === 'bakers' && (role === 'flour') !== (was === 'flour')) {
              const idx = ingredients.map((x, j) => (x.role === 'flour' ? j : -1)).filter((j) => j >= 0);
              const col = balance(idx.map((j) => (j === opt ? 0 : ingredients[j].qty)));
              ingredients = ingredients.map((x, j) => (idx.includes(j) ? { ...x, qty: col[idx.indexOf(j)] } : x));
            }
            return { ...p, ingredients };
          });
        }}
      />
    </section>
  );
}

/** Add an ingredient by typing it: "900g flour", "Salt 2.8%", or just a name. */
function QuickAdd({ method, onAdd }: { method: Formula['method']; onAdd: (text: string) => void }) {
  const [text, setText] = useState('');
  const submit = () => {
    onAdd(text);
    setText('');
  };
  return (
    <form
      className="qadd"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <input
        className="tin"
        value={text}
        placeholder={method === 'bakers' ? 'Add: salt 2.8%, or just a name' : 'Add: 900g flour, or just a name'}
        aria-label="Add an ingredient"
        autoComplete="off"
        autoCapitalize="none"
        enterKeyHint="done"
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit" className="btn small">
        <Icon name="plus" size={16} /> Add
      </button>
    </form>
  );
}

/** One ingredient: its name and grams, under them its share or amount, and how it reads in its own unit. */
function IngredientRow({
  r,
  f,
  flours,
  focus,
  stage,
  onName,
  onQty,
  onGrams,
  onOptions,
  onRemove,
}: {
  r: Row;
  f: Formula;
  flours: number;
  focus: boolean;
  /** The stage it's in, when not the main mix: water reads against that stage's flour too. */
  stage?: { name: string; flour: number };
  onName: (v: string) => void;
  onQty: (v: number) => void;
  /** Baker's percentages: set the grams and let the % follow. */
  onGrams?: (g: number) => void;
  onOptions: () => void;
  onRemove: () => void;
}) {
  const locked = useLocked();
  const bakers = f.method === 'bakers';
  const label = r.name || 'Ingredient';
  // Amounts are edited in the ingredient's own unit (3 eggs, 250 ml) and stored as grams.
  const per = r.unit === 'g' ? 1 : r.unit === 'kg' ? 1000 : r.unit === 'l' ? r.per * 1000 : r.per;
  const unitLabel = r.unit === 'each' ? '' : r.unit;
  const sub = [
    r.role === 'flour' ? (bakers && flours > 1 ? 'share of all the flour' : 'flour') : r.role === 'water' ? 'water' : '',
    !bakers && r.pct !== null && r.role !== 'flour' ? `${pctText(r.pct)} of flour` : '',
    stage && r.role !== 'flour' && stage.flour > 0 && r.grams > 0 ? `${pctText((r.grams / stage.flour) * 100)} of the ${stage.name} flour` : '',
    r.equiv ?? '',
    r.optional ? 'optional' : '',
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <li className="mrow">
      <input
        className="tin mname"
        type="text"
        value={r.name}
        placeholder="Ingredient"
        maxLength={F_LIMITS.ingredientName}
        aria-label="Ingredient name"
        autoComplete="off"
        enterKeyHint="done"
        readOnly={locked}
        data-locked={locked ? '' : undefined}
        autoFocus={focus && !locked}
        onChange={(e) => onName(e.target.value)}
      />
      {onGrams && !locked ? <GramsEdit grams={r.grams} label={label} onGrams={onGrams} /> : <span className="mg">{grams(r.grams)}</span>}
      <div className="mpct">
        {bakers && r.role === 'flour' && flours < 2 ? (
          <span className="mfixed">100%</span>
        ) : bakers ? (
          <Stepper
            label={`${label} share`}
            hideLabel
            unit="%"
            min={0}
            max={r.role === 'flour' ? 100 : F_LIMITS.pct}
            dec={3}
            show={pctText}
            value={r.qty}
            bump={adaptive((v) => stepFor(v, 'bakers', r.role), 0, r.role === 'flour' ? 100 : F_LIMITS.pct)}
            onChange={onQty}
          />
        ) : (
          <Stepper
            label={`${label} amount`}
            hideLabel
            unit={unitLabel}
            min={0}
            max={F_LIMITS.grams / per}
            dec={per >= 100 ? 2 : 1}
            show={(v) => `${num(v, per >= 100 ? 2 : 1)}${unitLabel ? ` ${unitLabel}` : ''}`}
            value={+(r.qty / per).toFixed(3)}
            bump={adaptive((v) => (r.unit === 'each' ? (v < 2 ? 0.25 : 0.5) : r.unit === 'kg' || r.unit === 'l' ? (v < 1 ? 0.05 : 0.1) : stepFor(v, 'amounts', r.role)), 0, F_LIMITS.grams / per)}
            parse={(v) => Math.min(F_LIMITS.grams / per, Math.max(0, v))}
            onChange={(v) => onQty(+(v * per).toFixed(3))}
          />
        )}
      </div>
      {locked ? null : (
        <div className="mbtns">
          <button type="button" className="xbtn" aria-label={`Options for ${label}`} onClick={onOptions}>
            <Icon name="sliders" size={18} />
          </button>
          <button type="button" className="xbtn" aria-label={`Remove ${label}`} onClick={onRemove}>
            <Icon name="trash" size={18} />
          </button>
        </div>
      )}
      {sub ? <small className="msub">{sub}</small> : null}
    </li>
  );
}

/**
 * A stage's line, the way a biga is described: its share of all the flour, its own hydration, and its
 * weight: "90% of the flour · 50% hydration · 1352 g". The main mix just gets its weight, since its
 * water usually counts against flour held in the other stages.
 */
function stageLine(rows: Row[], total: number, main: boolean, allFlour: number): string {
  const flour = rows.reduce((a, r) => a + (r.role === 'flour' ? r.grams : 0), 0);
  const water = rows.reduce((a, r) => a + (r.role === 'water' ? r.grams : 0), 0);
  if (main) return g0(total);
  return [allFlour > 0 && flour > 0 ? `${num((flour / allFlour) * 100, 1)}% of the flour` : '', flour > 0 && water > 0 ? `${num((water / flour) * 100, 1)}% hydration` : '', g0(total)]
    .filter(Boolean)
    .join(' · ');
}

const ROLE_NAME: Record<Role, string> = { flour: 'Flour', water: 'Water', other: 'Other' };
const DENSITIES = [
  { name: 'Water', per: 1 },
  { name: 'Milk', per: 1.03 },
  { name: 'Oil', per: 0.92 },
  { name: 'Honey', per: 1.42 },
];
const PIECES = [
  { name: 'Egg', per: 50 },
  { name: 'Yolk', per: 18 },
  { name: 'White', per: 33 },
];

/** An ingredient's options: what it is, how it reads, whether it's optional, which stage it's in. */
function IngredientOptions({
  f,
  i,
  onClose,
  onChange,
  onRole,
}: {
  f: Formula;
  i: number | null;
  onClose: () => void;
  onChange: (patch: Partial<Ingredient>) => void;
  onRole: (role: Role) => void;
}) {
  const x = i !== null ? f.ingredients[i] : undefined;
  return (
    <Sheet open={x !== undefined} onClose={onClose} title={x?.name || 'Ingredient'} label="Ingredient options">
      {x ? (
        <Locked.Provider value={false}>
          <div className="opts">
            <div className="sub-h">What it is</div>
            <div className="chips" role="group" aria-label="Role">
              {(['flour', 'water', 'other'] as const).map((role) => (
                <button key={role} type="button" className="chip-btn" aria-pressed={x.role === role} onClick={() => onRole(role)}>
                  {ROLE_NAME[role]}
                </button>
              ))}
            </div>
            <p className="note">The flours together are the 100% of a baker’s-percentage recipe. Water counts toward the hydration and the water temperature.</p>

            <div className="sub-h">Read it in</div>
            <div className="chips" role="group" aria-label="Unit">
              {UNITS.map((u) => (
                <button key={u} type="button" className="chip-btn" aria-pressed={x.unit === u} onClick={() => onChange({ unit: u, per: defaultPer(x, u) })}>
                  {UNIT_NAME[u]}
                </button>
              ))}
            </div>
            {x.unit === 'ml' || x.unit === 'l' ? (
              <>
                <div className="grid">
                  <Stepper label="Grams per ml" unit="g" min={0.1} max={3} step={0.01} dec={2} value={x.per} onChange={(per) => onChange({ per })} />
                </div>
                <div className="chips" role="group" aria-label="Typical densities">
                  {DENSITIES.map((p) => (
                    <button key={p.name} type="button" className="chip-btn" aria-pressed={x.per === p.per} onClick={() => onChange({ per: p.per })}>
                      {p.name} <span>{p.per}</span>
                    </button>
                  ))}
                </div>
                <p className="note">The recipe still says grams; this is how to read them as a volume. Not every ml weighs a gram: oil is lighter, honey heavier.</p>
              </>
            ) : x.unit === 'each' ? (
              <>
                <div className="grid">
                  <Stepper label="Grams each" unit="g" min={0.1} max={F_LIMITS.per} step={1} dec={1} value={x.per} onChange={(per) => onChange({ per })} />
                </div>
                <div className="chips" role="group" aria-label="Typical weights">
                  {PIECES.map((p) => (
                    <button key={p.name} type="button" className="chip-btn" aria-pressed={x.per === p.per} onClick={() => onChange({ per: p.per })}>
                      {p.name} <span>{p.per} g</span>
                    </button>
                  ))}
                </div>
                <p className="note">
                  The recipe says grams, never a whole number of eggs: whisk the eggs and weigh out what it asks for. The “about ⅔ egg” beside it is only a hint,
                  from the weight of one without its shell.
                </p>
              </>
            ) : null}

            <Switch checked={x.optional} onChange={(optional) => onChange({ optional })} label="Optional" sub="Marked as optional in the list. It still counts in the totals." />

            {f.stages.length ? (
              <>
                <div className="sub-h">Goes in</div>
                <div className="chips" role="group" aria-label="Stage">
                  {['', ...f.stages].map((name, s) => (
                    <button key={s} type="button" className="chip-btn" aria-pressed={Math.min(x.stage, f.stages.length) === s} onClick={() => onChange({ stage: s })}>
                      {s === 0 ? 'Main mix' : name || `Stage ${s}`}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            <div className="sheet-actions">
              <button type="button" className="btn block" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        </Locked.Provider>
      ) : null}
    </Sheet>
  );
}

/** A sensible weight per unit when the unit changes: an egg is 50 g, a ml of water 1 g. */
function defaultPer(x: Ingredient, unit: Unit): number {
  if (unit === 'each') return x.unit === 'each' ? x.per : 50;
  if (unit === 'ml' || unit === 'l') {
    if (x.unit === 'ml' || x.unit === 'l') return x.per;
    const guess = DENSITIES.find((p) => new RegExp(p.name, 'i').test(x.name));
    return guess?.per ?? 1;
  }
  return 1;
}

/* ---------- category ---------- */

/** What the recipe is for. It changes the yield's wording, the method template and the dough-temperature card. */
export function CategoryChips({ d }: { d: FormulaD }) {
  const { f, set } = d;
  const locked = useLocked();
  return (
    <div className="chips" role="group" aria-label="Recipe type">
      {CATEGORIES.map((cat: Category) => (
        <button
          key={cat}
          type="button"
          className="chip-btn"
          aria-pressed={f.category === cat}
          aria-disabled={locked || undefined}
          data-locked={locked ? '' : undefined}
          onClick={() => !locked && set('category', cat)}
        >
          {CATEGORY_NAME[cat]}
        </button>
      ))}
    </div>
  );
}

/* ---------- method ---------- */

export function MethodCard({ d, order }: { d: FormulaD; order?: number }) {
  const { f, setF } = d;
  const locked = useLocked();
  const focusNew = useRef(false);
  const upd = (i: number, patch: Partial<Formula['steps'][number]>) => setF((p) => ({ ...p, steps: p.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  const total = f.steps.reduce((a, s) => a + s.min, 0);
  const shown = locked ? realSteps(f.steps) : f.steps;
  const template = STEP_TEMPLATE[f.category];
  return (
    <section className="card" id="method" aria-labelledby="h-method" style={mobileOrder(order)}>
      <div className="card-h">
        <h2 id="h-method">Method</h2>
        {total > 0 ? <span className="hint">About {fmtDur(total)} in all</span> : null}
      </div>
      {shown.length ? (
        locked ? (
          <ol className="steps">
            {shown.map((s, i) => (
              <li key={i}>
                <span>
                  {s.text || <i>Step {i + 1}</i>}
                  {stepMeta(s) ? <small className="meta">{stepMeta(s)}</small> : null}
                  {s.note ? <small className="meta note-l">{s.note}</small> : null}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <ol className="esteps">
            {f.steps.map((s, i) => (
              <li key={i}>
                <span className="num" aria-hidden="true">
                  {i + 1}
                </span>
                <AutoText
                  className="tin ta"
                  value={s.text}
                  maxLength={F_LIMITS.stepText}
                  placeholder="What to do"
                  aria-label={`Step ${i + 1}`}
                  autoFocus={focusNew.current && i === f.steps.length - 1}
                  onChange={(v) => upd(i, { text: v })}
                />
                <button type="button" className="xbtn" aria-label={`Remove step ${i + 1}`} onClick={() => setF((p) => ({ ...p, steps: p.steps.filter((_, j) => j !== i) }))}>
                  <Icon name="trash" size={18} />
                </button>
                <div className="smeta">
                  <Stepper
                    label="Time"
                    unit="min"
                    min={0}
                    max={F_LIMITS.stepMin}
                    dec={0}
                    value={s.min}
                    show={(v) => (v ? shortDur(v) : '–')}
                    bump={adaptive((v) => (v < 60 ? 5 : v < 240 ? 15 : 60), 0, F_LIMITS.stepMin)}
                    onChange={(v) => upd(i, { min: v })}
                  />
                  <TempInput value={s.tempC} onChange={(tempC) => upd(i, { tempC })} />
                  <input
                    className="tin snote"
                    value={s.note}
                    maxLength={F_LIMITS.stepNote}
                    placeholder="Note (optional)"
                    aria-label={`Note for step ${i + 1}`}
                    autoComplete="off"
                    onChange={(e) => upd(i, { note: e.target.value })}
                  />
                </div>
              </li>
            ))}
          </ol>
        )
      ) : (
        <p className="note">{locked ? 'No steps yet. Tap Edit to write the method.' : 'Numbered steps, each with a time and a temperature if it needs one. Times are a guide, not a schedule.'}</p>
      )}
      {!locked ? (
        <div className="btn-row">
          <button
            type="button"
            className="btn small"
            disabled={f.steps.length >= F_LIMITS.steps}
            onClick={() => {
              focusNew.current = true;
              setF((p) => ({ ...p, steps: [...p.steps, emptyStep()] }));
            }}
          >
            <Icon name="plus" size={16} /> Add step
          </button>
          {!f.steps.length && template.length ? (
            <button type="button" className="btn small" onClick={() => setF((p) => ({ ...p, steps: structuredClone(template) }))}>
              Start from a {CATEGORY_NAME[f.category].toLowerCase()} template
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/** A temperature in °C, or none; shows the °F beside it. */
function TempInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [text, setText] = useState<string | null>(null);
  return (
    <label className="stp">
      <span className="sr-only">Temperature</span>
      <div className="ctl temp">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="–"
          aria-label="Temperature, °C"
          value={text ?? (value === null ? '' : String(value))}
          onFocus={() => setText(value === null ? '' : String(value))}
          onChange={(e) => {
            setText(e.target.value);
            const v = parseFloat(e.target.value.replace(',', '.'));
            onChange(Number.isFinite(v) ? Math.min(F_LIMITS.tempC.max, Math.max(F_LIMITS.tempC.min, v)) : null);
          }}
          onBlur={() => setText(null)}
        />
        <span className="tf">{value === null ? '°C' : `${Math.round((value * 9) / 5 + 32)} °F`}</span>
      </div>
    </label>
  );
}

/** A textarea that grows with its text. */
function AutoText({
  value,
  onChange,
  ...rest
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> & { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return <textarea ref={ref} rows={2} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />;
}

/* ---------- dough temperature ---------- */

/** For a dough: the water temperature that lands it on the target, by the heat balance. */
export function FormulaTemp({ d, order }: { d: FormulaD; order?: number }) {
  const { f, set, c } = d;
  const locked = useLocked();
  const [open, setOpen] = useStoredFlag('biga-open-temp', false);
  const w = c.mixWater;
  const summary = w ? (w.ice ? `Water ${Math.round(w.ice)} g ice` : `Water ${Math.round(w.water)} °C`) : undefined;
  return (
    <Fold title="Dough temperature" summary={summary} open={open} onToggle={setOpen} order={order}>
      {w ? (
        <div className={'water' + (w.ice ? ' cold' : w.tooHot ? ' hot' : '')}>
          <div className="water-main">
            <span className="k">Water</span>
            <span className="v">{w.ice ? `${Math.round(w.ice)} g ice` : `${Math.round(w.water)} °C`}</span>
          </div>
          <p>
            {w.ice ? (
              <>
                The water would need to be {Math.round(w.water)} °C. Use {Math.round(w.ice)} g of ice plus {Math.round(c.water - w.ice)} g of fridge-cold water, or
                chill the flour, to land on {f.ddt} °C.
              </>
            ) : w.tooHot ? (
              <>Keep the water under {WATER_MAX} °C: it goes straight onto the yeast. Let the flour warm up first, or accept a cooler dough.</>
            ) : (
              <>
                {Math.round(c.water)} g at {Math.round(w.water)} °C lands the dough on {f.ddt} °C, with {f.friction} °C from the mixer.
              </>
            )}
            {c.holdBack ? (
              <>
                {' '}
                Mix with <b>{c.holdBack.first} g</b> first, to {FIRST_HYD}% hydration, then drizzle in the last <b>{c.holdBack.rest} g</b> as it mixes.
              </>
            ) : null}
          </p>
        </div>
      ) : (
        <p className="note">Add water (an ingredient with the water role) and a flour to work out the water temperature.</p>
      )}
      <div className="grid">
        <FField d={d} k="ddt" />
        <FField d={d} k="room" />
        <FField d={d} k="flourT" />
        <FField d={d} k="friction" />
      </div>
      <div className="chips" role="group" aria-label="Mixing method">
        {MIXERS.map((mx) => (
          <button
            key={mx.id}
            type="button"
            className="chip-btn"
            aria-pressed={f.friction === mx.rise}
            aria-disabled={locked || undefined}
            data-locked={locked ? '' : undefined}
            onClick={() => !locked && set('friction', mx.rise)}
          >
            {mx.label} <span>+{mx.rise}°</span>
          </button>
        ))}
      </div>
      <p className="note">
        A heat balance: the flour and the water counted by weight and by how much heat each holds, plus the mixer’s heat. Only the water counts as water
        here; milk or eggs go in at room temperature.
      </p>
    </Fold>
  );
}
