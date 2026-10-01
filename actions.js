// Toutes les actions de l'interface. Chaque action modifie l'état puis demande un nouveau rendu.
import { store, render, toast, newUi } from './state.js';
import { uid } from '../domain/format.js';
import { ymd, mondayOf } from '../domain/dates.js';
import { availableIds, unlockedBetween, newItem, loadOptions } from '../domain/equipment.js';
import { EXERCISES } from '../domain/catalogue.js';
import { findTemplate, setMove } from '../domain/program.js';
import { validateTemplateEx } from '../domain/validate.js';
import {
  startSession, makeDraft, validateSet, undoSet, skipExercise, swapToAlt, adjustRest, markPain, finishSession, currentEx
} from '../domain/session.js';
import { defaultState } from '../data/seed.js';
import { buildExport, parseImport } from '../data/transfer.js';
import { initAudio, acquireWake, releaseWake, buzz, download, requestPersist } from './platform.js';

let pendingImport = null;

function $(id) { return document.getElementById(id); }

function pressOnly(el) {
  Array.prototype.forEach.call(el.parentNode.children, function (c) { c.setAttribute('aria-pressed', c === el ? 'true' : 'false'); });
}

function persistActive() { store.repo.saveActive(store.A); }

function endActive() {
  store.A = null;
  store.repo.saveActive(null);
  store.ui.draft = null;
  store.ui.sheet = null;
  releaseWake();
}

function completeSession(partial) {
  const S = store.S;
  const ui = store.ui;
  const s = finishSession(store.A, S.sessions, store.now(), partial);
  endActive();
  if (!s) { ui.view = 'main'; toast('Séance fermée : aucune série enregistrée.'); return; }
  S.sessions.push(s);
  store.repo.putSession(s);
  ui.summaryId = s.id;
  ui.view = 'summary';
}

function startTpl(id) {
  const S = store.S;
  const ui = store.ui;
  if (store.A) { ui.view = 'session'; ui.sheet = null; render(); return; }
  const t = findTemplate(S.templates, id);
  if (!t) return;
  initAudio();
  if (S.settings.keepAwake) acquireWake();
  store.A = startSession(t, store.now());
  persistActive();
  ui.view = 'session';
  ui.sheet = null;
  ui.draft = null;
  render();
}

function equipmentChange(mutate, message) {
  const S = store.S;
  const before = availableIds(S.equipment);
  mutate();
  store.repo.saveEquipment(S.equipment);
  const after = availableIds(S.equipment);
  const gained = unlockedBetween(before, after);
  const lost = unlockedBetween(after, before);
  if (gained.length) toast(gained.length + (gained.length > 1 ? ' exercices débloqués : ' : ' exercice débloqué : ') + gained.map(function (i) { return EXERCISES[i].n; }).join(', ') + '.');
  else if (lost.length) toast(lost.length + (lost.length > 1 ? ' exercices deviennent indisponibles' : ' exercice devient indisponible') + '. Ton historique reste intact.');
  else toast(message);
}

