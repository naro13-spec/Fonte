// Petits éléments d'interface réutilisables (chaînes HTML).
import { esc } from '../domain/format.js';

const IC = {
  today: '<path d="M4 11l8-7 8 7M6 10v9h12v-9"/>',
  prog: '<path d="M5 6h14M5 12h14M5 18h9"/>',
  hist: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  dumb: '<path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  chart: '<path d="M4 19V9M10 19V5M16 19v-7M21 19H3"/>'
};

export function ic(name, size) {
  const s = size || 24;
  return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[name] + '</svg>';
}

export function dots(n) {
  let s = '';
  for (let i = 0; i < 5; i++) s += i < n ? '●' : '<span class="e">●</span>';
  return '<span class="dots" role="img" aria-label="Difficulté ' + n + ' sur 5">' + s + '</span>';
}

export function btn(label, act, arg, cls, extra) {
  return '<button class="btn ' + (cls || 'secondary') + '" data-act="' + act + '"' + (arg != null ? ' data-arg="' + esc(arg) + '"' : '') + (extra || '') + '>' + label + '</button>';
}

export function chip(label, act, arg, pressed) {
  return '<button class="chip" data-act="' + act + '" data-arg="' + esc(arg) + '" aria-pressed="' + (pressed ? 'true' : 'false') + '">' + esc(label) + '</button>';
}

export function target(te, ex) {
  const unit = ex.meas === 'sec' ? ' s' : '';
  if (te.max) return 'max' + (te.rir ? ', ' + te.rir + ' en réserve' : '');
  return (te.lo === te.hi ? te.lo : te.lo + ' à ' + te.hi) + unit;
}
