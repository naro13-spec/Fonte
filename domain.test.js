import test from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISES, SAFE_TXT } from '../js/domain/catalogue.js';
import { capabilities, isAvailable, missingFor, loadOptions, availableIds, unlockedBetween, newItem } from '../js/domain/equipment.js';
import { DEFAULT_TEMPLATES, plannedFor, nextPlanned, moveConflicts, setMove, effectiveDay, estimateMinutes } from '../js/domain/program.js';
import { hist, computeRecords, weekSessions, lastDelta } from '../js/domain/history.js';
import { startSession, validateSet, undoSet, skipExercise, swapToAlt, adjustRest, finishSession, makeDraft, needsSafety, currentEx, markPain, restLeft } from '../js/domain/session.js';
import { validateTemplateEx } from '../js/domain/validate.js';
import { defaultState } from '../js/data/seed.js';
import { mondayOf, ymd } from '../js/domain/dates.js';

const eq = () => defaultState().equipment;
const tpl = (id) => DEFAULT_TEMPLATES.find((t) => t.id === id);

test('catalogue : cohérence interne', () => {
  for (const id of Object.keys(EXERCISES)) {
    const ex = EXERCISES[id];
    if (ex.alt) assert.ok(EXERCISES[ex.alt], id + ' : alternative inconnue');
    if (ex.safe) assert.ok(SAFE_TXT[ex.safe], id + ' : texte de sécurité manquant');
    assert.ok(ex.cues.length > 0 && ex.err.length > 0, id + ' : consignes manquantes');
    assert.ok(['reps', 'sec'].includes(ex.meas));
  }
  for (const t of DEFAULT_TEMPLATES) for (const te of t.ex) assert.ok(EXERCISES[te.ex], t.id + ' : exercice inconnu ' + te.ex);
});

test('équipement : les exercices de départ sont réalisables avec l\'inventaire initial', () => {
  const c = capabilities(eq());
  for (const t of DEFAULT_TEMPLATES) for (const te of t.ex) assert.ok(isAvailable(EXERCISES[te.ex], c), te.ex);
});

test('équipement : retirer les chaises rend les dips et les fentes bulgares indisponibles', () => {
  const e = eq();
  e.forEach((x) => { if (x.kind === 'chair') x.active = false; });
  const c = capabilities(e);
  assert.deepEqual(missingFor(EXERCISES.dips, c), ['chair']);
  assert.ok(!isAvailable(EXERCISES.bulgare, c));
  assert.ok(isAvailable(EXERCISES.pompes, c));
});

test('équipement : une barre de traction débloque les tractions, jamais avant', () => {
  const e = eq();
  const before = availableIds(e);
  assert.ok(!before.includes('tractions') && !before.includes('tractions_neg'));
  e.push(newItem('door_pullup_bar'));
  const unlocked = unlockedBetween(before, availableIds(e));
  assert.deepEqual(unlocked.sort(), ['tractions', 'tractions_neg']);
});

test('équipement : les charges proposées viennent uniquement de l\'inventaire', () => {
  const e = eq();
  assert.deepEqual(loadOptions(EXERCISES.squat_goblet, e).map((o) => o.kg), [10, 15]);
  assert.deepEqual(loadOptions(EXERCISES.curl, e).map((o) => o.kg), [10, 15]);
  assert.deepEqual(loadOptions(EXERCISES.rowing_uni, e).map((o) => o.kg), [5, 7.5]);
  assert.deepEqual(loadOptions(EXERCISES.pompes, e).map((o) => o.kg), [0]);
  e.push(newItem('db10'));
  assert.ok(loadOptions(EXERCISES.squat_goblet, e).some((o) => o.kg === 20));
  e.forEach((x) => { if (x.kind === 'dumbbell') x.active = false; });
  assert.deepEqual(loadOptions(EXERCISES.squat_goblet, e).map((o) => o.kg), [0]);
});

test('planning : séance prévue pour chaque jour de la semaine', () => {
  const monday = new Date(2026, 9, 5); // lundi 5 octobre 2026
  const names = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const d = new Date(2026, 9, 5 + i);
    const t = plannedFor(DEFAULT_TEMPLATES, d, []);
    return t ? t.id : '-';
  });
  assert.deepEqual(names, ['A', '-', 'B', '-', 'C', 'D', '-']);
  assert.equal(ymd(mondayOf(new Date(2026, 9, 11))), ymd(monday));
});

