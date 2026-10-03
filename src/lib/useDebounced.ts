import { useEffect, useRef } from 'react';

/**
 * Calls `fn(value)` once `value` has been stable for `ms`. Flushes immediately on unmount,
 * when the page is hidden (app switched away), and before unload, so edits are never dropped.
 */
export function useDebouncedEffect<T>(value: T, ms: number, fn: (v: T) => void, enabled = true) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const pending = useRef<{ v: T } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  // The last value seen, so the first render (and React re-running effects in development) isn't a change.
  const seen = useRef(value);

  const flush = () => {
    clearTimeout(timer.current);
    if (pending.current) {
      const { v } = pending.current;
      pending.current = null;
      fnRef.current(v);
    }
  };

  useEffect(() => {
    if (Object.is(seen.current, value)) return;
    seen.current = value;
    if (!enabled) return;
    pending.current = { v: value };
    clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, ms);
  }, [value, ms, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancel = () => {
    clearTimeout(timer.current);
    pending.current = null;
  };

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { flush, cancel };
}
