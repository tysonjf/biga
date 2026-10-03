import { useRef, type MouseEvent } from 'react';
import { LOCKED_TARGET } from '../lib/lock';
import { toast } from '../lib/toast';
import { Icon } from './Icon';

/**
 * The Edit / Done button for a locked page, and a click handler for the page that answers a tap
 * on a locked control with a hint (and a nudge of the button) instead of silently ignoring it.
 */
export function useLockButton(locked: boolean, onToggle: (locked: boolean) => void) {
  const ref = useRef<HTMLButtonElement>(null);
  const button = (
    <button
      ref={ref}
      type="button"
      className={'nav-btn lock-btn' + (locked ? '' : ' editing')}
      aria-pressed={!locked}
      aria-label={locked ? 'Edit: unlock to make changes' : 'Done: lock again'}
      onClick={() => onToggle(!locked)}
    >
      <Icon name={locked ? 'lock' : 'unlock'} size={17} />
      <span>{locked ? 'Edit' : 'Done'}</span>
    </button>
  );
  const onClickCapture = (e: MouseEvent) => {
    if (!locked) return;
    const t = e.target as Element;
    if (!t.closest(LOCKED_TARGET) || t.closest('a')) return;
    toast('Locked so nothing changes by accident. Tap Edit to make changes.');
    ref.current?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.14)' }, { transform: 'scale(1)' }], {
      duration: 320,
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    });
  };
  return { button, onClickCapture };
}
