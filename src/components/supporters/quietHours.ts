/**
 * מנוע "שעות-מנוחה" — האם עכשיו שעה נוחה להתקשר לתורם, **לפי קידומת-הטלפון שלו**
 * (תורם עם מספר חו״ל נמצא באזור-זמן אחר). טהור ודטרמיניסטי — השעה מוזרקת.
 *
 * העיקרון: יודעים את שעת-המכשיר המקומית (של הרכז) ואת היסט-ה-UTC שלו; לתורם
 * מחשבים את שעתו-המקומית = שעת-הרכז + (היסט-התורם − היסט-הרכז). מספר ישראלי/מקומי
 * ⇒ אותו אזור. "נוח" = 08:00–21:00 מקומית אצל התורם. אין קידומת מוכרת ⇒ מניחים מקומי.
 */

/** חלון-נוחות (שעות מקומיות אצל התורם). מחוץ לזה = "אנשים לא ערים / לא נעים". */
export const QUIET_FROM = 21; // מ-21:00
export const QUIET_TO = 8; // עד 08:00

/** קידומות בין-לאומיות נפוצות בקהילת-התורמים → היסט-UTC משוער (מתעלם מדקויות-שעון-קיץ). */
const PREFIX_TZ: { p: string; off: number; label: string }[] = [
  { p: '+972', off: 3, label: 'ישראל' },
  { p: '+1', off: -5, label: 'ארה״ב/קנדה' },
  { p: '+44', off: 0, label: 'בריטניה' },
  { p: '+33', off: 1, label: 'צרפת' },
  { p: '+32', off: 1, label: 'בלגיה' },
  { p: '+41', off: 1, label: 'שווייץ' },
  { p: '+61', off: 10, label: 'אוסטרליה' },
  { p: '+7', off: 3, label: 'רוסיה' },
  { p: '+380', off: 2, label: 'אוקראינה' },
];

export interface ContactWindow {
  /** האם עכשיו מחוץ לחלון-הנוחות אצל התורם. */
  quiet: boolean;
  /** שעת-התורם המקומית (0–23, מעוגלת). */
  localHour: number;
  /** תווית-אזור ('' = מקומי/לא-מזוהה). */
  region: string;
  /** האם המספר בין-לאומי (קידומת מוכרת שאינה ישראל). */
  intl: boolean;
}

/** מנרמל טלפון ל-E.164-ish: מחזיר קידומת בין-לאומית אם קיימת ('+..' / '00..'), אחרת ''. */
function intlPrefix(phone: string): string | null {
  const raw = (phone || '').replace(/[\s()\-.]/g, '');
  let s = raw;
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (!s.startsWith('+')) return null; // מקומי (05x / 0x) — אין קידומת בין-לאומית
  // התאמה לקידומת הארוכה-ביותר (‏+380 לפני +3).
  let best: string | null = null;
  for (const e of PREFIX_TZ) if (s.startsWith(e.p) && (!best || e.p.length > best.length)) best = e.p;
  return best;
}

/**
 * חלון-הקשר לתורם. `nowHour`/`nowMin` = שעת-הרכז המקומית; `orgUtcOffset` = היסט-ה-UTC
 * של הרכז (למשל ‎-new Date().getTimezoneOffset()/60‎). מספר-ישראלי/מקומי ⇒ אותו אזור.
 */
export function contactWindow(phone: string, nowHour: number, orgUtcOffset: number): ContactWindow {
  const p = intlPrefix(phone);
  const entry = p ? PREFIX_TZ.find((e) => e.p === p) : null;
  // ישראל/מקומי: אין הסטה. חו״ל מוכר: הסטה מול הרכז.
  const intl = !!entry && entry.p !== '+972';
  const shift = entry && intl ? entry.off - orgUtcOffset : 0;
  let local = (nowHour + shift) % 24;
  if (local < 0) local += 24;
  const localHour = Math.floor(local);
  const quiet = localHour >= QUIET_FROM || localHour < QUIET_TO;
  return { quiet, localHour, region: intl && entry ? entry.label : '', intl };
}

/** האם עכשיו שעת-מנוחה מקומית אצל הרכז עצמו (לבאנר-הכללי). */
export function localQuiet(nowHour: number): boolean {
  return nowHour >= QUIET_FROM || nowHour < QUIET_TO;
}
