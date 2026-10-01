import { store } from '../app/state.js';
import { esc } from '../domain/format.js';
import { DAYS } from '../domain/dates.js';

export function onboardingView() {
  const step = store.ui.onb;
  const S = store.S;
  let h = '<div class="sess"><div class="sbody" style="display:block"><div>';
  h += '<p class="muted small">Étape ' + (step + 1) + ' sur 3</p>';
  if (step === 0) {
    h += '<h1 style="margin-bottom:10px">Fonte</h1><p>Ton carnet de musculation à la maison. Tu notes tes séries, l\'app garde ton historique et connaît ton matériel.</p>' +
      '<div class="safety"><b>À savoir</b><p style="margin:6px 0 0">Fonte n\'est pas un avis médical et ne remplace pas un coach qualifié. Si une douleur est vive, persistante ou inhabituelle, arrête l\'exercice et parles-en à un parent ou tuteur, ou à un professionnel de santé.</p></div>' +
      '<p class="muted small">Tout reste sur cet appareil. Aucun compte, aucune donnée envoyée.</p>' +
      '<button class="btn primary block" data-act="onbNext">J\'ai compris, on commence</button>';
  } else if (step === 1) {
    h += '<h2>Ton matériel</h2><p class="muted">Retire ce que tu n\'as pas. Les exercices s\'adaptent.</p><div class="list">';
    S.equipment.forEach(function (e) {
      h += '<div class="card" style="margin:0"><div class="row" style="justify-content:space-between"><span><b>' + esc(e.label) + '</b> <span class="muted">× ' + e.qty + '</span></span>' +
        '<button class="chip" data-act="toggleEq" data-arg="' + esc(e.id) + '" aria-pressed="' + (e.active ? 'true' : 'false') + '">' + (e.active ? 'Je l\'ai' : 'Je ne l\'ai pas') + '</button></div></div>';
    });
    h += '</div><p class="muted small" style="margin-top:12px">Tu pourras ajouter du matériel plus tard dans Réglages.</p>' +
      '<div class="row" style="margin-top:14px"><button class="btn ghost" data-act="onbBack">Retour</button><button class="btn primary" data-act="onbNext">Continuer</button></div>';
  } else {
    h += '<h2>Tes séances</h2><p class="muted">Voici le programme de départ. Tu pourras le régler et déplacer une séance quand tu veux.</p><div class="list">';
    S.templates.forEach(function (t) {
      h += '<div class="card" style="margin:0"><b>Séance ' + esc(t.id) + ', ' + esc(t.name.toLowerCase()) + '</b>' + (t.optional ? ' <span class="badge info">Optionnelle</span>' : '') +
        '<p class="muted small" style="margin:4px 0 0">' + DAYS[t.day] + ' · ' + t.ex.length + ' exercices</p></div>';
    });
    h += '</div><div class="row" style="margin-top:14px"><button class="btn ghost" data-act="onbBack">Retour</button><button class="btn primary" data-act="onbDone">Ouvrir Fonte</button></div>';
  }
  return h + '</div></div></div>';
}
