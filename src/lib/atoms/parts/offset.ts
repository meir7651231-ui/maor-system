/**
 * ⏱️ חלק `offset` — זמן יחסי (פורק ממנוע הזמנים, חלק 9 עם חלק 6: "10 דקות לפני השקיעה").
 * לא יודע ביחס למה: כל עוגן עם שם. טהור, לא זורק. הזמנים בדקות.
 */

/** הזזת כל הרגעים ב-`minutes` (שלילי = לפני). פגומים מדולגים. */
export function offsetAll(times: readonly number[], minutes: number): number[] {
  if (!Array.isArray(times)) return [];
  const d = typeof minutes === 'number' && Number.isFinite(minutes) ? minutes : 0;
  const out: number[] = [];
  for (const t of times) if (typeof t === 'number' && Number.isFinite(t)) out.push(t + d);
  return out;
}

/** "H:MM"/"HH:MM" ⇒ דקות-מחצות (24:00 = 1440); לא-תקין ⇒ null. */
export function hhmmToMinutes(t: unknown): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t ?? '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (mi > 59 || h > 24 || (h === 24 && mi !== 0)) return null;
  return h * 60 + mi;
}

/** עוגן: דקות, או "HH:MM", או חסר (null/'' — אין לו ערך היום, למשל קוטב). */
export type Anchor = number | string | null | undefined;

const anchorMin = (a: Anchor): number | null =>
  typeof a === 'number' ? (Number.isFinite(a) ? a : null) : typeof a === 'string' ? hhmmToMinutes(a) : null;

/**
 * טוקן יחסי ⇒ דקות: "HH:MM" קבוע (עד 23:59) · "<שם>" · "<שם>±N" (עד 3 ספרות) — השם הוא מפתח ב-`anchors`
 * (אותיות לטיניות או עבריות, בלי תלות ברישיות). הכללה של resolveTimeToken (sh/tz/nz) לכל עוגן.
 * טוקן לא-תקין, שם לא-מוכר או עוגן חסר ⇒ null. התוצאה לא מנורמלת ליממה (זה תפקיד התצוגה).
 */
export function resolveRelative(token: unknown, anchors: Readonly<Record<string, Anchor>>): number | null {
  const s = String(token ?? '').trim();
  const fixed = hhmmToMinutes(s);
  if (fixed !== null) return fixed < 1440 ? fixed : null;
  const m = /^([a-zא-ת_]+)\s*([+-]\s*\d{1,3})?$/i.exec(s);
  if (!m || !anchors || typeof anchors !== 'object') return null;
  const own = (k: string): boolean => Object.prototype.hasOwnProperty.call(anchors, k);
  const key = own(m[1].toLowerCase()) ? m[1].toLowerCase() : own(m[1]) ? m[1] : null;
  if (key === null) return null;
  const base = anchorMin(anchors[key]);
  if (base === null) return null;
  return base + (m[2] ? Number(m[2].replace(/\s/g, '')) : 0);
}
