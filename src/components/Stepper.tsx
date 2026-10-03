import { useEffect, useId, useRef, useState } from 'react';
import { tick } from '../lib/haptics';

type Props = {
  label: string;
  unit?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min: number;
  max: number;
  dec?: number;
  /** Custom display, e.g. "18°" */
  show?: (v: number) => string;
  /** Custom step logic (e.g. snapping to a grid). Return the next value. */
  bump?: (v: number, dir: 1 | -1) => number;
  /** Map a typed number to a value (e.g. snap to nearest grid value). */
  parse?: (v: number) => number;
  big?: boolean;
  hideLabel?: boolean;
};

const fmt = (v: number, dec: number) => String(Number((+v).toFixed(dec)));

/** Press-and-hold repeat, without firing an extra tap on release. */
function useHold(fn: () => void) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timers = useRef<{ t?: number; i?: number; held: boolean; down: boolean }>({ held: false, down: false });
  const stop = (el: HTMLElement) => {
    clearTimeout(timers.current.t);
    clearInterval(timers.current.i);
    el.classList.remove('held');
  };
  useEffect(() => () => {
    clearTimeout(timers.current.t);
    clearInterval(timers.current.i);
  }, []);
  return {
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const el = e.currentTarget;
      timers.current.down = true;
      timers.current.held = false;
      el.classList.add('held');
      timers.current.t = window.setTimeout(() => {
        timers.current.held = true;
        fnRef.current();
        let n = 0;
        timers.current.i = window.setInterval(() => {
          fnRef.current();
          // speed up after a second of holding
          if (++n === 12) {
            clearInterval(timers.current.i);
            timers.current.i = window.setInterval(() => fnRef.current(), 40);
          }
        }, 80);
      }, 380);
    },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      if (timers.current.down && !timers.current.held) fnRef.current();
      timers.current.down = false;
      stop(e.currentTarget);
    },
    onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
      timers.current.down = false;
      stop(e.currentTarget);
    },
    onPointerLeave: (e: React.PointerEvent<HTMLButtonElement>) => {
      timers.current.down = false;
      stop(e.currentTarget);
    },
    // keyboard / assistive tech "clicks" have detail 0
    onClick: (e: React.MouseEvent) => {
      if (e.detail === 0) fnRef.current();
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}

export function Stepper({ label, unit, value, onChange, step = 1, min, max, dec = 0, show, bump, parse, big, hideLabel }: Props) {
  const id = useId();
  const [text, setText] = useState<string | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const display = show ? show(value) : fmt(value, dec);
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  const go = (dir: 1 | -1) => {
    const cur = valueRef.current;
    const next = bump ? bump(cur, dir) : clamp(+(cur + dir * step).toFixed(dec));
    if (next !== cur) {
      valueRef.current = next;
      onChange(next);
      tick();
    }
  };
  const dec$ = useHold(() => go(-1));
  const inc$ = useHold(() => go(1));

  return (
    <div className={'stp' + (big ? ' big' : '')}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : undefined}>
        <span>{label}</span>
        {unit ? <span className="u">{unit}</span> : null}
      </label>
      <div className="ctl">
        <button type="button" aria-label={`Decrease ${label}`} data-off={!bump && value <= min ? '' : undefined} {...dec$}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" /></svg>
        </button>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={text ?? display}
          onFocus={(e) => {
            setText(fmt(value, dec));
            requestAnimationFrame(() => e.target.select());
          }}
          onChange={(e) => {
            setText(e.target.value);
            const v = parseFloat(e.target.value.replace(',', '.'));
            if (Number.isFinite(v)) onChange(parse ? parse(v) : clamp(v));
          }}
          onBlur={() => setText(null)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              go(1);
              setText(null);
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              go(-1);
              setText(null);
            } else if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        <button type="button" aria-label={`Increase ${label}`} data-off={!bump && value >= max ? '' : undefined} {...inc$}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12M12 6v12" /></svg>
        </button>
      </div>
    </div>
  );
}
