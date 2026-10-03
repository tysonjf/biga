import { createContext, useContext, useEffect, useState } from 'react';

/**
 * Recipes and bakes open locked, so a stray tap while scrolling can't change them. Controls read
 * this to show their value without letting it be changed.
 */
export const Locked = createContext(false);
export const useLocked = () => useContext(Locked);

// Things you've only just made open ready to edit.
const fresh = new Set<string>();
export const markFresh = (id: string) => fresh.add(id);

export function useLock(id: string) {
  const [locked, setLocked] = useState(() => !fresh.has(id));
  useEffect(() => {
    fresh.delete(id);
  }, [id]);
  return [locked, setLocked] as const;
}

/** Elements a locked page answers with a hint instead of a change. */
export const LOCKED_TARGET = '[data-locked]';
