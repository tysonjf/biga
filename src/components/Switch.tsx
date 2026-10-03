import { useId } from 'react';
import { tick } from '../lib/haptics';
import { useLocked } from '../lib/lock';

export function Switch({
  checked,
  onChange,
  label,
  sub,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub?: string;
}) {
  const id = useId();
  const locked = useLocked();
  return (
    <label className="switch-row" htmlFor={id} data-locked={locked ? '' : undefined}>
      <span className="switch-text">
        <span>{label}</span>
        {sub ? <small>{sub}</small> : null}
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="switch"
        checked={checked}
        aria-disabled={locked || undefined}
        onChange={(e) => {
          if (locked) return; // stays as it was: the switch is controlled
          onChange(e.target.checked);
          tick();
        }}
      />
    </label>
  );
}
