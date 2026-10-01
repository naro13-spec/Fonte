import { store } from '../app/state.js';
import { esc } from '../domain/format.js';
import { EXERCISES } from '../domain/catalogue.js';
import { loadOptions, isAvailable, capabilities } from '../domain/equipment.js';
import { hist, metricOf } from '../domain/history.js';
import { currentEx, currentTE, makeDraft } from '../domain/session.js';
import { ic, target } from './components.js';

export function sessionView() {
  const A = store.A;
  const S = store.S;
  const ui = store.ui;
  const te = currentTE(A);
  const ex = currentEx(A);
  const e = A.exs[A.exIdx];
  const resting = !!A.restEnd;
  const nowMs = store.now();

  let h = '<div class="sess"><div class="sbar"><div><b class="disp" style="font-size:1.25rem">Séance ' + esc(A.tplId) + '</b> <span class="muted small">· <span id="elapsed">' + Math.floor((nowMs - A.startedAt) / 60000) + ' min</span></span></div>' +
    '<button class="btn ghost sm" data-act="quit">Quitter</button></div><div class="sbody">';

  h += '<div class="exlist" aria-label="Exercices de la séance">';
  A.snap.ex.forEach(function (x, i) {
    const st = A.exs[i];
    const cls = i === A.exIdx ? 'cur' : (st.status === 'done' || st.status === 'skipped' ? 'done' : '');
    h += '<div class="' + cls + '">' + (st.status === 'done' ? '✓ ' : st.status === 'skipped' ? '– ' : '') + esc(EXERCISES[st.exId].n) + '</div>';
  });
  h += '</div><div>';

  h += '<p class="muted small" style="margin-bottom:4px">Exercice ' + (A.exIdx + 1) + ' sur ' + A.snap.ex.length + '</p>';
  h += '<h2 class="ex-title">' + esc(ex.n) + '</h2>';
  h += '<div class="row" style="margin:10px 0 12px">' + ex.m.map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join('') + '<span class="chip">' + esc(te.tempo) + '</span>';
  if (ex.safe) h += '<span class="badge warn">Meuble à caler</span>';
  if (e.sub) h += '<span class="badge info">Alternative</span>';
  h += '</div><div class="plates" role="img" aria-label="Série ' + Math.min(A.setIdx + 1, te.sets) + ' sur ' + te.sets + '">';
  for (let i = 0; i < te.sets; i++) {
    h += '<div class="plate' + (i < A.setIdx ? ' done' : '') + (i === A.setIdx && !resting ? ' now' : '') + (ui.pop === i && i < A.setIdx ? ' pop' : '') + '"></div>';
  }
  h += '</div>';
  ui.pop = null;

  if (resting) {
    const left = Math.max(0, (A.restEnd - nowMs) / (A.restTotal * 1000));
    h += '<div style="text-align:center"><div class="ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="bg" cx="60" cy="60" r="54"/><circle class="fg" id="ringFg" cx="60" cy="60" r="54" style="stroke-dashoffset:' + (339.29 * (1 - left)).toFixed(2) + '"/></svg><div class="time num" id="timeTxt"></div></div>';
    h += '<p class="muted">' + (e.sets.length === 0 ? 'Repos avant ' + esc(ex.n.toLowerCase()) : 'Repos avant la série ' + (A.setIdx + 1) + ' sur ' + te.sets) + '</p>';
    h += '<div class="row" style="justify-content:center;margin-bottom:14px"><button class="btn ghost sm" data-act="rest" data-arg="-15">−15 s</button><button class="btn ghost sm" data-act="rest" data-arg="15">+15 s</button><button class="btn secondary sm" data-act="skipRest">Passer le repos</button></div>';
    if (e.sets.length) h += '<button class="btn ghost sm" data-act="undo">Modifier la série précédente</button>';
    h += '</div>';
  } else {
    if (!ui.draft) ui.draft = makeDraft(A, S.sessions, S.equipment);
    const d = ui.draft;
    const opts = loadOptions(ex, S.equipment);
    const hh = hist(S.sessions, ex.id);
    const m = metricOf(ex);
    const lastTxt = hh.length ? hh[hh.length - 1].sets.map(function (s) { return s[m] || 0; }).join(' · ') : 'Première fois';
    h += '<div class="readout"><div><small>Objectif' + (te.per ? ' ' + esc(te.per) : '') + '</small><b>' + esc(target(te, ex)) + '</b></div><div><small>Charge</small><b id="loadTxt">' + esc((opts[d.kgIdx] || opts[0]).label) + '</b></div><div><small>Dernière fois</small><b>' + esc(lastTxt) + '</b></div></div>';
    h += '<details style="margin-bottom:12px"><summary>Consignes</summary><div class="inner"><ul class="plain">' + ex.cues.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>' + (ex.note ? '<p>' + esc(ex.note) + '</p>' : '') + '</div></details>';
    h += '<div class="stepper"><button class="round" data-act="dec" aria-label="' + (ex.meas === 'sec' ? '5 secondes de moins' : 'Une répétition de moins') + '">' + ic('minus') + '</button>' +
      '<div class="big num"><span id="repsVal">' + d.reps + '</span><small>' + (ex.meas === 'sec' ? 'secondes' : 'répétitions') + (te.per ? ' ' + esc(te.per) : '') + '</small></div>' +
      '<button class="round" data-act="inc" aria-label="' + (ex.meas === 'sec' ? '5 secondes de plus' : 'Une répétition de plus') + '">' + ic('plus') + '</button></div>';
    if (opts.length > 1) {
      h += '<div class="row" style="margin-bottom:12px" role="group" aria-label="Charge">';
      opts.forEach(function (o, i) { h += '<button class="chip" data-act="load" data-arg="' + i + '" aria-pressed="' + (i === d.kgIdx) + '">' + esc(o.label) + '</button>'; });
      h += '</div>';
    }
    h += '<div class="feels" role="group" aria-label="Difficulté ressentie">';
    [['easy', 'Facile'], ['ok', 'Correct'], ['hard', 'Dur'], ['limit', 'Limite']].forEach(function (f) {
      h += '<button class="feel" data-act="feel" data-arg="' + f[0] + '" aria-pressed="' + (d.feel === f[0]) + '">' + f[1] + '</button>';
    });
    h += '</div><details style="margin-bottom:14px"><summary>Ajouter une remarque</summary><textarea id="noteIn" maxlength="500" placeholder="Sensation, technique, gêne éventuelle">' + esc(d.note) + '</textarea></details>';
    h += '<button class="btn primary block" data-act="validate">Valider la série ' + (A.setIdx + 1) + '</button><div class="row" style="margin-top:12px">';
    if (e.sets.length) h += '<button class="btn ghost sm" data-act="undo">Modifier la série précédente</button>';
    h += '<button class="btn ghost sm" data-act="pain">J\'ai une douleur</button>';
    if (ex.alt && isAvailable(EXERCISES[ex.alt], capabilities(S.equipment))) h += '<button class="btn ghost sm" data-act="swap">Alternative</button>';
    h += '<button class="btn ghost sm" data-act="skipEx">Passer l\'exercice</button></div>';
  }
  return h + '</div></div></div>';
}
