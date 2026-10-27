// An amount in grams as a field: tap it, type what you want, and the percentage behind it is worked out.

import { useState } from 'react';
import { g1 } from '../lib/dough';
import { grams } from '../lib/formula';

/** The grams of an ingredient as a field: tap, type what you want, and the percentage is worked out. */
export function GramsEdit({ grams: g, label, fine, onGrams }: { grams: number; label: string; /** Show a decimal place (yeast). */ fine?: boolean; onGrams: (g: number) => void }) {
  const [text, setText] = useState<string | null>(null);
  if (text === null)
    return (
      <button type="button" className="mg edit" aria-label={`${label}: ${fine ? g1(g) : grams(g)}. Tap to type the grams`} onClick={() => setText(String(+g.toFixed(g < 10 || fine ? 2 : 0)))}>
        {fine ? g1(g) : grams(g)}
      </button>
    );
  const commit = () => {
    const v = parseFloat(text.replace(',', '.'));
    if (Number.isFinite(v)) onGrams(v);
    setText(null);
  };
  return (
    <input
      className="tin mg-in"
      type="text"
      inputMode="decimal"
      autoFocus
      aria-label={`${label}, grams`}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') setText(null);
      }}
    />
  );
}
