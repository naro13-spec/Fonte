import { store } from '../app/state.js';
import { esc } from '../domain/format.js';
import { VERSION } from '../version.js';

export function settingsView() {
  const S = store.S;
  const ui = store.ui;
  let h = '<h1>Réglages</h1><h2 style="margin:22px 0 10px">Mon équipement</h2><div class="list">';
  S.equipment.forEach(function (e) {
    const needsCheck = e.kind === 'chair' || e.kind === 'stool' || e.kind === 'table';
    h += '<div class="card" style="margin:0' + (e.active ? '' : ';opacity:.6') + '"><div class="row" style="justify-content:space-between"><b>' + esc(e.label) + '</b><span class="muted">× ' + e.qty + '</span></div>';
    if (needsCheck && e.active) {
      h += '<div class="toggle"><span class="small">Installation vérifiée' + (e.kind === 'stool' ? ' (jamais en charge)' : '') + '</span><button data-act="check" data-arg="' + esc(e.id) + '" aria-pressed="' + (e.checked ? 'true' : 'false') + '">' + (e.checked ? 'Oui' : 'Non') + '</button></div>' +
        '<p class="small dim" style="margin:8px 0 0">' + (e.kind === 'stool' ? "Petit tabouret : mains ou pieds en appui contre un mur seulement. Sa charge maximale est inconnue." : "Cale-le contre un mur et pousse-le fort avant de t'en servir.") + '</p>';
    }
    h += '<div style="margin-top:10px"><button class="btn ' + (e.active ? 'ghost' : 'secondary') + ' sm" data-act="toggleEq" data-arg="' + esc(e.id) + '">' + (e.active ? 'Retirer' : 'Remettre') + '</button></div></div>';
  });
  h += '</div><button class="btn primary block" style="margin-top:14px" data-act="addEq">Ajouter du matériel</button>';

  h += '<h2 style="margin:28px 0 6px">Préférences</h2>';
  [['vibration', 'Vibration'], ['sound', 'Son à la fin du repos'], ['keepAwake', 'Écran allumé pendant la séance']].forEach(function (p) {
    const on = !!S.settings[p[0]];
    h += '<div class="toggle"><span>' + p[1] + '</span><button data-act="pref" data-arg="' + p[0] + '" aria-pressed="' + on + '">' + (on ? 'Oui' : 'Non') + '</button></div>';
  });

  h += '<h2 style="margin:28px 0 6px">Mes données</h2><p class="muted small">Tout reste sur cet appareil. Rien n\'est envoyé. La sauvegarde est un fichier que tu gardes toi-même.</p>';
  h += '<p class="small" style="margin-bottom:10px">' + (S.settings.lastExportAt ? 'Dernière sauvegarde : ' + esc(S.settings.lastExportAt.slice(0, 10)) + '.' : 'Aucune sauvegarde pour l\'instant.') + '</p>';
  h += '<button class="btn secondary block" style="margin-bottom:10px" data-act="exportData">Exporter mes données</button>';
  h += '<button class="btn secondary block" style="margin-bottom:10px" data-act="pickImport">Importer une sauvegarde</button>';
  h += '<input type="file" id="importFile" accept="application/json,.json" hidden>';
  h += '<div class="toggle"><span class="small">Stockage protégé contre l\'effacement automatique</span>' +
    (ui.persisted ? '<span class="badge ok">Oui</span>' : '<button data-act="persist" aria-pressed="false">Demander</button>') + '</div>';
  h += '<button class="btn danger block" style="margin-top:18px" data-act="resetAll">Effacer toutes mes données</button>';

  h += '<h2 style="margin:28px 0 6px">À propos</h2><p class="muted small">Fonte, version ' + esc(VERSION) + '. Fonte n\'est pas un avis médical et ne remplace pas un coach qualifié. En cas de douleur vive, persistante ou inhabituelle, arrête l\'exercice et parles-en à un parent ou tuteur, ou à un professionnel de santé.</p>';
  return h;
}
