import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
  getResponse: (id: string) => string | undefined;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __tsLoad?: Promise<TurnstileApi>;
  }
}

const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  window.__tsLoad ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SRC;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile failed to load')));
    s.onerror = () => {
      window.__tsLoad = undefined;
      reject(new Error('Turnstile failed to load'));
    };
    document.head.appendChild(s);
  });
  return window.__tsLoad;
}

export type TurnstileHandle = {
  /** Resolves with a fresh single-use token, waiting for the widget if it's still working. */
  token: (timeoutMs?: number) => Promise<string>;
  reset: () => void;
};

type Props = { siteKey: string; action: string };

/**
 * Cloudflare Turnstile in "interaction-only" mode: invisible for almost everyone, and only shows
 * a checkbox when Cloudflare wants a human to click.
 */
export const Turnstile = forwardRef<TurnstileHandle, Props>(function Turnstile({ siteKey, action }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const token = useRef<string | null>(null);
  const waiters = useRef<((t: string) => void)[]>([]);
  const failed = useRef<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadTurnstile()
      .then((ts) => {
        if (cancelled || !host.current) return;
        widget.current = ts.render(host.current, {
          sitekey: siteKey,
          action,
          theme: 'auto',
          size: 'flexible',
          appearance: 'interaction-only',
          'refresh-expired': 'auto',
          callback: (t: string) => {
            token.current = t;
            failed.current = null;
            waiters.current.splice(0).forEach((w) => w(t));
          },
          'expired-callback': () => {
            token.current = null;
          },
          'error-callback': () => {
            token.current = null;
            failed.current = new Error("We couldn't check that you're human. Check your connection and try again.");
            return false; // let Turnstile retry
          },
        });
      })
      .catch((e) => {
        failed.current = e;
      });
    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [siteKey, action]);

  useImperativeHandle(ref, () => ({
    token: (timeoutMs = 15_000) => {
      if (token.current) return Promise.resolve(token.current);
      if (failed.current && !window.turnstile) return Promise.reject(failed.current);
      return new Promise<string>((resolve, reject) => {
        const t = setTimeout(() => {
          waiters.current = waiters.current.filter((w) => w !== done);
          reject(failed.current ?? new Error('Still checking that you’re human — try again in a moment.'));
        }, timeoutMs);
        const done = (v: string) => {
          clearTimeout(t);
          resolve(v);
        };
        waiters.current.push(done);
      });
    },
    reset: () => {
      token.current = null;
      if (widget.current) window.turnstile?.reset(widget.current);
    },
  }));

  return <div ref={host} className="turnstile" />;
});
