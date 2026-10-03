import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  label?: string;
};

/**
 * Bottom sheet on phones, centred dialog on wide screens. Built on <dialog> so focus trapping,
 * Escape and the Android back gesture (via `cancel`) come for free.
 */
export function Sheet({ open, onClose, title, children, label }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.documentElement.classList.add('modal-open');
    } else if (!open && d.open) {
      d.classList.add('closing');
      const done = () => {
        d.classList.remove('closing');
        d.close();
      };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) done();
      else setTimeout(done, 180);
    }
    if (!open) document.documentElement.classList.remove('modal-open');
  }, [open]);

  useEffect(() => () => document.documentElement.classList.remove('modal-open'), []);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-label={label ?? title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // tap on the backdrop closes
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="sheet-body">
        <div className="grabber" aria-hidden="true" />
        {title ? <h2 className="sheet-title">{title}</h2> : null}
        {children}
      </div>
    </dialog>
  );
}
