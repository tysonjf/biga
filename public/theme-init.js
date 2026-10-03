// Applies a saved light/dark choice before first paint (no flash). Kept external for the CSP.
try {
  var t = localStorage.getItem('biga-theme');
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
