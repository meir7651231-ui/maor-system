// מראה של app/policy.py — מתי מותר לשלוח. טהור; הזמן מוזרק.
// הכרעת מאיר 6.11: 08:00–20:00 · שישי וערב חג 08:00–12:00 (בלי אחה"צ) · שבת/חג — לא שולחים.
// לוח החגים = מראה של app/policy.py HOLIDAYS + QUIET_DAYS (נבדק אות-באות ב-tests/lib.check.ts).
// ⚖️ אין בחוק התקשורת שעות-שליחה מפורשות לתזכורת שאינה פרסומת — זו מדיניות שמרנית של המוצר (מניעת הטרדה).
type Win = [number, number] | null; // דקות מחצות
const DAY: Win = [480, 1200], SHORT: Win = [480, 720];
const W: Win[] = [DAY, DAY, DAY, DAY, DAY, SHORT, null]; // getDay(): 0=ראשון
export const HOLIDAYS: ReadonlySet<string> = new Set([
  '2026-09-12', '2026-09-13', '2026-09-21', '2026-09-26', '2026-10-03', '2027-04-22', '2027-04-28', '2027-06-11', '2027-10-02', '2027-10-03', '2027-10-11', '2027-10-16', '2027-10-23', '2028-04-11', '2028-04-17', '2028-05-31', '2028-09-21', '2028-09-22', '2028-09-30', '2028-10-05', '2028-10-12', '2029-03-31', '2029-04-06', '2029-05-20',
  // ימי שקט (QUIET_DAYS): יום השואה · יום הזיכרון · תשעה באב
  '2027-05-04', '2027-05-11', '2027-08-12', '2028-04-24', '2028-05-01', '2028-08-01', '2029-04-12', '2029-04-18', '2029-07-22',
]);
const isHol = (iso: string, extra: ReadonlySet<string>) => HOLIDAYS.has(iso) || extra.has(iso);
function windowOf(d: Date, extra: ReadonlySet<string>): Win {
  if (isHol(isoLocal(d), extra)) return null;
  const next = new Date(d); next.setDate(d.getDate() + 1);
  const w = W[d.getDay()];
  return w && isHol(isoLocal(next), extra) ? SHORT : w; // ערב חג = כמו שישי
}

export function canSendAt(d: Date, holidays: ReadonlySet<string> = new Set()): boolean {
  const w = windowOf(d, holidays);
  const m = d.getHours() * 60 + d.getMinutes();
  return !!w && m >= w[0] && m < w[1];
}
export function nextAllowed(from: Date, holidays: ReadonlySet<string> = new Set()): Date {
  const d = new Date(from);
  for (let i = 0; i < 24 * 14; i++) {
    if (canSendAt(d, holidays)) return d;
    const w = windowOf(d, holidays);
    const m = d.getHours() * 60 + d.getMinutes();
    if (w && m < w[0]) { d.setHours(8, 0, 0, 0); continue; }
    d.setDate(d.getDate() + 1); d.setHours(0, 0, 0, 0);
  }
  throw new Error('אין חלון שליחה בשבועיים הקרובים');
}
const isoLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** תאריך-שעה מהשרת (ISO עם אזור) ⇒ "יום ראשון 10:00" לפי שעון ישראל, בלי תלות באזור הדפדפן. */
export function fmtWhenIL(iso: string): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date(iso)).map(p => [p.type, p.value]));
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  return `יום ${DAYS[wd]} ${parts.hour}:${parts.minute}`;
}
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
export const fmtWhen = (d: Date) => `יום ${DAYS[d.getDay()]} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
