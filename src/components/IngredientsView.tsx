import { useEffect, useLayoutEffect, useRef } from 'react';

export type Ingredient = {
  n: string;
  /** Shorter name for the full-screen view, where long names cost font size. */
  short?: string;
  sub?: string;
  /** A word or two shown beside the name in the full-screen view. */
  tag?: string;
  g: string;
  sum?: boolean;
};
export type Stage = { key: string; title: string; when?: string; items: Ingredient[] };

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  sub: string;
  stages: Stage[];
};

/**
 * Full-screen ingredient amounts for the kitchen: every line on one screen, no scrolling.
 * The text is sized to the largest font that still fits, and the screen is kept awake.
 */
export function IngredientsView({ open, onClose, title, sub, stages }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);

  // Layout effect: the dialog has to be showing before the fit below can measure it.
  useLayoutEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.documentElement.classList.add('modal-open');
    } else if (!open && d.open) d.close();
    if (!open) document.documentElement.classList.remove('modal-open');
  }, [open]);

  useEffect(() => () => document.documentElement.classList.remove('modal-open'), []);

  // Binary-search the biggest font size whose layout still fits the box. Everything inside is sized
  // in em, so one number scales the whole list. Refit on rotation, resize and late font loads.
  useLayoutEffect(() => {
    const b = box.current;
    const el = body.current;
    if (!open || !b || !el) return;
    const fit = () => {
      el.style.setProperty('--spread', '0px');
      let lo = 8;
      let hi = 72;
      for (let i = 0; i < 14; i++) {
        const mid = (lo + hi) / 2;
        el.style.fontSize = `${mid}px`;
        if (el.offsetHeight <= b.clientHeight && el.scrollWidth <= b.clientWidth) lo = mid;
        else hi = mid;
      }
      el.style.fontSize = `${Math.floor(lo * 10) / 10}px`;
      // A long line can cap the size before the height runs out: share what's left between the rows.
      const rows = el.querySelectorAll('li').length;
      const spare = b.clientHeight - el.offsetHeight;
      if (rows && spare > 0) el.style.setProperty('--spread', `${Math.floor((spare / rows / 2) * 10) / 10}px`);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(b);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => ro.disconnect();
  }, [open, stages]);

  // Keep the screen on while it's showing (floury hands).
  useEffect(() => {
    if (!open || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let done = false;
    const get = () =>
      navigator.wakeLock
        .request('screen')
        .then((l) => {
          if (done) l.release().catch(() => {});
          else lock = l;
        })
        .catch(() => {});
    const onVisible = () => document.visibilityState === 'visible' && get();
    get();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      done = true;
      lock?.release().catch(() => {});
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="ingv"
      aria-label={`${title} ingredients`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {open ? (
        <>
          <header className="ingv-h">
            <div className="ingv-t">
              <h2>{title}</h2>
              <p>{sub}</p>
            </div>
            <button type="button" className="btn small" onClick={onClose}>
              Done
            </button>
          </header>
          <div className="ingv-box" ref={box}>
            <div className="ingv-body" ref={body}>
              {stages.map((st) => (
                <section key={st.key} className="ingv-stage">
                  <h3>
                    <span>{st.title}</span>
                    {st.when ? <small>{st.when}</small> : null}
                  </h3>
                  <ul>
                    {st.items
                      .filter((it) => !it.sum)
                      .map((it, i) => (
                        <li key={i}>
                          <span className="n">
                            {it.short ?? it.n}
                            {it.tag ? <small>{it.tag}</small> : null}
                          </span>
                          <span className="g">{it.g}</span>
                        </li>
                      ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </dialog>
  );
}
