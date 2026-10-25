// הכרטיס בסימולטור = localStorage (במכשיר האמיתי: קובץ KUPA.JSON בכרטיס הזיכרון)
import { emptyCard, parseCard, serializeCard } from '../engine/kupa.mjs';

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
