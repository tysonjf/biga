// The calculator cards shared by recipes, bakes and the playground. Each page composes them in its
// own order; they read the lock from context, so a locked page shows values that can't be changed.

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { FIELDS, LIMITS, type Kind, type NumKey, type Settings } from '../../shared/recipe';
import {
  afterReady,
  balance,
  blend,
  calc,
  clockChange,
  describeClockChange,
  fmtClock,
  fmtDay,
  fmtDur,
  fmtWeekday,
  g0,
  g1,
  MIXERS,
  nearest,
  nextAt,
  num,
  planStart,
  rebalance,
  relDay,
  ROOM_MAX,
  ROOM_MIN,
  timeline,
  toLocalInput,
  WATER_MAX,
  type BakeStatus,
  type Calc,
  type Timeline,
} from '../lib/dough';
import { Locked, useLocked } from '../lib/lock';
import { useNow } from '../lib/useNow';
import { useStoredFlag } from '../lib/useStoredFlag';
import { Fold, mobileOrder } from './Fold';
import { Heatmap } from './Heatmap';
import { Icon } from './Icon';
import type { Stage } from './IngredientsView';
import { Stepper } from './Stepper';
import { Switch } from './Switch';

export type SetS = Dispatch<SetStateAction<Settings>>;

/**
 * Everything the cards need, worked out once per change. `start` is when the preferment is mixed;
 * `live` means it's just "now" (a recipe or the playground), so the ingredients don't show mix times.
 */
export function useDough(kind: Kind, s: Settings, setS: SetS, start: Date | null, live = false) {
  const c = useMemo(() => calc(kind, s), [kind, s]);
  const tl = useMemo(() => (start ? timeline(kind, s, start) : null), [kind, s, start]);
  const set = useCallback(<K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v })), [setS]);
  const stageList = useMemo(() => stages(kind, s, c, live ? null : tl), [kind, s, c, tl, live]);
  return { kind, s, setS, set, c, tl, start, live, stages: stageList };
}
export type Dough = ReturnType<typeof useDough>;

/**
 * Where a recipe's (or the playground's) schedule starts: the planned mix time while that schedule is
 * still going, otherwise now, kept up to date.
 */
export function usePlanStart(kind: Kind, s: Settings) {
  const now = useNow();
  return useMemo(() => planStart(kind, s, now), [kind, s, now]);
}

/** A yeast percentage: three decimals for the tiny doses of long, wet ferments (0.075%, not 0.07%). */
const idyPct = (fraction: number) => {
  const v = fraction * 100;
  return `${v.toFixed(v < 0.1 ? 3 : 2)}%`;
};

export const doughSummary = (s: Settings, c: Calc) => `${s.balls} × ${s.bw} g · ${num(s.hyd, 1)}% hydration · ${g0(c.dough)} dough`;

type StepperProps = Parameters<typeof Stepper>[0];

function Field({ d, k, ...extra }: { d: Dough; k: NumKey } & Partial<StepperProps>) {
  return <Stepper {...FIELDS[k]} value={d.s[k]} onChange={(v) => d.set(k, v)} {...extra} />;
}

/* ---------- yeast ---------- */

