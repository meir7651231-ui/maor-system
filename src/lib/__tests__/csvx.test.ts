/**
 * פענוח CSV אמיתי (parseCsv) — התרחישים שהפיצול הנאיבי split(',') שיבר:
 * פסיקים בתוך שדה מצוטט, גרשיים כפולים, מעברי-שורה בתוך שדה, ו-CRLF.
 * זה המנתח שמזין את ייבוא המשפחות.
 */
import { describe, expect, it } from 'vitest';
import { parseCsv, csvEscape, toCsv, parseAnyDate, decodeCsvBuffer } from '../csvx';

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

  // ratchet — ציר דו-ספרתי דינמי (באג #12): היה קשיח על 26 ⇒ מ-2027 "27"→1927.
  it('שנה דו-ספרתית — ציר דינמי סביב השנה הנוכחית', () => {
    const nowYY = new Date().getFullYear() % 100;
    // כמה שנים קדימה (בתוך חלון ה-10) → 20xx
    const nearStr = String((nowYY + 5) % 100).padStart(2, '0');
    expect(parseAnyDate(`15/03/${nearStr}`)).toBe(`20${nearStr}-03-15`);
    // עבר רחוק (מעל cut=nowYY+10) → 19xx
    expect(parseAnyDate('01/01/85')).toBe('1985-01-01');
    expect(parseAnyDate('01/01/99')).toBe('1999-01-01');
  });
});

/* ── בקשת-בעלים 9.8: ייבוא ExportHistory ממסוף-הסליקה — UTF-16 + טאבים ── */
describe('📥 ratchet — קובץ מסוף-הסליקה (UTF-16 + TSV)', () => {
  const HDR = ['מספר זהות', 'שם', 'כתובת', 'טלפון', 'מייל', 'סכום', 'מטבע', 'תאריך עסקה', 'מספר אישור', '4 ספרות אחרונות', 'תוקף', 'תשלומים', 'קטגוריה', 'הערות', 'שם מסוף', 'מספר מסוף', 'מותג', 'חברה סולקת', 'מספר הו"ק', 'מספר עסקה', 'מספר שובר', 'מספר קבלה'].join('\t');
  const ROW = ['', 'הדס הדסה ', 'מושב בר יוחאי ', '053-6231449', 'hadasa@example.org', '400', 'שקל', '09/08/26 00:36', '1975698', '7936', '="0330"', 'הו"ק', 'קבלה סעיף 46', '', 'POS - מאור החסד ', '14187', 'מסטרכרד', 'ישראכרט', '2188318', '76112547', '44001003', ''].join('\t');

  it('decodeCsvBuffer: BOM של UTF-16LE מפוענח נכון (עברית שלמה)', () => {
    const src = HDR + '\r\n' + ROW;
    // בונים בייטים כמו הקובץ האמיתי: BOM FF FE ואז UTF-16LE
    const buf = new ArrayBuffer(2 + src.length * 2);
    const view = new DataView(buf);
    view.setUint8(0, 0xff);
    view.setUint8(1, 0xfe);
    for (let i = 0; i < src.length; i++) view.setUint16(2 + i * 2, src.charCodeAt(i), true);
    const out = decodeCsvBuffer(buf);
    expect(out).toContain('מספר זהות');
    expect(out).toContain('הדס הדסה');
    expect(out).not.toContain('�');
  });

  it('parseCsv: זיהוי-טאבים אוטומטי — העמודות במקומן; קבצי-פסיקים לא נגעו', () => {
    const rows = parseCsv(HDR + '\r\n' + ROW);
    expect(rows[0][0]).toBe('מספר זהות');
    expect(rows[0][1]).toBe('שם');
    expect(rows[1][1].trim()).toBe('הדס הדסה');
    expect(rows[1][3]).toBe('053-6231449');
    expect(rows[1][4]).toBe('hadasa@example.org');
    expect(rows[1][12]).toBe('קבלה סעיף 46');
    // קובץ-פסיקים רגיל ממשיך לעבוד בדיוק כמו קודם
    const commas = parseCsv('שם,טלפון\nכהן,050-1234567');
    expect(commas[1]).toEqual(['כהן', '050-1234567']);
    // שדה מצוטט עם פסיק — בתוך TSV הפסיק אינו מפריד ונשמר כתוכן
    const q = parseCsv('א\tב\n"כהן, בן דוד"\tx');
    expect(q[1][0]).toBe('כהן, בן דוד');
    expect(q[1][1]).toBe('x');
  });
});

