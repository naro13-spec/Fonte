import test from 'node:test';
import assert from 'node:assert/strict';
import { memoryAdapter } from '../js/data/adapters.js';
import { createRepo } from '../js/data/repo.js';
import { ensureSchema, NewerSchemaError } from '../js/data/migrations.js';
import { buildExport, parseImport } from '../js/data/transfer.js';
import { defaultState } from '../js/data/seed.js';
import { validateImport, SCHEMA_VERSION } from '../js/domain/validate.js';

const session = (over) => Object.assign({
  id: 's1', tpl: 'A', date: '2026-09-28', durationSec: 2400, partial: false, quality: 3, note: 'ok',
  exs: [{ exId: 'pompes', plannedId: 'pompes', sub: false, sets: [{ reps: 12, kg: 0, feel: 'ok', tag: 'none', note: '' }, { reps: 11, kg: 0, feel: 'hard', tag: 'none', note: '' }] }],
  records: [], plan: []
}, over || {});

async function freshRepo() {
  const adapter = memoryAdapter();
  const repo = createRepo(adapter);
  const info = await ensureSchema(adapter, repo.replaceAll);
  return { adapter, repo, info };
}

test('base vide : l\'état initial est installé une seule fois', async () => {
  const { adapter, repo, info } = await freshRepo();
  assert.equal(info.fresh, true);
  assert.equal(await adapter.get('kv', 'schemaVersion'), SCHEMA_VERSION);
  const s = await repo.load();
  assert.equal(s.templates.length, 4);
  assert.deepEqual(s.templates.map((t) => t.id), ['A', 'B', 'C', 'D']);
  assert.equal(s.equipment.length, 6);
  assert.equal(s.settings.onboardingDone, false);
  const again = await ensureSchema(adapter, repo.replaceAll);
  assert.equal(again.fresh, false);
});

test('persistance : séance, réglages et reprise relus à l\'identique', async () => {
  const { repo } = await freshRepo();
  const st = await repo.load();
  st.settings.sound = false;
  await repo.saveSettings(st.settings);
  await repo.putSession(session());
  await repo.saveActive({ tplId: 'B', exIdx: 2 });
  await repo.flush();
  const back = await repo.load();
  assert.equal(back.settings.sound, false);
  assert.equal(back.sessions.length, 1);
  assert.deepEqual(back.sessions[0].exs[0].sets[0].reps, 12);
  assert.equal(back.active.exIdx, 2);
  await repo.saveActive(null);
  await repo.flush();
  assert.equal((await repo.load()).active, null);
});

test('persistance : l\'ordre des séances et du matériel est conservé', async () => {
  const { repo } = await freshRepo();
  const st = await repo.load();
  const reversed = st.templates.slice().reverse();
  await repo.saveTemplates(reversed);
  await repo.flush();
  assert.deepEqual((await repo.load()).templates.map((t) => t.id), ['D', 'C', 'B', 'A']);
});

test('persistance : une erreur d\'écriture est signalée sans bloquer la suite', async () => {
  const adapter = memoryAdapter();
  const repo = createRepo(adapter);
  const errors = [];
  repo.setErrorHandler((e) => errors.push(e.message));
  const real = adapter.put;
  let calls = 0;
  adapter.put = async (...a) => { calls++; if (calls === 1) throw new Error('quota'); return real(...a); };
  repo.saveSettings({ a: 1 });
  repo.saveMoves([]);
  await repo.flush();
  assert.deepEqual(errors, ['quota']);
  assert.deepEqual(await adapter.get('kv', 'moves'), []);
});

test('migrations : appliquées dans l\'ordre, version mise à jour', async () => {
  const adapter = memoryAdapter();
  await adapter.put('kv', 'schemaVersion', 1);
  const order = [];
  const migrations = { 2: async (a) => { order.push(2); await a.put('kv', 'x', 'deux'); }, 3: async () => { order.push(3); } };
  const r = await ensureSchema(adapter, async () => {}, { current: 3, migrations });
  assert.deepEqual(order, [2, 3]);
  assert.equal(await adapter.get('kv', 'schemaVersion'), 3);
  assert.deepEqual([r.from, r.to], [1, 3]);
});

