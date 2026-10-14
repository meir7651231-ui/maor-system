import { random } from './random.mjs';

/**
 * 🎲 מגריל — נקודות: `count` נקודות במקומות "אקראיים" בריבוע 0..1 — אותו זרע ⇒ אותן נקודות בדיוק.
 * הליבה בלי עולם של אבק-הזהב בפרנס׳לע (src/components/parnasa/Ambient.tsx:63):
 *   `{ x: Math.random() * w, y: Math.random() * h, … }` — שתי הגרלות לכל חלקיק, אחת ל-x ואחת ל-y.
 * כאן: אותן שתי הגרלות, מליבת «מגריל» עם זרע (catalog/core/random.mjs) — בלי Math.random; w = h = 1 (מי שמצייר מכפיל בגודל).
 * הגרלה 2k ⇒ x של הנקודה k, הגרלה 2k+1 ⇒ y שלה — לבקש עוד נקודות לא משנה את הראשונות.
 * @param {{seed: number}} spec
 * @param {number} count
 * @returns {{x: number, y: number}[]}
 */
export function randomPoints(spec, count) {
  const n = Math.min(2500, Math.floor(Math.abs(Number(count) || 0)));
  const r = random(spec, 2 * n);
  const out = [];
  for (let k = 0; k < n; k++) out.push({ x: r[2 * k], y: r[2 * k + 1] });
  return out;
}
