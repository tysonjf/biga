// The calculator cards shared by recipes, bakes and the playground. Each page composes them in its
// own order; they read the lock from context, so a locked page shows values that can't be changed.

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { FIELDS, LIMITS, PRE_T, type DoughKind, type NumKey, type Settings, type WaterRule } from '../../shared/recipe';
import { GramsEdit } from './GramsEdit';
import {
  afterReady,
  balance,
  blend,
  calc,
  clockChange,
  describeClockChange,
  directChart,
  fermentOf,
  applyGrams,
  doughVars,
  noPreferment,
  FIRST_HYD,
  fmtClock,
  fmtDay,
  fmtDur,
  fmtWeekday,
  g0,
  frictionFactor,
  FRIDGE,
  FRIDGE_MAX,
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
  type BigaWater,
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
export function useDough(kind: DoughKind, s: Settings, setS: SetS, start: Date | null, live = false) {
  const c = useMemo(() => calc(kind, s), [kind, s]);
  const tl = useMemo(() => (start ? timeline(kind, s, start) : null), [kind, s, start]);
  const set = useCallback(<K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v })), [setS]);
  const stageList = useMemo(() => stages(kind, s, c, live ? null : tl), [kind, s, c, tl, live]);
  // The amounts by name, for sums in the calculator and the notes.
  const vars = useMemo(() => doughVars(kind, s, c), [kind, s, c]);
  const scope = useMemo(() => Object.fromEntries(vars.map((v) => [v.name, v.value])), [vars]);
  return { kind, s, setS, set, c, tl, start, live, stages: stageList, vars, scope };
}
export type Dough = ReturnType<typeof useDough>;

/**
 * Where a recipe's (or the playground's) schedule starts: the planned mix time while that schedule is
 * still going, otherwise now, kept up to date.
 */
export function usePlanStart(kind: DoughKind, s: Settings) {
  const now = useNow();
  return useMemo(() => planStart(kind, s, now), [kind, s, now]);
}

/** A yeast percentage: three decimals for the tiny doses of long, wet ferments (0.075%, not 0.07%). */
const idyPct = (fraction: number) => {
  const v = fraction * 100;
  return `${v.toFixed(v < 0.1 ? 3 : 2)}%`;
};

export const doughSummary = (s: Settings, c: Calc) => `${s.balls} × ${Math.round(s.bw)} g · ${num(s.hyd, 1)}% hydration · ${g0(c.dough)} dough`;

type StepperProps = Parameters<typeof Stepper>[0];

export function Field({ d, k, ...extra }: { d: Dough; k: NumKey } & Partial<StepperProps>) {
  return <Stepper {...FIELDS[k]} value={d.s[k]} onChange={(v) => d.set(k, v)} {...extra} />;
}

/* ---------- yeast ---------- */

