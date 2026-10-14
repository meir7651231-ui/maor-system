/**
 * 🪐 מקיף (orbit) — נקודה שמסתובבת סביב מרכז: תמיד באותו מרחק, באותה מהירות, וחוזרת למקום אחרי מחזור.
 * הליבה בלי עולם של: כוכבי-התורמים בגלקסיה, היקום-3D שמסתובב, כדור-המוח בהרשמה, מחוג-הסריקה במעבדת-הטבעות. מקורות: origins.json.
 * טהור: הזמן = מספר-צעד.
 * @param {{cx: number, cy: number, radius: number, period: number}} spec
 * @param {number} step
 * @returns {{x: number, y: number}}
 */
export function orbit(spec, step) {
  const cx = fin(spec?.cx);
  const cy = fin(spec?.cy);
  const r = Math.abs(fin(spec?.radius));
  const period = Math.abs(fin(spec?.period)) || 1;
  const phase = (((fin(step) % period) + period) % period) / period;
  const a = 2 * Math.PI * phase;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function fin(x) { const v = Number(x); return Number.isFinite(v) ? v : 0; }
