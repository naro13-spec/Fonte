import { store } from '../app/state.js';
import { esc } from '../domain/format.js';
import { EXERCISES, GROUPS, EQ_LABEL } from '../domain/catalogue.js';
import { capabilities, isAvailable, missingFor } from '../domain/equipment.js';
import { dots, chip } from './components.js';

export function exercisesView() {
  const ui = store.ui;
  const c = capabilities(store.S.equipment);
  let h = '<h1>Exercices</h1><p class="muted">La bibliothèque suit ton matériel.</p><div class="row" style="margin-bottom:10px">';
  [['all', 'Tous'], ['ok', 'Disponibles'], ['no', 'Indisponibles']].forEach(function (f) { h += chip(f[1], 'filter', f[0], ui.filter === f[0]); });
  h += '</div><div class="row" style="margin-bottom:16px">';
  ['all'].concat(GROUPS).forEach(function (g) { h += chip(g === 'all' ? 'Tous les groupes' : g, 'group', g, ui.group === g); });
  h += '</div><div class="list">';
  let n = 0;
  Object.keys(EXERCISES).forEach(function (id) {
    const ex = EXERCISES[id];
    const ok = isAvailable(ex, c);
    if (ui.filter === 'ok' && !ok) return;
    if (ui.filter === 'no' && ok) return;
    if (ui.group !== 'all' && ex.g !== ui.group) return;
    n++;
    h += '<button class="item' + (ok ? '' : ' off') + '" data-act="fiche" data-arg="' + esc(id) + '"><span>' + esc(ex.n) + '<br><span class="muted small">' + esc(ex.m.join(', ')) + '</span></span>' +
      '<span style="text-align:right">' + dots(ex.d) + '<br>' + (ok ? '<span class="badge ok">Disponible</span>' : '<span class="badge warn">' + esc(missingFor(ex, c).map(function (r) { return EQ_LABEL[r]; }).join(', ')) + '</span>') + '</span></button>';
  });
  if (!n) h += '<div class="card empty"><b>Aucun exercice pour ce filtre</b></div>';
  return h + '</div>';
}
