/**
 * ratchet — כיסוי חגים מלא (ANALYSIS §5 קלים · הכרעת בעלים "כיסוי מלא של חגים").
 * חנוכה = בדיוק 8 ימים בשתי סוגי-השנים (כסלו מלא/חסר) · שושן פורים · תענית אסתר
 * · פורים קטן. מאומת מול הלוח דרך hebToIso.
 */
import { describe, expect, it } from 'vitest';
import { holidayOf } from '../hebrew';
import { hebToIso, isHebLeapYear } from '../hebdate';

const noon = (iso: string) => new Date(iso + 'T12:00:00');
const hol = (day: number, monthHe: string, y: number) => {
  const iso = hebToIso(day, monthHe, y);
  return iso ? holidayOf(noon(iso)) : null;
};
/** סופר ימי-חנוכה בשנה עברית (כל התאריכים האפשריים של החג). */
function chanukahDays(y: number): number {
  const cand: [number, string][] = [
    [25, 'כסלו'], [26, 'כסלו'], [27, 'כסלו'], [28, 'כסלו'], [29, 'כסלו'], [30, 'כסלו'],
    [1, 'טבת'], [2, 'טבת'], [3, 'טבת'],
  ];
  let n = 0;
  for (const [d, m] of cand) if (hol(d, m, y) === 'חנוכה') n++;
  return n;
}

describe('🕎 ratchet — כיסוי חגים מלא', () => {
  // שנה עם כסלו מלא (יש 30) ושנה עם כסלו חסר (אין 30)
  let full = 0;
  let short = 0;
  for (let y = 5785; y < 5820 && (!full || !short); y++) {
    if (!full && hebToIso(30, 'כסלו', y)) full = y;
    if (!short && !hebToIso(30, 'כסלו', y)) short = y;
  }
  it('נמצאו שנת כסלו-מלא ושנת כסלו-חסר', () => {
    expect(full).toBeGreaterThan(0);
    expect(short).toBeGreaterThan(0);
  });
  it('חנוכה = בדיוק 8 ימים — בשנת כסלו מלא (מסתיים ב״ב טבת)', () => {
    expect(chanukahDays(full)).toBe(8);
    expect(hol(3, 'טבת', full)).toBeNull(); // ג' טבת אינו חנוכה בשנה מלאה
    expect(hol(2, 'טבת', full)).toBe('חנוכה');
  });
  it('חנוכה = בדיוק 8 ימים — בשנת כסלו חסר (מסתיים ב״ג טבת)', () => {
    expect(chanukahDays(short)).toBe(8);
    expect(hol(3, 'טבת', short)).toBe('חנוכה'); // ג' טבת = יום ח' בשנה חסרה
  });

  it('שושן פורים · תענית אסתר (שנה פשוטה)', () => {
    let common = 0;
    for (let y = 5786; y < 5810 && !common; y++) if (!isHebLeapYear(y)) common = y;
    expect(hol(13, 'אדר', common)).toBe('תענית אסתר');
    expect(hol(15, 'אדר', common)).toBe('שושן פורים');
    expect(hol(14, 'אדר', common)).toBe('פורים');
  });

  it('פורים קטן / שושן פורים קטן + תענית/שושן באדר ב׳ (שנה מעוברת)', () => {
    let leap = 0;
    for (let y = 5786; y < 5810 && !leap; y++) if (isHebLeapYear(y)) leap = y;
    expect(hol(14, 'אדר א׳', leap)).toBe('פורים קטן');
    expect(hol(15, 'אדר א׳', leap)).toBe('שושן פורים קטן');
    expect(hol(13, 'אדר ב׳', leap)).toBe('תענית אסתר');
    expect(hol(15, 'אדר ב׳', leap)).toBe('שושן פורים');
  });

  // 🐛 נחיל-עמוק (13.8): צום ט׳ באב / י״ז בתמוז שחלו בשבת — הצום נדחה ליום ראשון.
  // אין להציג את הצום על השבת; מציגים "(נדחה)" על יום-הדחייה. אומת מול 2022 (ט׳ באב חל בשבת).
  it('תשעה באב שחל בשבת — נדחה ליום ראשון (2022)', () => {
    expect(holidayOf(noon('2022-08-06'))).toBeNull(); // שבת, ט׳ באב — הצום נדחה
    expect(holidayOf(noon('2022-08-07'))).toBe('תשעה באב (נדחה)'); // ראשון, י׳ באב
  });
  it('צום י״ז בתמוז שחל בשבת — נדחה ליום ראשון (2022)', () => {
    expect(holidayOf(noon('2022-07-16'))).toBeNull(); // שבת, י״ז בתמוז — הצום נדחה
    expect(holidayOf(noon('2022-07-17'))).toBe('צום י״ז בתמוז (נדחה)'); // ראשון, י״ח בתמוז
  });
});