test('migrations : migration manquante et base plus récente refusées', async () => {
  const a1 = memoryAdapter();
  await a1.put('kv', 'schemaVersion', 1);
  await assert.rejects(() => ensureSchema(a1, async () => {}, { current: 2, migrations: {} }), /Migration manquante/);
  const a2 = memoryAdapter();
  await a2.put('kv', 'schemaVersion', 9);
  await assert.rejects(() => ensureSchema(a2, async () => {}), NewerSchemaError);
});

test('export puis import : aller-retour sans perte', async () => {
  const st = defaultState();
  st.sessions.push(session());
  st.pain.push({ id: 'p1', date: '2026-09-29', exId: 'dips', zone: 'Épaule', tpl: 'A' });
  st.moves.push({ week: '2026-09-28', tpl: 'B', day: 3 });
  const exp = await buildExport(st, Date.UTC(2026, 9, 1));
  const text = JSON.stringify(exp);
  const r = await parseImport(text);
  assert.ok(r.ok, r.errors && r.errors.join(' | '));
  assert.deepEqual([r.summary.sessions, r.summary.sets], [1, 2]);
  assert.deepEqual(r.state.sessions, st.sessions);
  assert.deepEqual(r.state.moves, st.moves);
  assert.equal(r.state.active, null);
});

test('import : fichier modifié, mal formé ou trop récent rejeté', async () => {
  const st = defaultState();
  st.sessions.push(session());
  const exp = await buildExport(st, 0);
  const tampered = JSON.parse(JSON.stringify(exp));
  tampered.data.sessions[0].exs[0].sets[0].reps = 99;
  const r1 = await parseImport(JSON.stringify(tampered));
  assert.equal(r1.ok, false);
  assert.match(r1.errors[0], /empreinte/);
  assert.equal((await parseImport('pas du json')).ok, false);
  assert.equal((await parseImport('{"app":"autre"}')).ok, false);
  const newer = JSON.parse(JSON.stringify(exp)); newer.schemaVersion = 99;
  assert.equal(validateImport(newer, SCHEMA_VERSION).ok, false);
  assert.equal((await parseImport('x'.repeat(5_000_001))).ok, false);
});

test('import : valeurs absurdes et exercices inconnus rejetés avant toute écriture', () => {
  const base = async () => JSON.parse(JSON.stringify(await buildExport(defaultState(), 0)));
  return (async () => {
    const mut = async (fn) => { const o = await base(); fn(o); return validateImport(o, SCHEMA_VERSION); };
    assert.equal((await mut(() => {})).ok, true);
    assert.equal((await mut((o) => o.data.sessions.push(session({ exs: [{ exId: 'pompes', sets: [{ reps: 99999, kg: 0, feel: 'ok' }] }] })))).ok, false);
    assert.equal((await mut((o) => o.data.sessions.push(session({ exs: [{ exId: 'inconnu', sets: [] }] })))).ok, false);
    assert.equal((await mut((o) => o.data.sessions.push(session({ date: '28/09/2026' })))).ok, false);
    assert.equal((await mut((o) => o.data.sessions.push(session({ exs: [{ exId: 'pompes', sets: [{ reps: 5, kg: -3, feel: 'ok' }] }] })))).ok, false);
    assert.equal((await mut((o) => { o.data.templates[0].ex[0].sets = 0; })).ok, false);
    assert.equal((await mut((o) => { o.data.equipment[0].kind = 'fusée'; })).ok, false);
    assert.equal((await mut((o) => { delete o.data.pain; })).ok, false);
    assert.equal((await mut((o) => o.data.sessions.push(session({ note: 'x'.repeat(501) })))).ok, false);
    const r = await mut((o) => o.data.sessions.push(session({ exs: [{ exId: 'inconnu', sets: [] }] })));
    assert.ok(r.errors.length > 0 && r.errors.length <= 12);
  })();
});

test('remplacement complet : l\'import écrase l\'ancien état proprement', async () => {
  const { repo } = await freshRepo();
  await repo.putSession(session({ id: 'ancien' }));
  await repo.flush();
  const st = defaultState();
  st.sessions.push(session({ id: 'nouveau' }));
  await repo.replaceAll(st);
  const back = await repo.load();
  assert.deepEqual(back.sessions.map((s) => s.id), ['nouveau']);
});
