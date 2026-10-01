// Faux IndexedDB minimal, asynchrone comme le vrai : sert à tester l'adaptateur de stockage du navigateur.
export function createFakeIndexedDB() {
  const dbs = {};
  const tick = function (fn) { setTimeout(fn, 0); };

  function makeDb(name) {
    const stores = dbs[name].stores;
    const db = {
      objectStoreNames: { contains: function (n) { return Object.prototype.hasOwnProperty.call(stores, n); } },
      createObjectStore: function (n) { stores[n] = new Map(); return {}; },
      transaction: function (names, mode) {
        const list = Array.isArray(names) ? names : [names];
        list.forEach(function (n) { if (!stores[n]) throw new Error('NotFoundError: ' + n); });
        const tx = { oncomplete: null, onerror: null, onabort: null, pending: 0, finished: false };
        const finishSoon = function () {
          tick(function () {
            if (tx.pending === 0 && !tx.finished) { tx.finished = true; if (tx.oncomplete) tx.oncomplete(); }
          });
        };
        tx.objectStore = function (n) {
          if (list.indexOf(n) < 0) throw new Error('NotFoundError: ' + n + ' hors transaction');
          const map = stores[n];
          const request = function (compute, write) {
            if (write && mode !== 'readwrite') throw new Error('ReadOnlyError');
            const req = { onsuccess: null, onerror: null, result: undefined };
            tx.pending++;
            tick(function () {
              req.result = compute();
              tx.pending--;
              if (req.onsuccess) req.onsuccess();
              finishSoon();
            });
            return req;
          };
          return {
            get: function (k) { return request(function () { return map.has(k) ? JSON.parse(JSON.stringify(map.get(k))) : undefined; }); },
            getAll: function () { return request(function () { return Array.from(map.values()).map(function (v) { return JSON.parse(JSON.stringify(v)); }); }); },
            put: function (v, k) { return request(function () { if (k === undefined) throw new Error('DataError'); map.set(k, JSON.parse(JSON.stringify(v))); return k; }, true); },
            delete: function (k) { return request(function () { map.delete(k); }, true); },
            clear: function () { return request(function () { map.clear(); }, true); }
          };
        };
        finishSoon();
        return tx;
      }
    };
    return db;
  }

  return {
    open: function (name) {
      const req = { onupgradeneeded: null, onsuccess: null, onerror: null, onblocked: null, result: null };
      tick(function () {
        const fresh = !dbs[name];
        if (fresh) dbs[name] = { stores: {} };
        req.result = makeDb(name);
        if (fresh && req.onupgradeneeded) req.onupgradeneeded();
        if (req.onsuccess) req.onsuccess();
      });
      return req;
    }
  };
}
