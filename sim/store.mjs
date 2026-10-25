// הכרטיס בסימולטור = localStorage (במכשיר האמיתי: קובץ KUPA.JSON בכרטיס הזיכרון)
import { serializeCard, newDevice, pickCardText } from '../engine/kupa.mjs';

const KEY = 'kupa.card';
const TMP = 'kupa.card.tmp';
const SLOT = 'kupa.inserted';

// { card } או { error } — קובץ קיים שלא נקרא לעולם לא מוחלף בכרטיס ריק
export function loadCardResult() {
  try { return pickCardText(localStorage.getItem(KEY), localStorage.getItem(TMP)); } catch { return { error: 'אי אפשר לקרוא את הכרטיס' }; }
}

// מחזיר true/false — כשל שמירה חייב להיות גלוי (כרטיס מלא / פגום), לא להיבלע.
// סדר כמו במכשיר: TMP ⇒ הקובץ הראשי ⇒ מחיקת TMP
export function saveCard(card) {
  try {
    const t = serializeCard(card);
    localStorage.setItem(TMP, t);
    localStorage.setItem(KEY, t);
    localStorage.removeItem(TMP);
    return true;
  } catch { return false; }
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
  try { localStorage.setItem(DEV, JSON.stringify(d)); return true; } catch { return false; }
}

// הקבצים הפשוטים בכרטיס (במכשיר: קבצים אמיתיים בכרטיס; בסימולטור: מפה נתיב⇒טקסט)
const FILES = 'kupa.files';
export function loadFiles() {
  try { return JSON.parse(localStorage.getItem(FILES) || '{}'); } catch { return {}; }
}
export function saveFiles(files) {
  try { localStorage.setItem(FILES, JSON.stringify(files)); return true; } catch { return false; }
}
