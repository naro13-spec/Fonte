// Service worker de Fonte : mode hors ligne.
// À chaque nouvelle version : changer VERSION ici ET dans js/version.js (un test vérifie les deux).
// Chaque fichier de l'application doit figurer dans CORE (un test le vérifie aussi).
const VERSION = '1.0.1';
const CACHE = 'fonte-' + VERSION;

const CORE = [
  './',
  './css/app.css',
  './css/tokens.css',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/icon.svg',
  './index.html',
  './js/app/actions.js',
  './js/app/platform.js',
  './js/app/state.js',
  './js/boot.js',
  './js/data/adapters.js',
  './js/data/migrations.js',
  './js/data/repo.js',
  './js/data/seed.js',
  './js/data/transfer.js',
  './js/domain/catalogue.js',
  './js/domain/dates.js',
  './js/domain/equipment.js',
  './js/domain/format.js',
  './js/domain/history.js',
  './js/domain/program.js',
  './js/domain/session.js',
  './js/domain/validate.js',
  './js/guard.js',
  './js/main.js',
  './js/ui/components.js',
  './js/ui/exercises.js',
  './js/ui/history.js',
  './js/ui/onboarding.js',
  './js/ui/program.js',
  './js/ui/sessionView.js',
  './js/ui/settings.js',
  './js/ui/sheets.js',
  './js/ui/shell.js',
  './js/ui/summary.js',
  './js/ui/today.js',
  './js/version.js',
  './manifest.webmanifest'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(CORE); }));
});

// La nouvelle version s'active au prochain lancement de l'application, jamais en pleine séance.
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf('fonte-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () {
        if (req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