/* ── הכרעת-בעלים 9.8: "היסטוריה ללא קבלה" — עסקאות-הסליקה ל-hist ── */
describe('🕰 ratchet — עסקאות-סליקה כהיסטוריה-ללא-קבלה', () => {
  it('planSupporterImport מקבץ שורות-עסקה מרובות של אותו תורם — כלום לא אובד', async () => {
    const { planSupporterImport } = await import('../../components/supporters/lib');
    const row = (name: string, d: string, a: number) => ({
      name, phone: '', email: '', idNum: '', address: '', cat: '', forWho: '', hist: [{ d, a }],
    });
    // תורם חדש עם 3 עסקאות + תורם קיים עם 2
    const existing = [{ id: 'sp1', name: 'כהן', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [] }];
    const p = planSupporterImport(
      [row('לוי', '2026-01-01', 100), row('לוי', '2026-02-01', 200), row('לוי', '2026-03-01', 300),
       row('כהן', '2026-01-15', 50), row('כהן', '2026-02-15', 60)],
      existing as never,
    );
    expect(p.inserts).toHaveLength(1);
    expect(p.inserts[0].hist).toHaveLength(3); // הבאג שנמנע: רק האחרונה שרדה
    expect(p.updates).toHaveLength(1); // מקובץ לעדכון אחד פר-id
    expect(p.updates[0].row.hist).toHaveLength(2);
  });

  it('mergeHist אידמפוטנטי: ייבוא-חוזר לא מכפיל; כפילות-אמת באותו קובץ נשמרת', async () => {
    const { mergeHist } = await import('../../components/supporters/lib');
    const incoming = [
      { d: '2026-01-01', a: 60 }, { d: '2026-01-01', a: 60 }, // שתי עסקאות-אמת באותו יום
      { d: '2026-02-01', a: 100 },
    ];
    const first = mergeHist([], incoming);
    expect(first).toHaveLength(3);
    // ייבוא-חוזר של אותו קובץ — שום תוספת
    const second = mergeHist(first, incoming);
    expect(second).toHaveLength(3);
    // קובץ-המשך עם עסקה חדשה — רק היא מתווספת
    const third = mergeHist(second, [...incoming, { d: '2026-03-01', a: 45 }]);
    expect(third).toHaveLength(4);
    // המונים לא נגועים — mergeHist טהור על hist בלבד (הכרעת ‎#14 פתוחה)
  });

  it('mergeSupporterRow/newSupporterFromRow נושאים hist; בלי hist — ביט-זהה', async () => {
    const { mergeSupporterRow, newSupporterFromRow } = await import('../../components/supporters/lib');
    const bare = { name: 'לוי', phone: '', email: '', idNum: '', address: '', cat: '', forWho: '' };
    const fresh = newSupporterFromRow('sp9', bare);
    expect('hist' in fresh).toBe(false); // אין שדה-רפאים לקבצים רגילים
    const withTx = newSupporterFromRow('sp8', { ...bare, hist: [{ d: '2026-01-01', a: 100 }] });
    expect(withTx.hist).toHaveLength(1);
    expect(withTx.count).toBe(0); // המונים לא נגועים
    const sp = { ...fresh, hist: [{ d: '2025-05-05', a: 10 }] };
    const merged = mergeSupporterRow(sp as never, { ...bare, hist: [{ d: '2026-01-01', a: 100 }] });
    expect(merged.hist).toHaveLength(2);
    expect(merged.count).toBe(0);
  });
});
