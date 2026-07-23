/**
 * פענוח CSV אמיתי (parseCsv) — התרחישים שהפיצול הנאיבי split(',') שיבר:
 * פסיקים בתוך שדה מצוטט, גרשיים כפולים, מעברי-שורה בתוך שדה, ו-CRLF.
 * זה המנתח שמזין את ייבוא המשפחות.
 */
import { describe, expect, it } from 'vitest';
import { parseCsv, csvEscape, toCsv } from '../csvx';

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
