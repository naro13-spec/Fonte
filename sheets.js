import { store } from '../app/state.js';
import { esc } from '../domain/format.js';
import { DAYS, ymd, mondayOf } from '../domain/dates.js';
import { EXERCISES, SAFE_TXT, EQ_LABEL } from '../domain/catalogue.js';
import { capabilities, missingFor, isAvailable, ADDABLE } from '../domain/equipment.js';
import { estimateMinutes, findTemplate, effectiveDay, moveConflicts } from '../domain/program.js';
import { currentEx } from '../domain/session.js';
import { dots } from './components.js';
import { historyDetail } from './history.js';

function list(items) { return '<ul class="plain">' + items.map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ul>'; }

export function sheetHtml() {
  const sh = store.ui.sheet;
  if (!sh) return '';
  const S = store.S;
  const A = store.A;
  let b = '<div class="overlay" data-act="closeSheetBg"><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>';

  if (sh.type === 'safety') {
    const ex = EXERCISES[sh.exId];
    const st = SAFE_TXT[ex.safe];
    b += '<h3>' + esc(st.t) + '</h3><div class="safety"><b>' + esc(ex.n) + '</b><p style="margin:6px 0 0">' + esc(st.body) + '</p></div>' +
      '<button class="btn primary block" data-act="ack" style="margin-bottom:10px">Test fait, je commence</button>';
    if (ex.alt && isAvailable(EXERCISES[ex.alt], capabilities(S.equipment))) b += '<button class="btn secondary block" data-act="swap" style="margin-bottom:10px">Choisir l\'alternative : ' + esc(EXERCISES[ex.alt].n.toLowerCase()) + '</button>';
    b += '<button class="btn ghost block" data-act="skipEx">Passer cet exercice</button>';
  } else if (sh.type === 'pain') {
    b += '<h3>Une douleur pendant l\'exercice</h3>';
    if (!sh.zone) {
      b += '<p class="muted">Où ressens-tu la douleur ?</p><div class="row">';
      ['Épaule', 'Coude', 'Poignet', 'Bas du dos', 'Hanche', 'Genou', 'Cheville', 'Autre'].forEach(function (z) { b += '<button class="chip" data-act="painZone" data-arg="' + z + '">' + z + '</button>'; });
      b += '</div>';
    } else {
      const cur = currentEx(A);
      b += '<div class="safety"><b>Arrête cet exercice maintenant.</b><p style="margin:6px 0 0">Une douleur (' + esc(sh.zone.toLowerCase()) + ') n\'est pas de la fatigue normale. Ne continue pas à forcer. Si elle est vive, si elle dure ou si elle revient, parles-en à un parent ou tuteur, ou à un professionnel de santé. Fonte ne peut pas poser de diagnostic.</p></div>';
      if (cur.alt && isAvailable(EXERCISES[cur.alt], capabilities(S.equipment))) b += '<button class="btn secondary block" data-act="swap" style="margin-bottom:10px">Voir l\'alternative : ' + esc(EXERCISES[cur.alt].n.toLowerCase()) + '</button>';
      b += '<button class="btn primary block" data-act="skipEx">Passer cet exercice</button>';
    }
  } else if (sh.type === 'quit') {
    b += '<h3>Quitter la séance ?</h3><p class="muted">Les séries déjà validées sont conservées.</p>' +
      '<button class="btn primary block" data-act="endNow" style="margin-bottom:10px">Terminer maintenant</button>' +
      '<button class="btn secondary block" data-act="closeSheet" style="margin-bottom:10px">Continuer la séance</button>' +
      '<button class="btn danger block" data-act="abandon">Quitter sans enregistrer</button>';
  } else if (sh.type === 'pickTpl') {
    b += '<h3>Choisir une séance</h3><div class="list">';
    S.templates.forEach(function (t) {
      b += '<button class="item" data-act="start" data-arg="' + esc(t.id) + '"><span>Séance ' + esc(t.id) + ', ' + esc(t.name.toLowerCase()) + '<br><span class="muted small">' + t.ex.length + ' exercices · environ ' + estimateMinutes(t, S.sessions) + ' min' + (t.optional ? ' · optionnelle' : '') + '</span></span></button>';
    });
    b += '</div>';
  } else if (sh.type === 'addEq') {
    b += '<h3>Ajouter du matériel</h3><p class="muted">Les exercices compatibles se débloquent automatiquement.</p><div class="list">';
    const have = {};
    S.equipment.forEach(function (e) { have[e.id] = true; });
    let n = 0;
    ADDABLE.forEach(function (c) {
      if (have[c.key]) return;
      n++;
      b += '<button class="item" data-act="addEqItem" data-arg="' + c.key + '"><span>' + esc(c.label) + '</span><span aria-hidden="true">+</span></button>';
    });
    if (!n) b += '<p class="muted">Tout le matériel proposé est déjà dans ton inventaire.</p>';
    b += '</div>';
  } else if (sh.type === 'fiche') {
    const x = EXERCISES[sh.exId];
    const miss = missingFor(x, capabilities(S.equipment));
    b += '<h3>' + esc(x.n) + '</h3><div class="row" style="margin:8px 0">' +
      (miss.length ? '<span class="badge warn">Il te manque : ' + esc(miss.map(function (r) { return EQ_LABEL[r]; }).join(', ')) + '</span>' : '<span class="badge ok">Réalisable avec ton matériel</span>') + dots(x.d) + '</div>' +
      '<div class="kv"><div><span class="muted">Muscles principaux :</span> ' + esc(x.m.join(', ')) + '</div>' + (x.s.length ? '<div><span class="muted">Muscles secondaires :</span> ' + esc(x.s.join(', ')) + '</div>' : '') +
      '<div><span class="muted">Matériel :</span> ' + (x.req.length ? esc(x.req.map(function (r) { return EQ_LABEL[r]; }).join(', ')) : 'Aucun') + '</div></div>';
    if (x.safe) b += '<div class="safety"><b>' + esc(SAFE_TXT[x.safe].t) + '</b><p style="margin:6px 0 0">' + esc(SAFE_TXT[x.safe].body) + '</p></div>';
    b += '<h3 class="h-sm">Consignes</h3>' + list(x.cues) + '<h3 class="h-sm">Erreurs fréquentes</h3>' + list(x.err);
    if (x.vars && x.vars.length) b += '<h3 class="h-sm">Variantes</h3>' + list(x.vars);
    b += '<h3 class="h-sm">Comment progresser</h3>' + list(x.lev.filter(function (l) { return l !== 'CHARGE'; }).concat(x.lev.indexOf('CHARGE') >= 0 ? ['Charge supérieure, quand tu en as une'] : []));
    if (x.note) b += '<p class="muted">' + esc(x.note) + '</p>';
    if (x.alt) b += '<p class="muted">Alternative : ' + esc(EXERCISES[x.alt].n) + '</p>';
    b += '<button class="btn secondary block" data-act="closeSheet">Fermer</button>';
  } else if (sh.type === 'edit') {
    const t = findTemplate(S.templates, sh.tplId);
    const te = t.ex[sh.idx];
    const ex = EXERCISES[te.ex];
    b += '<h3>Régler : ' + esc(ex.n) + '</h3><p class="muted small">Séance ' + esc(t.id) + '. Tes séances déjà faites ne changent pas.</p>';
    if (sh.errors && sh.errors.length) b += '<div class="safety"><b>À corriger</b><p style="margin:6px 0 0">' + sh.errors.map(esc).join('<br>') + '</p></div>';
    b += '<label class="fld">Nombre de séries<input type="number" inputmode="numeric" id="edSets" min="1" max="12" value="' + te.sets + '"></label>';
    if (te.max) b += '<p class="muted small">Objectif : le maximum de ' + (ex.meas === 'sec' ? 'secondes' : 'répétitions') + ' possible' + (te.rir ? ', en gardant ' + te.rir + ' en réserve' : '') + '.</p>';
    else b += '<div class="row2"><label class="fld">Minimum (' + (ex.meas === 'sec' ? 's' : 'reps') + ')<input type="number" inputmode="numeric" id="edLo" min="1" value="' + te.lo + '"></label><label class="fld">Maximum<input type="number" inputmode="numeric" id="edHi" min="1" value="' + te.hi + '"></label></div>';
    b += '<label class="fld">Repos entre les séries (secondes)<input type="number" inputmode="numeric" id="edRest" min="10" max="600" value="' + te.rest + '"></label>' +
      '<button class="btn primary block" data-act="saveTe" style="margin-bottom:10px">Enregistrer</button><button class="btn ghost block" data-act="closeSheet">Annuler</button>';
  } else if (sh.type === 'move') {
    const t = findTemplate(S.templates, sh.tplId);
    const wk = ymd(mondayOf(new Date(store.now())));
    const day = sh.day != null ? sh.day : effectiveDay(t, wk, S.moves);
    const conflicts = moveConflicts(S.templates, S.moves, wk, t.id, day);
    b += '<h3>Déplacer la séance ' + esc(t.id) + '</h3><p class="muted">Pour cette semaine seulement. Ton programme habituel ne change pas.</p><div class="row" style="margin-bottom:12px">';
    DAYS.forEach(function (d, i) { b += '<button class="chip" data-act="moveDay" data-arg="' + i + '" aria-pressed="' + (i === day) + '">' + d + '</button>'; });
    b += '</div>';
    if (conflicts.length) {
      b += '<div class="safety"><b>Récupération un peu courte</b><p style="margin:6px 0 0">' + conflicts.map(function (c) {
        return 'La séance ' + esc(c.tpl.id) + ' sollicite aussi ' + esc(c.muscles.join(', ').toLowerCase()) + ' à moins de 48 h.';
      }).join('<br>') + ' Tu peux continuer si tu te sens bien.</p></div>';
    }
    b += '<button class="btn primary block" data-act="confirmMove" style="margin-bottom:10px">' + (conflicts.length ? 'Déplacer quand même' : 'Déplacer') + '</button>' +
      '<button class="btn ghost block" data-act="closeSheet">Annuler</button>';
  } else if (sh.type === 'hist') {
    b += historyDetail(sh.id);
  } else if (sh.type === 'importPreview') {
    b += '<h3>Importer cette sauvegarde ?</h3><p class="muted">Le fichier est valide : ' + sh.summary.sessions + ' séances, ' + sh.summary.sets + ' séries, ' + sh.summary.equipment + ' éléments de matériel.</p>' +
      '<div class="safety"><b>Attention</b><p style="margin:6px 0 0">Tes données actuelles seront remplacées. Une copie de sauvegarde n\'est pas conservée : exporte-les d\'abord si besoin.</p></div>' +
      '<button class="btn primary block" data-act="confirmImport" style="margin-bottom:10px">Remplacer mes données</button><button class="btn ghost block" data-act="closeSheet">Annuler</button>';
  } else if (sh.type === 'importError') {
    b += '<h3>Le fichier n\'a pas pu être importé</h3><p class="muted">Aucune donnée n\'a été modifiée.</p><ul class="plain">' + sh.errors.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul><button class="btn secondary block" data-act="closeSheet">Fermer</button>';
  } else if (sh.type === 'confirmReset') {
    b += '<h3>Effacer toutes les données ?</h3><p class="muted">Séances, séries, matériel et réglages seront supprimés de cet appareil. Cette action est définitive.</p>' +
      '<button class="btn danger block" data-act="doReset" style="margin-bottom:10px">Tout effacer</button><button class="btn secondary block" data-act="closeSheet">Annuler</button>';
  }
  return b + '</div></div>';
}
