import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';

let needRefresh = false;
let offlineReady = false;
let registration: ServiceWorkerRegistration | undefined;
let updateSW: ((reload?: boolean) => Promise<void>) | undefined;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function startPwa() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  updateSW = registerSW({
    onNeedRefresh() {
      needRefresh = true;
      emit();
    },
    onOfflineReady() {
      offlineReady = true;
      emit();
    },
    onRegisteredSW(_url, r) {
      registration = r;
      if (!r) return;
      // iOS resumes installed apps rather than relaunching them, so also check when we come back.
      setInterval(() => r.update().catch(() => {}), 60 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') r.update().catch(() => {});
      });
    },
  });
}

export function applyUpdate() {
  needRefresh = false;
  emit();
  updateSW?.(true);
}

export function dismissUpdate() {
  needRefresh = false;
  offlineReady = false;
  emit();
}

export async function checkForUpdate(): Promise<boolean> {
  if (!registration) return false;
  await registration.update().catch(() => {});
  return needRefresh || !!registration.waiting || !!registration.installing;
}

export function usePwaState() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => (needRefresh ? 'update' : offlineReady ? 'offline-ready' : null),
  );
}

export const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function useOnline() {
  return useSyncExternalStore(
    (f) => {
      window.addEventListener('online', f);
      window.addEventListener('offline', f);
      return () => {
        window.removeEventListener('online', f);
        window.removeEventListener('offline', f);
      };
    },
    () => navigator.onLine,
  );
}
