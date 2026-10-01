// Dates locales (jour civil). La semaine commence le lundi.
import { pad } from './format.js';

export const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const DL = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

export function parseYmd(s) { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }

export function fd(s) { const p = s.split('-'); return p[2] + '/' + p[1]; }

export function weekdayIdx(d) { return (d.getDay() + 6) % 7; }

export function addDays(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

export function mondayOf(d) { return addDays(d, -weekdayIdx(d)); }
