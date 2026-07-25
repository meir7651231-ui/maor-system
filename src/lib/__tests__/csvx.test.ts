/**
 * פענוח CSV אמיתי (parseCsv) — התרחישים שהפיצול הנאיבי split(',') שיבר:
 * פסיקים בתוך שדה מצוטט, גרשיים כפולים, מעברי-שורה בתוך שדה, ו-CRLF.
 * זה המנתח שמזין את ייבוא המשפחות.
 */
import { describe, expect, it } from 'vitest';
import { parseCsv, csvEscape, toCsv, parseAnyDate } from '../csvx';

describe('parseCsv', () => {
  it('שדה מצוטט עם פסיק פנימי נשאר שלם ("כהן, בן דוד")', () => {
    const rows = parseCsv('"כהן, בן דוד",אבי,שרה,050-1234567,בני ברק');
    expect(rows[0]).toEqual(['כהן, בן דוד', 'אבי', 'שרה', '050-1234567', 'בני ברק']);
  });

  it('גרשיים כפולים בתוך ציטוט → גרש בודד', () => {
    expect(parseCsv('"בית ""אל""",x')[0]).toEqual(['בית "אל"', 'x']);
  });

  it('מעבר שורה בתוך שדה מצוטט לא שובר לשתי שורות', () => {
    const rows = parseCsv('"שורה1\nשורה2",b');
    expect(rows.length).toBe(1);
    expect(rows[0][0]).toBe('שורה1\nשורה2');
  });

  it('CRLF ו-BOM מטופלים; שורות ריקות מדולגות', () => {
    const rows = parseCsv('﻿a,b\r\n\r\nc,d\r\n');
    expect(rows).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('round-trip: toCsv → parseCsv משמר שדה עם פסיק', () => {
    const original = [['כהן, בן דוד', 'עיר, מחוז']];
    const parsed = parseCsv(toCsv(original).replace(/^﻿/, ''));
    expect(parsed).toEqual(original);
  });
});

describe('csvEscape — הגנת הזרקת נוסחאות', () => {
  it('תא שמתחיל ב-=/+/-/@ מקבל גרש מוביל', () => {
    expect(csvEscape('=1+1')).toBe("'=1+1");
    expect(csvEscape('@cmd')).toBe("'@cmd");
  });
  it('תא עם פסיק/גרשיים מצוטט', () => {
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape('a"b')).toBe('"a""b"');
  });
});

describe('🗓️ ratchet — parseAnyDate לא מפרש שנה בת 4 ספרות כסריאל אקסל (פאס-4)', () => {
  it('שנת-לידה חשופה (2025/2010/1975) → ריק, לא תאריך ~1905 שגוי', () => {
    // /^\d{4,5}$/ תפס "2025"→1905-07-17; אחרי התיקון (/^\d{5}$/) נופל לריק.
    expect(parseAnyDate('2025')).toBe('');
    expect(parseAnyDate('2010')).toBe('');
    expect(parseAnyDate('1975')).toBe('');
  });
  it('סריאל אקסל אמיתי (5 ספרות) עדיין מתפרש, וגם ISO/D-M-Y', () => {
    expect(parseAnyDate('45292')).toBe('2024-01-01');
    expect(parseAnyDate('2024-03-15')).toBe('2024-03-15');
    expect(parseAnyDate('15/03/2024')).toBe('2024-03-15');
  });
  it('ISO בלתי-אפשרי נדחה כמו בענף D/M/Y (פאס-5), תקין נשמר', () => {
    expect(parseAnyDate('2015-06-31')).toBe(''); // ליוני אין 31
    expect(parseAnyDate('2019-02-30')).toBe(''); // לפברואר אין 30
    expect(parseAnyDate('2020-13-01')).toBe(''); // אין חודש 13
    expect(parseAnyDate('2020-02-29')).toBe('2020-02-29'); // שנה מעוברת — תקין
  });
});