/** `planner`: show the start row (recipes and the playground; a bake has its own start time). */
export function YeastCard({ d, order, planner }: { d: Dough; order?: number; planner?: boolean }) {
  const { kind, s, set, setS, c, tl, start, live } = d;
  const m = c.model;
  // A direct dough's chart is its bulk ferment: when it's up, you ball the dough.
  const direct = kind === 'direct';
  // The page's lock: the chart and the times are scheduling and stay usable; the cold ferment locks.
  const locked = useLocked();
  const [reveal, setReveal] = useState(0);
  // A direct dough's chart follows its whole schedule: the balls, and any time in the fridge.
  const chart = useMemo(() => (direct ? { ...m, idy: directChart(s) } : m), [m, direct, s]);
  const onPick = useCallback((t: number, h: number) => setS((p) => ({ ...p, temp: t, hours: h })), [setS]);
  // From the chart the steppers walk its grid; with the yeast set by hand they go anywhere, fridge included.
  const grid = (list: number[], k: 'temp' | 'hours') =>
    c.manualYeast
      ? { min: FIELDS[k].min, max: FIELDS[k].max, step: 1 }
      : {
          min: list[0],
          max: list.at(-1)!,
          parse: (v: number) => nearest(list, v),
          bump: (v: number, dir: 1 | -1) => {
            const i = list.indexOf(nearest(list, v));
            return list[Math.max(0, Math.min(list.length - 1, i + dir))];
          },
        };
  const { onChart } = fermentOf(kind, s);
  return (
    <Locked.Provider value={false}>
      <section className="card" id="yeast" aria-labelledby="h-yeast" style={mobileOrder(order)}>
        <div className="card-h">
          <h2 id="h-yeast">{m.name} yeast</h2>
          <span className="hint">Tap a cell to pick temperature × time.</span>
        </div>
        {planner ? <StartRow d={d} /> : null}
        <Heatmap model={chart} temp={c.temp} hours={c.hours} onPick={onPick} start={start} live={live} after={afterReady(kind, s)} reveal={reveal} />
        <div className="grid">
          <Stepper
            big
            label={direct ? 'Bulk at' : 'Ferment at'}
            unit="°C"
            value={c.temp}
            show={(v) => `${v}°`}
            {...grid(m.temps, 'temp')}
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
            {...grid(m.hours, 'hours')}
            onChange={(v) => {
              set('hours', v);
              setReveal((r) => r + 1);
            }}
          />
        </div>
        {direct ? <ColdFerment d={d} locked={locked} /> : null}
        <YeastMode d={d} locked={locked} />
        <div className="stats">
          {c.manualYeast ? (
            <Stat k={`${onChart ? 'Chart suggests' : 'Beyond the chart, it suggests'} · ${idyPct(c.chartIdy)}`} v={g1((direct ? c.flour : c.pre.flour) * c.chartIdy)} />
          ) : (
            <Stat k={s.boost ? `IDY · boost ${s.boost > 0 ? '+' : ''}${s.boost}%` : 'IDY'} v={idyPct(c.preIdy)} />
          )}
          <Stat k={c.manualYeast ? `${m.name} yeast · ${idyPct(c.preIdy)}` : `${m.name} yeast`} v={g1(direct ? c.final.yeast : c.pre.yeast)} />
          {live || !tl ? (
            <>
              <Stat k={direct ? 'Ball after' : `${m.name} ready after`} v={fmtDur(c.hours * 60)} />
              <Stat k="Bake after" v={fmtDur(c.hours * 60 + afterReady(kind, s))} accent />
            </>
          ) : (
            <>
              <Stat k={`${direct ? 'Ball' : 'Ready'} · ${fmtWeekday(tl.ready)}`} v={fmtClock(tl.ready)} />
              <Stat k={`Bake · ${fmtWeekday(tl.bake)}`} v={fmtClock(tl.bake)} accent />
            </>
          )}
        </div>
      </section>
    </Locked.Provider>
  );
}

/**
 * Where the yeast comes from: the chart, or a figure of your own, in % of the preferment's flour (a
 * direct dough's flour) or in grams, with the chart's figure shown beside it as a guide. Part of the
 * recipe, so it locks.
 */
function YeastMode({ d, locked }: { d: Dough; locked: boolean }) {
  const { kind, s, set, c } = d;
  const direct = kind === 'direct';
  const flour = direct ? c.flour : c.pre.flour;
  const grams = direct ? c.final.yeast : c.pre.yeast;
  const what = direct ? 'the dough' : `the ${c.model.name.toLowerCase()}`;
  return (
    <Locked.Provider value={locked}>
      <div className="segmented" role="radiogroup" aria-label="Yeast" data-locked={locked ? '' : undefined}>
        {(['chart', 'manual'] as const).map((mode) => (
          <button key={mode} type="button" role="radio" aria-checked={s.yeast === mode} aria-disabled={locked || undefined} onClick={() => !locked && set('yeast', mode)}>
            {mode === 'chart' ? 'From the chart' : 'Set by hand'}
          </button>
        ))}
      </div>
      {c.manualYeast ? (
        <>
          <div className="grid">
            <Stepper {...FIELDS.idy} label={`IDY in ${what}`} unit={`% of ${direct ? 'flour' : 'its flour'}`} value={s.idy} onChange={(v) => set('idy', v)} />
            <div className="stp">
              <label>
                <span>Or in grams</span>
                <span className="u">g</span>
              </label>
              <div className="yman">
                {locked || !(flour > 0) ? (
                  <span className="mg">{g1(grams)}</span>
                ) : (
                  <GramsEdit grams={grams} label="Yeast" fine onGrams={(g) => set('idy', Math.min(FIELDS.idy.max, Math.max(0, +((g / flour) * 100).toFixed(3))))} />
                )}
              </div>
            </div>
          </div>
          <p className="note">
            Your own yeast, as a recipe gives it. The temperature and time can go anywhere from {FIELDS.temp.min} to {FIELDS.temp.max} °C and {FIELDS.hours.min} to{' '}
            {FIELDS.hours.max} h, a fridge included{direct ? '' : `, and the schedule follows them`}. The chart still shows what it would use for {c.hours} h at {c.temp} °C
            {fermentOf(kind, s).onChart ? '' : ' (beyond its grid, so a rough extrapolation)'}, so you can see how far off the recipe is: more yeast than the chart means it
            will be ready sooner than the schedule says.
          </p>
        </>
      ) : null}
    </Locked.Provider>
  );
}

