/**
 * לוח עברי — גימטריה, המרות תאריכים וחגים.
 * מבוסס על Intl.DateTimeFormat עם לוח 'hebrew' (ללא תלות חיצונית).
 */

const fmtHM = new Intl.DateTimeFormat('he-u-ca-hebrew', { month: 'long' });
const fmtHY = new Intl.DateTimeFormat('he-u-ca-hebrew', { year: 'numeric' });
const fmtParts = new Intl.DateTimeFormat('en-u-ca-hebrew', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** גימטריה: 15→ט״ו, 5786→תשפ״ו. */
export function gem(n: number): string {
  n = +n;
  if (!n) return '';
  const U = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  const T = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const H = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
  let s = H[Math.floor(n / 100)] || '';
  const r = n % 100;
  if (r === 15) s += 'טו';
  else if (r === 16) s += 'טז';
  else s += T[Math.floor(r / 10)] + U[r % 10];
  return s.length === 1 ? s + '׳' : s.slice(0, -1) + '״' + s.slice(-1);
}

export function gemYear(y: number | string): string {
  return gem(+y % 1000);
}

export interface HebParts {
  day: number;
  month: string;
  year: number;
}

/** מפרק תאריך לועזי לחלקי התאריך העברי (חודש בשם אנגלי — 'Tishri', 'Adar II'…). */
export function hebParts(d: Date): HebParts {
  const parts = fmtParts.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { day: +get('day'), month: get('month'), year: +get('year') };
}

/** "ט״ו אלול תשפ״ו" מתוך תאריך ISO. */
export function hebDateFull(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${gem(hebParts(d).day)} ${fmtHM.format(d)} ${gemYear(fmtHY.format(d))}`;
}

/** חגים ומועדים לפי 'חודש-אנגלי יום'. */
export const HOLIDAYS: Record<string, string> = {
  'Tishri 1': 'ראש השנה',
  'Tishri 2': 'ראש השנה ב׳',
  'Tishri 10': 'יום כיפור',
  'Tishri 15': 'סוכות',
  'Tishri 21': 'הושענא רבה',
  'Tishri 22': 'שמחת תורה',
  'Kislev 25': 'חנוכה',
  'Tevet 10': 'צום עשרה בטבת',
  'Shevat 15': 'ט״ו בשבט',
  'Adar 14': 'פורים',
  'Adar II 14': 'פורים',
  'Nisan 15': 'פסח',
  'Nisan 21': 'שביעי של פסח',
  'Iyar 18': 'ל״ג בעומר',
  'Sivan 6': 'שבועות',
  'Tamuz 17': 'צום י״ז בתמוז',
  'Av 9': 'תשעה באב',
  'Av 15': 'ט״ו באב',
  'Elul 29': 'ערב ראש השנה',
};

/** שם החג בתאריך נתון, אם יש. */
export function holidayOf(d: Date): string | null {
  const p = hebParts(d);
  return HOLIDAYS[`${p.month} ${p.day}`] ?? null;
}