/** `planner`: show the start row (recipes and the playground; a bake has its own start time). */
export function YeastCard({ d, order, planner }: { d: Dough; order?: number; planner?: boolean }) {
  const { s, set, setS, c, tl, start, live } = d;
  const m = c.model;
  const [reveal, setReveal] = useState(0);
  const onPick = useCallback((t: number, h: number) => setS((p) => ({ ...p, temp: t, hours: h })), [setS]);
  const grid = (list: number[]) => ({
    min: list[0],
    max: list.at(-1)!,
    parse: (v: number) => nearest(list, v),
    bump: (v: number, dir: 1 | -1) => {
      const i = list.indexOf(nearest(list, v));
      return list[Math.max(0, Math.min(list.length - 1, i + dir))];
    },
  });
  // The chart is scheduling (how warm, how long), not the recipe's ratios: it stays usable while locked.
  return (
    <Locked.Provider value={false}>
      <section className="card" id="yeast" aria-labelledby="h-yeast" style={mobileOrder(order)}>
        <div className="card-h">
          <h2 id="h-yeast">{m.name} yeast</h2>
          <span className="hint">Tap a cell to pick temperature × time.</span>
        </div>
        {planner ? <StartRow d={d} /> : null}
        <Heatmap model={m} temp={c.temp} hours={c.hours} onPick={onPick} start={start} live={live} after={afterReady(s)} reveal={reveal} />
        <div className="grid">
          <Stepper
            big
            label="Ferment at"
            unit="°C"
            value={c.temp}
            show={(v) => `${v}°`}
            {...grid(m.temps)}
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
            show={(v) => `${v} h`}
            {...grid(m.hours)}
            onChange={(v) => {
              set('hours', v);
              setReveal((r) => r + 1);
            }}
          />
        </div>
        <div className="stats">
          <Stat k={s.boost ? `IDY · boost ${s.boost > 0 ? '+' : ''}${s.boost}%` : 'IDY'} v={idyPct(c.preIdy)} />
          <Stat k={`${m.name} yeast`} v={g1(c.pre.yeast)} />
          {live || !tl ? (
            <>
              <Stat k={`${m.name} ready after`} v={fmtDur(c.hours * 60)} />
              <Stat k="Bake after" v={fmtDur(c.hours * 60 + afterReady(s))} accent />
            </>
          ) : (
            <>
              <Stat k={`Ready · ${fmtWeekday(tl.ready)}`} v={fmtClock(tl.ready)} />
              <Stat k={`Bake · ${fmtWeekday(tl.bake)}`} v={fmtClock(tl.bake)} accent />
            </>
          )}
        </div>
      </section>
    </Locked.Provider>
  );
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * When you'll mix the preferment: now (kept up to date), or a time you pick, which means the next
 * time the clock reads it. The day can be changed too. Shows when everything works out.
 */
function StartRow({ d }: { d: Dough }) {
  const { set, start, tl, live, c } = d;
  const now = useNow();
  if (!start) return null;
  const time = `${pad2(start.getHours())}:${pad2(start.getMinutes())}`;
  const date = toLocalInput(start).slice(0, 10);
  return (
    <div className="start-plan">
      <span className="start-plan-l" id="start-plan-l">
        Mix the {c.model.name.toLowerCase()}
      </span>
      <div className="start-plan-ctl" role="group" aria-labelledby="start-plan-l">
        <button type="button" className="plan-pill" aria-pressed={live} onClick={() => set('plan', '')}>
          Now
        </button>
        <input
          type="time"
          className={'plan-pill time' + (live ? '' : ' on')}
          aria-label="Start time"
          value={time}
          onChange={(e) => e.target.value && set('plan', toLocalInput(nextAt(e.target.value, now)))}
        />
        {live ? null : (
          <label className="plan-pill day on">
            <span aria-hidden="true">{relDay(start, now)}</span>
            <input
              type="date"
              aria-label="Start date"
              value={date}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker?.();
                } catch {
                  /* not supported: the tap opens it */
                }
              }}
              onChange={(e) => set('plan', e.target.value ? `${e.target.value}T${time}` : toLocalInput(nextAt(time, now)))}
            />
          </label>
        )}
      </div>
      {tl ? (
        <p className="start-plan-out">
          {c.model.name} ready <b>{fmtDay(tl.ready)}</b> · bake <b>{fmtDay(tl.bake)}</b>
        </p>
      ) : null}
    </div>
  );
}

/* ---------- dough ---------- */

