// Migrations de schéma. Une migration par version, appliquées dans l'ordre à l'ouverture.
import { SCHEMA_VERSION } from '../domain/validate.js';
import { defaultState } from './seed.js';

// Exemple de forme d'une migration future :
// 2: async function (adapter) { /* lire, transformer, réécrire */ }
export const MIGRATIONS = {};

export class NewerSchemaError extends Error {}

// Base vide : on installe l'état initial. Base plus ancienne : migrations. Base plus récente : refus.
export async function ensureSchema(adapter, writeState, options) {
  const o = options || {};
  const current = o.current || SCHEMA_VERSION;
  const migrations = o.migrations || MIGRATIONS;
  const found = await adapter.get('kv', 'schemaVersion');
  if (found == null) {
    await writeState(defaultState());
    await adapter.put('kv', 'schemaVersion', current);
    return { fresh: true, from: current, to: current };
  }
  if (found > current) throw new NewerSchemaError('Les données viennent d\'une version plus récente de Fonte.');
  let v = found;
  while (v < current) {
    const step = migrations[v + 1];
    if (typeof step !== 'function') throw new Error('Migration manquante vers la version ' + (v + 1));
    await step(adapter);
    v++;
    await adapter.put('kv', 'schemaVersion', v);
  }
  return { fresh: false, from: found, to: current };
}
