// Light haptic tick for stepper presses and switches. Android/Chrome only: iOS has no
// Vibration API, and Safari 26.5 closed the programmatic "switch input" workaround.

let last = 0;

export function tick() {
  const now = performance.now();
  if (now - last < 45) return; // don't buzz on every auto-repeat step
  last = now;
  try {
    navigator.vibrate?.(4);
  } catch {
    /* haptics are a nicety */
  }
}
