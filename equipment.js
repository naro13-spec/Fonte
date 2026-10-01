// Équipement et compatibilité des exercices.
// Les « capacités » sont calculées à partir de l'inventaire, jamais stockées.
import { EXERCISES } from './catalogue.js';
import { fmt } from './format.js';

export const ADDABLE = [
  { key: 'door_pullup_bar', label: 'Barre de traction de porte' },
  { key: 'band', label: 'Élastiques de résistance' },
  { key: 'bench', label: 'Banc' },
  { key: 'db10', label: 'Haltères 10 kg (paire)' },
  { key: 'db125', label: 'Haltères 12,5 kg (paire)' }
];

export function newItem(key) {
  const defs = {
    door_pullup_bar: { id: 'door_pullup_bar', kind: 'door_pullup_bar', label: 'Barre de traction de porte', qty: 1 },
    band: { id: 'band', kind: 'band', label: 'Élastiques de résistance', qty: 1 },
    bench: { id: 'bench', kind: 'bench', label: 'Banc', qty: 1 },
    db10: { id: 'db10', kind: 'dumbbell', label: 'Haltères 10 kg', qty: 2, kg: 10 },
    db125: { id: 'db125', kind: 'dumbbell', label: 'Haltères 12,5 kg', qty: 2, kg: 12.5 }
  };
  const d = defs[key];
  if (!d) return null;
  d.active = true;
  return d;
}

export function capabilities(equipment) {
  const c = {};
  equipment.forEach(function (e) {
    if (!e.active) return;
    if (e.kind === 'dumbbell') c.db = true;
    else if (e.kind === 'door_pullup_bar') c.bar = true;
    else c[e.kind] = true;
    if (e.kind === 'chair' || e.kind === 'stool') c.seat = true;
  });
  return c;
}

export function missingFor(ex, caps) { return ex.req.filter(function (r) { return !caps[r]; }); }

export function isAvailable(ex, caps) { return missingFor(ex, caps).length === 0; }

export function availableIds(equipment) {
  const c = capabilities(equipment);
  return Object.keys(EXERCISES).filter(function (id) { return isAvailable(EXERCISES[id], c); });
}

export function unlockedBetween(before, after) {
  return after.filter(function (id) { return before.indexOf(id) < 0; });
}

// Charges réalisables avec l'inventaire actif : compositions d'haltères (1 ou 2 identiques).
export function loadOptions(ex, equipment) {
  if (ex.load === 'bw') return [{ kg: 0, label: 'Poids du corps' }];
  const o = [];
  if (ex.bwOK) o.push({ kg: 0, label: 'Poids du corps' });
  equipment.forEach(function (e) {
    if (!e.active || e.kind !== 'dumbbell') return;
    if (ex.load !== 'pair' && e.qty >= 1) o.push({ kg: e.kg, label: '1 × ' + fmt(e.kg) + ' kg' });
    if (ex.load !== 'single' && e.qty >= 2) o.push({ kg: e.kg * 2, label: '2 × ' + fmt(e.kg) + ' kg' });
  });
  o.sort(function (a, b) { return a.kg - b.kg; });
  const seen = {};
  const out = [];
  o.forEach(function (x) { if (!seen[x.label]) { seen[x.label] = 1; out.push(x); } });
  return out.length ? out : [{ kg: 0, label: 'Poids du corps' }];
}

export function kgLabel(ex, kg, equipment) {
  if (!kg) return 'Poids du corps';
  const o = loadOptions(ex, equipment);
  for (let i = 0; i < o.length; i++) if (o[i].kg === kg) return o[i].label;
  return fmt(kg) + ' kg au total';
}
