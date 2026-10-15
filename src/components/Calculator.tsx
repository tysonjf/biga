import { useRef, useState } from 'react';
import type { DoughVar } from '../lib/dough';
import { evaluate, fmtNum, type Vars } from '../lib/math';
import { mobileOrder } from './Fold';

const KEYS = ['7', '8', '9', '(', ')', '4', '5', '6', '×', '÷', '1', '2', '3', '+', '−', '0', '.', '%', '⌫', '='] as const;
const OPS = new Set<string>(['(', ')', '×', '÷', '+', '−', '%']);
const SPOKEN: Record<string, string> = { '×': 'Times', '÷': 'Divide', '−': 'Minus', '+': 'Plus', '%': 'Percent', '⌫': 'Delete', '=': 'Equals' };

type Line = { expr: string; value: number };

/**
 * A kitchen calculator: a keypad, the answer as you type, and the last few sums. It knows the recipe's
 * amounts by name, so "flour × 2%" works. Not part of the recipe: it stays usable while locked.
 */
export function CalculatorCard({ vars, scope, order }: { vars: DoughVar[]; scope: Vars; order?: number }) {
  const [expr, setExpr] = useState('');
  const [tape, setTape] = useState<Line[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const value = evaluate(expr, scope);
  // A bare number is its own answer; only show one for a sum.
  const answer = value !== null && fmtNum(value) !== expr.trim() ? fmtNum(value) : '';

  /** The selection to edit: the caret if you've tapped into the sum, otherwise its end. */
  const range = () => {
    const el = input.current;
    if (!el || document.activeElement !== el) return [expr.length, expr.length] as const;
    return [el.selectionStart ?? expr.length, el.selectionEnd ?? expr.length] as const;
  };
  const put = (next: string, at: number) => {
    setExpr(next);
    requestAnimationFrame(() => {
      const el = input.current;
      if (el && document.activeElement === el) el.setSelectionRange(at, at);
    });
  };
  const insert = (text: string) => {
    const [from, to] = range();
    put(expr.slice(0, from) + text + expr.slice(to), from + text.length);
  };
  // A name straight after a number or a bracket means "times": 2 then flour is 2 × flour.
  const insertName = (name: string) => insert(/[\w).%]$/.test(expr.slice(0, range()[0])) ? `×${name}` : name);
  const back = () => {
    let [from, to] = range();
    // A whole name goes at once.
    if (from === to) from -= /[A-Za-z]+$|.$/.exec(expr.slice(0, from))?.[0].length ?? 0;
    put(expr.slice(0, from) + expr.slice(to), from);
  };
  const equals = () => {
    if (!answer || value === null) return;
    setTape((t) => [{ expr: expr.trim(), value }, ...t].slice(0, 5));
    put(answer, answer.length);
  };
  const press = (k: string) => (k === '=' ? equals() : k === '⌫' ? back() : insert(k));
  const shown = vars.filter((v) => v.value > 0);

  return (
    <section className="card calc" id="calc" aria-labelledby="h-calc" style={mobileOrder(order)}>
      <div className="card-h">
        <h2 id="h-calc">Calculator</h2>
        {expr || tape.length ? (
          <button
            type="button"
            className="btn small"
            onClick={() => {
              setExpr('');
              setTape([]);
            }}
          >
            Clear
          </button>
        ) : (
          <span className="hint">Knows this recipe’s amounts</span>
        )}
      </div>
      <div className="calc-screen" onClick={() => input.current?.focus()}>
        <input
          ref={input}
          className="calc-in"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === '=') {
              e.preventDefault();
              equals();
            } else if (e.key === 'Escape') setExpr('');
          }}
          // The keypad does the typing on a phone; a keyboard still works on a computer.
          inputMode="none"
          placeholder="0"
          aria-label="Sum"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <output className="calc-out" aria-live="polite">
          {answer ? `= ${answer}` : ''}
        </output>
      </div>
      <div className="calc-keys">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            className={k === '=' ? 'eq' : OPS.has(k) ? 'op' : undefined}
            aria-label={SPOKEN[k]}
            // Keep the caret where it is.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => press(k)}
          >
            {k}
          </button>
        ))}
      </div>
      {shown.length ? (
        <div className="chips" role="group" aria-label="This recipe’s amounts">
          {shown.map((v) => (
            <button key={v.name} type="button" className="chip-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => insertName(v.name)}>
              {v.name} <span>{v.unit === 'g' ? `${v.value} g` : `${fmtNum(v.value)}${v.unit}`}</span>
            </button>
          ))}
        </div>
      ) : null}
      {tape.length ? (
        <ul className="calc-tape" aria-label="Earlier sums">
          {tape.map((l, i) => (
            <li key={i}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insert(fmtNum(l.value))} aria-label={`${l.expr} = ${fmtNum(l.value)}. Use the answer`}>
                <span>{l.expr} =</span>
                <b>{fmtNum(l.value)}</b>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="note">
        The notes do sums too: end a line with <b>=</b> and the answer appears, like <b>4 x 280 =</b> or <b>flour × 2.5% =</b>.
      </p>
    </section>
  );
}