test('planning : la prochaine séance ignore l\'optionnelle', () => {
  const n = nextPlanned(DEFAULT_TEMPLATES, new Date(2026, 9, 9), []); // vendredi
  assert.equal(n.tpl.id, 'A');
  assert.equal(ymd(n.date), '2026-10-12');
});

test('planning : aucun conflit de récupération dans le programme par défaut', () => {
  const wk = '2026-10-05';
  for (const t of DEFAULT_TEMPLATES) assert.deepEqual(moveConflicts(DEFAULT_TEMPLATES, [], wk, t.id, t.day), [], t.id);
});

test('planning : déplacer C au mardi crée un conflit avec A (épaules) et le signale', () => {
  const c = moveConflicts(DEFAULT_TEMPLATES, [], '2026-10-05', 'C', 1);
  assert.equal(c.length, 1);
  assert.equal(c[0].tpl.id, 'A');
  assert.ok(c[0].muscles.includes('Épaules'));
});

test('planning : la séance allégée D n\'entre jamais en conflit', () => {
  assert.deepEqual(moveConflicts(DEFAULT_TEMPLATES, [], '2026-10-05', 'D', 4), []);
});

test('planning : un déplacement ne vaut que pour sa semaine et peut être annulé', () => {
  let moves = setMove([], '2026-10-05', 'B', 3, 2);
  assert.equal(effectiveDay(tpl('B'), '2026-10-05', moves), 3);
  assert.equal(effectiveDay(tpl('B'), '2026-10-12', moves), 2);
  assert.equal(plannedFor(DEFAULT_TEMPLATES, new Date(2026, 9, 8), moves).id, 'B');
  moves = setMove(moves, '2026-10-05', 'B', 2, 2);
  assert.deepEqual(moves, []);
});

function playTemplate(id, sessions, repsFor, nowStart) {
  const A = startSession(tpl(id), nowStart);
  let now = nowStart;
  const equipment = eq();
  let guard = 0;
  while (!A.finished && guard++ < 200) {
    if (needsSafety(A)) A.ack[currentEx(A).id] = true;
    const draft = makeDraft(A, sessions, equipment);
    draft.reps = repsFor(A);
    now += 40000;
    validateSet(A, draft, equipment, now);
    if (A.restEnd) now = A.restEnd;
  }
  return { A, now };
}

test('séance : parcours complet de la séance A', () => {
  const { A, now } = playTemplate('A', [], () => 10, 1_000_000);
  assert.ok(A.finished);
  const s = finishSession(A, [], now, false);
  assert.equal(s.tpl, 'A');
  assert.equal(s.exs.length, 7);
  assert.equal(s.exs[0].sets.length, 4);
  assert.equal(s.partial, false);
  assert.deepEqual(s.records, []);
});

test('séance : le repos démarre après chaque série et se règle', () => {
  const A = startSession(tpl('A'), 0);
  const d = makeDraft(A, [], eq());
  validateSet(A, d, eq(), 1000);
  assert.equal(A.restEnd, 1000 + 90_000);
  assert.equal(restLeft(A, 1000), 90);
  adjustRest(A, 15, 1000);
  assert.equal(restLeft(A, 1000), 105);
  adjustRest(A, -600, 1000);
  assert.equal(restLeft(A, 1000), 1);
});

test('séance : correction de la série précédente', () => {
  const A = startSession(tpl('A'), 0);
  const d = makeDraft(A, [], eq());
  d.reps = 12; d.feel = 'hard';
  validateSet(A, d, eq(), 0);
  const back = undoSet(A, eq());
  assert.equal(back.reps, 12);
  assert.equal(back.feel, 'hard');
  assert.equal(A.setIdx, 0);
  assert.equal(A.restEnd, null);
  assert.equal(undoSet(A, eq()), null);
});

test('séance : reprise après fermeture (sérialisation complète)', () => {
  const A = startSession(tpl('B'), 5);
  A.ack.squat_saute = true;
  validateSet(A, makeDraft(A, [], eq()), eq(), 100);
  const restored = JSON.parse(JSON.stringify(A));
  assert.equal(restored.setIdx, 1);
  assert.equal(restored.exs[0].sets.length, 1);
  validateSet(restored, makeDraft(restored, [], eq()), eq(), 200);
  assert.equal(restored.setIdx, 2);
});

