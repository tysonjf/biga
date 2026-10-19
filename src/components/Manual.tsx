// A manual recipe: a plain baker's-percentage calculator. Your flours and their shares, then water,
// salt, yeast and anything else as a % of the flour. The grams follow from the dough's size.

import type { ReactNode } from 'react';
import { FIELDS, LIMITS } from '../../shared/recipe';
import { balance, g0, g1, num, rebalance } from '../lib/dough';
import { useLocked } from '../lib/lock';
import { Field, Stat, waterNote, type Dough } from './Dough';
import { mobileOrder } from './Fold';
import { Icon } from './Icon';
import { Stepper } from './Stepper';

const grams = (v: number) => (v < 10 ? g1(v) : g0(v));
const pct = (dec: number) => (v: number) => `${num(v, dec)}%`;

export function ManualCard({ d, onFull, order }: { d: Dough; onFull: () => void; order?: number }) {
  const { s, setS, set, c } = d;
  const locked = useLocked();
  const many = s.flours.length > 1;

  // Flour shares always add up to 100%: changing one moves the biggest of the others.
  const setShare = (i: number, v: number) =>
    setS((p) => {
      const col = rebalance(p.flours.map((f) => f.pct), i, v);
      return { ...p, flours: p.flours.map((f, j) => ({ ...f, pct: col[j], fin: col[j] })) };
    });
  const renameFlour = (i: number, name: string) => setS((p) => ({ ...p, flours: p.flours.map((f, j) => (j === i ? { ...f, name } : f)) }));
  const removeFlour = (i: number) =>
    setS((p) => {
      const rest = p.flours.filter((_, j) => j !== i);
      const col = balance(rest.map((f) => f.pct));
      return { ...p, flours: rest.map((f, j) => ({ ...f, pct: col[j], fin: col[j] })) };
    });
  const addFlour = () =>
    setS((p) => {
      const n = p.flours.length;
      const col = balance([...p.flours.map((f) => f.pct), 0], n);
      return { ...p, flours: [...p.flours, { name: `Flour ${n + 1}`, pct: 0, fin: 0 }].map((f, j) => ({ ...f, pct: col[j], fin: col[j] })) };
    });
  const setExtra = (i: number, patch: Partial<{ name: string; pct: number }>) =>
    setS((p) => ({ ...p, extras: p.extras.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));

  return (
    <section className="card" id="ingredients" aria-labelledby="h-ingredients" style={mobileOrder(order)}>
      <div className="card-h">
        <h2 id="h-ingredients">Ingredients</h2>
        <button type="button" className="btn small" onClick={onFull}>
          <Icon name="expand" size={16} /> Full screen
        </button>
      </div>
      <div className="totals">
        <Stat k="Dough" v={g0(c.dough)} plain />
        <Stat k="Flour" v={g0(c.flour)} plain />
        <Stat k="Hydration" v={`${num(s.hyd, 1)}%`} plain />
      </div>
      <div className="grid three">
        <Field d={d} k="balls" />
        <Field d={d} k="bw" />
        <Field d={d} k="waste" />
      </div>

      <div className="sub-h">{many ? 'Flours · shares of the flour' : 'Flour'}</div>
      <ul className="mlist">
        {s.flours.map((f, i) => (
          <Row
            key={i}
            name={f.name}
            onName={(v) => renameFlour(i, v)}
            g={grams(c.flours[i]?.fin ?? 0)}
            onRemove={many ? () => removeFlour(i) : undefined}
          >
            {many ? (
              <Stepper label={`${f.name || 'Flour'} share`} hideLabel unit="%" step={5} min={0} max={100} dec={1} show={pct(1)} value={f.pct} onChange={(v) => setShare(i, v)} />
            ) : (
              <span className="mfixed">100%</span>
            )}
          </Row>
        ))}
      </ul>
      {many && !locked ? <p className="note">Shares always add up to 100%: when you change one, the biggest of the others makes up the difference.</p> : null}
      {s.flours.length < LIMITS.flours && !locked ? (
        <div>
          <button type="button" className="btn small" onClick={addFlour}>
            <Icon name="plus" size={16} /> Add flour
          </button>
        </div>
      ) : null}

      <div className="sub-h">% of the flour</div>
      <ul className="mlist">
        <Row name="Water" g={grams(Math.max(c.final.water, 0))} sub={waterNote(c)}>
          <Stepper {...FIELDS.hyd} label="Water" hideLabel show={pct(1)} value={s.hyd} onChange={(v) => set('hyd', v)} />
        </Row>
        <Row name="Salt" g={grams(c.final.salt)}>
          <Stepper {...FIELDS.salt} dec={2} label="Salt" hideLabel show={pct(2)} value={s.salt} onChange={(v) => set('salt', v)} />
        </Row>
        <Row name="Yeast" g={grams(c.final.yeast)}>
          <Stepper {...FIELDS.idy} label="Yeast" hideLabel show={pct(3)} value={s.idy} onChange={(v) => set('idy', v)} />
        </Row>
        {s.extras.map((x, i) => (
          <Row
            key={i}
            name={x.name}
            onName={(v) => setExtra(i, { name: v })}
            g={grams(c.extras[i]?.grams ?? 0)}
            onRemove={() => setS((p) => ({ ...p, extras: p.extras.filter((_, j) => j !== i) }))}
          >
            <Stepper label={x.name || 'Ingredient'} hideLabel unit="%" step={0.5} min={0} max={100} dec={3} show={pct(3)} value={x.pct} onChange={(v) => setExtra(i, { pct: v })} />
          </Row>
        ))}
      </ul>
      {s.extras.length < LIMITS.extras && !locked ? (
        <div>
          <button type="button" className="btn small" onClick={() => setS((p) => ({ ...p, extras: [...p.extras, { name: '', pct: 1 }] }))}>
            <Icon name="plus" size={16} /> Add ingredient
          </button>
        </div>
      ) : null}
      {c.warnings.length ? <p className="warn">{c.warnings.join(' ')}</p> : null}
    </section>
  );
}

/** One ingredient: its name and grams, and under them its share. */
function Row({ name, onName, g, sub, onRemove, children }: { name: string; onName?: (v: string) => void; g: string; sub?: string; onRemove?: () => void; children: ReactNode }) {
  const locked = useLocked();
  return (
    <li className="mrow">
      {onName ? (
        <input
          className="tin mname"
          type="text"
          value={name}
          placeholder="Ingredient"
          maxLength={LIMITS.flourName}
          aria-label="Ingredient name"
          autoComplete="off"
          enterKeyHint="done"
          readOnly={locked}
          data-locked={locked ? '' : undefined}
          onChange={(e) => onName(e.target.value)}
        />
      ) : (
        <span className="mname">{name}</span>
      )}
      <span className="mg">{g}</span>
      <div className="mpct">{children}</div>
      {onRemove && !locked ? (
        <button type="button" className="xbtn" aria-label={`Remove ${name || 'ingredient'}`} onClick={onRemove}>
          <Icon name="trash" size={18} />
        </button>
      ) : null}
      {sub ? <small className="msub">{sub}</small> : null}
    </li>
  );
}
