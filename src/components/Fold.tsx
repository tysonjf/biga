import { useId, type CSSProperties, type ReactNode } from 'react';
import { Icon } from './Icon';

type Props = {
  id?: string;
  title: string;
  /** Shown beside the title, so a folded card still says what it holds. */
  summary?: ReactNode;
  open: boolean;
  onToggle: (open: boolean) => void;
  children: ReactNode;
  /** Position in the single phone column (see `.cols`). */
  order?: number;
};

/** Places a card in the single phone column, where the two desktop columns are merged. */
export const mobileOrder = (order?: number) => (order === undefined ? undefined : ({ '--m': order } as CSSProperties));

/** A card whose body folds away behind its heading. */
export function Fold({ id, title, summary, open, onToggle, children, order }: Props) {
  const body = useId();
  return (
    <section className={'card fold' + (open ? ' open' : '')} id={id} style={mobileOrder(order)}>
      <h2>
        <button type="button" className="fold-h" aria-expanded={open} aria-controls={body} onClick={() => onToggle(!open)}>
          <span>{title}</span>
          {summary ? <span className="hint">{summary}</span> : null}
          <Icon name="chevron" size={18} className="fold-i" />
        </button>
      </h2>
      <div className="fold-b" id={body} hidden={!open}>
        {children}
      </div>
    </section>
  );
}
