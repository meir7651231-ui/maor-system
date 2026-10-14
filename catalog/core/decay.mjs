/**
 * 🍂 דועך (decay) — ערך שמתקרב לרצפה בכל צעד, עד שהוא נוגע בה בדיוק ונשאר שם.
 * הליבה בלי עולם של: חיכוך-מטבעות שנופלים, דהיית-קונפטי, ריסון-סיבוב בגלקסיה, גל שנחלש. מקורות: origins.json.
 * טהור ודטרמיניסטי: הזמן = מספר-צעד, בלי שעון.
 */

/**
 * הערך אחרי `step` צעדים: בכל צעד נשאר `keepPct` אחוז מהמרחק לרצפה (v = floor + (v − floor)·keep).
 * כשהמרחק קטן מאוד (מיליונית מהמרחק ההתחלתי) — הערך נצמד לרצפה, כמו "אם alpha < 0.01 — הסר".
 * @param {{from: number, floor: number, keepPct: number}} spec
 * @param {number} step
 * @returns {number}
 */
export function decay(spec, step) {
  const from = fin(spec?.from);
  const floor = fin(spec?.floor);
  const keep = Math.min(99, Math.abs(fin(spec?.keepPct))) / 100;
  const n = Math.min(100000, Math.floor(Math.abs(fin(step))));
  const snap = 1e-6 * Math.max(1e-6, Math.abs(from - floor));
  let v = from;
  for (let k = 0; k < n && v !== floor; k++) {
    v = floor + (v - floor) * keep;
    if (Math.abs(v - floor) <= snap) v = floor;
  }
  return v;
}

function fin(x) { const v = Number(x); return Number.isFinite(v) ? v : 0; }
