/**
 * 🎲 מגריל (random) — רצף מספרים בין 0 ל-1 שנראה אקראי, אבל אותו זרע ⇒ אותו רצף בדיוק.
 * הליבה בלי עולם של: mulberry32 של המאמת (atoms/verify/gen.ts), הגרלות-הדמו, פיזור-הכוכבים בגלקסיה. מקורות: origins.json.
 * טהור: ה"מזל" נכנס כזרע — אין Math.random.
 * @param {{seed: number}} spec
 * @param {number} count
 * @returns {number[]}
 */
export function random(spec, count) {
  let a = (fin(spec?.seed) >>> 0) || 0x9e3779b9;
  const n = Math.min(5000, Math.floor(Math.abs(fin(count))));
  const out = [];
  for (let k = 0; k < n; k++) {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    out.push(((t ^ (t >>> 14)) >>> 0) / 4294967296);
  }
  return out;
}

function fin(x) { const v = Number(x); return Number.isFinite(v) ? Math.trunc(v) : 0; }
