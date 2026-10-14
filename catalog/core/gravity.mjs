/**
 * 🍎 נופל (gravity) — בכל צעד המהירות גדלה באותה כמות, והמקום זז במהירות החדשה: מסלול ריבועי.
 * הליבה בלי עולם של: מטבעות נופלים, קונפטי, יו-יו. אותו צעד כמו בקוד: vy += g; y += vy. מקורות: origins.json.
 * טהור: הזמן = מספר-צעד (נוסחה סגורה של אותה לולאה — בלי הצטברות-שגיאה).
 * @param {{y: number, vy: number, g: number}} spec
 * @param {number} step
 * @returns {{y: number, vy: number}}
 */
export function gravity(spec, step) {
  const y = fin(spec?.y);
  const vy = fin(spec?.vy);
  const g = fin(spec?.g);
  const n = Math.min(1e6, Math.floor(Math.abs(fin(step))));
  return { y: y + n * vy + (g * n * (n + 1)) / 2, vy: vy + n * g };
}

function fin(x) { const v = Number(x); return Number.isFinite(v) ? v : 0; }
