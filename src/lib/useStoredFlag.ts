import { useCallback, useState } from 'react';

/** An on/off preference remembered on this device. Falls back to `initial` when storage is unavailable. */
export function useStoredFlag(key: string, initial: boolean) {
  const [value, setValue] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v === null ? initial : v === '1';
    } catch {
      return initial;
    }
  });
  const set = useCallback(
    (next: boolean) => {
      setValue(next);
      try {
        localStorage.setItem(key, next ? '1' : '0');
      } catch {
        /* private mode */
      }
    },
    [key],
  );
  return [value, set] as const;
}
