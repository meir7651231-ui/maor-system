/**
 * 🏀 קופץ (bounce) — גוף שזז; אם בצעד הזה הוא עובר את הרצפה — הוא חוזר ממנה: המהירות מתהפכת ונחלשת לפי
 * מקדם-הקפיצה, והוא אף פעם לא נשאר מתחת לרצפה.
 * 🔴 נבנה-חדש (origin: built-new): באף אחד מ-9 הפרויקטים אין מהירות שמתהפכת בפגיעה בקיר. הקרובים ביותר (origins.json):
 * "קפיצה" מדומה ב-sin (dots_loader של המחולל), עקומות-קפיץ easeOutBack, וגלישה-מסביב במקום קפיצה (Ambient של פרנס׳לע).
 * טהור: צעד אחד; הלולאה אצל הקורא (יחד עם "נופל" — gravity).
 * @param {{floor: number, bouncePct: number}} spec
 * @param {{pos: number, vel: number}} body
 * @returns {{pos: number, vel: number}}
 */
export function bounce(spec, body) {
  const floor = fin(spec?.floor);
  const e = Math.min(100, Math.abs(fin(spec?.bouncePct))) / 100;
  const pos = Math.max(floor, fin(body?.pos));
  const vel = fin(body?.vel);
  const next = pos + vel;
  if (next < floor) return { pos: floor + (floor - next) * e, vel: -vel * e };
  return { pos: next, vel };
}

function fin(x) { const v = Number(x); return Number.isFinite(v) ? v : 0; }
