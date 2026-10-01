// L'adaptateur IndexedDB est testé avec un faux IndexedDB asynchrone, puis l'application démarre dessus.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createFakeIndexedDB } from './fake-idb.js';

globalThis.indexedDB = createFakeIndexedDB();

const els = {};
const rootEl = { innerHTML: '', handlers: {}, addEventListener(t, f) { this.handlers[t] = f; }, querySelector() { return null; } };
globalThis.document = {
  getElementById(id) { return id === 'app' ? rootEl : (els[id] = els[id] || { id, value: '', style: {}, click() {} }); },
  addEventListener() {}, createElement() { return { click() {}, style: {} }; }, body: { appendChild() {}, removeChild() {} }, visibilityState: 'visible'
};
globalThis.window = { scrollTo() {}, addEventListener() {} };
Object.defineProperty(globalThis, 'navigator', { value: { vibrate() {} }, configurable: true, writable: true });

const { idbAdapter } = await import('../js/data/adapters.js');
const { createRepo } = await import('../js/data/repo.js');
const { ensureSchema } = await import('../js/data/migrations.js');
const { boot } = await import('../js/main.js');
const { store } = await import('../js/app/state.js');

test('IndexedDB : lecture, écriture, remplacement et suppression', async () => {
  const a = idbAdapter('test-adapter');
  assert.equal(await a.get('kv', 'absent'), undefined);
  await a.put('kv', 'x', { n: 1 });
  assert.deepEqual(await a.get('kv', 'x'), { n: 1 });
  await a.replaceStore('sessions', [['s1', { id: 's1' }], ['s2', { id: 's2' }]]);
  assert.equal((await a.getAll('sessions')).length, 2);
  await a.replaceStore('sessions', [['s3', { id: 's3' }]]);
  assert.deepEqual((await a.getAll('sessions')).map((s) => s.id), ['s3']);
  await a.delete('kv', 'x');
  assert.equal(await a.get('kv', 'x'), undefined);
});

test('IndexedDB : première ouverture installe l\'état initial et relit tout', async () => {
  const a = idbAdapter('test-repo');
  const repo = createRepo(a);
  const info = await ensureSchema(a, repo.replaceAll);
  assert.equal(info.fresh, true);
  const st = await repo.load();
  assert.equal(st.templates.length, 4);
  assert.equal(st.equipment.length, 6);
});

test('l\'application démarre sur IndexedDB et affiche l\'écran d\'accueil', async () => {
  const a = idbAdapter('test-app');
  await boot(a, { noTimers: true });
  assert.ok(rootEl.innerHTML.includes('Étape 1 sur 3'), rootEl.innerHTML.slice(0, 300));
  assert.equal(store.ui.fatal, null);
});
