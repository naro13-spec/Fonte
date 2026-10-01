// Machine à états de la séance en cours. Fonctions sans effet de bord hors de l'objet A passé en paramètre.
// A est un objet JSON simple : il peut être sauvegardé et relu à tout moment (reprise après fermeture).
import { EXERCISES } from './catalogue.js';
import { loadOptions, isAvailable, capabilities } from './equipment.js';
import { hist, metricOf, computeRecords } from './history.js';
import { clone, uid } from './format.js';
import { ymd } from './dates.js';

export function startSession(tpl, now) {
  const snap = clone(tpl);
  return {
    tplId: tpl.id, snap: snap, startedAt: now, exIdx: 0, setIdx: 0,
    restEnd: null, restTotal: 0, finished: false, ack: {},
    exs: snap.ex.map(function (e) { return { exId: e.ex, plannedId: e.ex, status: 'todo', sets: [], sub: false }; })
  };
}

export function currentTE(A) { return A.snap.ex[A.exIdx]; }

export function currentEx(A) { return EXERCISES[A.exs[A.exIdx].exId]; }

export function needsSafety(A) {
  if (A.finished) return false;
  const ex = currentEx(A);
  return !!(ex.safe && !A.ack[ex.id]);
}

export function restLeft(A, now) { return A.restEnd ? Math.max(0, Math.ceil((A.restEnd - now) / 1000)) : 0; }

// Valeurs proposées avant la saisie : celles de la dernière fois, sinon le bas de la plage.
export function makeDraft(A, sessions, equipment) {
  const te = currentTE(A);
  const ex = currentEx(A);
  const opts = loadOptions(ex, equipment);
  const h = hist(sessions, ex.id);
  const last = h.length ? h[h.length - 1] : null;
  const m = metricOf(ex);
  let reps;
  if (last && last.sets[A.setIdx]) reps = last.sets[A.setIdx][m] || 0;
  else if (last) reps = last.sets[last.sets.length - 1][m] || 0;
  else reps = te.max ? 10 : te.lo;
  let kgIdx = 0;
  if (last) {
    const lk = last.sets[0].kg || 0;
    for (let i = 0; i < opts.length; i++) if (opts[i].kg === lk) kgIdx = i;
  }
  const e = A.exs[A.exIdx];
  const prev = e.sets[e.sets.length - 1];
  if (prev) for (let j = 0; j < opts.length; j++) if (opts[j].kg === prev.kg) kgIdx = j;
  return { reps: reps, kgIdx: kgIdx, feel: 'ok', note: '' };
}

function nextExercise(A, withRest, now) {
  if (A.exIdx >= A.snap.ex.length - 1) {
    A.finished = true;
    A.restEnd = null;
    return { sessionDone: true };
  }
  A.exIdx++;
  A.setIdx = 0;
  if (withRest) { A.restTotal = 60; A.restEnd = now + 60000; }
  return { sessionDone: false };
}

// Enregistre la série. Retourne l'état suivant (repos lancé, exercice terminé, séance terminée).
export function validateSet(A, draft, equipment, now) {
  const te = currentTE(A);
  const ex = currentEx(A);
  const opts = loadOptions(ex, equipment);
  const m = metricOf(ex);
  const opt = opts[draft.kgIdx] || opts[0];
  const st = { kg: opt.kg, feel: draft.feel, tag: 'none', note: String(draft.note || '').slice(0, 500) };
  st[m] = draft.reps;
  const e = A.exs[A.exIdx];
  e.sets.push(st);
  A.setIdx++;
  if (A.setIdx >= te.sets) {
    e.status = 'done';
    const r = nextExercise(A, true, now);
    return { exerciseDone: true, sessionDone: r.sessionDone, setIndex: e.sets.length - 1 };
  }
  A.restTotal = te.rest;
  A.restEnd = now + te.rest * 1000;
  return { exerciseDone: false, sessionDone: false, setIndex: e.sets.length - 1 };
}

// Retire la dernière série de l'exercice courant pour la corriger. Retourne le brouillon, ou null.
export function undoSet(A, equipment) {
  const e = A.exs[A.exIdx];
  if (A.finished || !e.sets.length) return null;
  const p = e.sets.pop();
  A.setIdx = e.sets.length;
  A.restEnd = null;
  const ex = currentEx(A);
  const opts = loadOptions(ex, equipment);
  let ki = 0;
  for (let q = 0; q < opts.length; q++) if (opts[q].kg === p.kg) ki = q;
  return { reps: p[metricOf(ex)] || 0, kgIdx: ki, feel: p.feel, note: p.note || '' };
}

export function skipExercise(A, now) {
  A.exs[A.exIdx].status = 'skipped';
  return nextExercise(A, false, now);
}

export function swapToAlt(A, equipment) {
  const ex = currentEx(A);
  if (!ex.alt) return false;
  if (!isAvailable(EXERCISES[ex.alt], capabilities(equipment))) return false;
  const e = A.exs[A.exIdx];
  e.exId = ex.alt;
  e.sub = true;
  return true;
}

export function adjustRest(A, deltaSec, now) {
  if (!A.restEnd) return;
  const next = A.restEnd + deltaSec * 1000;
  A.restEnd = next < now + 1000 ? now + 1000 : next;
  A.restTotal = Math.max(1, A.restTotal + deltaSec);
}

export function markPain(A) {
  const e = A.exs[A.exIdx];
  if (e.sets.length) e.sets[e.sets.length - 1].tag = 'pain';
}

// Construit la séance à enregistrer, ou null si aucune série n'a été validée.
export function finishSession(A, priorSessions, now, partial) {
  const exs = A.exs.filter(function (e) { return e.sets.length; }).map(function (e) {
    return { exId: e.exId, plannedId: e.plannedId, sub: e.sub, sets: e.sets };
  });
  if (!exs.length) return null;
  return {
    id: uid(), tpl: A.tplId, date: ymd(new Date(now)),
    durationSec: Math.round((now - A.startedAt) / 1000),
    exs: exs, partial: !!partial, records: computeRecords(priorSessions, exs),
    quality: null, note: '', plan: A.snap.ex
  };
}
