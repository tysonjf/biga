// Paste a recipe as you found it (a forum post, a book, a message) and it becomes ingredients and
// stages. What it made of the text shows underneath as you type, so a mis-read line is obvious.

import { useMemo, useState } from 'react';
import { CATEGORIES, CATEGORY_NAME, type Category } from '../../shared/formula';
import { parseRecipe, type Parsed } from '../lib/parseRecipe';
import { Icon } from './Icon';
import { Sheet } from './Sheet';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** The button: "Create recipe" or "Replace ingredients". */
  action: string;
  /** Offer the category chips (when creating a recipe). */
  category?: Category;
  onCategory?: (c: Category) => void;
  onDone: (p: Parsed, text: string) => void;
};

const EXAMPLE = `Biga
900g flour
450g water
2g instant yeast

Dough
100g flour
320g water
30g salt`;

export function PasteSheet({ open, onClose, title, action, category, onCategory, onDone }: Props) {
  const [text, setText] = useState('');
  const parsed = useMemo(() => (text.trim() ? parseRecipe(text) : null), [text]);
  const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  return (
    <Sheet open={open} onClose={onClose} title={title} label={title}>
      <div className="form">
        <textarea
          className="tin ta paste"
          value={text}
          placeholder={EXAMPLE}
          aria-label="The recipe, one ingredient per line"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          onChange={(e) => setText(e.target.value)}
        />
        <p className="note">
          One ingredient per line, with its amount before or after the name: <b>900g flour</b>, <b>Water 450 g</b>, <b>2 eggs</b>, or <b>Salt 2.5%</b> for
          baker’s percentages. A line with no amount, like <b>Biga</b> or <b>For the dough</b>, starts a stage.
        </p>
        {category && onCategory ? (
          <div className="chips" role="group" aria-label="Recipe type">
            {CATEGORIES.map((cat) => (
              <button key={cat} type="button" className="chip-btn" aria-pressed={category === cat} onClick={() => onCategory(cat)}>
                {CATEGORY_NAME[cat]}
              </button>
            ))}
          </div>
        ) : null}
        {text.trim() ? (
          parsed ? (
            <div className="paste-preview">
              <p className="note">
                <b>
                  {count(parsed.ingredients.length, 'ingredient', 'ingredients')}
                  {parsed.stages.length ? `, in ${count(parsed.stages.length + 1, 'stage', 'stages')} (${[...parsed.stages, parsed.method === 'bakers' ? 'main' : 'main mix'].join(', ')})` : ''}
                </b>
                , {parsed.method === 'bakers' ? 'as baker’s percentages' : 'by weight'}:{' '}
                {parsed.ingredients.map((x) => `${x.name}${x.role === 'flour' ? ' (flour)' : x.role === 'water' ? ' (water)' : ''}`).join(', ')}.
                {parsed.notes.length ? ` Kept for the notes: ${parsed.notes.join('; ')}.` : ''}
              </p>
              {parsed.warnings.map((w) => (
                <p className="warn" key={w}>
                  {w}
                </p>
              ))}
            </div>
          ) : (
            <p className="warn">Nothing looks like an ingredient yet. Each needs an amount, like “900g flour”.</p>
          )
        ) : null}
        <div className="sheet-actions">
          <button type="button" className="btn primary block" disabled={!parsed} onClick={() => parsed && onDone(parsed, text)}>
            <Icon name="paste" size={18} /> {action}
          </button>
          <button type="button" className="btn block" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Sheet>
  );
}
