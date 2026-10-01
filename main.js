// Point d'entrée de l'application : ouverture des données, rendu, minuteur.
import { store, newUi, setRenderer, render, toast } from './app/state.js';
import { onClick, onChange } from './app/actions.js';
import { createRepo } from './data/repo.js';
import { ensureSchema, NewerSchemaError } from './data/migrations.js';
import { esc } from './domain/format.js';
import { needsSafety, currentEx, restLeft } from './domain/session.js';
import { beep, buzz, acquireWake, storagePersisted } from './app/platform.js';
import { shell } from './ui/shell.js';
import { todayView } from './ui/today.js';
import { programView } from './ui/program.js';
import { historyView } from './ui/history.js';
import { exercisesView } from './ui/exercises.js';
import { settingsView } from './ui/settings.js';
import { sessionView } from './ui/sessionView.js';
import { summaryView } from './ui/summary.js';
import { onboardingView } from './ui/onboarding.js';
import { sheetHtml } from './ui/sheets.js';

let rootEl = null;
let volatileStorage = false;

function mainContent() {
  const tab = store.ui.tab;
  const banner = volatileStorage
    ? '<div class="banner">Le stockage est indisponible dans ce navigateur : tes données seront perdues à la fermeture. Exporte-les régulièrement dans Réglages.</div>' : '';
  const body = tab === 'today' ? todayView() : tab === 'program' ? programView() : tab === 'history' ? historyView() : tab === 'exercises' ? exercisesView() : settingsView();
  return banner + body;
}

function draw() {
  const ui = store.ui;
  let html;
  if (ui.fatal) {
    html = '<div class="sess"><div class="sbody" style="display:block"><div><h2>Impossible d\'ouvrir Fonte</h2><p class="muted">' + esc(ui.fatal) + '</p><p class="muted small">Tes données n\'ont pas été modifiées.</p></div></div></div>';
  } else if (ui.view === 'onboarding') {
    html = onboardingView();
  } else if (ui.view === 'session' && store.A) {
    if (!store.A.restEnd && !ui.sheet && needsSafety(store.A)) ui.sheet = { type: 'safety', exId: currentEx(store.A).id };
    html = sessionView();
  } else if (ui.view === 'summary' && summaryView()) {
    html = summaryView();
  } else {
    ui.view = 'main';
    html = shell(mainContent(), ui.tab);
  }
  rootEl.innerHTML = html + (ui.fatal ? '' : sheetHtml()) + (ui.toast ? '<div class="toast" role="status">' + esc(ui.toast) + '</div>' : '');
  if (ui.toast) {
    const msg = ui.toast;
    setTimeout(function () {
      if (store.ui.toast === msg) { store.ui.toast = ''; const t = rootEl.querySelector ? rootEl.querySelector('.toast') : null; if (t) t.remove(); }
    }, 4500);
  }
  tick();
}

export function tick() {
  const A = store.A;
  if (!A || !rootEl) return;
  const now = store.now();
  const el = document.getElementById('elapsed');
  if (el) el.textContent = Math.floor((now - A.startedAt) / 60000) + ' min';
  if (!A.restEnd) return;
  const left = restLeft(A, now);
  const tt = document.getElementById('timeTxt');
  const fg = document.getElementById('ringFg');
  if (tt) tt.textContent = Math.floor(left / 60) + ':' + (left % 60 < 10 ? '0' : '') + (left % 60);
  if (fg && fg.style) fg.style.strokeDashoffset = String((339.29 * (1 - Math.max(0, (A.restEnd - now) / (A.restTotal * 1000)))).toFixed(2));
  if (left <= 0) {
    A.restEnd = null;
    store.repo.saveActive(A);
    buzz([120, 60, 120]);
    if (store.S.settings.sound) beep();
    render();
  }
}

// adapter : adaptateur de stockage. env : { now, volatile, noTimers } (utile pour les tests).
export async function boot(adapter, env) {
  const e = env || {};
  rootEl = document.getElementById('app');
  volatileStorage = !!e.volatile;
  const repo = createRepo(adapter);
  store.repo = repo;
  store.ui = newUi();
  if (e.now) store.now = e.now;
  repo.setErrorHandler(function () {
    toast('Sauvegarde impossible sur cet appareil (espace plein ou stockage bloqué). Exporte tes données dès que possible.');
    render();
  });
  setRenderer(draw);

  try {
    await ensureSchema(adapter, repo.replaceAll);
    const st = await repo.load();
    if (!st.settings || !Array.isArray(st.templates) || !Array.isArray(st.equipment)) throw new Error('Données illisibles');
    store.A = st.active;
    delete st.active;
    store.S = st;
    store.ui.persisted = await storagePersisted();
    if (!st.settings.onboardingDone) store.ui.view = 'onboarding';
    else if (store.A) { store.ui.view = 'session'; toast("Séance reprise là où tu t'étais arrêté."); }
  } catch (err) {
    store.ui.fatal = err instanceof NewerSchemaError ? err.message : "Les données de l'application n'ont pas pu être lues.";
  }

  rootEl.addEventListener('click', onClick);
  rootEl.addEventListener('change', onChange);
  if (!e.noTimers) {
    setInterval(tick, 250);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        if (store.A && store.S && store.S.settings.keepAwake) acquireWake();
        tick();
      }
    });
  }
  render();
  return store;
}
