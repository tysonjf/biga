import { useMemo, useSyncExternalStore } from 'react';

// One shared clock that ticks on the minute, and again whenever the app comes back to the screen.
let now = Date.now();
let timer: number | undefined;
const subs = new Set<() => void>();

function tick() {
  now = Date.now();
  subs.forEach((f) => f());
  timer = window.setTimeout(tick, 60_000 - (now % 60_000) + 50);
}
const onVisible = () => {
  if (document.visibilityState === 'visible') {
    clearTimeout(timer);
    tick();
  }
};

function subscribe(f: () => void) {
  subs.add(f);
  if (subs.size === 1) {
    tick();
    document.addEventListener('visibilitychange', onVisible);
  }
  return () => {
    subs.delete(f);
    if (!subs.size) {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    }
  };
}

/** The current time, updated every minute. */
export function useNow(): Date {
  const minute = useSyncExternalStore(subscribe, () => Math.floor(now / 60_000));
  return useMemo(() => new Date(minute * 60_000), [minute]);
}
