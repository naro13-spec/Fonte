import { store } from '../app/state.js';
import { esc } from '../domain/format.js';
import { DAYS, DL, ymd, mondayOf, addDays, weekdayIdx } from '../domain/dates.js';
import { plannedFor, nextPlanned, estimateMinutes } from '../domain/program.js';
import { sortedDone, weekSessions, lastDelta, unitOf } from '../domain/history.js';
import { EXERCISES } from '../domain/catalogue.js';
import { kgLabel } from '../domain/equipment.js';

export function todayView() {
  const S = store.S;
  const A = store.A;
  const now = new Date(store.now());
  const wd = weekdayIdx(now);
  const mon = mondayOf(now);
  let h = '<h1>Aujourd\'hui</h1><p class="muted">' + DAYS[wd] + ' ' + now.getDate() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '</p>';

  if (A) {
    h += '<div class="card"><div class="kicker">Séance en cours</div><h3>Séance ' + esc(A.tplId) + ', ' + esc(A.snap.name.toLowerCase()) + '</h3>' +
      '<p class="muted">Exercice ' + (A.exIdx + 1) + ' sur ' + A.snap.ex.length + '. Tes séries validées sont conservées.</p>' +
      '<button class="btn primary block" data-act="resume">Reprendre la séance</button></div>';
    return h;
  }

  const planned = plannedFor(S.templates, now, S.moves);
  const todays = sortedDone(S.sessions).filter(function (s) { return s.date === ymd(now); });

  if (planned && todays.some(function (s) { return s.tpl === planned.id; })) {
    h += '<div class="card"><span class="badge ok">Terminée</span><h3 style="margin-top:10px">Séance ' + esc(planned.id) + ' faite aujourd\'hui</h3>' +
      '<p class="muted" style="margin:0">Bien joué. Le reste de la journée est pour la récupération.</p></div>';
  } else if (planned) {
    const first = EXERCISES[planned.ex[0].ex];
    const d = lastDelta(S.sessions, first.id);
    const line = d != null && d > 0 ? '+' + d + unitOf(first) + ' sur « ' + first.n.toLowerCase() + ' » depuis la séance précédente.' : null;
    h += '<div class="card"><div class="kicker">' + (planned.optional ? 'Séance optionnelle' : 'Prévue aujourd\'hui') + '</div>' +
      '<h2>Séance ' + esc(planned.id) + ', ' + esc(planned.name.toLowerCase()) + '</h2>' +
      '<div class="meta"><span>' + planned.ex.length + ' exercices</span><span>environ ' + estimateMinutes(planned, S.sessions) + ' min</span></div>' +
      (line ? '<div class="suggest"><b>' + esc(line) + '</b></div>' : '') +
      '<button class="btn primary block" data-act="start" data-arg="' + esc(planned.id) + '">Commencer la séance</button></div>';
  } else {
    const nx = nextPlanned(S.templates, now, S.moves);
    h += '<div class="card"><span class="badge info">Repos</span><h3 style="margin-top:10px">Pas de séance prévue aujourd\'hui</h3>' +
      '<p class="muted" style="margin:0">' + (nx ? 'Prochaine séance : séance ' + esc(nx.tpl.id) + ', ' + DAYS[weekdayIdx(nx.date)].toLowerCase() + '.' : 'Aucune séance planifiée.') + '</p></div>';
  }
  h += '<button class="btn secondary block" style="margin-bottom:14px" data-act="pickTpl">Choisir une autre séance</button>';

  const ws = weekSessions(S.sessions, mon);
  const doneDays = {};
  ws.forEach(function (s) { doneDays[s.date] = true; });
  let strip = '';
  for (let i = 0; i < 7; i++) strip += '<i class="' + (doneDays[ymd(addDays(mon, i))] ? 'on' : '') + (i === wd ? ' today' : '') + '">' + DL[i] + '</i>';
  const n = ws.length;
  h += '<div class="card"><h3>Cette semaine</h3><div class="week" role="img" aria-label="' + n + ' séances cette semaine">' + strip + '</div>' +
    '<p class="muted" style="margin:0 0 10px">' + (n === 0 ? 'Aucune séance pour l\'instant. Tu reprends quand tu veux.' : n + (n > 1 ? ' séances' : ' séance') + ' cette semaine.') + '</p>' +
    '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="3" aria-valuenow="' + Math.min(3, n) + '" aria-label="Séances de la semaine"><span style="width:' + Math.min(100, Math.round(n / 3 * 100)) + '%"></span></div>' +
    (n >= 3 ? '<p style="margin:12px 0 0"><span class="badge ok">Semaine complète</span></p>' : '') + '</div>';

  let rec = null;
  sortedDone(S.sessions).forEach(function (s) { if (s.records && s.records.length) rec = { s: s, r: s.records[s.records.length - 1] }; });
  if (rec) {
    const ex = EXERCISES[rec.r.exId];
    h += '<div class="card"><span class="badge record">Record</span> <span class="muted small">le ' + rec.s.date.split('-').reverse().slice(0, 2).join('/') + '</span>' +
      '<p style="margin:10px 0 0"><b>' + esc(ex.n) + '</b> : ' + rec.r.from + ' → ' + rec.r.to + unitOf(ex) + (rec.r.kg ? ' (' + esc(kgLabel(ex, rec.r.kg, S.equipment)) + ')' : '') + '</p></div>';
  }
  return h;
}
