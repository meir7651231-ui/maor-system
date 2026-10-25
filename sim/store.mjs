// הכרטיס בסימולטור = localStorage (במכשיר האמיתי: קובץ KUPA.JSON בכרטיס הזיכרון)
import { emptyCard, parseCard, serializeCard, newDevice } from '../engine/kupa.mjs';

const KEY = 'kupa.card';
const SLOT = 'kupa.inserted';

export function loadCard() {
  try {
    const t = localStorage.getItem(KEY);
    if (t) { const r = parseCard(t); if (r.card) return r.card; }
  } catch { /* אחסון חסום ⇒ כרטיס ריק */ }
  return emptyCard();
}

export function saveCard(card) {
  try { localStorage.setItem(KEY, serializeCard(card)); } catch { /* ignore */ }
}

export function cardInserted() {
  try { return localStorage.getItem(SLOT) !== '0'; } catch { return true; }
}

export function setInserted(v) {
  try { localStorage.setItem(SLOT, v ? '1' : '0'); } catch { /* ignore */ }
}

export function downloadCard(card) {
  const blob = new Blob([serializeCard(card)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'KUPA.JSON';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// זיכרון פנימי של הקופה (במכשיר: זיכרון פלאש פנימי, לא הכרטיס). נוצר פעם אחת.
const DEV = 'kupa.device';
export function loadDevice() {
  try {
    const t = localStorage.getItem(DEV);
    if (t) return JSON.parse(t);
  } catch { /* ignore */ }
  const rnd = new Uint8Array(32);
  crypto.getRandomValues(rnd);
  const key = Array.from(rnd, (b) => b.toString(16).padStart(2, '0')).join('');
  const idb = new Uint8Array(3);
  crypto.getRandomValues(idb); // מזהה נפרד מהמפתח — לא חושף ממנו דבר
  const id = 'KUPA-' + Array.from(idb, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  const d = newDevice(id, key);
  saveDevice(d);
  return d;
}
export function saveDevice(d) {
  try { localStorage.setItem(DEV, JSON.stringify(d)); } catch { /* ignore */ }
}

// הקבצים הפשוטים בכרטיס (במכשיר: קבצים אמיתיים בכרטיס; בסימולטור: מפה נתיב⇒טקסט)
const FILES = 'kupa.files';
export function loadFiles() {
  try { return JSON.parse(localStorage.getItem(FILES) || '{}'); } catch { return {}; }
}
export function saveFiles(files) {
  try { localStorage.setItem(FILES, JSON.stringify(files)); } catch { /* ignore */ }
}
