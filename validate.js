// Validation des saisies et des fichiers importés. Un fichier importé est une donnée non fiable.
import { EXERCISES } from './catalogue.js';
import { clamp } from './format.js';

export const LIMITS = { reps: 200, secs: 1800, kg: 200, note: 500, sets: 12, rest: 600, name: 80, maxFileChars: 5000000, maxSessions: 5000 };
export const SCHEMA_VERSION = 1;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const KINDS = ['dumbbell', 'mat', 'chair', 'stool', 'table', 'door_pullup_bar', 'band', 'bench', 'other'];
const FEELS = ['easy', 'ok', 'hard', 'limit'];
const TAGS = ['none', 'fatigue', 'technique', 'pain'];

function isInt(v, min, max) { return typeof v === 'number' && isFinite(v) && Math.floor(v) === v && v >= min && v <= max; }
function isStr(v, max) { return typeof v === 'string' && v.length <= max; }

// Modification d'un exercice du programme : bornes strictes, retourne la valeur nettoyée.
export function validateTemplateEx(input, te, ex) {
  const errors = [];
  const sets = clamp(input.sets, 1, LIMITS.sets);
  const rest = clamp(input.rest, 10, LIMITS.rest);
  if (!isFinite(Number(input.sets)) || Number(input.sets) < 1 || Number(input.sets) > LIMITS.sets) errors.push('Le nombre de séries doit être entre 1 et ' + LIMITS.sets + '.');
  if (!isFinite(Number(input.rest)) || Number(input.rest) < 10 || Number(input.rest) > LIMITS.rest) errors.push('Le repos doit être entre 10 et ' + LIMITS.rest + ' secondes.');
  const out = { sets: sets, rest: rest };
  if (!te.max) {
    const max = ex.meas === 'sec' ? LIMITS.secs : LIMITS.reps;
    const lo = Number(input.lo);
    const hi = Number(input.hi);
    if (!isFinite(lo) || !isFinite(hi) || lo < 1 || hi > max || lo > hi) errors.push('La plage doit aller de 1 à ' + max + ', avec le minimum inférieur ou égal au maximum.');
    out.lo = clamp(lo, 1, max);
    out.hi = clamp(hi, out.lo, max);
  }
  return { ok: errors.length === 0, errors: errors, value: out };
}

function checkSet(s, path, errors) {
  if (!s || typeof s !== 'object') { errors.push(path + ' : série invalide.'); return; }
  if (s.reps != null && !isInt(s.reps, 0, LIMITS.reps)) errors.push(path + ' : répétitions hors limites.');
  if (s.secs != null && !isInt(s.secs, 0, LIMITS.secs)) errors.push(path + ' : secondes hors limites.');
  if (s.reps == null && s.secs == null) errors.push(path + ' : ni répétitions ni secondes.');
  if (typeof s.kg !== 'number' || !isFinite(s.kg) || s.kg < 0 || s.kg > LIMITS.kg) errors.push(path + ' : charge hors limites.');
  if (FEELS.indexOf(s.feel) < 0) errors.push(path + ' : ressenti inconnu.');
  if (s.tag != null && TAGS.indexOf(s.tag) < 0) errors.push(path + ' : étiquette inconnue.');
  if (s.note != null && !isStr(s.note, LIMITS.note)) errors.push(path + ' : remarque trop longue.');
}

