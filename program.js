import { store } from '../app/state.js';
import { esc } from '../domain/format.js';
import { DAYS } from '../domain/dates.js';
import { EXERCISES } from '../domain/catalogue.js';
import { capabilities, isAvailable } from '../domain/equipment.js';
import { estimateMinutes, effectiveDay } from '../domain/program.js';
import { ymd, mondayOf } from '../domain/dates.js';
import { target } from './components.js';

export function programView() {
  const S = store.S;
  const c = capabilities(S.equipment);
  const wk = ymd(mondayOf(new Date(store.now())));
  let h = '<h1>Programme</h1><p class="muted">Tes séances. Tu peux régler chaque exercice ou déplacer une séance pour cette semaine.</p>';
  S.templates.forEach(function (t) {
    const day = effectiveDay(t, wk, S.moves);
    const moved = day !== t.day;
    h += '<div class="card"><div class="row" style="justify-content:space-between"><h3>Séance ' + esc(t.id) + ', ' + esc(t.name.toLowerCase()) + '</h3>' + (t.optional ? '<span class="badge info">Optionnelle</span>' : '') + '</div>' +
      '<p class="muted small" style="margin-bottom:10px">' + DAYS[day] + (moved ? ' (déplacée cette semaine)' : '') + ' · environ ' + estimateMinutes(t, S.sessions) + ' min · ' + esc(t.sub) + '</p><div class="list">';
    t.ex.forEach(function (te, i) {
      const ex = EXERCISES[te.ex];
      const ok = isAvailable(ex, c);
      h += '<div class="item2' + (ok ? '' : ' off') + '"><button class="item2-main" data-act="fiche" data-arg="' + esc(ex.id) + '"><span>' + esc(ex.n) + '<br><span class="muted small">' + te.sets + ' × ' + target(te, ex) + (te.per ? ' ' + te.per : '') + ' · repos ' + te.rest + ' s</span></span>' +
        (ok ? '' : '<span class="badge warn">Matériel manquant</span>') + '</button>' +
        '<button class="btn ghost sm" data-act="editTe" data-arg="' + esc(t.id + ':' + i) + '" aria-label="Régler ' + esc(ex.n) + '">Régler</button></div>';
    });
    h += '</div><div class="row" style="margin-top:14px"><button class="btn ' + (t.optional ? 'secondary' : 'primary') + '" data-act="start" data-arg="' + esc(t.id) + '">Faire cette séance maintenant</button>' +
      '<button class="btn ghost" data-act="moveTpl" data-arg="' + esc(t.id) + '">Déplacer cette semaine</button></div></div>';
  });
  return h;
}
