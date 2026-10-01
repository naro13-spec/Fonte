// État initial : matériel déclaré au départ et programme A / B / C / D.
import { DEFAULT_TEMPLATES } from '../domain/program.js';
import { clone } from '../domain/format.js';
import { SCHEMA_VERSION } from '../domain/validate.js';

export function defaultState() {
  return {
    settings: { schemaVersion: SCHEMA_VERSION, vibration: true, sound: true, keepAwake: true, onboardingDone: false, lastExportAt: null },
    equipment: [
      { id: 'db5', kind: 'dumbbell', label: 'Haltères 5 kg', qty: 2, kg: 5, active: true },
      { id: 'db75', kind: 'dumbbell', label: 'Haltères 7,5 kg', qty: 2, kg: 7.5, active: true },
      { id: 'mat', kind: 'mat', label: 'Tapis', qty: 1, active: true },
      { id: 'chair', kind: 'chair', label: 'Chaises', qty: 2, active: true, checked: false },
      { id: 'stool', kind: 'stool', label: 'Petits tabourets', qty: 2, active: true, checked: false },
      { id: 'table', kind: 'table', label: 'Table solide (rowing inversé)', qty: 1, active: true, checked: false }
    ],
    templates: clone(DEFAULT_TEMPLATES),
    sessions: [],
    pain: [],
    moves: [],
    active: null
  };
}