/**
 * A direct dough's cold ferment: a cold bulk is a fridge row on the chart; balls in the fridge are
 * this switch. Either way the fridge time counts toward the yeast. Part of the recipe, so it locks.
 */
function ColdFerment({ d, locked }: { d: Dough; locked: boolean }) {
  const { s, set, c } = d;
  const coldBulk = c.temp <= FRIDGE_MAX;
  return (
    <Locked.Provider value={locked}>
      <div className="sub-h">Cold ferment</div>
      {coldBulk ? (
        <p className="note">
          A <b>{c.temp} °C</b> bulk is in the fridge. Give the balls 3–4 hours to warm up and proof.
        </p>
      ) : null}
      <Switch
        checked={s.fridge}
        onChange={(v) => set('fridge', v)}
        label="Balls in the fridge"
        sub="Cold bulk: a fridge row on the chart (8 °C or colder). Cold balls: this. The fridge time counts toward the yeast either way."
      />
      {s.fridge ? (
        <div className="grid">
          <Field d={d} k="fridgeH" />
          <Field d={d} k="fridgeT" />
        </div>
      ) : null}
      {coldBulk && !s.fridge && s.proof < 180 ? <p className="warn">Give the balls from a cold bulk 3–4 hours under Timing.</p> : null}
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
          {d.kind === 'direct' ? 'Ball' : `${c.model.name} ready`} <b>{fmtDay(tl.ready)}</b> · bake <b>{fmtDay(tl.bake)}</b>
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
        {(['balls', 'bw', 'hyd', 'salt', 'oil', 'sugar', 'waste'] as const).map((k) => (
          <Field key={k} d={d} k={k} />
        ))}
      </div>
      {kind === 'direct' ? (
        c.manualYeast ? null : (
          <>
            <div className="sub-h">Yeast</div>
            <div className="grid">
              <Field d={d} k="boost" />
            </div>
          </>
        )
      ) : (
        <>
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
            {c.manualYeast ? null : <Field d={d} k="boost" />}
            <Field d={d} k="fy" />
          </div>
        </>
      )}
      <Flours d={d} />
    </section>
  );
}

/* ---------- ingredients ---------- */

