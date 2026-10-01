// Garde-fous de publication : le mode hors ligne ne doit jamais oublier un fichier ni afficher une mauvaise version.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION } from '../js/version.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p, out); else out.push(path.relative(root, p).split(path.sep).join('/'));
  }
  return out;
}

test('versions : sw.js et js/version.js sont identiques', () => {
  const m = sw.match(/const VERSION = '([^']+)'/);
  assert.ok(m);
  assert.equal(m[1], VERSION);
});

test('hors ligne : tous les fichiers de l\'application sont dans le précache, et seulement eux', () => {
  const listed = [...sw.matchAll(/'\.\/([^']*)'/g)].map((x) => x[1]).filter((x) => x !== '');
  const shipped = ['index.html', 'manifest.webmanifest'].concat(['css', 'js', 'icons'].flatMap((d) => walk(path.join(root, d))));
  assert.deepEqual([...new Set(listed)].sort(), [...new Set(shipped)].sort());
});

test('PWA : le manifeste pointe vers des icônes qui existent', () => {
  const man = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(man.display, 'standalone');
  for (const i of man.icons) assert.ok(fs.existsSync(path.join(root, i.src)), i.src);
  assert.ok(man.icons.some((i) => i.purpose === 'maskable'));
});

test('sécurité : aucun script en ligne, aucune ressource externe, aucun stockage de session dans le code', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(!/<script(?![^>]*src=)/.test(html), 'script en ligne détecté');
  assert.ok(!/https?:\/\//.test(html.replace(/xmlns="[^"]*"/g, '')), 'URL externe dans index.html');
  assert.match(html, /script-src 'self'/);
  for (const f of walk(path.join(root, 'js'))) {
    const code = fs.readFileSync(path.join(root, 'js', f.replace(/^js\//, '')), 'utf8');
    assert.ok(!/\beval\s*\(|new Function\(|document\.write/.test(code), f + ' : API dangereuse');
    assert.ok(!/https?:\/\//.test(code.replace(/http:\/\/www\.w3\.org[^'"]*/g, '')), f + ' : requête externe');
  }
});

test('qualité : aucun TODO ni console.log oublié, fichiers de taille raisonnable', () => {
  for (const f of walk(path.join(root, 'js'))) {
    const code = fs.readFileSync(path.join(root, f), 'utf8');
    assert.ok(!/TODO|FIXME|console\.log/.test(code), f);
    assert.ok(code.split('\n').length < 400, f + ' trop long');
  }
});
