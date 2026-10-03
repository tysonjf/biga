import { lazy, Suspense } from 'react';
import type { Kind } from '../../shared/recipe';
import { mobileOrder } from './Fold';
import type { NotesEditorProps } from './NotesEditor';

const NotesEditor = lazy(() => import('./NotesEditor'));

/** The editor, or the plain text while it loads (it's a separate download). */
export function NotesText(props: NotesEditorProps) {
  return (
    <Suspense fallback={<div className="md md-loading">{props.value}</div>}>
      <NotesEditor {...props} />
    </Suspense>
  );
}

type Props = {
  id: string;
  title: string;
  hint?: string;
  value: string;
  onChange: (markdown: string) => void;
  editable: boolean;
  placeholder: string;
  /** Shown instead of an empty, locked editor. */
  empty: string;
  /** Offered while the notes are empty and editable. */
  template?: string;
  order?: number;
};

export function NotesCard({ id, title, hint, value, onChange, editable, placeholder, empty, template, order }: Props) {
  const blank = !value.trim();
  return (
    <section className="card notes-card" id={id} aria-labelledby={`h-${id}`} style={mobileOrder(order)}>
      <div className="card-h">
        <h2 id={`h-${id}`}>{title}</h2>
        {hint ? <span className="hint">{hint}</span> : null}
      </div>
      <div data-locked={editable ? undefined : ''}>
        {blank && !editable ? (
          <p className="note">{empty}</p>
        ) : (
          <NotesText value={value} onChange={onChange} editable={editable} placeholder={placeholder} label={title} />
        )}
      </div>
      {blank && editable && template ? (
        <div>
          <button type="button" className="btn small" onClick={() => onChange(template)}>
            Start from a template
          </button>
        </div>
      ) : null}
    </section>
  );
}

const BALLS = `## Balls
1. Cover the dough and let it rest.
2. Divide and shape into tight, smooth balls.
3. Proof, covered, until puffy and soft to the touch.

## Before you bake
- [ ] Heat the oven with the stone or steel in it for at least 45 minutes
- [ ] Get the toppings ready
- [ ] Flour the bench and the peel
`;

/** A starting point for a recipe's method. No amounts or times: those live in the recipe. */
export const METHOD_TEMPLATE: Record<Kind, string> = {
  biga: `## Biga
1. Dissolve the yeast in the water.
2. Add the flour and mix just until there's no dry flour left. It should look shaggy and lumpy, not smooth.
3. Cover and leave it to ferment.

## Final dough
1. Tear the biga into pieces into the bowl with most of the water.
2. Add the flour and mix until it comes together.
3. Add the salt, then the rest of the water a little at a time.
4. Mix until the dough is smooth and strong. Check its temperature.

${BALLS}`,
  poolish: `## Poolish
1. Dissolve the yeast in the water.
2. Whisk in the flour until it's a smooth batter.
3. Cover and leave it until it's bubbly and domed, just starting to dip in the middle.

## Final dough
1. Loosen the poolish with the water.
2. Add the flour and mix until it comes together.
3. Add the salt and mix until the dough is smooth and strong. Check its temperature.

${BALLS}`,
};
