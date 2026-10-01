import { store } from '../app/state.js';
import { esc } from '../domain/format.js';
import { sortedAll } from '../domain/history.js';
import { EXERCISES } from '../domain/catalogue.js';
import { kgLabel } from '../domain/equipment.js';
import { fd } from '../domain/dates.js';
import { ic } from './components.js';

export function historyView() {
  const list = sortedAll(store.S.sessions).reverse();
  let h = '<h1>Historique</h1>';
  if (!list.length) {
    return h + '<div class="card empty"><div class="glyph">' + ic('hist', 28) + '</div><b>Pas encore de séance</b>' +
      '<p class="muted" style="margin:6px 0 16px">Tes séances terminées apparaîtront ici, avec chaque série.</p>' +
      '<button class="btn secondary sm" data-act="tab" data-arg="today">Voir la séance du jour</button></div>';
  }
  h += '<p class="muted">' + list.length + (list.length > 1 ? ' séances enregistrées.' : ' séance enregistrée.') + '</p><div class="list">';
  list.forEach(function (s) {
    let sets = 0;
    s.exs.forEach(function (e) { sets += e.sets.length; });
    h += '<button class="item" data-act="histOpen" data-arg="' + esc(s.id) + '"><span>Séance ' + esc(s.tpl) + ' · ' + fd(s.date) + '<br><span class="muted small">' +
      Math.max(1, Math.round((s.durationSec || 0) / 60)) + ' min · ' + sets + ' séries' + (s.partial ? ' · partielle' : '') + '</span></span>' +
      (s.records && s.records.length ? '<span class="badge record">Record</span>' : '') + '</button>';
  });
  return h + '</div>';
}

export function historyDetail(id) {
  const s = store.S.sessions.filter(function (x) { return x.id === id; })[0];
  if (!s) return '';
  let b = '<h3>Séance ' + esc(s.tpl) + ' · ' + fd(s.date) + '</h3><p class="muted">' + Math.max(1, Math.round((s.durationSec || 0) / 60)) + ' min' + (s.partial ? ' · séance partielle' : '') + (s.quality ? ' · ressenti ' + s.quality + ' sur 4' : '') + '</p>';
  s.exs.forEach(function (e) {
    const ex = EXERCISES[e.exId];
    const m = ex.meas === 'sec' ? 'secs' : 'reps';
    b += '<div class="kv"><b>' + esc(ex.n) + (e.sub ? ' <span class="badge info">Alternative</span>' : '') + '</b><span class="muted small">' +
      e.sets.map(function (st) { return (st[m] || 0) + (ex.meas === 'sec' ? ' s' : '') + (st.kg ? ' (' + esc(kgLabel(ex, st.kg, store.S.equipment)) + ')' : ''); }).join(' · ') + '</span></div>';
  });
  if (s.note) b += '<p class="muted">Remarque : ' + esc(s.note) + '</p>';
  return b + '<button class="btn secondary block" data-act="closeSheet">Fermer</button>';
}
