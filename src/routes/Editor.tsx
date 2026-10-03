import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { FIELDS, KIND_NAME, LIMITS, type NumKey, type Recipe, type Settings } from '../../shared/recipe';
import {
  balance,
  blend,
  calc,
  rebalance,
  fmtClock,
  fmtDay,
  fmtWeekday,
  g0,
  g1,
  MIXERS,
  nearest,
  num,
  ROOM_MAX,
  ROOM_MIN,
  roundedNow,
  timeline,
  afterReady,
  toLocalInput,
  WATER_MAX,
  type Calc,
} from '../lib/dough';
import { useDeleteRecipe, useRecipe, useSaveRecipe } from '../lib/query';
import { useDebouncedEffect } from '../lib/useDebounced';
import { toast } from '../lib/toast';
import { Page } from '../components/Page';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { Stepper } from '../components/Stepper';
import { Heatmap } from '../components/Heatmap';
import { Switch } from '../components/Switch';
import { Fold } from '../components/Fold';
import { IngredientsView, type Stage } from '../components/IngredientsView';
import { useStoredFlag } from '../lib/useStoredFlag';
import { useCreateRecipe } from './Recipes';

export function EditorPage() {
  const { id } = useParams({ from: '/r/$id' });
  const { recipe, isPending } = useRecipe(id);
  if (!recipe) {
    return (
      <Page title="" left={<BackButton />}>
        {isPending ? (
          <div className="empty" aria-busy="true" />
        ) : (
          <div className="empty">
            <h2>Recipe not found</h2>
            <p>It may have been deleted on another device.</p>
            <Link to="/" className="btn">
              Back to recipes
            </Link>
          </div>
        )}
      </Page>
    );
  }
  return <Editor key={recipe.id} recipe={recipe} />;
}

function BackButton() {
  return (
    <Link to="/" className="nav-btn back" aria-label="Back to recipes" viewTransition={{ types: ['pop'] }}>
      <Icon name="back" />
      <span>Recipes</span>
    </Link>
  );
}

const SECTIONS = [
  { id: 'yeast', label: 'Yeast' },
  { id: 'dough', label: 'Dough' },
  { id: 'recipe', label: 'Recipe' },
  { id: 'timing', label: 'Timing' },
] as const;

