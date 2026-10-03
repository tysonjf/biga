import { useSyncExternalStore } from 'react';

export type Theme = 'system' | 'light' | 'dark';
const KEY = 'biga-theme';
const subs = new Set<() => void>();

// Dark unless someone picked Light or Auto. Keep in step with public/theme-init.js.
function read(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'system' ? v : 'dark';
  } catch {
    return 'dark';
  }
}

const darkQuery = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)') : null;

/** Applies the theme and keeps the browser chrome (status bar / title bar) colour in sync. */
export function applyTheme(t: Theme = read()) {
  const root = document.documentElement;
  if (t === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', t);
  const dark = t === 'dark' || (t === 'system' && !!darkQuery?.matches);
  const color = getComputedStyle(root).getPropertyValue('--bar').trim() || (dark ? '#14110f' : '#f6f2ec');
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
    if (t === 'system') {
      // restore the media-query versions
      m.content = m.dataset.default ?? m.content;
    } else {
      m.dataset.default ??= m.content;
      m.content = color;
    }
  });
}

darkQuery?.addEventListener('change', () => applyTheme());

export function setTheme(t: Theme) {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* private mode */
  }
  applyTheme(t);
  subs.forEach((f) => f());
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    read,
  );
}