// Retourne { ok, errors, summary }. N'altère jamais l'objet reçu.
export function validateImport(obj, currentSchema) {
  const errors = [];
  const add = function (m) { if (errors.length < 12) errors.push(m); };
  if (!obj || typeof obj !== 'object') return { ok: false, errors: ["Le fichier n'est pas une sauvegarde Fonte."], summary: null };
  if (obj.app !== 'fonte') add("Ce fichier n'a pas été créé par Fonte.");
  if (obj.format !== 1) add('Format de sauvegarde inconnu.');
  if (typeof obj.schemaVersion !== 'number') add('Version des données manquante.');
  else if (obj.schemaVersion > currentSchema) add("Cette sauvegarde vient d'une version plus récente de Fonte.");
  const d = obj.data;
  if (!d || typeof d !== 'object') { add('Données manquantes.'); return { ok: false, errors: errors, summary: null }; }
  ['equipment', 'templates', 'sessions', 'pain', 'moves'].forEach(function (k) { if (!Array.isArray(d[k])) add('Section « ' + k + ' » manquante ou invalide.'); });
  if (!d.settings || typeof d.settings !== 'object') add('Réglages manquants.');
  if (errors.length) return { ok: false, errors: errors, summary: null };

  if (d.sessions.length > LIMITS.maxSessions) add('Trop de séances.');
  let setCount = 0;
  d.equipment.forEach(function (e, i) {
    if (!e || !isStr(e.id, 64) || KINDS.indexOf(e.kind) < 0 || !isStr(e.label, LIMITS.name) || !isInt(e.qty, 1, 99) || typeof e.active !== 'boolean') add('Équipement ' + (i + 1) + ' invalide.');
    else if (e.kg != null && (typeof e.kg !== 'number' || e.kg <= 0 || e.kg > LIMITS.kg)) add('Équipement ' + (i + 1) + ' : charge invalide.');
  });
  d.templates.forEach(function (t, i) {
    if (!t || !isStr(t.id, 16) || !isStr(t.name, LIMITS.name) || !isInt(t.day, 0, 6) || !Array.isArray(t.ex) || t.ex.length > 30) { add('Séance ' + (i + 1) + ' invalide.'); return; }
    t.ex.forEach(function (te, j) {
      if (!te || !EXERCISES[te.ex]) add('Séance ' + t.id + ', exercice ' + (j + 1) + ' : exercice inconnu.');
      else if (!isInt(te.sets, 1, LIMITS.sets) || !isInt(te.rest, 10, LIMITS.rest)) add('Séance ' + t.id + ', exercice ' + (j + 1) + ' : séries ou repos invalides.');
      else if (!te.max && !(isInt(te.lo, 1, LIMITS.secs) && isInt(te.hi, 1, LIMITS.secs) && te.lo <= te.hi)) add('Séance ' + t.id + ', exercice ' + (j + 1) + ' : plage invalide.');
    });
  });
  d.sessions.forEach(function (s, i) {
    const p = 'Séance enregistrée ' + (i + 1);
    if (!s || !isStr(s.id, 64) || !isStr(s.tpl, 16) || typeof s.date !== 'string' || !DATE_RE.test(s.date) || !Array.isArray(s.exs) || s.exs.length > 40) { add(p + ' invalide.'); return; }
    if (s.durationSec != null && !isInt(s.durationSec, 0, 86400)) add(p + ' : durée invalide.');
    if (s.quality != null && !isInt(s.quality, 1, 4)) add(p + ' : qualité invalide.');
    if (s.note != null && !isStr(s.note, LIMITS.note)) add(p + ' : remarque trop longue.');
    s.exs.forEach(function (e, j) {
      if (!e || !EXERCISES[e.exId] || !Array.isArray(e.sets) || e.sets.length > 30) { add(p + ', exercice ' + (j + 1) + ' invalide.'); return; }
      e.sets.forEach(function (st, k) { setCount++; checkSet(st, p + ', exercice ' + (j + 1) + ', série ' + (k + 1), errors); });
    });
  });
  d.pain.forEach(function (x, i) { if (!x || typeof x.date !== 'string' || !DATE_RE.test(x.date) || !EXERCISES[x.exId] || !isStr(x.zone, 30)) add('Signalement de douleur ' + (i + 1) + ' invalide.'); });
  d.moves.forEach(function (m, i) { if (!m || typeof m.week !== 'string' || !DATE_RE.test(m.week) || !isStr(m.tpl, 16) || !isInt(m.day, 0, 6)) add('Déplacement ' + (i + 1) + ' invalide.'); });
  ['vibration', 'sound', 'keepAwake'].forEach(function (k) { if (d.settings[k] != null && typeof d.settings[k] !== 'boolean') add('Réglage « ' + k + ' » invalide.'); });
  if (errors.length) return { ok: false, errors: errors, summary: null };
  return { ok: true, errors: [], summary: { sessions: d.sessions.length, sets: setCount, equipment: d.equipment.length, templates: d.templates.length } };
}