export function DoughCard({ d, order }: { d: Dough; order?: number }) {
  const { kind, c } = d;
  return (
    <section className="card" id="dough" aria-labelledby="h-dough" style={mobileOrder(order)}>
      <h2 id="h-dough">Dough</h2>
      <div className="grid three">
        {(['balls', 'bw', 'hyd', 'salt', 'oil', 'waste'] as const).map((k) => (
          <Field key={k} d={d} k={k} />
        ))}
      </div>
      <div className="sub-h">{c.model.name}</div>
      <div className="grid">
        <Field d={d} k="bp" />
        {kind === 'biga' ? (
          <Field d={d} k="bh" min={40} max={65} />
        ) : (
          <div className="stp fixed">
            <label>
              <span>Hydration</span>
              <span className="u">%</span>
            </label>
            <div className="fixed-val">100</div>
          </div>
        )}
        <Field d={d} k="boost" />
        <Field d={d} k="fy" />
      </div>
      <Flours d={d} />
    </section>
  );
}

/* ---------- ingredients ---------- */

export function RecipeCard({ d, onFull, order }: { d: Dough; onFull: () => void; order?: number }) {
  const { c } = d;
  return (
    <section className="card" id="recipe" aria-labelledby="h-recipe" style={mobileOrder(order)}>
      <div className="card-h">
        <h2 id="h-recipe">Recipe</h2>
        <button type="button" className="btn small" onClick={onFull}>
          <Icon name="expand" size={16} /> Full screen
        </button>
      </div>
      <div className="totals">
        <Stat k="Dough" v={g0(c.dough)} plain />
        <Stat k="Flour" v={g0(c.flour)} plain />
        <Stat k="Water" v={g0(c.water)} plain />
      </div>
      <RecipeLists stages={d.stages} />
      {c.warnings.length ? <p className="warn">{c.warnings.join(' ')}</p> : null}
    </section>
  );
}

/* ---------- dough temperature ---------- */

