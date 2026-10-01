// Export / import. Le fichier contient une empreinte d'intégrité (SHA-256) calculée sur les données.
import { validateImport, SCHEMA_VERSION, LIMITS } from '../domain/validate.js';
import { defaultState } from './seed.js';

export async function sha256Hex(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(function (b) { return (b < 16 ? '0' : '') + b.toString(16); }).join('');
}

export async function buildExport(state, nowMs) {
  const data = {
    settings: state.settings, equipment: state.equipment, templates: state.templates,
    sessions: state.sessions, pain: state.pain, moves: state.moves
  };
  const json = JSON.stringify(data);
  return {
    app: 'fonte', format: 1, schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date(nowMs).toISOString(), checksum: await sha256Hex(json), data: data
  };
}

// Retourne { ok, errors, summary, state }. Rien n'est modifié tant que l'utilisateur n'a pas confirmé.
export async function parseImport(text) {
  if (typeof text !== 'string' || text.length > LIMITS.maxFileChars) return { ok: false, errors: ['Fichier trop volumineux ou illisible.'] };
  let obj;
  try { obj = JSON.parse(text); } catch (e) { return { ok: false, errors: ["Le fichier n'est pas un JSON valide."] }; }
  const v = validateImport(obj, SCHEMA_VERSION);
  if (!v.ok) return { ok: false, errors: v.errors };
  const sum = await sha256Hex(JSON.stringify(obj.data));
  if (sum !== obj.checksum) return { ok: false, errors: ["L'empreinte du fichier ne correspond pas : il a été modifié ou est incomplet."] };
  const base = defaultState();
  const state = {
    settings: Object.assign({}, base.settings, obj.data.settings, { schemaVersion: SCHEMA_VERSION }),
    equipment: obj.data.equipment, templates: obj.data.templates,
    sessions: obj.data.sessions, pain: obj.data.pain, moves: obj.data.moves, active: null
  };
  return { ok: true, errors: [], summary: v.summary, state: state };
}
