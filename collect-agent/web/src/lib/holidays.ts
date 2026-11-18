// התראת פקיעת לוח החגים המובנה (critic סבב 119 בשרת: send_window.holidays_until/holidays_expiring ב-/dashboard).
// אחרי התאריך האחרון בלוח השרת לא שולח כלום (fail-closed), ולכן מזהירים 120 יום מראש. טהור — נבדק ב-tests.
export interface SendWindow {
  open_now: boolean; closed_reason: string | null; next_allowed: string | null;
  /** התאריך האחרון בלוח החגים המובנה (ISO), או null */ holidays_until?: string | null;
  /** פחות מ-120 יום לפקיעה (מחושב בשרת) */ holidays_expiring?: boolean;
}
export type HolidayNotice = { level: 'expired' | 'expiring'; until: string; daysLeft: number };

const day = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));

/** null = אין מה להציג (אין נתון, או הלוח בתוקף ליותר מ-120 יום). today = «today» מהשרת (ISO). */
export function holidayNotice(sw: SendWindow | null | undefined, today: string): HolidayNotice | null {
  const until = sw?.holidays_until;
  if (!sw || !until || !/^\d{4}-\d{2}-\d{2}$/.test(until) || !/^\d{4}-\d{2}-\d{2}$/.test(today)) return null;
  const daysLeft = Math.round((day(until) - day(today)) / 86_400_000);
  if (daysLeft < 0) return { level: 'expired', until, daysLeft };
  // השרת הוא המקור (holidays_expiring); נפילה לחישוב מקומי רק אם שדה הדגל חסר בשרת ישן
  const expiring = sw.holidays_expiring ?? daysLeft < 120;
  return expiring ? { level: 'expiring', until, daysLeft } : null;
}
