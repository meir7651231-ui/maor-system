/**
 * 🔌 המרכזייה — החוזה (BUILD-ORDER-SWITCHBOARD-2026-10-13): איך כלי אחד שואל כלי אחר.
 *
 * "יכולת" = שירות **קריאה-בלבד** שכלי מציע לכלים אחרים: מזהה יציב (`<כלי>.<פועל>`), תווית עברית, קלט ופלט
 * מטופסים, ו-`run(ctx, input)` טהור. ההקשר מוזרק — `ctx = { db, config, nowMs }` — ולכן אין ביכולת Date.now,
 * store או DOM: אותו קלט ⇒ אותו פלט, נבדק-ביחידה. יכולת יכולה גם לומר מה היא תורמת ל"תקציר-היום" (`today`).
 *
 * הקובץ הזה קל במכוון (טיפוסים + עוזר-הגדרה + שעון-הארגון): הוא מיובא גם מקבצי-הספקים וגם מהרישום, ושום דבר כבד
 * לא נגרר דרכו. בידוד: אין כאן — ולא יהיה — כסף, קבלות, לוח-ראשי או חדרי-חוגים.
 */
import type { Db } from '../../types/domain';
import type { OrgConfig } from '../../types/config';

/** ההקשר שכל יכולת מקבלת — הכול מוזרק. */
export interface SwitchCtx {
  readonly db: Db;
  readonly config: OrgConfig;
  /** הרגע (epoch ms). */
  readonly nowMs: number;
}

/** יכולת: פונקציה טהורה מקלט לפלט, ובאופציה — השורות שהיא מוסיפה לתקציר-היום. */
export interface Ability<I, O> {
  run(ctx: SwitchCtx, input: I): O;
  /** תקציר-היום: הקלט הקבוע שבו שואלים אותה בבוקר, ומנסח-השורות מהפלט (ריק ⇒ אין מה לומר היום). */
  today?: { readonly input: I; lines(out: O, ctx: SwitchCtx): readonly string[] };
}

/** עוזר-הגדרה לקובצי-הספקים (`ability<In, Out>({ run, today })`) — הסקת-טיפוסים בלבד; זהות בזמן-ריצה. */
export function ability<I, O>(a: Ability<I, O>): Ability<I, O> {
  return a;
}

/** קלט ריק (יכולת בלי פרמטרים). */
export type NoInput = Readonly<Record<string, never>>;

/** למה יכולת לא ענתה: מזהה זר · הכלי (או תת-הדגל) כבוי · הספק עוד נטען · טעינה/ריצה נכשלו. */
export type UnavailableReason = 'unknown' | 'off' | 'loading' | 'error';

export interface Unavailable {
  readonly ok: false;
  readonly unavailable: true;
  readonly id: string;
  readonly reason: UnavailableReason;
  /** הסבר קצר בעברית (לתצוגה/יומן — לא לקבלת-החלטות; החלטות לפי reason). */
  readonly message: string;
}

export interface Answer<O> {
  readonly ok: true;
  readonly id: string;
  /** מודול-הספק. */
  readonly module: string;
  /** התווית העברית מהרישום (למשל לנוסח-תפריט בקו). */
  readonly label: string;
  readonly value: O;
}

/** תשובת `ask` — תמיד מטופסת, לעולם לא חריגה. */
export type AskResult<O> = Answer<O> | Unavailable;

/** שורה בתקציר-היום — הטקסט ומי אמר אותו. */
export interface SummaryLine {
  readonly ability: string;
  readonly module: string;
  readonly text: string;
}

/* ═══════════════ שעון-הארגון (לכלים שאין להם מיקום משלהם) ═══════════════ */

/** אזור-הזמן של הארגון לכלים בלי הגדרת-מיקום (אירוח): ישראל — לא שעון-המכשיר. */
export const ORG_TZ = 'Asia/Jerusalem';

const isoFmts = new Map<string, Intl.DateTimeFormat>();

/** תאריך ISO (YYYY-MM-DD) של רגע באזור-זמן — Intl (שעון-קיץ נכון); רגע/אזור פגומים ⇒ epoch 0 / ישראל. */
export function isoAt(ms: number, tz: string = ORG_TZ): string {
  let f = isoFmts.get(tz);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return isoAt(ms, ORG_TZ);
    }
    isoFmts.set(tz, f);
  }
  const parts = f.formatToParts(Number.isFinite(ms) ? ms : 0);
  const get = (t: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === t)?.value ?? '';
  return get('year') + '-' + get('month') + '-' + get('day');
}
