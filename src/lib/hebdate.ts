/**
 * שכבת קלט תאריך עברי — המרות עברי↔לועזי דרך Intl בלבד (ללא תלות חיצונית).
 *
 * עיקרון הליבה: כל המערכת שומרת ISO לועזי (YYYY-MM-DD) בלבד — שירותים חיצוניים
 * צריכים לועזי. העברי הוא שכבת קלט ותצוגה בלבד (ראו HebDateInput).
 *
 * ההמרה עברי→לועזי נעשית בסריקה: מעריכים עוגן לועזי (שנה עברית − 3761 ≈ השנה
 * הלועזית שבה השנה מסתיימת; מתחילים ב-1 באוגוסט של השנה הקודמת — תמיד לפני
 * ראש השנה) וסורקים ~440 ימים עד שחלקי התאריך העברי של היום הנבדק תואמים.
 */
import { hebParts } from './hebrew';

/** מיפוי שם חודש של Intl (אנגלית, לוח 'hebrew') → תווית עברית לתצוגה. */
const MONTHS: readonly (readonly [en: string, he: string])[] = [
  ['Tishri', 'תשרי'],
  ['Heshvan', 'חשוון'],
  ['Kislev', 'כסלו'],
  ['Tevet', 'טבת'],
  ['Shevat', 'שבט'],
  ['Adar', 'אדר'],
  ['Adar I', 'אדר א׳'],
  ['Adar II', 'אדר ב׳'],
  ['Nisan', 'ניסן'],
  ['Iyar', 'אייר'],
  ['Sivan', 'סיוון'],
  ['Tamuz', 'תמוז'],
  ['Av', 'אב'],
  ['Elul', 'אלול'],
];

/** סדר החודשים בשנה פשוטה (12) ובשנה מעוברת (13) — שמות Intl. */
const ORDER_COMMON: readonly string[] = [
  'Tishri', 'Heshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar',
  'Nisan', 'Iyar', 'Sivan', 'Tamuz', 'Av', 'Elul',
];
const ORDER_LEAP: readonly string[] = [
  'Tishri', 'Heshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar I', 'Adar II',
  'Nisan', 'Iyar', 'Sivan', 'Tamuz', 'Av', 'Elul',
];

/** תווית עברית של חודש לפי שם Intl ('Av' → 'אב'), או '' אם לא מוכר. */
export function monthHeOf(en: string): string {
  return MONTHS.find((m) => m[0] === en)?.[1] ?? '';
}

/** שם Intl של חודש לפי תווית עברית ('אב' → 'Av'), או null אם לא מוכר. */
export function monthEnOf(he: string): string | null {
  return MONTHS.find((m) => m[1] === he)?.[0] ?? null;
}

/** השנה העברית הנוכחית (למשל 5786). */
export function hebYearNow(): number {
  return hebParts(new Date()).year;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function isoOf(d: Date): string {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

/** המרה עברי→לועזי כששם החודש כבר בשם Intl (סריקת ~440 ימים מהעוגן). */
function hebToIsoEn(day: number, monthEn: string, hebYear: number): string | null {
  if (!Number.isInteger(day) || day < 1 || day > 30) return null;
  if (!Number.isInteger(hebYear) || hebYear < 4000 || hebYear > 7000) return null;
  const gy = hebYear - 3761; // 1 באוגוסט של השנה הזו קודם תמיד לא׳ תשרי של hebYear
  for (let i = 0; i < 440; i++) {
    const d = new Date(gy, 7, 1 + i, 12); // צהריים — חסין להיסטי שעון קיץ
    const p = hebParts(d);
    if (p.year === hebYear && p.month === monthEn && p.day === day) return isoOf(d);
  }
  return null; // התאריך לא קיים בשנה זו (למשל ל׳ חשוון בשנה חסרה/כסדרה)
}

/** האם שנה עברית מעוברת — בדיקה מול Intl (האם קיים בה 'Adar I'), עם cache. */
const leapCache = new Map<number, boolean>();
export function isHebLeapYear(hebYear: number): boolean {
  const hit = leapCache.get(hebYear);
  if (hit !== undefined) return hit;
  const leap = hebToIsoEn(1, 'Adar I', hebYear) !== null;
  leapCache.set(hebYear, leap);
  return leap;
}

/**
 * שמות החודשים של שנה עברית נתונה, לפי הסדר, בתוויות עבריות.
 * שנה פשוטה: 12 חודשים עם 'אדר'; שנה מעוברת: 13 עם 'אדר א׳' ו'אדר ב׳'.
 */
export function hebMonthsOf(hebYear: number): string[] {
  const order = isHebLeapYear(hebYear) ? ORDER_LEAP : ORDER_COMMON;
  return order.map(monthHeOf);
}

/**
 * עברי→לועזי: 'כ״ג' (23) + 'אב' + 5786 → '2026-08-06'.
 * מחזירה null אם הצירוף לא קיים בשנה זו (יום 30 בחודש חסר, אדר א׳ בשנה פשוטה…).
 */
export function hebToIso(day: number, monthHe: string, hebYear: number): string | null {
  const en = monthEnOf(monthHe);
  if (!en) return null;
  return hebToIsoEn(day, en, hebYear);
}

/** לועזי→עברי: '2026-08-06' → { day: 23, monthHe: 'אב', year: 5786 }. */
export function isoToHebParts(iso: string): { day: number; monthHe: string; year: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(iso + 'T12:00:00');
  if (isNaN(d.getTime())) return null;
  const p = hebParts(d);
  const monthHe = monthHeOf(p.month);
  if (!monthHe || !p.day || !p.year) return null;
  return { day: p.day, monthHe, year: p.year };
}
