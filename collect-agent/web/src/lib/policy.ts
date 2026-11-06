// מראה של app/policy.py — מתי מותר לשלוח. טהור; הזמן מוזרק.
// א׳–ה׳ 08:00–20:00 · ו׳ 08:00–12:00 · שבת/חג — לא שולחים (הכרעת מאיר 6.11; לוח החגים המלא בשרת).
// ⚖️ אין בחוק התקשורת שעות-שליחה מפורשות לתזכורת שאינה פרסומת — זו מדיניות שמרנית של המוצר (מניעת הטרדה).
type Win = [number, number] | null; // דקות מחצות
const W: Win[] = [[480, 1200], [480, 1200], [480, 1200], [480, 1200], [480, 1200], [480, 720], null]; // getDay(): 0=ראשון

export function canSendAt(d: Date, holidays: ReadonlySet<string> = new Set()): boolean {
  const iso = isoLocal(d);
  const w = W[d.getDay()];
  const m = d.getHours() * 60 + d.getMinutes();
  return !holidays.has(iso) && !!w && m >= w[0] && m < w[1];
}
export function nextAllowed(from: Date, holidays: ReadonlySet<string> = new Set()): Date {
  const d = new Date(from);
  for (let i = 0; i < 24 * 14; i++) {
    if (canSendAt(d, holidays)) return d;
    const w = W[d.getDay()];
    const m = d.getHours() * 60 + d.getMinutes();
    if (w && m < w[0] && !holidays.has(isoLocal(d))) { d.setHours(8, 0, 0, 0); continue; }
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