export function TempFold({ d, order }: { d: Dough; order?: number }) {
  const { s, set, c } = d;
  const locked = useLocked();
  // Folded by default: the ingredient amounts come first. Remembered on this device.
  const [open, setOpen] = useStoredFlag('biga-open-temp', false);
  const m = c.model;
  return (
    <Fold title="Dough temperature" summary={waterSummary(c)} open={open} onToggle={setOpen} order={order}>
      <WaterResult c={c} s={s} />
      <div className="grid">
        <Field d={d} k="ddt" />
        <Field d={d} k="room" />
        <Field d={d} k="flourT" />
        <Field d={d} k="friction" />
      </div>
      <div className="chips" role="group" aria-label="Mixing method">
        {MIXERS.map((mx) => (
          <button
            key={mx.id}
            type="button"
            className="chip-btn"
            aria-pressed={s.friction === mx.rise}
            aria-disabled={locked || undefined}
            data-locked={locked ? '' : undefined}
            onClick={() => !locked && set('friction', mx.rise)}
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
        room. Hitting the dough temperature matters most. The water temperature counts the {m.name.toLowerCase()} at its {c.temp} °C
        ferment temperature; check it with a probe if you can.
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
  );
}

/* ---------- timing ---------- */

/** The durations that make up the schedule, and the bake-later option. */
export function TimingFields({ d }: { d: Dough }) {
  const { kind, s, set } = d;
  return (
    <>
      <div className="grid">
        <Field d={d} k="buf" />
        <Field d={d} k="mix" />
        <Field d={d} k="bulk" />
        <Field d={d} k={s.fridge ? 'fridgeRest' : 'proof'} />
      </div>
      <Switch checked={s.fridge} onChange={(v) => set('fridge', v)} label="Bake later" sub="Rest the balls about an hour, then hold them in the fridge." />
      {s.fridge ? (
        <div className="grid">
          <Field d={d} k="fridgeH" />
          <Field d={d} k="temper" />
        </div>
      ) : null}
      {!s.fridge && s.proof < 120 ? <p className="warn">Give the balls at least 2 hours at room temperature before baking.</p> : null}
      {s.fridge && kind === 'biga' && s.bp >= 90 && s.fridgeH > 16 ? (
        <p className="warn">An all-biga dough runs out of sugar in the fridge: bake within about 12–16 hours or the crust comes out pale.</p>
      ) : s.fridge && s.fridgeH > 48 ? (
        <p className="warn">Balls are best within about 48 hours in the fridge, and only with strong flour.</p>
      ) : null}
    </>
  );
}

/** Timing for a recipe or the playground: the durations, and the schedule if you started now. */
export function TimingFold({
  d,
  open,
  onToggle,
  order,
  children,
}: {
  d: Dough;
  open: boolean;
  onToggle: (open: boolean) => void;
  order?: number;
  children?: ReactNode;
}) {
  const { s, c, tl } = d;
  return (
    <Fold id="timing" title="Timing" summary={`Bake after ${fmtDur(c.hours * 60 + afterReady(s))}`} open={open} onToggle={onToggle} order={order}>
      <TimingFields d={d} />
      {tl ? (
        <>
          <div className="sub-h">{d.live ? 'If you start now' : `Starting ${fmtDay(tl.steps[0].at)}`}</div>
          <TimelineList tl={tl} />
          <ClockNote tl={tl} />
        </>
      ) : null}
      {children}
    </Fold>
  );
}

/** The steps of a schedule. With a status, steps already done are dimmed and the current one marked. */
export function TimelineList({ tl, status }: { tl: Timeline; status?: BakeStatus }) {
  const cur = status?.current ? tl.steps.indexOf(status.current) : -1;
  return (
    <ol className="tl">
      {tl.steps.map((st, i) => (
        <li
          key={st.key}
          className={[st.end ? 'end' : '', status && i < cur ? 'done' : '', status && i === cur && status.phase !== 'done' ? 'now' : '']
            .filter(Boolean)
            .join(' ') || undefined}
          aria-current={status && i === cur && status.phase !== 'done' ? 'step' : undefined}
        >
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
  );
}

/** Explains a daylight-saving change inside a schedule, so the shifted clock times make sense. */
export function ClockNote({ tl }: { tl: Timeline }) {
  const change = clockChange(tl.steps[0].at, tl.window?.late ?? tl.bake);
  if (!change) return null;
  return (
    <p className="tip">
      <Icon name="clock" size={18} />
      <span>
        {describeClockChange(change)}. The times shown already allow for it, so every step still gets its full time.
      </span>
    </p>
  );
}

/* ---------- notes on the maths ---------- */

export function HowCard({ c, order }: { c: Calc; order?: number }) {
  const m = c.model;
  return (
    <section className="card notes" style={mobileOrder(order)}>
      <h2>How the numbers work</h2>
      <p className="note">
        <b>{m.name}:</b> {m.ready}
      </p>
      <p className="note">
        The yeast chart is an estimate, not a published table: {m.note} Tune it to your flour and yeast with the yeast boost: about +20% if the{' '}
        {m.name.toLowerCase()} is under-risen at mix time, −20% if it smells sharp. Hydration counts water only; oil and salt are extra.
      </p>
    </section>
  );
}

/* ---------- small pieces ---------- */

export function Stat({ k, v, accent, plain }: { k: string; v: string; accent?: boolean; plain?: boolean }) {
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

/** The ingredient lists, shared by the Recipe card and the full-screen view. Mix times only for a bake. */
function stages(kind: Kind, s: Settings, c: Calc, tl: Timeline | null): Stage[] {
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
      when: tl ? `Mix ${fmtDay(tl.steps[0].at)}` : undefined,
      items: [
        ...flourItems('pre'),
        { n: 'Water', sub: `${kind === 'poolish' ? 100 : num(s.bh, 0)}% of ${pre} flour`, g: g0(c.pre.water) },
        { n: 'Instant dry yeast', short: 'Yeast', tag: 'IDY', sub: `${idyPct(c.preIdy)} · ${c.hours} h at ${c.temp} °C`, g: g1(c.pre.yeast) },
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

function Flours({ d }: { d: Dough }) {
  const { kind, s, setS, c } = d;
  const locked = useLocked();
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
          <div className={'frow' + (split ? ' split' : '') + (locked ? ' locked' : '')} key={i}>
            <input
              className="tin"
              type="text"
              maxLength={LIMITS.flourName}
              aria-label={`Flour ${i + 1} name`}
              value={f.name}
              autoComplete="off"
              enterKeyHint="done"
              readOnly={locked}
              data-locked={locked ? '' : undefined}
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
            {locked ? null : (
              <button className="xbtn" type="button" aria-label={`Remove flour ${i + 1}`} disabled={s.flours.length < 2} onClick={() => removeFlour(i)}>
                <Icon name="trash" size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
      {s.flours.length > 2 && !locked ? (
        <p className="note">Shares always add up to 100%. When you change one, the biggest of the other flours makes up the difference.</p>
      ) : null}
      {overall ? <p className="note">Overall: {s.flours.map((f, i) => `${f.name || 'Flour'} ${num(overall[i], 1)}%`).join(' · ')}</p> : null}
      {s.flours.length > 1 ? (
        <Switch
          checked={split}
          onChange={toggleSplit}
          label="Set flours per stage"
          sub={`Choose how much of each flour goes into the ${pre} and how much into the final dough.`}
        />
      ) : null}
      {s.flours.length < LIMITS.flours && !locked ? (
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

/* ---------- section switcher ---------- */

export type Section = { id: string; label: string };

/** Pill links under the nav bar that jump to each card, highlighting the one in view. */
export function JumpNav({ sections, onJump }: { sections: readonly Section[]; onJump?: (id: string) => void }) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(sections[0].id);
  // A tapped pill keeps its highlight until you scroll yourself: a short card at the very end of the
  // page can't scroll up to the header, and the smooth scroll passes the cards in between.
  const pinned = useRef(false);
  const idsKey = sections.map((x) => x.id).join(',');

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (pinned.current) return;
      const els = sections.map((x) => document.getElementById(x.id)).filter((el): el is HTMLElement => !!el);
      if (!els.length) return;
      const tops = els.map((el) => ({ id: el.id, top: el.getBoundingClientRect().top }));
      // The card in view is the lowest one whose top has gone under the header (whatever its height:
      // the notch, the pills). Cards can be in a different order on a phone, so go by position.
      const line = (ref.current?.closest('.nav')?.getBoundingClientRect().bottom ?? 0) + 24;
      const above = tops.filter((t) => t.top <= line);
      const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
      const pick = atEnd
        ? tops.filter((t) => t.top < innerHeight).sort((a, b) => b.top - a.top)[0]
        : above.sort((a, b) => b.top - a.top)[0] ?? tops.sort((a, b) => a.top - b.top)[0];
      if (pick) setActive(pick.id);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const release = () => {
      pinned.current = false;
    };
    update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    // Anything that starts a scroll of your own hands the highlight back to the page.
    const intents = ['touchstart', 'wheel', 'keydown', 'mousedown'] as const;
    intents.forEach((ev) => addEventListener(ev, release, { passive: true }));
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      intents.forEach((ev) => removeEventListener(ev, release));
    };
  }, [idsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the highlighted pill on screen in the sideways-scrolling row.
  useEffect(() => {
    const row = ref.current;
    const pill = row?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!row || !pill) return;
    const r = pill.getBoundingClientRect();
    const box = row.getBoundingClientRect();
    const pad = 24;
    if (r.left < box.left + pad) row.scrollBy({ left: r.left - box.left - pad, behavior: 'smooth' });
    else if (r.right > box.right - pad) row.scrollBy({ left: r.right - box.right + pad, behavior: 'smooth' });
  }, [active]);

  return (
    <nav className="jump" aria-label="Sections" ref={ref}>
      {sections.map((x) => (
        <a
          key={x.id}
          href={`#${x.id}`}
          aria-current={active === x.id ? 'true' : undefined}
          onClick={(e) => {
            e.preventDefault();
            onJump?.(x.id);
            setActive(x.id);
            pinned.current = true;
            requestAnimationFrame(() => document.getElementById(x.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
          }}
        >
          {x.label}
        </a>
      ))}
    </nav>
  );
}