export function RecipeCard({ d, onFull, order }: { d: Dough; onFull: () => void; order?: number }) {
  const { kind, c, setS } = d;
  const locked = useLocked();
  // Working backwards: type a line's grams and the percentages, shares and ball weight follow.
  const onGrams = (key: string, grams: number) => setS((p) => applyGrams(kind, p, calc(kind, p), key, grams));
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
      <RecipeLists stages={d.stages} onGrams={locked ? undefined : onGrams} />
      {locked ? null : (
        <p className="note">
          Working from a recipe in grams? Tap an amount and type it: the hydration, salt{noPreferment(kind) ? '' : `, ${c.model.name.toLowerCase()} share and hydration`} and ball
          weight are worked back from the grams, for the {d.s.balls} balls set above.
        </p>
      )}
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
  return (
    <Fold title="Dough temperature" summary={waterSummary(c)} open={open} onToggle={setOpen} order={order}>
      {c.bigaWater ? <BigaWaterResult w={c.bigaWater} /> : null}
      <WaterResult c={c} s={s} />
      <WaterRules d={d} />
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
        room. Hitting the dough temperature matters most.
      </p>
      {/* A direct dough's yeast comes from the chart, so a hot room doesn't cut it. */}
      {s.room > ROOM_MAX && !noPreferment(d.kind) ? (
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
      {noPreferment(d.kind) ? null : <PreTemp d={d} />}
    </Fold>
  );
}

/**
 * How warm the preferment is going into the final mix, which sets the final dough's water. It isn't
 * always the ferment temperature: held back in the fridge it comes out at about 4 °C, and left out
 * once it was ready it's at room temperature. It's about the day, not the recipe's ratios, so it
 * stays usable while locked.
 */
function PreTemp({ d }: { d: Dough }) {
  const { s, set, c } = d;
  const name = c.model.name;
  const pre = name.toLowerCase();
  const picks = [
    { label: 'As fermented', v: null, at: c.temp },
    { label: 'Fridge', v: FRIDGE, at: FRIDGE },
    { label: 'Room', v: s.room, at: s.room },
  ];
  return (
    <Locked.Provider value={false}>
      <div className="sub-h">{name} into the mix</div>
      <div className="chips" role="group" aria-label={`Where the ${pre} comes from`}>
        {picks.map((p) => (
          <button key={p.label} type="button" className="chip-btn" aria-pressed={s.preT === p.v} onClick={() => set('preT', p.v)}>
            {p.label} <span>{p.at}°</span>
          </button>
        ))}
      </div>
      <div className="grid">
        <Stepper {...PRE_T} label={`${name} temp`} value={c.preTemp} onChange={(v) => set('preT', v)} />
      </div>
      <p className="note">
        {s.preT === null ? (
          <>
            The final dough water counts the {pre} at its <b>{c.temp} °C</b> ferment temperature. Held it back in the fridge, or left it out once it
            was ready? Pick where it’s coming from, or probe it and set the temperature.
          </>
        ) : (
          <>
            The final dough water counts the {pre} at <b>{c.preTemp} °C</b>
            {s.preT === FRIDGE ? ', straight from the fridge' : ''}. A probe in the middle tells you best.
          </>
        )}
      </p>
    </Locked.Provider>
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
        {/* A direct dough's bulk is the yeast chart's hours, and starts as it's mixed. */}
        {kind === 'direct' ? null : (
          <>
            <Field d={d} k="mix" />
            <Field d={d} k="bulk" />
          </>
        )}
        <Field d={d} k={s.fridge ? 'fridgeRest' : 'proof'} />
        {kind === 'direct' && s.fridge ? <Field d={d} k="temper" /> : null}
      </div>
      {/* A direct dough's cold ferment is set in its Yeast card, since it changes the yeast. */}
      {kind === 'direct' ? null : (
        <Switch checked={s.fridge} onChange={(v) => set('fridge', v)} label="Bake later" sub="Rest the balls about an hour, then hold them in the fridge." />
      )}
      {s.fridge && kind !== 'direct' ? (
        <div className="grid">
          <Field d={d} k="fridgeH" />
          <Field d={d} k="temper" />
        </div>
      ) : null}
      {!s.fridge && s.proof < 120 ? <p className="warn">Give the balls at least 2 hours at room temperature before baking.</p> : null}
      {s.fridge && kind === 'biga' && s.bp >= 90 && s.fridgeH > 16 && s.sugar < 1 ? (
        <p className="warn">
          An all-biga dough runs out of sugar in the fridge: bake within about 12–16 hours, or add 1–2% sugar, or the crust comes out pale.
        </p>
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
  const { kind, s, c, tl } = d;
  return (
    <Fold id="timing" title="Timing" summary={`Bake after ${fmtDur(c.hours * 60 + afterReady(kind, s))}`} open={open} onToggle={onToggle} order={order}>
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
        {m.name.toLowerCase()} is under-risen {m.kind === 'direct' ? 'when you ball it' : 'at mix time'}, −20% if it smells sharp. Hydration counts water only; oil, sugar and salt are extra.
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

function Li({ n, sub, g, sum, onGrams, grams }: { n: string; sub?: string; g: string; sum?: boolean; onGrams?: (g: number) => void; grams?: number }) {
  return (
    <li className={sum ? 'sum' : undefined}>
      <span className="n">
        {n}
        {sub ? <small>{sub}</small> : null}
      </span>
      {onGrams && grams !== undefined ? <GramsEdit grams={grams} label={n} fine={grams < 10} onGrams={onGrams} small /> : <span className="g">{g}</span>}
    </li>
  );
}

/**
 * The final mix's water: how warm, and for a wet dough how to hold some back. "at 23 °C · 400 g first,
 * to 60%, then drizzle in 57 g", or `short` for the full-screen view: "at 23 °C · 400 g + 57 g".
 */
export function waterNote(c: Calc, short = false): string | undefined {
  const w = c.mixWater;
  const temp = w ? (w.ice ? `${Math.round(w.ice)} g of it as ice` : `at ${Math.round(w.water)} °C`) : '';
  // Wet doughs: mix to 60% first, then drizzle in the rest.
  const hb = c.holdBack;
  const split = hb ? (short ? `${hb.first} g + ${hb.rest} g` : `${hb.first} g first, to ${FIRST_HYD}%, then drizzle in ${hb.rest} g`) : '';
  return [temp, split].filter(Boolean).join(' · ') || undefined;
}

/** The ingredient lists, shared by the Recipe card and the full-screen view. Mix times only for a bake. */
function stages(kind: DoughKind, s: Settings, c: Calc, tl: Timeline | null): Stage[] {
  const m = c.model;
  const pre = m.name.toLowerCase();
  const flourItems = (stage: 'pre' | 'fin') =>
    c.flours.flatMap((f) => {
      const grams = f[stage];
      if (grams < 0.5) return [];
      const pct = num((stage === 'pre' ? f.preShare : f.finShare) * 100, 1);
      const of = !c.split ? 'the flour' : stage === 'pre' ? `the ${pre} flour` : 'the final dough flour';
      return [{ n: f.name || 'Flour', sub: c.flours.length > 1 ? `${pct}% of ${of}` : undefined, g: g0(grams), edit: `${stage === 'pre' ? 'pf' : 'ff'}:${c.flours.indexOf(f)}`, grams }];
    });
  const waterLine = waterNote(c);
  const waterTag = waterNote(c, true);
  const preWaterAt = c.bigaWater ? bigaWaterShort(c.bigaWater) : undefined;
  const direct = noPreferment(kind);
  const dough: Stage = {
    key: 'fin',
    title: direct ? 'Dough' : 'Final dough',
    when: tl ? `Mix ${fmtDay(direct ? tl.steps[0].at : tl.ready)}` : undefined,
    items: [
      ...(direct
        ? []
        : [
            {
              n: m.name,
              sub: (kind === 'biga' ? 'all of it, torn into pieces' : 'all of it') + (s.preT === null ? '' : ` · at ${c.preTemp} °C`),
              tag: 'all of it',
              g: g0(c.pre.total),
            },
          ]),
      ...(c.final.flour > 0.5 ? flourItems('fin') : []),
      { n: 'Water', sub: waterLine, tag: waterTag, g: g0(Math.max(c.final.water, 0)), edit: 'fw', grams: Math.max(c.final.water, 0) },
      ...(c.final.oil > 0 ? [{ n: 'Olive oil', sub: `${num(s.oil, 1)}% of flour`, g: g0(c.final.oil), edit: 'fo', grams: c.final.oil }] : []),
      ...(c.final.sugar > 0 ? [{ n: 'Sugar', sub: `${num(s.sugar, 1)}% of flour`, g: c.final.sugar < 10 ? g1(c.final.sugar) : g0(c.final.sugar), edit: 'fsu', grams: c.final.sugar }] : []),
      { n: 'Salt', sub: `${num(s.salt, 1)}% of flour`, g: g0(c.final.salt), edit: 'fs', grams: c.final.salt },
      ...(c.final.yeast > 0 || c.manualYeast
        ? [
            {
              n: 'Instant dry yeast',
              short: 'Yeast',
              tag: 'IDY',
              sub: direct
                ? `${idyPct(c.preIdy)}${c.manualYeast ? ' · set by hand' : ''} · ${c.hours} h bulk at ${c.temp} °C`
                : c.finalIdy < s.fy
                  ? `${num(c.finalIdy, 3)}% · cut for a ${s.room} °C room`
                  : `${num(s.fy, 2)}% of flour`,
              g: g1(c.final.yeast),
              edit: 'fy',
              grams: c.final.yeast,
            },
          ]
        : []),
      { n: 'Total dough', sub: `${s.balls} × ${s.bw} g + ${num(s.waste, 1)}% waste`, g: g0(c.dough), sum: true },
    ],
  };
  if (direct) return [dough];
  return [
    {
      key: 'pre',
      title: m.name,
      when: tl ? `Mix ${fmtDay(tl.steps[0].at)}` : undefined,
      items: [
        ...flourItems('pre'),
        {
          n: 'Water',
          sub: `${kind === 'poolish' ? 100 : num(s.bh, 0)}% of ${pre} flour` + (preWaterAt ? ` · ${preWaterAt}` : ''),
          tag: preWaterAt,
          g: g0(c.pre.water),
          // A poolish is always 100% hydration: its water follows its flour.
          ...(kind === 'biga' ? { edit: 'pw', grams: c.pre.water } : {}),
        },
        { n: 'Instant dry yeast', short: 'Yeast', tag: 'IDY', sub: `${idyPct(c.preIdy)}${c.manualYeast ? ' · set by hand' : ''} · ${c.hours} h at ${c.temp} °C`, g: g1(c.pre.yeast), edit: 'py', grams: c.pre.yeast },
        { n: `Total ${pre}`, g: g0(c.pre.total), sum: true },
      ],
    },
    dough,
  ];
}

function RecipeLists({ stages, onGrams }: { stages: Stage[]; onGrams?: (key: string, grams: number) => void }) {
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
              <Li key={i} n={it.n} sub={it.sub} g={it.g} sum={it.sum} grams={it.grams} onGrams={onGrams && it.edit ? (g) => onGrams(it.edit!, g) : undefined} />
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

function waterSummary(c: Calc) {
  const w = c.mixWater;
  const fin = w ? (w.ice ? `${Math.round(w.ice)} g ice` : `${Math.round(w.water)} °C`) : null;
  if (!c.bigaWater) return fin ? `Water ${fin}` : undefined;
  const pre = c.bigaWater.cold ? 'ice-cold' : `${Math.round(c.bigaWater.water)} °C`;
  return fin ? `Water: biga ${pre} · final ${fin}` : `Biga water ${pre}`;
}

/** The biga's water as the ingredient lists show it: "at 13 °C" or "ice-cold". */
const bigaWaterShort = (b: BigaWater) => (b.cold ? 'ice-cold' : `at ${Math.round(b.water)} °C`);

/** Water for mixing the biga itself, by Giorilli's rule: 55 − (room + flour). */
function BigaWaterResult({ w }: { w: BigaWater }) {
  const sum = (
    <>
      55 − ({w.room} °C room + {w.flour} °C flour) = {Math.round(w.water)} °C
    </>
  );
  return (
    <div className={'water' + (w.cold ? ' cold' : w.tooHot ? ' hot' : '')}>
      <div className="water-main">
        <span className="k">Biga water</span>
        <span className="v">{w.cold ? 'Ice-cold' : `${Math.round(w.water)} °C`}</span>
      </div>
      <p>
        {w.cold ? (
          <>
            Giorilli's rule asks for {sum}, colder than water gets. Use iced water and chill the flour if you can.
          </>
        ) : w.tooHot ? (
          <>
            Giorilli's rule: {sum}. Keep it under {WATER_MAX} °C, since the yeast goes straight into this water. Warm the flour instead.
          </>
        ) : (
          <>Giorilli's rule: {sum}. It lands the biga at about 18–20 °C.</>
        )}
      </p>
    </div>
  );
}

const RULE_NAME: Record<WaterRule, (c: Calc, s: Settings) => string> = {
  balance: () => 'Heat balance',
  ddt: (c) => `DDT × ${c.ddtN}`,
  base: (_, s) => `Rule of ${s.waterBase}`,
};

/**
 * How the water temperature is worked out, and what each way gives for this mix. The heat balance is
 * the physics; the other two are the rules of thumb bakers use, shown with their working.
 */
function WaterRules({ d }: { d: Dough }) {
  const { s, set, c } = d;
  const locked = useLocked();
  if (!c.waterBy) return null;
  const pre = noPreferment(d.kind) ? null : c.model.name.toLowerCase();
  const ff = frictionFactor(s.friction);
  const by = c.waterBy;
  return (
    <>
      <div className="chips" role="group" aria-label="Water temperature method">
        {(['balance', 'ddt', 'base'] as const).map((r) => (
          <button
            key={r}
            type="button"
            className="chip-btn"
            aria-pressed={s.waterRule === r}
            aria-disabled={locked || undefined}
            data-locked={locked ? '' : undefined}
            onClick={() => !locked && set('waterRule', r)}
          >
            {RULE_NAME[r](c, s)} <span>{Math.round(by[r])}°</span>
          </button>
        ))}
      </div>
      {s.waterRule === 'base' ? (
        <div className="grid">
          <Field d={d} k="waterBase" />
        </div>
      ) : null}
      <p className="note">
        {s.waterRule === 'balance' ? (
          <>
            <b>Heat balance:</b> the flour, the water{pre ? ` and the ${pre}` : ''} counted by weight and by how much heat each holds, plus{' '}
            {s.friction} °C from the mixer. Water holds about two thirds of a dough’s heat, which is why it stays right with a cold {pre ?? 'flour'} or a
            hot mixer where the rules of thumb drift.
          </>
        ) : s.waterRule === 'ddt' ? (
          <>
            <b>
              {c.ddtN} × {s.ddt} − ({s.room} room + {s.flourT} flour{pre ? ` + ${num(c.preTemp, 1)} ${pre}` : ''} + {ff} friction) = {num(by.ddt, 1)} °C.
            </b>{' '}
            The bakers’ rule (King Arthur, Hamelman){pre ? `, × 4 with a ${pre}` : ''}. The friction factor is 3 × the mixer heat. It treats water as a
            third of the dough’s heat, so it overcorrects for a hot mixer{pre ? ` or a cold ${pre}` : ''}.
          </>
        ) : (
          <>
            <b>
              {s.waterBase} − ({s.room} room + {s.flourT} flour) = {num(by.base, 1)} °C.
            </b>{' '}
            The base-number rule, best known as the Neapolitan rule of 55: the mixer’s heat is built into the base, and there’s no target temperature.
            Raise the base for a warmer dough or a gentler mixer; French bakers use 52 for intensive mixing up to 72 for slow.
          </>
        )}
      </p>
    </>
  );
}

function WaterResult({ c, s }: { c: Calc; s: Settings }) {
  const w = c.mixWater;
  if (!w) return <p className="note">All the water is already in the {c.model.name.toLowerCase()}, so chill or warm the flour instead.</p>;
  const water = Math.max(c.final.water, 0);
  return (
    <div className={'water' + (w.ice ? ' cold' : w.tooHot ? ' hot' : '')}>
      <div className="water-main">
        <span className="k">{noPreferment(c.model.kind) ? 'Dough water' : 'Final dough water'}</span>
        <span className="v">{w.ice ? `${Math.round(w.ice)} g ice` : `${Math.round(w.water)} °C`}</span>
      </div>
      <p>
        {w.ice ? (
          <>
            The water would need to be {Math.round(w.water)} °C. Use {Math.round(w.ice)} g of ice plus {Math.round(water - w.ice)} g of fridge-cold water,
            or chill the flour, to land on {s.ddt} °C.
          </>
        ) : w.tooHot ? (
          noPreferment(c.model.kind) ? (
            <>
              Keep the water under {WATER_MAX} °C: it goes straight onto the yeast. Let the flour warm up first, or accept a cooler dough and a longer
              bulk.
            </>
          ) : (
            <>
              Keep the water under {WATER_MAX} °C: it hits the {c.model.name.toLowerCase()}'s live yeast directly. Let the {c.model.name.toLowerCase()} or
              flour warm up first, or accept a cooler dough and a longer bulk.
            </>
          )
        ) : s.waterRule === 'balance' ? (
          <>
            {Math.round(water)} g at {Math.round(w.water)} °C lands the dough on {s.ddt} °C.
          </>
        ) : (
          <>
            {Math.round(water)} g at {Math.round(w.water)} °C, by the {s.waterRule === 'ddt' ? `DDT × ${c.ddtN} rule` : `rule of ${s.waterBase}`}.
            {c.expectC !== null && Math.abs(c.expectC - s.ddt) >= 0.5 ? ` The heat balance expects about ${num(c.expectC, 1)} °C from it.` : ''}
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
      {s.flours.length > 1 && kind !== 'direct' ? (
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
