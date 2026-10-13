/**
 * 📅 לוח-השנה — ספק המרכזייה (ENGINEBOX-SOCKETS 13.10): מנוע מליבת-אורביט שכלים אחרים יכולים לחבר אליו.
 *
 *   · calendar.dayInfo — "מה היום הזה בלוח העברי": התאריך העברי (מלא · יום-וחודש · חודש · שנה), שם-החג/המועד (או null),
 *     שבת? · יום-טוב? · "סגור" (שבת או יו״ט — אותו דין של hosting.sacredDayOf/calLib.blockReason, בלי צום ט׳ באב).
 * מנוע-האמת הקיים בלבד: `hebParts`/`holidayOf` (lib/hebrew — כולל דין-נדחה של הצומות), `monthHeOf` (lib/hebdate — אדר א׳/ב׳
 * בשנה מעוברת), `FULL_HOLIDAYS` (calLib). אפס חשבון-תאריכים חדש.
 * הכרעות: (1) מנהג ארץ-ישראל — יום-טוב אחד (בלי יו״ט שני של גלויות), כמו כל הלוח של אורביט. (2) התאריך העברי **אזרחי**
 * (חצות-לחצות) — לא מתחלף בשקיעה; כמו בכל המערכת. (3) חול-המועד וצומות אינם "יום-טוב".
 * טהור: בלי Date.now/store/DOM; "היום" (כשאין iso) = ctx.nowMs בשעון-הארגון. לא קורא דבר מה-db (reads ריק ברישום).
 * תאריך פגום (לא-מחרוזת · "2026-02-31" · "abc") ⇒ valid:false עם שדות ריקים — לעולם לא זורק.
 * בידוד: קריאה-בלבד; אין כאן כתיבה ללוח-הראשי, כסף, קבלות או חדרים. נטען בעצלות דרך מסך-הלוח (export * as calendarProvider).
 */
import { ability, isoAt, type SwitchCtx } from '../../lib/switchboard/contract';
import { gem, gemYear, hebParts, holidayOf } from '../../lib/hebrew';
import { monthHeOf } from '../../lib/hebdate';
import { FULL_HOLIDAYS } from './calLib';

export interface DayInfoInput {
  /** תאריך ISO (YYYY-MM-DD) — חסר ⇒ היום בשעון-הארגון (ctx.nowMs). */
  readonly iso?: string;
}

export interface DayInfoOutput {
  /** התאריך שנבדק ('' כשפגום). */
  readonly iso: string;
  /** false ⇒ התאריך פגום וכל השדות ריקים. */
  readonly valid: boolean;
  /** "ה׳ חשוון תשפ״ז". */
  readonly hebDate: string;
  /** "ה׳ חשוון" — בלי השנה (להקראה/לכרטיס). */
  readonly hebDayMonth: string;
  /** "ה׳". */
  readonly hebDay: string;
  /** "חשוון" · "אדר א׳" · "אדר ב׳". */
  readonly hebMonth: string;
  /** "תשפ״ז". */
  readonly hebYear: string;
  /** שם-החג/המועד מהלוח ("חנוכה" · "יום כיפור" · "צום גדליה (נדחה)") — או null. */
  readonly holiday: string | null;
  /** "ראשון" … "שבת". */
  readonly dayName: string;
  readonly isShabbat: boolean;
  /** יום-טוב (מנהג ארץ-ישראל): ר״ה א׳-ב׳ · יוה״כ · סוכות · שמחת תורה · פסח · שביעי של פסח · שבועות. */
  readonly isYomTov: boolean;
  /** שבת או יום-טוב — "סגור" (לא צ׳ק-אין, לא שיחות). */
  readonly closed: boolean;
}

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'] as const;

/** ימים-טובים = החגים-המלאים של הלוח, בלי צום ט׳ באב (צום — לא יו״ט; כמו hosting.sacredDayOf). */
export const YOM_TOV: readonly string[] = FULL_HOLIDAYS.filter((h) => h !== 'תשעה באב');

const EMPTY: DayInfoOutput = {
  iso: '',
  valid: false,
  hebDate: '',
  hebDayMonth: '',
  hebDay: '',
  hebMonth: '',
  hebYear: '',
  holiday: null,
  dayName: '',
  isShabbat: false,
  isYomTov: false,
  closed: false,
};

/** "YYYY-MM-DD" אמיתי (גם "2026-02-31" נדחה — סבב-הלוך-חזור של התאריך). */
function parseIso(v: unknown): { y: number; m: number; d: number } | null {
  if (typeof v !== 'string') return null;
  const mt = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!mt) return null;
  const y = +mt[1];
  const m = +mt[2];
  const d = +mt[3];
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
  return { y, m, d };
}

/** היום בלוח העברי — טהור; תאריך פגום ⇒ EMPTY (valid:false). */
export function dayInfoOf(iso: unknown): DayInfoOutput {
  const p = parseIso(iso);
  if (!p) return EMPTY;
  // צהריים מקומי — כמו hebDateFull/isoToHebParts (חסין לאזור-זמן ולשעון-קיץ)
  const local = new Date(p.y, p.m - 1, p.d, 12);
  const hp = hebParts(local);
  const hebMonth = monthHeOf(hp.month);
  if (!hp.day || !hp.year || !hebMonth) return EMPTY;
  const dow = new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
  const holiday = holidayOf(local);
  const isShabbat = dow === 6;
  const isYomTov = holiday !== null && YOM_TOV.includes(holiday);
  const hebDay = gem(hp.day);
  const hebYear = gemYear(hp.year);
  return {
    iso: iso as string,
    valid: true,
    hebDate: hebDay + ' ' + hebMonth + ' ' + hebYear,
    hebDayMonth: hebDay + ' ' + hebMonth,
    hebDay,
    hebMonth,
    hebYear,
    holiday,
    dayName: DAY_NAMES[dow] ?? '',
    isShabbat,
    isYomTov,
    closed: isShabbat || isYomTov,
  };
}

function dayInfo(ctx: SwitchCtx, input: DayInfoInput): DayInfoOutput {
  const raw: unknown = input?.iso;
  return dayInfoOf(raw === undefined ? isoAt(ctx.nowMs) : raw);
}

/* ═══════════════ היכולות ═══════════════ */

export const abilities = {
  'calendar.dayInfo': ability<DayInfoInput, DayInfoOutput>({ run: dayInfo }),
};
