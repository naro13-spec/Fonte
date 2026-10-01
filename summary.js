import { store } from '../app/state.js';
import { esc } from '../domain/format.js';
import { EXERCISES } from '../domain/catalogue.js';
import { kgLabel } from '../domain/equipment.js';
import { unitOf } from '../domain/history.js';

export function summaryView() {
  const S = store.S;
  const s = S.sessions.filter(function (x) { return x.id === store.ui.summaryId; })[0];
  if (!s) return null;
  let sets = 0;
  let reps = 0;
  s.exs.forEach(function (e) { e.sets.forEach(function (st) { sets++; reps += st.reps || 0; }); });
  let h = '<div class="sess"><div class="sbody" style="display:block"><div><span class="badge ok">Séance enregistrée</span>' +
    '<h1 style="margin:12px 0 4px">Séance ' + esc(s.tpl) + (s.partial ? ' arrêtée' : ' terminée') + '</h1>' +
    '<p class="muted">' + Math.max(1, Math.round(s.durationSec / 60)) + ' min · ' + sets + ' séries' + (reps ? ' · ' + reps + ' répétitions au total' : '') + (s.partial ? ' · séance partielle' : '') + '</p>';
  if (s.records && s.records.length) {
    h += '<div class="card"><h3>Records</h3>';
    s.records.forEach(function (r) {
      const ex = EXERCISES[r.exId];
      h += '<p style="margin:8px 0 0"><span class="badge record">Record</span> ' + esc(ex.n) + ' : ' + r.from + ' → ' + r.to + unitOf(ex) + (r.kg ? ' (' + esc(kgLabel(ex, r.kg, S.equipment)) + ')' : '') + '</p>';
    });
    h += '</div>';
  }
  h += '<div class="card"><h3>Comment était la séance ?</h3><div class="row" style="margin:10px 0" role="group" aria-label="Qualité de la séance">';
  [[1, 'Difficile'], [2, 'Moyenne'], [3, 'Bonne'], [4, 'Très bonne']].forEach(function (q) {
    h += '<button class="chip" data-act="quality" data-arg="' + q[0] + '" aria-pressed="' + (s.quality === q[0]) + '">' + q[1] + '</button>';
  });
  h += '</div><textarea id="sumNote" maxlength="500" placeholder="Une remarque pour toi (facultatif)">' + esc(s.note || '') + '</textarea></div>';
  return h + '<button class="btn primary block" data-act="closeSummary">Terminer</button></div></div></div>';
}
