// Petits utilitaires de formatage, sans dépendance.

export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

export function fmt(n) { return String(n).replace('.', ','); }

export function pad(n) { return (n < 10 ? '0' : '') + n; }

export function uid() { return 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

export function clone(o) { return JSON.parse(JSON.stringify(o)); }

export function clamp(v, min, max) {
  v = Math.round(Number(v));
  if (!isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}