export function onClick(ev) {
  const el = ev.target && ev.target.closest ? ev.target.closest('[data-act]') : null;
  if (!el) return;
  const act = el.getAttribute('data-act');
  const arg = el.getAttribute('data-arg');
  const S = store.S;
  const ui = store.ui;
  const now = store.now();

  switch (act) {
    case 'closeSheetBg':
      if (ev.target !== el) return;
      if (ui.sheet && ui.sheet.type === 'safety') return;
      ui.sheet = null; render(); return;
    case 'tab': ui.tab = arg; ui.view = 'main'; render(); if (globalThis.window && window.scrollTo) window.scrollTo(0, 0); return;
    case 'start': startTpl(arg); return;
    case 'resume': ui.view = 'session'; render(); return;
    case 'pickTpl': ui.sheet = { type: 'pickTpl' }; render(); return;
    case 'fiche': ui.sheet = { type: 'fiche', exId: arg }; render(); return;
    case 'closeSheet': ui.sheet = null; render(); return;
    case 'filter': ui.filter = arg; render(); return;
    case 'group': ui.group = arg; render(); return;
    case 'histOpen': ui.sheet = { type: 'hist', id: arg }; render(); return;

    /* Programme */
    case 'editTe': {
      const p = arg.split(':');
      ui.sheet = { type: 'edit', tplId: p[0], idx: +p[1], errors: [] };
      render(); return;
    }
    case 'saveTe': {
      const sh = ui.sheet;
      const t = findTemplate(S.templates, sh.tplId);
      const te = t.ex[sh.idx];
      const ex = EXERCISES[te.ex];
      const val = function (id) { const x = $(id); return x ? x.value : ''; };
      const r = validateTemplateEx({ sets: val('edSets'), lo: val('edLo'), hi: val('edHi'), rest: val('edRest') }, te, ex);
      if (!r.ok) { sh.errors = r.errors; render(); return; }
      te.sets = r.value.sets;
      te.rest = r.value.rest;
      if (!te.max) { te.lo = r.value.lo; te.hi = r.value.hi; }
      store.repo.saveTemplates(S.templates);
      ui.sheet = null; toast('Réglage enregistré. Tes séances passées ne changent pas.'); render(); return;
    }
    case 'moveTpl': ui.sheet = { type: 'move', tplId: arg, day: null }; render(); return;
    case 'moveDay': ui.sheet.day = +arg; render(); return;
    case 'confirmMove': {
      const t = findTemplate(S.templates, ui.sheet.tplId);
      const wk = ymd(mondayOf(new Date(now)));
      const day = ui.sheet.day != null ? ui.sheet.day : t.day;
      S.moves = setMove(S.moves, wk, t.id, day, t.day);
      store.repo.saveMoves(S.moves);
      ui.sheet = null; toast('Séance déplacée pour cette semaine.'); render(); return;
    }

    /* Équipement et préférences */
    case 'toggleEq':
      equipmentChange(function () { S.equipment.forEach(function (e) { if (e.id === arg) e.active = !e.active; }); }, 'Inventaire mis à jour.');
      render(); return;
    case 'check':
      S.equipment.forEach(function (e) { if (e.id === arg) e.checked = !e.checked; });
      store.repo.saveEquipment(S.equipment); render(); return;
    case 'addEq': ui.sheet = { type: 'addEq' }; render(); return;
    case 'addEqItem': {
      const item = newItem(arg);
      if (item && !S.equipment.some(function (e) { return e.id === item.id; })) {
        equipmentChange(function () { S.equipment.push(item); }, 'Matériel ajouté. Les charges supérieures seront proposées quand la progression le justifiera.');
      }
      ui.sheet = null; render(); return;
    }
    case 'pref': S.settings[arg] = !S.settings[arg]; store.repo.saveSettings(S.settings); render(); return;

    /* Données */
    case 'exportData':
      buildExport(S, now).then(function (obj) {
        const stamp = ymd(new Date(now));
        download('fonte-sauvegarde-' + stamp + '.json', JSON.stringify(obj));
        S.settings.lastExportAt = new Date(now).toISOString();
        store.repo.saveSettings(S.settings);
        toast('Sauvegarde exportée.'); render();
      }).catch(function () { toast('Export impossible sur cet appareil.'); render(); });
      return;
    case 'pickImport': { const f = $('importFile'); if (f) f.click(); return; }
    case 'confirmImport': {
      const st = pendingImport;
      if (!st) { ui.sheet = null; render(); return; }
      st.settings.onboardingDone = true;
      if (store.A) endActive();
      store.S = st;
      store.repo.replaceAll(st);
      pendingImport = null;
      ui.sheet = null; ui.tab = 'today'; ui.view = 'main';
      toast('Données importées.'); render(); return;
    }
    case 'resetAll': ui.sheet = { type: 'confirmReset' }; render(); return;
    case 'doReset': {
      endActive();
      store.S = defaultState();
      store.repo.replaceAll(store.S);
      const keep = ui.persisted;
      store.ui = newUi();
      store.ui.persisted = keep;
      store.ui.view = 'onboarding';
      toast('Données effacées.'); render(); return;
    }
    case 'persist':
      requestPersist().then(function (ok) { ui.persisted = ok; toast(ok ? 'Stockage protégé.' : "Le navigateur n'a pas accordé la protection pour l'instant."); render(); });
      return;

    /* Première ouverture */
    case 'onbNext': ui.onb = Math.min(2, ui.onb + 1); render(); return;
    case 'onbBack': ui.onb = Math.max(0, ui.onb - 1); render(); return;
    case 'onbDone': S.settings.onboardingDone = true; store.repo.saveSettings(S.settings); ui.view = 'main'; ui.tab = 'today'; render(); return;

    /* Séance */
    case 'inc': case 'dec': {
      if (!ui.draft) ui.draft = makeDraft(store.A, S.sessions, S.equipment);
      const sec = currentEx(store.A).meas === 'sec';
      const step = sec ? 5 : 1;
      ui.draft.reps = Math.max(0, Math.min(sec ? 1800 : 200, ui.draft.reps + (act === 'inc' ? step : -step)));
      const rv = $('repsVal'); if (rv) rv.textContent = ui.draft.reps;
      return;
    }
    case 'load': {
      ui.draft.kgIdx = +arg;
      const lt = $('loadTxt'); if (lt) lt.textContent = loadOptions(currentEx(store.A), S.equipment)[+arg].label;
      pressOnly(el); return;
    }
    case 'feel': ui.draft.feel = arg; pressOnly(el); return;
    case 'validate': {
      if (!ui.draft) ui.draft = makeDraft(store.A, S.sessions, S.equipment);
      const note = $('noteIn'); if (note) ui.draft.note = String(note.value).slice(0, 500);
      const r = validateSet(store.A, ui.draft, S.equipment, now);
      buzz(30);
      ui.pop = r.setIndex;
      ui.draft = null;
      if (r.sessionDone) completeSession(false); else persistActive();
      render(); return;
    }
    case 'undo': {
      const d = undoSet(store.A, S.equipment);
      if (d) { ui.draft = d; persistActive(); }
      render(); return;
    }
    case 'skipRest': store.A.restEnd = null; persistActive(); render(); return;
    case 'rest': adjustRest(store.A, +arg, now); persistActive(); render(); return;
    case 'ack': store.A.ack[ui.sheet.exId] = true; ui.sheet = null; persistActive(); render(); return;
    case 'swap':
      if (swapToAlt(store.A, S.equipment)) { ui.sheet = null; ui.draft = null; persistActive(); toast('Alternative choisie.'); }
      render(); return;
    case 'skipEx': {
      const r = skipExercise(store.A, now);
      ui.sheet = null; ui.draft = null;
      if (r.sessionDone) completeSession(false); else persistActive();
      render(); return;
    }
    case 'pain': ui.sheet = { type: 'pain', zone: null }; render(); return;
    case 'painZone': {
      const e = store.A.exs[store.A.exIdx];
      S.pain.push({ id: uid(), date: ymd(new Date(now)), exId: e.exId, zone: arg, tpl: store.A.tplId });
      markPain(store.A);
      store.repo.savePain(S.pain);
      persistActive();
      ui.sheet.zone = arg; render(); return;
    }
    case 'quit': ui.sheet = { type: 'quit' }; render(); return;
    case 'endNow': ui.sheet = null; completeSession(true); render(); return;
    case 'abandon': endActive(); ui.view = 'main'; toast('Séance fermée sans enregistrement.'); render(); return;
    case 'quality': {
      const s = S.sessions.filter(function (x) { return x.id === ui.summaryId; })[0];
      if (s) { s.quality = +arg; store.repo.putSession(s); }
      pressOnly(el); return;
    }
    case 'closeSummary': {
      const s = S.sessions.filter(function (x) { return x.id === ui.summaryId; })[0];
      const ni = $('sumNote');
      if (s) { s.note = ni ? String(ni.value).slice(0, 500) : ''; store.repo.putSession(s); }
      ui.view = 'main'; ui.tab = 'today'; render(); return;
    }
  }
}

export function onChange(ev) {
  const t = ev.target;
  if (!t || t.id !== 'importFile' || !t.files || !t.files[0]) return;
  const ui = store.ui;
  const file = t.files[0];
  t.value = '';
  file.text().then(function (text) { return parseImport(text); }).then(function (r) {
    if (r.ok) { pendingImport = r.state; ui.sheet = { type: 'importPreview', summary: r.summary }; }
    else ui.sheet = { type: 'importError', errors: r.errors };
    render();
  }).catch(function () {
    ui.sheet = { type: 'importError', errors: ['Le fichier est illisible.'] }; render();
  });
}
