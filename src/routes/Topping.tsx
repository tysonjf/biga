import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import {
  BASE_NAME,
  BASE_SUB,
  BASES,
  TOPPING_LIMITS,
  WHEN_NAME,
  WHENS,
  type Base,
  type Item,
  type Topping,
  type ToppingData,
  type When,
} from '../../shared/topping';
import { CLASSIC_BY_ID } from '../lib/classics';
import { amount, fromClassic, usePizzaCount, type Classic } from '../lib/toppings';
import { useDeleteTopping, useSaveTopping, useTopping } from '../lib/query';
import { useDebouncedEffect } from '../lib/useDebounced';
import { toast } from '../lib/toast';
import { Page } from '../components/Page';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { Stepper } from '../components/Stepper';
import { IngredientsView, type Stage } from '../components/IngredientsView';
import { useCreateTopping } from './Toppings';

export function ToppingPage() {
  const { id } = useParams({ from: '/toppings/$id' });
  const classic = CLASSIC_BY_ID.get(id);
  if (classic) return <ClassicPage key={id} c={classic} />;
  return <OwnPage id={id} />;
}

function OwnPage({ id }: { id: string }) {
  const { topping, isPending } = useTopping(id);
  if (!topping) {
    return (
      <Page title="" left={<BackButton />}>
        {isPending ? (
          <div className="empty" aria-busy="true" />
        ) : (
          <div className="empty">
            <h2>Topping not found</h2>
            <p>It may have been deleted on another device.</p>
            <Link to="/toppings" className="btn">
              Back to toppings
            </Link>
          </div>
        )}
      </Page>
    );
  }
  return <OwnTopping key={topping.id} topping={topping} />;
}

function BackButton() {
  return (
    <Link to="/toppings" className="nav-btn back" aria-label="Back to toppings" viewTransition={{ types: ['pop'] }}>
      <Icon name="back" />
      <span>Toppings</span>
    </Link>
  );
}

/* ---------- shared view pieces ---------- */

const pizzas = (n: number) => `${n} pizza${n === 1 ? '' : 's'}`;

/** Ingredient groups for the card and the full-screen view, scaled to `n` pizzas. */
function stagesOf(items: Item[], n: number): Stage[] {
  return WHENS.map((w) => ({
    key: w,
    title: WHEN_NAME[w],
    items: items
      .filter((i) => i.when === w && (i.name.trim() || i.qty > 0))
      .map((i) => ({ n: i.name.trim() || 'Ingredient', short: i.name.split(',')[0].trim() || undefined, sub: i.note || undefined, g: amount(i, n) })),
  })).filter((s) => s.items.length);
}

function ExpandButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="nav-btn" aria-label="Show the ingredients full screen" onClick={onClick}>
      <Icon name="expand" />
    </button>
  );
}

