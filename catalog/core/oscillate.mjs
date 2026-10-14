/**
 * 🌊 מתנדנד (oscillate) — עולה ויורד סביב מרכז, באותו קצב, ולא חורג מהמשרעת.
 * הליבה בלי עולם של: נשימת-כפתור, הבהוב, נדנוד-כוכבים בגלקסיה, צליל של מתנד. מקורות: origins.json.
 * טהור: הזמן = מספר-צעד.
 * @param {{center: number, amplitude: number, period: number}} spec
 * @param {number} step
 * @returns {number}
 */
export function oscillate(spec, step) {
  const center = fin(spec?.center);
  const amp = fin(spec?.amplitude);
  const period = Math.abs(fin(spec?.period)) || 1;
  const phase = (((fin(step) % period) + period) % period) / period; // 0..1 — הזמן בתוך המחזור (מדויק גם בצעדים גדולים)
  return center + amp * Math.sin(2 * Math.PI * phase);
}

function fin(x) { const v = Number(x); return Number.isFinite(v) ? v : 0; }
