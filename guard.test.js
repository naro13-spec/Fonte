import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function run(appChildren, trigger) {
  const handlers = {};
  const timers = [];
  const made = [];
  const app = { childNodes: appChildren, appended: [], appendChild(n) { this.appended.push(n); this.childNodes = [n]; } };
  const mk = (tag) => { const n = { tag, style: {}, children: [], appendChild(c) { this.children.push(c); }, addEventListener() {}, textContent: '' }; made.push(n); return n; };
  const ctx = {
    window: { addEventListener(t, f) { (handlers[t] = handlers[t] || []).push(f); } },
    document: { getElementById: () => app, createElement: mk },
    setTimeout: (f) => timers.push(f), location: { reload() {} }
  };
  new Function('window', 'document', 'setTimeout', 'location', fs.readFileSync(new URL('../js/guard.js', import.meta.url), 'utf8'))(ctx.window, ctx.document, ctx.setTimeout, ctx.location);
  trigger({ handlers, timers });
  return { app, made };
}

test('guard : un fichier qui ne charge pas affiche un message au lieu d\'un écran noir', () => {
  const r = run([], ({ handlers }) => handlers.error[0]({ target: { tagName: 'SCRIPT', src: 'https://x.github.io/fonte/js/boot.js' } }));
  assert.equal(r.app.appended.length, 1);
  assert.ok(r.made.some((n) => /js\/boot\.js/.test(n.textContent)));
});

test('guard : si rien ne s\'affiche après le délai, le message apparaît ; sinon il reste discret', () => {
  assert.equal(run([], ({ timers }) => timers[0]()).app.appended.length, 1);
  assert.equal(run([{}], ({ timers }) => timers[0]()).app.appended.length, 0);
});
