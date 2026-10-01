import { ic } from './components.js';

const ITEMS = [
  ['today', "Aujourd'hui", 'today'],
  ['program', 'Programme', 'prog'],
  ['history', 'Historique', 'hist'],
  ['exercises', 'Exercices', 'dumb'],
  ['settings', 'Réglages', 'gear']
];

export function shell(content, tab) {
  let nav = '<nav class="nav" aria-label="Navigation principale"><div class="brand disp">Fonte</div>';
  ITEMS.forEach(function (i) {
    nav += '<button data-act="tab" data-arg="' + i[0] + '"' + (tab === i[0] ? ' aria-current="page"' : '') + '>' + ic(i[2], 24) + '<span>' + i[1] + '</span></button>';
  });
  nav += '</nav>';
  return '<div class="shell">' + nav + '<main>' + content + '</main></div>';
}
