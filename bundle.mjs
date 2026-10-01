// Assemble l'application en UN seul fichier HTML (pour un aperçu rapide, sans hébergement).
// Usage : node tools/bundle.mjs . dist/fonte-preview.html
// Le fichier produit n'enregistre pas de service worker (pas de mode hors ligne installable).
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const out = path.resolve(process.argv[3] || 'dist/fonte-preview.html');
const entry = path.join(root, 'js', 'boot.js');

const order = [];
const seen = new Map();

function rel(abs) { return path.relative(root, abs).split(path.sep).join('/'); }

function load(abs) {
  if (seen.has(abs)) return;
  seen.set(abs, true);
  let src = fs.readFileSync(abs, 'utf8');
  const exportsList = [];
  const deps = [];
  src = src.replace(/^import\s*\{([^}]*)\}\s*from\s*'([^']+)';?[ \t]*$/gm, function (m, names, spec) {
    const dep = path.resolve(path.dirname(abs), spec);
    deps.push(dep);
    const list = names.split(',').map(function (s) { return s.trim(); }).filter(Boolean).map(function (n) { return n.replace(/\s+as\s+/, ': '); });
    return 'const { ' + list.join(', ') + ' } = __mod(' + JSON.stringify(rel(dep)) + ');';
  });
  src = src.replace(/^export\s+(async\s+function|function|const|let|class)\s+([A-Za-z0-9_$]+)/gm, function (m, kw, name) {
    exportsList.push(name);
    return kw + ' ' + name;
  });
  if (/^\s*(import|export)\s/m.test(src)) throw new Error('Syntaxe import/export non prise en charge dans ' + rel(abs));
  deps.forEach(load);
  order.push({ abs: abs, src: src, exports: exportsList });
}

load(entry);

let js = '(function () {\n"use strict";\nvar __defs = {};\nfunction __mod(id) { return __defs[id]; }\n';
order.forEach(function (m) {
  js += '__defs[' + JSON.stringify(rel(m.abs)) + '] = (function () {\n' + m.src + '\nreturn { ' + m.exports.join(', ') + ' };\n})();\n';
});
js += '})();\n';
// Le service worker n'est pas utilisé dans l'aperçu.
js = js.replace(/if \('serviceWorker' in navigator[\s\S]*?\n\}\n/, '');

const css = fs.readFileSync(path.join(root, 'css', 'tokens.css'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'css', 'app.css'), 'utf8');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html
  .replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\n?/, '')
  .replace(/<link rel="manifest"[^>]*>\n?/, '')
  .replace(/<link rel="icon"[^>]*>\n?/, '')
  .replace(/<link rel="apple-touch-icon"[^>]*>\n?/, '')
  .replace(/<link rel="stylesheet" href="css\/tokens.css">\n?/, '<style>\n' + css.replace(/<\/style/g, '<\\/style') + '\n</style>\n')
  .replace(/<link rel="stylesheet" href="css\/app.css">\n?/, '')
  .replace(/<script type="module" src="js\/boot.js"><\/script>/, '<script>\n' + js.replace(/<\/script/g, '<\\/script') + '\n</script>');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log('Aperçu écrit : ' + path.relative(process.cwd(), out) + ' (' + Math.round(html.length / 1024) + ' Ko)');
