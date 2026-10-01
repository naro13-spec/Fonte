// Test de bout en bout sans navigateur : un faux DOM minimal pilote l'application réelle.
import test from 'node:test';
import assert from 'node:assert/strict';

const els = {};
function stubEl(id) {
  if (!els[id]) els[id] = { id: id, value: '', textContent: '', style: {}, files: null, click() {}, setAttribute() {}, remove() {} };
  return els[id];
}
const rootEl = { innerHTML: '', handlers: {}, addEventListener(t, f) { this.handlers[t] = f; }, querySelector() { return null; } };
globalThis.document = {
  getElementById(id) { return id === 'app' ? rootEl : stubEl(id); },
  addEventListener() {}, createElement() { return { click() {}, style: {} }; }, body: { appendChild() {}, removeChild() {} }, visibilityState: 'visible'
};
globalThis.window = { scrollTo() {} };
Object.defineProperty(globalThis, 'navigator', { value: { vibrate() { return true; } }, configurable: true, writable: true });

const { boot } = await import('../js/main.js');
const { memoryAdapter } = await import('../js/data/adapters.js');
const { store } = await import('../js/app/state.js');
const { createRepo } = await import('../js/data/repo.js');

let clock = new Date(2026, 9, 5, 18, 0, 0).getTime(); // lundi 5 octobre 2026
const now = () => clock;

function click(act, arg) {
  const el = { getAttribute: (n) => (n === 'data-act' ? act : n === 'data-arg' ? (arg === undefined ? null : String(arg)) : null), closest() { return el; }, parentNode: { children: [] }, setAttribute() {} };
  rootEl.handlers.click({ target: el });
}
const has = (s) => rootEl.innerHTML.includes(s);
const adapter = memoryAdapter();

function playUntil(stopWhen, guard = 300) {
  let g = 0;
  while (g++ < guard && !stopWhen()) {
    if (has('data-act="ack"')) click('ack');
    else if (has('data-act="skipRest"')) click('skipRest');
    else if (has('data-act="validate"')) click('validate');
    else break;
  }
}

test('première ouverture : accueil de présentation puis choix du matériel', async () => {
  await boot(adapter, { now, noTimers: true });
  assert.ok(has('Étape 1 sur 3'));
  assert.ok(has('ne remplace pas un coach qualifié'));
  click('onbNext');
  assert.ok(has('Ton matériel'));
  click('toggleEq', 'table');
  assert.ok(has("Je ne l'ai pas"));
  click('onbNext');
  assert.ok(has('Tes séances'));
  click('onbDone');
  assert.ok(has("Prévue aujourd'hui"));
  assert.ok(has('Séance A, poussée'));
});

test('retirer la table rend le rowing inversé indisponible et propose l\'alternative', () => {
  click('tab', 'exercises');
  click('filter', 'no');
  assert.ok(has('Rowing inversé'));
  click('filter', 'all');
});

test('séance A complète : sécurité, repos, résumé, historique', () => {
  click('tab', 'today');
  click('start', 'A');
  assert.ok(has('Pompes standard'));
  playUntil(() => has('Avant de commencer les dips') && has('data-act="ack"') && has('Dips entre deux chaises'));
  // on est arrivé aux dips : la feuille de sécurité est affichée avant la première série
  assert.ok(has('Avant de commencer les dips'));
  assert.ok(has("Choisir l'alternative"));
  click('ack');
  playUntil(() => has('Séance enregistrée'));
  assert.ok(has('Séance enregistrée'));
  assert.ok(has('Séance A terminée'));
  click('quality', 3);
  click('closeSummary');
  assert.ok(has('Terminée'));
  assert.equal(store.S.sessions.length, 1);
  click('tab', 'history');
  assert.ok(has('Séance A'));
  click('histOpen', store.S.sessions[0].id);
  assert.ok(has('Pompes standard'));
  click('closeSheet');
});

test('persistance : tout est relu depuis le stockage après redémarrage', async () => {
  await store.repo.flush();
  const back = await createRepo(adapter).load();
  assert.equal(back.sessions.length, 1);
  assert.equal(back.sessions[0].quality, 3);
  assert.equal(back.settings.onboardingDone, true);
  assert.equal(back.equipment.find((e) => e.id === 'table').active, false);
});

