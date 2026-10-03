import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { clockChange, describeClockChange, type Model } from '../lib/dough';
import { useLocked } from '../lib/lock';

type Props = {
  model: Model;
  temp: number;
  hours: number;
  onPick: (t: number, h: number) => void;
  /** When set, each column header shows when the preferment is ready and when the dough is ready to bake. */
  start: Date | null;
  /** The start is "now" (a recipe, not a bake). */
  live?: boolean;
  after: number;
  /** Bumped when the selection changed from outside the chart, so we scroll it into view. */
  reveal: number;
};

const shortTime = (d: Date) => {
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'a' : 'p'}`;
};

function When({ d, bake }: { d: Date; bake?: boolean }) {
  return (
    <span className={'bt' + (bake ? ' bake' : '')}>
      <b>{d.toLocaleString(undefined, { weekday: 'short' })}</b>
      {shortTime(d)}
    </span>
  );
}

const Row = memo(function Row({
  t,
  hours,
  sel,
  idy,
  bucket,
}: {
  t: number;
  hours: number[];
  sel: number | null;
  idy: (t: number, h: number) => number;
  bucket: (v: number) => number;
}) {
  return (
    <tr>
      <th scope="row" className={sel !== null ? 'x' : undefined}>
        {t}°
      </th>
      {hours.map((h) => {
        const v = idy(t, h);
        const on = sel === h;
        return (
          <td key={h}>
            <button
              type="button"
              className={`b${bucket(v)}${on ? ' on' : ''}`}
              data-t={t}
              data-h={h}
              aria-pressed={on}
              aria-label={`${t} °C for ${h} hours: ${v.toFixed(2)}% IDY`}
            >
              {v.toFixed(2)}
            </button>
          </td>
        );
      })}
    </tr>
  );
});

export function Heatmap({ model, temp, hours, onPick, start, live, after, reveal }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const locked = useLocked();
  const { temps, hours: H, idy } = model;
  const pre = model.name.toLowerCase();
  // A clock change anywhere across the chart shifts the later column times by an hour.
  const change = start ? clockChange(start, new Date(start.getTime() + (H.at(-1)! * 60 + after) * 60_000)) : null;

  const { bucket, lo, hi } = useMemo(() => {
    const lmin = Math.log(idy(temps.at(-1)!, H.at(-1)!));
    const lmax = Math.log(idy(temps[0], H[0]));
    return {
      lo: Math.exp(lmin),
      hi: Math.exp(lmax),
      bucket: (v: number) => Math.max(0, Math.min(5, Math.floor(((Math.log(v) - lmin) / (lmax - lmin)) * 6))),
    };
  }, [idy, temps, H]);

  // Keep the picked cell visible (below the sticky header row and right of the sticky column).
  const revealDone = useRef(-1);
  useLayoutEffect(() => {
    if (revealDone.current === reveal) return;
    revealDone.current = reveal;
    const w = wrap.current;
    const cell = w?.querySelector<HTMLElement>('button.on')?.parentElement;
    if (!w || !cell) return;
    const rh = (w.querySelector('tbody th') as HTMLElement).offsetWidth + 4;
    const hh = (w.querySelector('thead th') as HTMLElement).offsetHeight + 4;
    const x = cell.offsetLeft;
    const y = cell.offsetTop;
    const first = revealDone.current === 0;
    // First show: centre the pick. Later stepper moves: scroll just enough to keep it in view.
    if (first) {
      w.scrollLeft = x - rh - (w.clientWidth - rh - cell.offsetWidth) / 2;
      w.scrollTop = y - hh - (w.clientHeight - hh - cell.offsetHeight) / 2;
      return;
    }
    if (x - rh < w.scrollLeft) w.scrollLeft = x - rh;
    else if (x + cell.offsetWidth > w.scrollLeft + w.clientWidth) w.scrollLeft = x + cell.offsetWidth - w.clientWidth + 4;
    if (y - hh < w.scrollTop) w.scrollTop = y - hh;
    else if (y + cell.offsetHeight > w.scrollTop + w.clientHeight) w.scrollTop = y + cell.offsetHeight - w.clientHeight + 4;
  });

  // One delegated listener for ~300 cells.
  useEffect(() => {
    const el = wrap.current;
    if (!el || locked) return;
    const onClick = (e: MouseEvent) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('td button');
      if (b) onPick(+b.dataset.t!, +b.dataset.h!);
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [onPick, locked]);

  return (
    <>
      <div className="heat-wrap" ref={wrap} data-locked={locked ? '' : undefined}>
        <table className="heat">
          <thead>
            <tr>
              <th scope="col">
                °C
                {start ? (
                  <>
                    <span className="bt lbl">Ready</span>
                    <span className="bt lbl bake">Bake</span>
                  </>
                ) : null}
              </th>
              {H.map((h) => {
                const at = (min: number) => (start ? new Date(start.getTime() + min * 60_000) : null);
                const ready = at(h * 60);
                const bake = at(h * 60 + after);
                return (
                  <th scope="col" key={h} className={h === hours ? 'x' : undefined}>
                    {h}h
                    {ready && bake ? (
                      <>
                        <When d={ready} />
                        <When d={bake} bake />
                      </>
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {temps.map((t) => (
              <Row key={t} t={t} hours={H} sel={t === temp ? hours : null} idy={idy} bucket={bucket} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="legend">
        <span>IDY % of {model.name.toLowerCase()} flour</span>
        <span className="scale">
          <span>{lo.toFixed(2)}</span>
          <span className="sw" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={`b${i}`} />
            ))}
          </span>
          <span>{hi.toFixed(2)}</span>
        </span>
        {start ? (
          <span className="legend-note">
            {live ? 'Column times if you start now' : 'Column times'}: when the {pre} is ready, and when the dough is ready to bake.
            {change ? ` ${describeClockChange(change)}, and the times allow for it.` : null}
          </span>
        ) : null}
      </div>
    </>
  );
}