function IngredientsCard({ stages, n, setN, onFull }: { stages: Stage[]; n: number; setN: (v: number) => void; onFull: () => void }) {
  return (
    <section className="card" aria-labelledby="h-ing">
      <div className="card-h">
        <h2 id="h-ing">Ingredients</h2>
        <button type="button" className="btn small" onClick={onFull}>
          <Icon name="expand" size={16} /> Full screen
        </button>
      </div>
      <div className="pizzas">
        <div>
          <b>Pizzas</b>
          <small>30–33&nbsp;cm, 250–280&nbsp;g balls</small>
        </div>
        <Stepper label="Pizzas" hideLabel value={n} min={1} max={24} onChange={setN} />
      </div>
      {stages.length ? (
        stages.map((st) => (
          <div className="stage" key={st.key}>
            <div className="stage-h">
              <h3>{st.title}</h3>
            </div>
            <ul className="ing">
              {st.items.map((it, i) => (
                <li key={i}>
                  <span className="n">
                    {it.n}
                    {it.sub ? <small>{it.sub}</small> : null}
                  </span>
                  <span className="g">{it.g}</span>
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p className="note">No ingredients yet. Tap Edit to add some.</p>
      )}
    </section>
  );
}

function MethodCard({ steps, tip, children }: { steps: string[]; tip?: string; children?: React.ReactNode }) {
  const list = steps.filter((s) => s.trim());
  return (
    <section className="card" aria-labelledby="h-method">
      <h2 id="h-method">Method</h2>
      {list.length ? (
        <ol className="steps">
          {list.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      ) : (
        <p className="note">No steps yet.</p>
      )}
      {tip ? (
        <p className="tip">
          <Icon name="info" size={18} />
          <span>{tip}</span>
        </p>
      ) : null}
      {children}
    </section>
  );
}

const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

/* ---------- a built-in classic ---------- */

function ClassicPage({ c }: { c: Classic }) {
  const [n, setN] = usePizzaCount();
  const [full, setFull] = useState(false);
  const create = useCreateTopping();
  const stages = useMemo(() => stagesOf(c.items, n), [c.items, n]);
  const sub = [c.italian && c.italian !== c.name ? c.italian : '', c.origin].filter(Boolean).join(' · ');

  return (
    <Page
      title={c.name}
      className="topping"
      left={<BackButton />}
      right={<ExpandButton onClick={() => setFull(true)} />}
      large={
        <div className="title-block">
          <div className="chips">
            <span className={`chip base ${c.base}`}>{BASE_NAME[c.base]}</span>
            <span className="chip plain">{c.era === 'classic' ? 'Classic' : 'Contemporary'}</span>
          </div>
          <h1 className="title-h">{c.name}</h1>
          {sub ? <p className="title-sub">{sub}</p> : null}
          <p className="lede">{c.blurb}</p>
          <button type="button" className="btn small" onClick={() => create({ name: c.name, data: fromClassic(c) })}>
            <Icon name="copy" size={16} /> Make it yours
          </button>
        </div>
      }
    >
      <div className="cols">
        <div className="col">
          <IngredientsCard stages={stages} n={n} setN={setN} onFull={() => setFull(true)} />
        </div>
        <div className="col sticky">
          <MethodCard steps={c.steps} tip={c.tip}>
            {c.sources.length ? (
              <p className="note sources">
                Sources:{' '}
                {c.sources.map((s, i) => (
                  <span key={s}>
                    {i ? ' · ' : ''}
                    <a href={s} target="_blank" rel="noopener noreferrer">
                      {host(s)}
                    </a>
                  </span>
                ))}
              </p>
            ) : null}
          </MethodCard>
        </div>
      </div>
      <IngredientsView open={full} onClose={() => setFull(false)} title={c.name} sub={`${pizzas(n)} · ${BASE_NAME[c.base]}`} stages={stages} />
    </Page>
  );
}

/* ---------- your own topping ---------- */

const WHEN_HINT: Record<When, string> = {
  base: 'Sauce or cream, spread first',
  top: 'Goes on before the oven',
  finish: 'Added once it’s out',
};

const UNITS = ['g', 'ml', 'leaf', 'slice', 'clove', 'sprig', 'fillet', 'piece', 'handful', 'pinch', 'tsp', 'tbsp'];

/** Drop rows that were added but never filled in. */
const tidy = (d: ToppingData): ToppingData => ({
  ...d,
  items: d.items.filter((i) => i.name.trim() || i.qty > 0),
  steps: d.steps.filter((s) => s.trim()),
});

function OwnTopping({ topping }: { topping: Topping }) {
  const search = useSearch({ from: '/toppings/$id' });
  const [name, setName] = useState(topping.name);
  const [data, setData] = useState<ToppingData>(topping.data);
  const [editing, setEditing] = useState(!!search.edit);
  const [menu, setMenu] = useState<null | 'menu' | 'delete'>(null);
  const [full, setFull] = useState(false);
  const [n, setN] = usePizzaCount();
  const save = useSaveTopping();
  const del = useDeleteTopping();
  const create = useCreateTopping();
  const navigate = useNavigate();

  const draft = useMemo(() => ({ name, data }), [name, data]);
  const autosave = useDebouncedEffect(draft, 400, (d) =>
    save.mutate({ ...topping, name: d.name.trim().slice(0, TOPPING_LIMITS.name) || 'Untitled', data: d.data, updatedAt: Date.now() }),
  );

  const set = <K extends keyof ToppingData>(k: K, v: ToppingData[K]) => setData((p) => ({ ...p, [k]: v }));
  const stages = useMemo(() => stagesOf(data.items, n), [data.items, n]);
  const from = data.from ? CLASSIC_BY_ID.get(data.from) : undefined;

  const done = () => {
    setData(tidy);
    setEditing(false);
    navigate({ to: '/toppings/$id', params: { id: topping.id }, search: {}, replace: true });
  };

  const remove = () => {
    autosave.cancel();
    const snapshot: Topping = { ...topping, name, data };
    del.mutate({ id: topping.id });
    navigate({ to: '/toppings', viewTransition: { types: ['pop'] } });
    toast(`Deleted “${snapshot.name || 'Untitled'}”`, {
      label: 'Undo',
      run: () => save.mutate({ ...snapshot, updatedAt: Date.now() }),
    });
  };

  return (
    <Page
      title={name || 'Untitled'}
      className="topping"
      left={<BackButton />}
      right={
        <>
          <button type="button" className="nav-btn text" onClick={() => (editing ? done() : setEditing(true))}>
            {editing ? 'Done' : 'Edit'}
          </button>
          <button type="button" className="nav-btn" aria-label="Topping actions" onClick={() => setMenu('menu')}>
            <Icon name="more" />
          </button>
        </>
      }
      large={
        <div className="title-block">
          <div className="chips">
            <span className={`chip base ${data.base}`}>{BASE_NAME[data.base]}</span>
            <span className="chip plain">Yours</span>
          </div>
          <input
            className="title-input"
            value={name}
            maxLength={TOPPING_LIMITS.name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Topping name"
            enterKeyHint="done"
            autoComplete="off"
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
          {from ? (
            <p className="title-sub">
              Based on the{' '}
              <Link to="/toppings/$id" params={{ id: from.id }} className="link" viewTransition={{ types: ['push'] }}>
                {from.name}
              </Link>
            </p>
          ) : null}
        </div>
      }
    >
      {editing ? (
        <div className="cols">
          <div className="col">
            <section className="card" aria-labelledby="h-base">
              <h2 id="h-base">Base</h2>
              <div className="segmented" role="radiogroup" aria-label="Base">
                {BASES.map((b: Base) => (
                  <button key={b} type="button" role="radio" aria-checked={data.base === b} onClick={() => set('base', b)}>
                    {BASE_NAME[b]}
                  </button>
                ))}
              </div>
              <p className="note">{BASE_SUB[data.base]}</p>
            </section>
            <EditItems items={data.items} setItems={(f) => setData((p) => ({ ...p, items: f(p.items) }))} />
          </div>
          <div className="col">
            <EditSteps steps={data.steps} setSteps={(f) => setData((p) => ({ ...p, steps: f(p.steps) }))} />
            <section className="card" aria-labelledby="h-notes">
              <h2 id="h-notes">Notes</h2>
              <AutoText
                className="tin ta"
                value={data.notes}
                maxLength={TOPPING_LIMITS.notes}
                placeholder="Where the ingredients come from, what you’d change next time…"
                aria-label="Notes"
                onChange={(v) => set('notes', v)}
              />
            </section>
            <button type="button" className="btn primary lg block" onClick={done}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="cols">
          <div className="col">
            <IngredientsCard stages={stages} n={n} setN={setN} onFull={() => setFull(true)} />
          </div>
          <div className="col sticky">
            <MethodCard steps={data.steps} />
            {data.notes.trim() ? (
              <section className="card notes" aria-labelledby="h-notes">
                <h2 id="h-notes">Notes</h2>
                <p className="prose">{data.notes}</p>
              </section>
            ) : null}
          </div>
        </div>
      )}

      <IngredientsView open={full} onClose={() => setFull(false)} title={name || 'Untitled'} sub={`${pizzas(n)} · ${BASE_NAME[data.base]}`} stages={stages} />

      <Sheet open={menu !== null} onClose={() => setMenu(null)} title={menu === 'delete' ? `Delete “${name || 'Untitled'}”?` : undefined} label="Topping actions">
        {menu === 'delete' ? (
          <div className="sheet-actions">
            <button type="button" className="btn danger block" onClick={remove}>
              Delete topping
            </button>
            <button type="button" className="btn block" onClick={() => setMenu(null)}>
              Keep it
            </button>
          </div>
        ) : (
          <div className="sheet-actions">
            <button
              type="button"
              className="action"
              onClick={() => {
                autosave.flush();
                setMenu(null);
                create({ name: `${name || 'Untitled'} (copy)`, data: tidy(data) });
              }}
            >
              <Icon name="copy" /> Duplicate
            </button>
            <button type="button" className="action danger" onClick={() => setMenu('delete')}>
              <Icon name="trash" /> Delete
            </button>
            <button type="button" className="btn block" onClick={() => setMenu(null)}>
              Cancel
            </button>
          </div>
        )}
      </Sheet>
    </Page>
  );
}

/* ---------- editing ---------- */

type Update<T> = (f: (prev: T) => T) => void;

function EditItems({ items, setItems }: { items: Item[]; setItems: Update<Item[]> }) {
  const full = items.length >= TOPPING_LIMITS.items;
  const upd = (i: number, patch: Partial<Item>) => setItems((p) => p.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const focusNew = useRef(false);
  return (
    <section className="card" aria-labelledby="h-eing">
      <div className="card-h">
        <h2 id="h-eing">Ingredients</h2>
        <span className="hint">Amounts for one pizza</span>
      </div>
      <datalist id="units">
        {UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
      {WHENS.map((w) => (
        <div className="estage" key={w}>
          <div className="sub-h">
            {WHEN_NAME[w]}
            <span className="fsum">{WHEN_HINT[w]}</span>
          </div>
          {items.map((it, i) =>
            it.when === w ? (
              <div className="irow" key={i}>
                <input
                  className="tin iname"
                  value={it.name}
                  maxLength={TOPPING_LIMITS.itemName}
                  placeholder="Ingredient"
                  aria-label="Ingredient"
                  autoComplete="off"
                  enterKeyHint="next"
                  ref={(el) => {
                    if (el && focusNew.current && i === items.length - 1) {
                      focusNew.current = false;
                      el.focus();
                    }
                  }}
                  onChange={(e) => upd(i, { name: e.target.value })}
                />
                <button type="button" className="xbtn" aria-label={`Remove ${it.name || 'ingredient'}`} onClick={() => setItems((p) => p.filter((_, j) => j !== i))}>
                  <Icon name="trash" size={18} />
                </button>
                <QtyInput value={it.qty} onChange={(qty) => upd(i, { qty })} />
                <input
                  className="tin iunit"
                  list="units"
                  value={it.unit}
                  maxLength={TOPPING_LIMITS.unit}
                  placeholder="Unit"
                  aria-label="Unit"
                  autoComplete="off"
                  autoCapitalize="none"
                  onChange={(e) => upd(i, { unit: e.target.value })}
                />
                <input
                  className="tin inote"
                  value={it.note}
                  maxLength={TOPPING_LIMITS.note}
                  placeholder="Note"
                  aria-label="Note"
                  autoComplete="off"
                  onChange={(e) => upd(i, { note: e.target.value })}
                />
              </div>
            ) : null,
          )}
          <div>
            <button
              type="button"
              className="btn small"
              disabled={full}
              onClick={() => {
                focusNew.current = true;
                setItems((p) => [...p, { name: '', qty: 0, unit: w === 'base' ? 'g' : '', when: w, note: '' }]);
              }}
            >
              <Icon name="plus" size={16} /> Add
            </button>
          </div>
        </div>
      ))}
      <p className="note">Leave the amount empty for “to taste”. Amounts scale with the number of pizzas.</p>
    </section>
  );
}

function QtyInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState<string | null>(null);
  return (
    <input
      className="tin iqty"
      type="text"
      inputMode="decimal"
      placeholder="Qty"
      aria-label="Amount per pizza"
      autoComplete="off"
      value={text ?? (value ? String(value) : '')}
      onFocus={() => setText(value ? String(value) : '')}
      onChange={(e) => {
        setText(e.target.value);
        const v = parseFloat(e.target.value.replace(',', '.'));
        onChange(Number.isFinite(v) ? Math.min(10_000, Math.max(0, v)) : 0);
      }}
      onBlur={() => setText(null)}
    />
  );
}

function EditSteps({ steps, setSteps }: { steps: string[]; setSteps: Update<string[]> }) {
  const focusNew = useRef(false);
  useEffect(() => {
    focusNew.current = false; // only the step just added takes focus
  });
  return (
    <section className="card" aria-labelledby="h-esteps">
      <h2 id="h-esteps">Method</h2>
      {steps.length ? (
        <ol className="esteps">
          {steps.map((s, i) => (
            <li key={i}>
              <span className="num" aria-hidden="true">
                {i + 1}
              </span>
              <AutoText
                className="tin ta"
                value={s}
                maxLength={TOPPING_LIMITS.step}
                placeholder="What to do"
                aria-label={`Step ${i + 1}`}
                autoFocus={focusNew.current && i === steps.length - 1}
                onChange={(v) => setSteps((p) => p.map((x, j) => (j === i ? v : x)))}
              />
              <button type="button" className="xbtn" aria-label={`Remove step ${i + 1}`} onClick={() => setSteps((p) => p.filter((_, j) => j !== i))}>
                <Icon name="trash" size={18} />
              </button>
            </li>
          ))}
        </ol>
      ) : null}
      <div>
        <button
          type="button"
          className="btn small"
          disabled={steps.length >= TOPPING_LIMITS.steps}
          onClick={() => {
            focusNew.current = true;
            setSteps((p) => [...p, '']);
          }}
        >
          <Icon name="plus" size={16} /> Add step
        </button>
      </div>
    </section>
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