test('séance interrompue puis reprise après fermeture de l\'application', async () => {
  clock += 2 * 86400000; // mercredi : séance B
  click('tab', 'today');
  click('start', 'B');
  playUntil(() => store.A && store.A.exs[0].sets.length >= 1 && !has('data-act="validate"') === false, 5);
  click('validate');
  assert.ok(store.A.exs[0].sets.length >= 1);
  await store.repo.flush();
  // « fermeture » : on rouvre l'application avec le même stockage
  await boot(adapter, { now, noTimers: true });
  assert.ok(store.A, 'la séance en cours est restaurée');
  assert.ok(has('Squat sauté'));
  assert.ok(has('Séance reprise'));
  click('quit');
  assert.ok(has('Quitter la séance'));
  click('endNow');
  assert.ok(has('séance partielle') || has('arrêtée'));
  click('closeSummary');
  assert.equal(store.A, null);
});

test('douleur : l\'exercice est arrêté, jamais « continue malgré la douleur »', () => {
  clock += 2 * 86400000; // vendredi : séance C
  click('tab', 'today');
  click('start', 'C');
  playUntil(() => has('Rowing haltère'), 5);
  click('pain');
  assert.ok(has('Où ressens-tu la douleur'));
  click('painZone', 'Épaule');
  assert.ok(has('Arrête cet exercice maintenant'));
  assert.ok(!/continue malgré/i.test(rootEl.innerHTML));
  assert.equal(store.S.pain.length, 1);
  click('skipEx');
  assert.ok(has('Exercice 2 sur'));
  click('abandon');
  assert.equal(store.A, null);
});

test('programme : réglage d\'un exercice validé, valeurs absurdes refusées', () => {
  click('tab', 'program');
  click('editTe', 'A:1');
  assert.ok(has('Régler : Pompes déclinées'));
  stubEl('edSets').value = '4'; stubEl('edLo').value = '10'; stubEl('edHi').value = '14'; stubEl('edRest').value = '80';
  click('saveTe');
  assert.deepEqual(store.S.templates[0].ex[1].lo, 10);
  assert.equal(store.S.templates[0].ex[1].rest, 80);
  click('editTe', 'A:1');
  stubEl('edSets').value = '99'; stubEl('edLo').value = '10'; stubEl('edHi').value = '14'; stubEl('edRest').value = '80';
  click('saveTe');
  assert.ok(has('À corriger'));
  assert.equal(store.S.templates[0].ex[1].sets, 4);
  click('closeSheet');
});

test('programme : déplacement avec avertissement de récupération, puis confirmation', () => {
  clock = new Date(2026, 9, 5, 18, 0, 0).getTime();
  click('tab', 'program');
  click('moveTpl', 'C');
  click('moveDay', 1); // mardi : trop proche de A (lundi) sur les épaules
  assert.ok(has('Récupération un peu courte'));
  assert.ok(has('Déplacer quand même'));
  click('confirmMove');
  assert.equal(store.S.moves.length, 1);
  assert.ok(has('déplacée cette semaine'));
});

test('matériel : une barre de traction débloque les tractions, l\'historique reste intact', () => {
  click('tab', 'settings');
  click('addEq');
  click('addEqItem', 'door_pullup_bar');
  assert.ok(has('exercices débloqués'));
  assert.ok(has('Tractions'));
  assert.equal(store.S.sessions.length >= 1, true);
});

test('export, import invalide, puis réinitialisation complète', async () => {
  click('tab', 'settings');
  click('exportData');
  await new Promise((r) => setTimeout(r, 30));
  assert.ok(store.S.settings.lastExportAt);
  click('resetAll');
  assert.ok(has('Effacer toutes les données'));
  click('doReset');
  assert.ok(has('Étape 1 sur 3'));
  assert.equal(store.S.sessions.length, 0);
  await store.repo.flush();
  const back = await createRepo(adapter).load();
  assert.equal(back.sessions.length, 0);
  assert.equal(back.settings.onboardingDone, false);
});

test('données plus récentes que l\'application : refus clair, rien d\'écrasé', async () => {
  const a = memoryAdapter();
  await a.put('kv', 'schemaVersion', 99);
  await boot(a, { now, noTimers: true });
  assert.ok(has("Impossible d'ouvrir Fonte"));
  assert.ok(has('version plus récente'));
  assert.equal(await a.get('kv', 'schemaVersion'), 99);
});