function Editor({ recipe }: { recipe: Recipe }) {
  const kind = recipe.kind;
  const [name, setName] = useState(recipe.name);
  const [s, setS] = useState<Settings>(recipe.settings);
  const [reveal, setReveal] = useState(0);
  const [menu, setMenu] = useState<null | 'menu' | 'delete'>(null);
  const [cook, setCook] = useState(false);
  // Folded by default: the ingredient amounts come first. Remembered on this device.
  const [tempOpen, setTempOpen] = useStoredFlag('biga-open-temp', false);
  const [timingOpen, setTimingOpen] = useStoredFlag('biga-open-timing', false);
  const save = useSaveRecipe();
  const del = useDeleteRecipe();
  const navigate = useNavigate();
  const create = useCreateRecipe();

  // Autosave: local state is the source of truth while editing; the cache is updated optimistically.
  const draft = useMemo(() => ({ name, s }), [name, s]);
  const autosave = useDebouncedEffect(draft, 400, (d) =>
    save.mutate({ ...recipe, name: d.name.trim().slice(0, LIMITS.name) || 'Untitled', settings: d.s, updatedAt: Date.now() }),
  );

  const set = useCallback(<K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v })), []);
  const c = useMemo(() => calc(kind, s), [kind, s]);
  const start = useMemo(() => (s.start ? new Date(s.start) : null), [s.start]);
  const valid = start && !Number.isNaN(start.getTime()) ? start : null;
  const tl = useMemo(() => (valid ? timeline(kind, s, valid) : null), [kind, s, valid]);
  const m = c.model;
  const st = useMemo(() => stages(kind, s, c, valid, tl), [kind, s, c, valid, tl]);
  const sub = `${s.balls} × ${s.bw} g · ${num(s.hyd, 1)}% hydration · ${g0(c.dough)} dough`;

  const onPick = useCallback((t: number, h: number) => setS((p) => ({ ...p, temp: t, hours: h })), []);

  const field = (k: NumKey, extra: Partial<Parameters<typeof Stepper>[0]> = {}) => (
    <Stepper key={k} {...FIELDS[k]} value={s[k]} onChange={(v) => set(k, v)} {...extra} />
  );

  const remove = () => {
    autosave.cancel();
    const snapshot: Recipe = { ...recipe, name, settings: s };
    del.mutate({ id: recipe.id });
    navigate({ to: '/', viewTransition: { types: ['pop'] } });
    toast(`Deleted “${snapshot.name || 'Untitled'}”`, {
      label: 'Undo',
      run: () => save.mutate({ ...snapshot, updatedAt: Date.now() }),
    });
  };

  const active = useScrollSpy(SECTIONS.map((x) => x.id));

  return (
    <Page
      title={name || 'Untitled'}
      className="editor"
      left={<BackButton />}
      right={
        <>
          <button type="button" className="nav-btn" aria-label="Show the ingredients full screen" onClick={() => setCook(true)}>
            <Icon name="expand" />
          </button>
          <button type="button" className="nav-btn" aria-label="Recipe actions" onClick={() => setMenu('menu')}>
            <Icon name="more" />
          </button>
        </>
      }
      large={
        <div className="title-block">
          <span className={`chip ${kind}`}>{KIND_NAME[kind]}</span>
          <input
            className="title-input"
            value={name}
            maxLength={LIMITS.name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Recipe name"
            enterKeyHint="done"
            autoComplete="off"
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
          <p className="title-sub">{sub}</p>
        </div>
      }
      below={
        <nav className="jump" aria-label="Sections">
          {SECTIONS.map((x) => (
            <a
              key={x.id}
              href={`#${x.id}`}
              aria-current={active === x.id ? 'true' : undefined}
              onClick={(e) => {
                e.preventDefault();
                if (x.id === 'timing') setTimingOpen(true);
                requestAnimationFrame(() => document.getElementById(x.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
              }}
            >
              {x.label}
            </a>
          ))}
        </nav>
      }
    >
      <div className="cols">
        <div className="col">
          {/* ---------- yeast ---------- */}
          <section className="card" id="yeast" aria-labelledby="h-yeast">
            <div className="card-h">
              <h2 id="h-yeast">{m.name} yeast</h2>
              <span className="hint">Tap a cell to pick temperature × time.</span>
            </div>
            <Heatmap
              model={m}
              temp={c.temp}
              hours={c.hours}
              onPick={onPick}
              start={valid}
              after={afterReady(s)}
              reveal={reveal}
            />
            <div className="grid">
              <Stepper
                big
                label="Ferment at"
                unit="°C"
                value={c.temp}
                min={m.temps[0]}
                max={m.temps.at(-1)!}
                show={(v) => `${v}°`}
                parse={(v) => nearest(m.temps, v)}
                bump={(v, dir) => {
                  const i = m.temps.indexOf(nearest(m.temps, v));
                  return m.temps[Math.max(0, Math.min(m.temps.length - 1, i + dir))];
                }}
                onChange={(v) => {
                  set('temp', v);
                  setReveal((r) => r + 1);
                }}
              />
              <Stepper
                big
                label="For"
                unit="hours"
                value={c.hours}
                min={m.hours[0]}
                max={m.hours.at(-1)!}
                show={(v) => `${v} h`}
                parse={(v) => nearest(m.hours, v)}
                bump={(v, dir) => {
                  const i = m.hours.indexOf(nearest(m.hours, v));
                  return m.hours[Math.max(0, Math.min(m.hours.length - 1, i + dir))];
                }}
                onChange={(v) => {
                  set('hours', v);
                  setReveal((r) => r + 1);
                }}
              />
            </div>
            <div className="stats">
              <Stat k={s.boost ? `IDY · boost ${s.boost > 0 ? '+' : ''}${s.boost}%` : 'IDY'} v={`${(c.preIdy * 100).toFixed(2)}%`} />
              <Stat k={`${m.name} yeast`} v={g1(c.pre.yeast)} />
              <Stat k={tl ? `Ready · ${fmtWeekday(tl.ready)}` : `${m.name} ready`} v={tl ? fmtClock(tl.ready) : '–'} />
              <Stat k={tl ? `Bake · ${fmtWeekday(tl.bake)}` : 'Bake ready'} v={tl ? fmtClock(tl.bake) : '–'} accent />
            </div>
          </section>

          {/* ---------- dough ---------- */}
          <section className="card" id="dough" aria-labelledby="h-dough">
            <h2 id="h-dough">Dough</h2>
            <div className="grid three">{(['balls', 'bw', 'hyd', 'salt', 'oil', 'waste'] as const).map((k) => field(k))}</div>
            <div className="sub-h">{m.name}</div>
            <div className="grid">
              {field('bp')}
              {kind === 'biga' ? (
                field('bh', { min: 40, max: 65 })
              ) : (
                <div className="stp fixed">
                  <label>
                    <span>Hydration</span>
                    <span className="u">%</span>
                  </label>
                  <div className="fixed-val">100</div>
                </div>
              )}
              {field('boost')}
              {field('fy')}
            </div>
            <Flours kind={kind} s={s} setS={setS} c={c} />
          </section>
        </div>

        <div className="col sticky">
          {/* ---------- recipe ---------- */}
          <section className="card" id="recipe" aria-labelledby="h-recipe">
            <div className="card-h">
              <h2 id="h-recipe">Recipe</h2>
              <button type="button" className="btn small" onClick={() => setCook(true)}>
                <Icon name="expand" size={16} /> Full screen
              </button>
            </div>
            <div className="totals">
              <Stat k="Dough" v={g0(c.dough)} plain />
              <Stat k="Flour" v={g0(c.flour)} plain />
              <Stat k="Water" v={g0(c.water)} plain />
            </div>
            <RecipeLists stages={st} />
            {c.warnings.length ? <p className="warn">{c.warnings.join(' ')}</p> : null}
          </section>

          {/* ---------- dough temperature ---------- */}
          <Fold title="Dough temperature" summary={waterSummary(c)} open={tempOpen} onToggle={setTempOpen}>
            <WaterResult c={c} s={s} />
            <div className="grid">
              {field('ddt')}
              {field('room')}
              {field('flourT')}
              {field('friction')}
            </div>
            <div className="chips" role="group" aria-label="Mixing method">
              {MIXERS.map((mx) => (
                <button
                  key={mx.id}
                  type="button"
                  className="chip-btn"
                  aria-pressed={s.friction === mx.rise}
                  onClick={() => set('friction', mx.rise)}
                >
                  {mx.label} <span>+{mx.rise}°</span>
                </button>
              ))}
            </div>
            <p className="note">
              The ball timings assume the dough comes off the mix at <b>24–26 °C</b> and the balls proof in an{' '}
              <b>
                {ROOM_MIN}–{ROOM_MAX} °C
              </b>{' '}
              room. Hitting the dough temperature matters most. The water temperature counts the {m.name.toLowerCase()} at its{' '}
              {c.temp} °C ferment temperature; check it with a probe if you can.
            </p>
            {s.room > ROOM_MAX ? (
              <p className="tip">
                <Icon name="thermo" size={18} />
                <span>
                  At {s.room} °C the final yeast drops to <b>{num(c.finalIdy, 3)}%</b> (from {num(s.fy, 2)}%) so the balls still get their 2 hours
                  without over-proofing. In a hot kitchen also aim the dough at 23–24 °C.
                </span>
              </p>
            ) : s.room < ROOM_MIN ? (
              <p className="tip">
                <Icon name="thermo" size={18} />
                <span>Below {ROOM_MIN} °C the balls will be slow. Find a warmer spot or give them longer than 2 hours.</span>
              </p>
            ) : null}
          </Fold>

          {/* ---------- timing ---------- */}
          <Fold
            id="timing"
            title="Timing"
            summary={tl ? `Bake ${fmtDay(tl.bake)}` : 'Not started'}
            open={timingOpen}
            onToggle={setTimingOpen}
          >
            <div className="startrow">
              <label>
                <span>{m.name} mixed at</span>
                <input type="datetime-local" value={s.start} onChange={(e) => set('start', e.target.value)} />
              </label>
              <button type="button" className="btn" onClick={() => set('start', toLocalInput(roundedNow()))}>
                Now
              </button>
            </div>
            <div className="grid">
              {field('buf')}
              {field('mix')}
              {field('bulk')}
              {s.fridge ? field('fridgeRest') : field('proof')}
            </div>
            <Switch
              checked={s.fridge}
              onChange={(v) => set('fridge', v)}
              label="Bake later"
              sub="Rest the balls about an hour, then hold them in the fridge."
            />
            {s.fridge ? (
              <div className="grid">
                {field('fridgeH')}
                {field('temper')}
              </div>
            ) : null}
            {tl ? (
              <ol className="tl">
                {tl.steps.map((st) => (
                  <li key={st.key} className={st.end ? 'end' : undefined}>
                    <span className="t">{fmtDay(st.at)}</span>
                    <span className="d">
                      {st.title}
                      {st.sub ? <small>{st.sub}</small> : null}
                      {st.end && tl.window ? (
                        <small>
                          Window {fmtClock(tl.window.early)} to {fmtClock(tl.window.late)}
                        </small>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="note">Set when the {m.name.toLowerCase()} was mixed to see the schedule.</p>
            )}
            {!s.fridge && s.proof < 120 ? <p className="warn">Give the balls at least 2 hours at room temperature before baking.</p> : null}
            {s.fridge && kind === 'biga' && s.bp >= 90 && s.fridgeH > 16 ? (
              <p className="warn">An all-biga dough runs out of sugar in the fridge: bake within about 12–16 hours or the crust comes out pale.</p>
            ) : s.fridge && s.fridgeH > 48 ? (
              <p className="warn">Balls are best within about 48 hours in the fridge, and only with strong flour.</p>
            ) : null}
          </Fold>

          <section className="card notes">
            <h2>How the numbers work</h2>
            <p className="note">
              <b>{m.name}:</b> {m.ready}
            </p>
            <p className="note">
              The yeast chart is an estimate, not a published table: {m.note} Tune it to your flour and yeast with the yeast boost: about +20% if
              the {m.name.toLowerCase()} is under-risen at mix time, −20% if it smells sharp. Hydration counts water only; oil and salt are extra.
            </p>
          </section>
        </div>
      </div>

      <IngredientsView open={cook} onClose={() => setCook(false)} title={name || 'Untitled'} sub={sub} stages={st} />

      <Sheet open={menu !== null} onClose={() => setMenu(null)} title={menu === 'delete' ? `Delete “${name || 'Untitled'}”?` : undefined} label="Recipe actions">
        {menu === 'delete' ? (
          <div className="sheet-actions">
            <button type="button" className="btn danger block" onClick={remove}>
              Delete recipe
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
                create(kind, { ...recipe, name, settings: s });
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

function Stat({ k, v, accent, plain }: { k: string; v: string; accent?: boolean; plain?: boolean }) {
  return (
    <div className={'stat' + (accent ? ' accent' : '') + (plain ? ' plain' : '')}>
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  );
}

function Li({ n, sub, g, sum }: { n: string; sub?: string; g: string; sum?: boolean }) {
  return (
    <li className={sum ? 'sum' : undefined}>
      <span className="n">
        {n}
        {sub ? <small>{sub}</small> : null}
      </span>
      <span className="g">{g}</span>
    </li>
  );
}

/** The ingredient lists, shared by the Recipe card and the full-screen view. */
function stages(kind: Recipe['kind'], s: Settings, c: Calc, start: Date | null, tl: ReturnType<typeof timeline> | null): Stage[] {
  const m = c.model;
  const pre = m.name.toLowerCase();
  const flourItems = (stage: 'pre' | 'fin') =>
    c.flours.flatMap((f) => {
      const grams = f[stage];
      if (grams < 0.5) return [];
      const pct = num((stage === 'pre' ? f.preShare : f.finShare) * 100, 1);
      const of = !c.split ? 'the flour' : stage === 'pre' ? `the ${pre} flour` : 'the final dough flour';
      return [{ n: f.name || 'Flour', sub: c.flours.length > 1 ? `${pct}% of ${of}` : undefined, g: g0(grams) }];
    });
  const w = c.mixWater;
  const waterSub = w ? (w.ice ? `${Math.round(w.ice)} g of it as ice` : `at ${Math.round(w.water)} °C`) : undefined;
  return [
    {
      key: 'pre',
      title: m.name,
      when: start ? `Mix ${fmtDay(start)}` : undefined,
      items: [
        ...flourItems('pre'),
        { n: 'Water', sub: `${kind === 'poolish' ? 100 : num(s.bh, 0)}% of ${pre} flour`, g: g0(c.pre.water) },
        { n: 'Instant dry yeast', short: 'Yeast', tag: 'IDY', sub: `${(c.preIdy * 100).toFixed(2)}% · ${c.hours} h at ${c.temp} °C`, g: g1(c.pre.yeast) },
        { n: `Total ${pre}`, g: g0(c.pre.total), sum: true },
      ],
    },
    {
      key: 'fin',
      title: 'Final dough',
      when: tl ? `Mix ${fmtDay(tl.ready)}` : undefined,
      items: [
        { n: m.name, sub: kind === 'biga' ? 'all of it, torn into pieces' : 'all of it', tag: 'all of it', g: g0(c.pre.total) },
        ...(c.final.flour > 0.5 ? flourItems('fin') : []),
        { n: 'Water', sub: waterSub, tag: waterSub, g: g0(Math.max(c.final.water, 0)) },
        ...(c.final.oil > 0 ? [{ n: 'Olive oil', sub: `${num(s.oil, 1)}% of flour`, g: g0(c.final.oil) }] : []),
        { n: 'Salt', sub: `${num(s.salt, 1)}% of flour`, g: g0(c.final.salt) },
        ...(c.final.yeast > 0
          ? [
              {
                n: 'Instant dry yeast',
                short: 'Yeast',
                tag: 'IDY',
                sub: c.finalIdy < s.fy ? `${num(c.finalIdy, 3)}% · cut for a ${s.room} °C room` : `${num(s.fy, 2)}% of flour`,
                g: g1(c.final.yeast),
              },
            ]
          : []),
        { n: 'Total dough', sub: `${s.balls} × ${s.bw} g + ${num(s.waste, 1)}% waste`, g: g0(c.dough), sum: true },
      ],
    },
  ];
}

function RecipeLists({ stages }: { stages: Stage[] }) {
  return (
    <>
      {stages.map((st) => (
        <div className="stage" key={st.key}>
          <div className="stage-h">
            <h3>{st.title}</h3>
            {st.when ? <span className="when">{st.when}</span> : null}
          </div>
          <ul className="ing">
            {st.items.map((it, i) => (
              <Li key={i} n={it.n} sub={it.sub} g={it.g} sum={it.sum} />
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

function waterSummary(c: Calc) {
  const w = c.mixWater;
  if (!w) return undefined;
  return w.ice ? `Water ${Math.round(w.ice)} g ice` : `Water ${Math.round(w.water)} °C`;
}

function WaterResult({ c, s }: { c: Calc; s: Settings }) {
  const w = c.mixWater;
  if (!w) return <p className="note">All the water is already in the {c.model.name.toLowerCase()}, so chill or warm the flour instead.</p>;
  const water = Math.max(c.final.water, 0);
  return (
    <div className={'water' + (w.ice ? ' cold' : w.tooHot ? ' hot' : '')}>
      <div className="water-main">
        <span className="k">Final dough water</span>
        <span className="v">{w.ice ? `${Math.round(w.ice)} g ice` : `${Math.round(w.water)} °C`}</span>
      </div>
      <p>
        {w.ice ? (
          <>
            The water would need to be {Math.round(w.water)} °C. Use {Math.round(w.ice)} g of ice plus {Math.round(water - w.ice)} g of fridge-cold water,
            or chill the flour, to land on {s.ddt} °C.
          </>
        ) : w.tooHot ? (
          <>
            Keep the water under {WATER_MAX} °C: it hits the {c.model.name.toLowerCase()}'s live yeast directly. Let the {c.model.name.toLowerCase()} or
            flour warm up first, or accept a cooler dough and a longer bulk.
          </>
        ) : (
          <>
            {Math.round(water)} g at {Math.round(w.water)} °C lands the dough on {s.ddt} °C.
          </>
        )}
      </p>
    </div>
  );
}

function Flours({
  kind,
  s,
  setS,
  c,
}: {
  kind: Recipe['kind'];
  s: Settings;
  setS: React.Dispatch<React.SetStateAction<Settings>>;
  c: Calc;
}) {
  const pre = c.model.name.toLowerCase();
  const split = c.split;
  const sum = (k: 'pct' | 'fin') => s.flours.reduce((a, f) => a + (+f[k] || 0), 0);
  const total = (k: 'pct' | 'fin', label: string) => (
    <span className={'fsum' + (Math.abs(sum(k) - 100) > 0.01 ? ' bad' : '')}>
      {label} {num(sum(k), 1)}%
    </span>
  );
  const upd = (i: number, patch: Partial<Settings['flours'][number]>) =>
    setS((p) => ({ ...p, flours: p.flours.map((f, j) => (j === i ? { ...f, ...patch } : f)) }));
  // Each column stays at 100%: changing one share moves the others. Without the split, both columns match.
  const setShare = (i: number, k: 'pct' | 'fin', v: number) =>
    setS((p) => {
      const col = rebalance(p.flours.map((f) => f[k]), i, v);
      return { ...p, flours: p.flours.map((f, j) => (p.split ? { ...f, [k]: col[j] } : { ...f, pct: col[j], fin: col[j] })) };
    });
  const removeFlour = (i: number) =>
    setS((p) => {
      const rest = p.flours.filter((_, j) => j !== i);
      const pct = balance(rest.map((f) => f.pct));
      const fin = balance(rest.map((f) => f.fin));
      return { ...p, flours: rest.map((f, j) => ({ ...f, pct: pct[j], fin: fin[j] })) };
    });
  // Switching on starts both stages on the current blend. Switching off keeps the overall blend.
  const toggleSplit = (on: boolean) =>
    setS((p) => {
      if (on) return { ...p, split: true, flours: p.flours.map((f) => ({ ...f, fin: f.pct })) };
      const b = blend(calc(kind, p));
      return { ...p, split: false, flours: p.flours.map((f, i) => ({ ...f, pct: b[i], fin: b[i] })) };
    });
  const overall = split ? blend(c) : null;
  const pctStepper = { unit: '%', step: 5, min: 0, max: 100, dec: 1 };
  return (
    <>
      <div className="sub-h">
        Flours
        {split ? (
          <>
            {total('pct', c.model.name)}
            {total('fin', 'final')}
          </>
        ) : (
          total('pct', 'total')
        )}
      </div>
      <div className={'flours' + (split ? ' split' : '')}>
        {s.flours.map((f, i) => (
          <div className={'frow' + (split ? ' split' : '')} key={i}>
            <input
              className="tin"
              type="text"
              maxLength={LIMITS.flourName}
              aria-label={`Flour ${i + 1} name`}
              value={f.name}
              autoComplete="off"
              enterKeyHint="done"
              onChange={(e) => upd(i, { name: e.target.value })}
            />
            {split ? (
              <>
                <Stepper label={`In the ${pre}`} {...pctStepper} value={f.pct} onChange={(v) => setShare(i, 'pct', v)} />
                <Stepper label="In the final dough" {...pctStepper} value={f.fin} onChange={(v) => setShare(i, 'fin', v)} />
              </>
            ) : s.flours.length > 1 ? (
              <Stepper label={`Flour ${i + 1} share`} hideLabel {...pctStepper} value={f.pct} onChange={(v) => setShare(i, 'pct', v)} />
            ) : (
              <div className="stp fixed">
                <div className="fixed-val">100%</div>
              </div>
            )}
            <button
              className="xbtn"
              type="button"
              aria-label={`Remove flour ${i + 1}`}
              disabled={s.flours.length < 2}
              onClick={() => removeFlour(i)}
            >
              <Icon name="trash" size={18} />
            </button>
          </div>
        ))}
      </div>
      {s.flours.length > 2 ? (
        <p className="note">Shares always add up to 100%. When you change one, the biggest of the other flours makes up the difference.</p>
      ) : null}
      {overall ? (
        <p className="note">
          Overall: {s.flours.map((f, i) => `${f.name || 'Flour'} ${num(overall[i], 1)}%`).join(' · ')}
        </p>
      ) : null}
      {s.flours.length > 1 ? (
        <Switch
          checked={split}
          onChange={toggleSplit}
          label="Set flours per stage"
          sub={`Choose how much of each flour goes into the ${pre} and how much into the final dough.`}
        />
      ) : null}
      {s.flours.length < LIMITS.flours ? (
        <div>
          <button
            className="btn small"
            type="button"
            onClick={() =>
              setS((p) => {
                // The new flour starts with whatever is left (usually 0%).
                const n = p.flours.length;
                const col = (k: 'pct' | 'fin') => balance([...p.flours.map((f) => f[k]), 100 - p.flours.reduce((a, f) => a + (+f[k] || 0), 0)], n);
                const pct = col('pct');
                const fin = col('fin');
                return { ...p, flours: [...p.flours, { name: `Flour ${n + 1}`, pct: 0, fin: 0 }].map((f, j) => ({ ...f, pct: pct[j], fin: fin[j] })) };
              })
            }
          >
            <Icon name="plus" size={16} /> Add flour
          </button>
        </div>
      ) : null}
    </>
  );
}

function useScrollSpy(ids: readonly string[]) {
  const [active, setActive] = useState(ids[0]);
  const idsKey = ids.join(',');
  const visible = useRef(new Map<string, number>());
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.current.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        const best = ids.find((id) => (visible.current.get(id) ?? 0) > 0);
        if (best) setActive(best);
      },
      { rootMargin: '-120px 0px -45% 0px', threshold: [0, 0.01] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [idsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return active;
}
