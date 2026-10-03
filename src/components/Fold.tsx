import { useId, type ReactNode } from 'react';
import { Icon } from './Icon';

type Props = {
  id?: string;
  title: string;
  /** Shown beside the title, so a folded card still says what it holds. */
  summary?: ReactNode;
  open: boolean;
  onToggle: (open: boolean) => void;
  children: ReactNode;
};

/** A card whose body folds away behind its heading. */
export function Fold({ id, title, summary, open, onToggle, children }: Props) {
  const body = useId();
  return (
    <section className={'card fold' + (open ? ' open' : '')} id={id}>
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
