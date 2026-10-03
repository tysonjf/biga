// Applies the light/dark choice before first paint (no flash). Kept external for the CSP.
// Dark unless someone picked Light or Auto ('system'). Keep in step with src/lib/theme.ts.
var t = 'dark';
try {
  t = localStorage.getItem('biga-theme') || 'dark';
} catch (e) {}
if (t !== 'light' && t !== 'system') t = 'dark';
if (t !== 'system') document.documentElement.setAttribute('data-theme', t);
