import { decay } from './decay.mjs';

/**
 * 🏀 קופץ (bounce) — גוף שזז; אם בצעד הזה הוא עובר את הרצפה — הוא חוזר ממנה: המהירות מתהפכת ונחלשת לפי
 * מקדם-הקפיצה, והוא אף פעם לא נשאר מתחת לרצפה.
 * 🧩 נמצא כשילוב: שתי פעולות שכבר כתבנו, מחוברות.
 *   1. "מתקפל מהרצפה" — `lift = sin(phase*π).clamp(0,1)` (dots_loader של המחולל, :47): הגל לא יורד מתחת לרצפה,
 *      חצי-הגל התחתון מתקפל למעלה. כאן: מה שעבר את הרצפה חוזר מעליה באותו מרחק (`foldUp`).
 *   2. "דועך" — ליבת decay (catalog/core/decay.mjs): כל נדנוד חלש מהקודם — הפעמון של בנייה-חכמה
 *      (`@keyframes bellring`: 16° → −13° → 9° → −6° → 3° → 0, כל נדנוד הפוך וחלש ב-~×0.7), והחיכוך של
 *      אבק-הזהב בפרנס׳לע (Ambient.tsx:91, `*= 0.985`). כאן: המהירות שהתהפכה עוברת צעד-דעיכה אחד לעבר 0.
 * הערה מדויקת: ליבת decay מגבילה את מה-שנשאר ל-99% (דבר שדועך תמיד דועך); מקדם-קפיצה מעל 99% (כמעט-אלסטי)
 * לא עובר דרכה ומוכפל ישירות. כל שאר הטווח (0–99%) — דרך decay עצמה. חוקי "קופץ" רצים על הפונקציה הזו.
 * טהור: צעד אחד; הלולאה אצל הקורא (יחד עם "נופל" — gravity).
 * @param {{floor: number, bouncePct: number}} spec
 * @param {{pos: number, vel: number}} body
 * @returns {{pos: number, vel: number}}
 */
export function bounce(spec, body) {
  const floor = fin(spec?.floor);
  const pct = Math.min(100, Math.abs(fin(spec?.bouncePct)));
  const pos = Math.max(floor, fin(body?.pos));
  const vel = fin(body?.vel);
  const next = pos + vel;
  if (next >= floor) return { pos: next, vel };
  // פגיעה: מתקפל מהרצפה (1) ונחלש בצעד-דעיכה אחד (2) — גם המרחק שמעל הרצפה וגם המהירות
  return { pos: floor + weaken(foldUp(floor, next) - floor, pct), vel: weaken(-vel, pct) };
}

/** (1) "מתקפל מהרצפה": מה שמתחת לרצפה חוזר מעליה באותו מרחק — כמו sin(…).clamp שלא יורד מתחת לאפס. */
export function foldUp(floor, x) {
  return x < floor ? floor + (floor - x) : x;
}

/** (2) "דועך" צעד אחד לעבר 0, ונשאר `pct` אחוז — ליבת decay; מעל 99% (מחוץ לתחום של decay) — כפל ישיר. */
function weaken(v, pct) {
  if (pct > 99) return (v * pct) / 100;
  return decay({ from: v, floor: 0, keepPct: pct }, 1);
}

function fin(x) { const v = Number(x); return Number.isFinite(v) ? v : 0; }
