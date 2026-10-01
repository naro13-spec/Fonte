// Accès aux données. Toutes les écritures passent par une file : elles s'exécutent dans l'ordre.
// Une erreur d'écriture ne bloque pas l'application : elle est signalée via onError.

export function createRepo(adapter) {
  let queue = Promise.resolve();
  let onError = function () {};

  function enqueue(fn) {
    queue = queue.then(fn).catch(function (e) { onError(e); });
    return queue;
  }

  function byPos(list) { return list.slice().sort(function (a, b) { return (a.pos || 0) - (b.pos || 0); }); }
  function withPos(list) { return list.map(function (x, i) { const c = Object.assign({}, x); c.pos = i; return c; }); }
  function strip(list) { return list.map(function (x) { const c = Object.assign({}, x); delete c.pos; return c; }); }

  return {
    setErrorHandler: function (fn) { onError = fn; },
    flush: function () { return queue; },

    load: async function () {
      const r = await Promise.all([
        adapter.get('kv', 'settings'), adapter.get('kv', 'moves'), adapter.get('kv', 'active'),
        adapter.getAll('equipment'), adapter.getAll('templates'), adapter.getAll('sessions'), adapter.getAll('pain')
      ]);
      return {
        settings: r[0], moves: r[1] || [], active: r[2] || null,
        equipment: strip(byPos(r[3])), templates: strip(byPos(r[4])), sessions: r[5], pain: r[6]
      };
    },

    saveSettings: function (s) { return enqueue(function () { return adapter.put('kv', 'settings', s); }); },
    saveMoves: function (m) { return enqueue(function () { return adapter.put('kv', 'moves', m); }); },
    saveActive: function (a) {
      return enqueue(function () { return a ? adapter.put('kv', 'active', a) : adapter.delete('kv', 'active'); });
    },
    saveEquipment: function (list) {
      return enqueue(function () { return adapter.replaceStore('equipment', withPos(list).map(function (x) { return [x.id, x]; })); });
    },
    saveTemplates: function (list) {
      return enqueue(function () { return adapter.replaceStore('templates', withPos(list).map(function (x) { return [x.id, x]; })); });
    },
    putSession: function (s) { return enqueue(function () { return adapter.put('sessions', s.id, s); }); },
    saveSessions: function (list) {
      return enqueue(function () { return adapter.replaceStore('sessions', list.map(function (x) { return [x.id, x]; })); });
    },
    savePain: function (list) {
      return enqueue(function () { return adapter.replaceStore('pain', list.map(function (x, i) { return [x.id || ('p' + i), x]; })); });
    },

    // Remplace tout (import, réinitialisation).
    replaceAll: function (state) {
      return enqueue(async function () {
        await adapter.put('kv', 'settings', state.settings);
        await adapter.put('kv', 'moves', state.moves || []);
        if (state.active) await adapter.put('kv', 'active', state.active); else await adapter.delete('kv', 'active');
        await adapter.replaceStore('equipment', withPos(state.equipment).map(function (x) { return [x.id, x]; }));
        await adapter.replaceStore('templates', withPos(state.templates).map(function (x) { return [x.id, x]; }));
        await adapter.replaceStore('sessions', state.sessions.map(function (x) { return [x.id, x]; }));
        await adapter.replaceStore('pain', state.pain.map(function (x, i) { return [x.id || ('p' + i), x]; }));
      });
    }
  };
}