test('séance : passer un exercice, alternative sûre, douleur', () => {
  const A = startSession(tpl('A'), 0);
  skipExercise(A, 0);
  assert.equal(A.exIdx, 1);
  assert.equal(A.exs[0].status, 'skipped');
  assert.ok(needsSafety(A)); // pompes déclinées sur chaise
  assert.ok(swapToAlt(A, eq()));
  assert.equal(currentEx(A).id, 'pompes');
  assert.equal(A.exs[1].sub, true);
  validateSet(A, makeDraft(A, [], eq()), eq(), 0);
  markPain(A);
  assert.equal(A.exs[1].sets[0].tag, 'pain');
});

test('séance : l\'alternative est refusée si elle n\'est pas réalisable', () => {
  const e = eq();
  e.forEach((x) => { if (x.kind === 'mat') x.active = false; });
  const A = startSession(tpl('A'), 0);
  A.exIdx = 4; // pompes diamant → alternative pompes serrées : mat requis
  assert.equal(swapToAlt(A, e), false);
});

test('séance : fin sans série → rien à enregistrer ; fin partielle → marquée partielle', () => {
  const A = startSession(tpl('A'), 0);
  assert.equal(finishSession(A, [], 1000, true), null);
  validateSet(A, makeDraft(A, [], eq()), eq(), 1000);
  const s = finishSession(A, [], 61000, true);
  assert.equal(s.partial, true);
  assert.equal(s.durationSec, 61);
});

test('historique : les records se comparent à charge égale et seulement à l\'existant', () => {
  const prior = [{ id: 'a', tpl: 'A', date: '2026-09-28', partial: false, exs: [{ exId: 'curl', sets: [{ reps: 12, kg: 10, feel: 'ok', tag: 'none' }] }] }];
  const now = [{ exId: 'curl', sets: [{ reps: 14, kg: 10, feel: 'ok' }, { reps: 20, kg: 15, feel: 'ok' }] }];
  const r = computeRecords(prior, now);
  assert.equal(r.length, 1);
  assert.deepEqual([r[0].from, r[0].to, r[0].kg], [12, 14, 10]);
  assert.deepEqual(computeRecords([], now), []);
});

test('historique : écart entre les deux dernières séances, null sans données', () => {
  const mk = (id, date, reps) => ({ id, date, partial: false, exs: [{ exId: 'pompes', sets: [{ reps, kg: 0, feel: 'ok' }] }] });
  assert.equal(lastDelta([mk('a', '2026-09-01', 10)], 'pompes'), null);
  assert.equal(lastDelta([mk('a', '2026-09-01', 10), mk('b', '2026-09-08', 13)], 'pompes'), 3);
  assert.equal(hist([mk('a', '2026-09-08', 1), mk('b', '2026-09-01', 2)], 'pompes')[0].date, '2026-09-01');
});

test('historique : une séance partielle ne compte pas dans la semaine', () => {
  const s = [{ id: 'a', date: '2026-10-06', partial: true, exs: [] }, { id: 'b', date: '2026-10-07', partial: false, exs: [] }];
  assert.equal(weekSessions(s, new Date(2026, 9, 5)).length, 1);
});

test('programme : estimation de durée et modification validée', () => {
  assert.ok(estimateMinutes(tpl('A'), []) >= 30);
  const te = tpl('A').ex[1];
  const ok = validateTemplateEx({ sets: 4, lo: 8, hi: 14, rest: 80 }, te, EXERCISES[te.ex]);
  assert.ok(ok.ok);
  assert.deepEqual(ok.value, { sets: 4, rest: 80, lo: 8, hi: 14 });
  assert.ok(!validateTemplateEx({ sets: 0, lo: 8, hi: 14, rest: 80 }, te, EXERCISES[te.ex]).ok);
  assert.ok(!validateTemplateEx({ sets: 3, lo: 15, hi: 10, rest: 80 }, te, EXERCISES[te.ex]).ok);
  assert.ok(!validateTemplateEx({ sets: 3, lo: 8, hi: 12, rest: 5 }, te, EXERCISES[te.ex]).ok);
  assert.ok(!validateTemplateEx({ sets: 3, lo: 8, hi: 9999, rest: 60 }, te, EXERCISES[te.ex]).ok);
  const mx = tpl('A').ex[0];
  assert.ok(validateTemplateEx({ sets: 4, rest: 90 }, mx, EXERCISES[mx.ex]).ok);
});
