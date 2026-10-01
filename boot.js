// Démarrage dans le navigateur : choix du stockage et enregistrement du mode hors ligne.
import { boot } from './main.js';
import { idbAdapter, memoryAdapter } from './data/adapters.js';

async function start() {
  let adapter = idbAdapter('fonte');
  let volatile = false;
  try {
    await adapter.get('kv', 'schemaVersion');
  } catch (e) {
    adapter = memoryAdapter();
    volatile = true;
  }
  await boot(adapter, { volatile: volatile });
}

start();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js').catch(function () { /* hors ligne non disponible ici */ });
  });
}
