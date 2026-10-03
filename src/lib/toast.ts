import { useSyncExternalStore } from 'react';

export type Toast = { id: number; text: string; action?: { label: string; run: () => void } };

let current: Toast | null = null;
let timer: number | undefined;
let seq = 0;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function toast(text: string, action?: Toast['action'], ms = action ? 5000 : 3200) {
  current = { id: ++seq, text, action };
  clearTimeout(timer);
  timer = window.setTimeout(dismiss, ms);
  emit();
}

export function dismiss() {
  current = null;
  emit();
}

export function useToast() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => current,
  );
}
