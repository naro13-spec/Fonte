// Deux adaptateurs de stockage avec la même interface : mémoire (tests) et IndexedDB (navigateur).
// get(store, key) · put(store, key, value) · getAll(store) · delete(store, key)
// replaceStore(store, [[key, value], ...]) : remplace tout le contenu en une seule transaction.

export const STORES = ['kv', 'equipment', 'templates', 'sessions', 'pain'];

export function memoryAdapter() {
  const data = {};
  STORES.forEach(function (s) { data[s] = new Map(); });
  return {
    kind: 'memory',
    get: async function (s, k) { return data[s].has(k) ? JSON.parse(data[s].get(k)) : undefined; },
    put: async function (s, k, v) { data[s].set(k, JSON.stringify(v)); },
    getAll: async function (s) { return Array.from(data[s].values()).map(function (x) { return JSON.parse(x); }); },
    delete: async function (s, k) { data[s].delete(k); },
    replaceStore: async function (s, entries) {
      data[s].clear();
      entries.forEach(function (e) { data[s].set(e[0], JSON.stringify(e[1])); });
    }
  };
}

export function idbAdapter(name) {
  const dbName = name || 'fonte';
  let dbPromise = null;
  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      const req = indexedDB.open(dbName, 1);
      req.onupgradeneeded = function () {
        const db = req.result;
        STORES.forEach(function (s) { if (!db.objectStoreNames.contains(s)) db.createObjectStore(s); });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('Ouverture de la base impossible')); };
      req.onblocked = function () { reject(new Error('Base bloquée par un autre onglet')); };
    });
    return dbPromise;
  }
  function wrap(req) {
    return new Promise(function (resolve, reject) {
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }
  function done(tx) {
    return new Promise(function (resolve, reject) {
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
      tx.onabort = function () { reject(tx.error || new Error('Transaction annulée')); };
    });
  }
  return {
    kind: 'indexeddb',
    get: async function (s, k) { const db = await open(); return wrap(db.transaction(s, 'readonly').objectStore(s).get(k)); },
    put: async function (s, k, v) { const db = await open(); const tx = db.transaction(s, 'readwrite'); tx.objectStore(s).put(v, k); return done(tx); },
    getAll: async function (s) { const db = await open(); return wrap(db.transaction(s, 'readonly').objectStore(s).getAll()); },
    delete: async function (s, k) { const db = await open(); const tx = db.transaction(s, 'readwrite'); tx.objectStore(s).delete(k); return done(tx); },
    replaceStore: async function (s, entries) {
      const db = await open();
      const tx = db.transaction(s, 'readwrite');
      const os = tx.objectStore(s);
      os.clear();
      entries.forEach(function (e) { os.put(e[1], e[0]); });
      return done(tx);
    }
  };
}
