// État partagé de l'application. S = données persistées (copie en mémoire), A = séance en cours, ui = état d'affichage.
export const store = { S: null, A: null, ui: null, repo: null, now: function () { return Date.now(); } };

export function newUi() {
  return { tab: 'today', view: 'main', sheet: null, toast: '', draft: null, pop: null, onb: 0, summaryId: null, filter: 'all', group: 'all', fatal: null };
}

let renderer = function () {};
export function setRenderer(fn) { renderer = fn; }
export function render() { renderer(); }
export function toast(message) { store.ui.toast = message; }
