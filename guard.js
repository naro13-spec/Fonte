// Filet de sécurité (script classique, chargé avant l'application).
// Si Fonte ne démarre pas, affiche la cause probable au lieu d'un écran noir.
(function () {
  var errors = [];
  var shown = false;

  function short(url) { return String(url || '').split('/').slice(-2).join('/'); }

  function show(headline) {
    var app = document.getElementById('app');
    if (!app || app.childNodes.length > 0 || shown) return;
    shown = true;
    var box = document.createElement('div');
    box.style.cssText = 'max-width:560px;margin:0 auto;padding:28px 20px;font:16px/1.5 system-ui,sans-serif;color:#F1F2F4';
    var h = document.createElement('h1');
    h.textContent = "Fonte n'a pas pu démarrer";
    h.style.cssText = 'font-size:1.6rem;margin:0 0 12px';
    var p = document.createElement('p');
    p.textContent = headline;
    var ul = document.createElement('ul');
    ['Recharge la page sans le cache : Ctrl + Maj + R sur ordinateur.',
      "Vérifie que le dossier « js » et tous ses sous-dossiers sont bien dans ton dépôt GitHub (js/main.js doit s'ouvrir).",
      "Si tu as modifié des fichiers, remets ceux du dernier envoi."].forEach(function (t) {
      var li = document.createElement('li');
      li.textContent = t;
      li.style.marginBottom = '6px';
      ul.appendChild(li);
    });
    box.appendChild(h);
    box.appendChild(p);
    box.appendChild(ul);
    if (errors.length) {
      var pre = document.createElement('pre');
      pre.textContent = errors.slice(0, 4).join('\n');
      pre.style.cssText = 'white-space:pre-wrap;background:#1A1C21;border:1px solid #2E323A;border-radius:10px;padding:12px;font-size:.8rem;color:#A4A9B3';
      box.appendChild(pre);
    }
    var b = document.createElement('button');
    b.textContent = 'Réessayer';
    b.style.cssText = 'margin-top:16px;min-height:52px;padding:0 24px;border-radius:12px;border:0;background:#7C93FF;color:#0B1030;font:600 1rem system-ui,sans-serif';
    b.addEventListener('click', function () { location.reload(); });
    box.appendChild(b);
    app.appendChild(box);
  }

  window.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t !== window && t.tagName) {
      errors.push('Fichier non chargé : ' + short(t.src || t.href));
      show("Un fichier de l'application n'a pas pu être chargé.");
    } else {
      errors.push((e.message || 'Erreur') + (e.filename ? ' (' + short(e.filename) + ')' : ''));
    }
  }, true);

  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    errors.push(String((r && r.message) || r));
  });

  setTimeout(function () { show("L'application ne s'est pas affichée après 5 secondes."); }, 5000);
})();
