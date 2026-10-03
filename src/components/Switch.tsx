import { useId } from 'react';
import { tick } from '../lib/haptics';

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
  return (
    <label className="switch-row" htmlFor={id}>
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
        onChange={(e) => {
          onChange(e.target.checked);
          tick();
        }}
      />
    </label>
  );
}
