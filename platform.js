// Fonctions liées au navigateur. Chacune échoue silencieusement si l'API n'existe pas.
let audio = null;
let wake = null;

export function initAudio() {
  try {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (AC && !audio) audio = new AC();
    if (audio && audio.resume) audio.resume();
  } catch (e) { audio = null; }
}

export function beep() {
  if (!audio) return;
  try {
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.frequency.value = 880;
    g.gain.value = 0.15;
    o.connect(g);
    g.connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 0.18);
  } catch (e) { /* son indisponible */ }
}

export function buzz(pattern) {
  try { if (globalThis.navigator && navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* vibration indisponible */ }
}

export function acquireWake() {
  try {
    if (globalThis.navigator && navigator.wakeLock && !wake) {
      navigator.wakeLock.request('screen').then(function (w) { wake = w; }).catch(function () {});
    }
  } catch (e) { /* écran allumé indisponible */ }
}

export function releaseWake() {
  try { if (wake && wake.release) wake.release(); } catch (e) { /* rien */ }
  wake = null;
}

export function hasWake() { return !!wake; }

export function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
}

export async function storagePersisted() {
  try { return !!(navigator.storage && navigator.storage.persisted && await navigator.storage.persisted()); } catch (e) { return false; }
}

export async function requestPersist() {
  try { return !!(navigator.storage && navigator.storage.persist && await navigator.storage.persist()); } catch (e) { return false; }
}
