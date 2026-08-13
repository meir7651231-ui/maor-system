/**
 * ratchet — ייבוא תורמים מ-Excel (‏.xlsx) + זיהוי-כותרות חכם (13.8.2026).
 *
 * הבאג-בשטח: מסך-הייבוא קיבל **רק CSV**; קובץ "היסטוריית חיובים" מסליקת-אשראי
 * (.xlsx) נדחה. שני חסמים גם אחרי המרה ל-CSV: (1) שורת-הכותרות אינה שורה-1
 * (מעליה כותרת/טווח-תאריכים/סה"כ), (2) עמודת-השם נקראת **"תורם"**, לא "שם".
 * הנעילה: `parseSupporterGrid` סורק את שורת-הכותרות ומזהה "תורם"; `parseXlsxSheet`
 * מפענח xlsx (‏fflate) לרשת-תאים — כל שדה משובץ למקומו.
 */
import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { parseXlsxSheet } from '../../../lib/xlsx';
import { excelSerialToIso, mergeSupporterRow, newSupporterFromRow, parseSupporterGrid, supDonEvents } from '../lib';

/** בונה xlsx מינימלי (רק sharedStrings + sheet1) מרשת-תאים — כמו יצוא אמיתי. */
function buildXlsx(grid: string[][]): Uint8Array {
  const strings: string[] = [];
  const idx = (s: string) => {
    const i = strings.indexOf(s);
    return i >= 0 ? i : strings.push(s) - 1;
  };
  const col = (n: number) => {
    let s = '';
    n++;
    while (n > 0) {
      s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  };
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const rowsXml = grid
    .map((row, r) => {
      const cells = row
        .map((v, c) => (v === '' ? '' : `<c r="${col(c)}${r + 1}" t="s"><v>${idx(v)}</v></c>`))
        .join('');
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join('');
  const sheet = `<?xml version="1.0"?><worksheet><sheetData>${rowsXml}</sheetData></worksheet>`;
  const sst = `<?xml version="1.0"?><sst>${strings.map((s) => `<si><t>${esc(s)}</t></si>`).join('')}</sst>`;
  return zipSync({
    'xl/sharedStrings.xml': strToU8(sst),
    'xl/worksheets/sheet1.xml': strToU8(sheet),
  });
}

// המבנה המדויק של הקובץ שהבעלים העלה (יצוא "היסטוריית חיובים - אשראי"):
const CREDIT_GRID: string[][] = [
  ['הסטוריית חיובים - אשראי'],
  ['1/7/2026 - 13/8/2026 · תוצאות מסוננות · הופק בתאריך 13.8.2026'],
  ['סה"כ', '53 עסקאות', '', '', '', '', '', '', '', '', '', '', '9950', '₪'],
  ['תאריך', 'תורם', 'ת"ז', 'כתובת', 'טלפון', 'מייל', 'קטגוריה', 'עבור', 'תשלומים', '4 ספרות', 'מותג', 'חברה סולקת', 'סכום', 'מטבע', 'אסמכתא', 'סטטוס', 'מספר קבלה', 'מספר עסקה'],
  ['2026-08-13 10:18:40', 'בינדר', '055647572', '', '', '', 'הסרת עין הרע', 'אסתי סגל', '1', '6028', 'ויזה', 'ישראכרט', '60', '₪', '063848', 'אושר', '', '76430635'],
  ['2026-08-11 13:24:40', 'רות', '', '', '052-7663653', '', 'תרומה כללית', 'כללי', '1', '6519', 'ויזה', 'ישראכרט', '300', '₪', '0968784', 'אושר', '121833', '76340966'],
];

describe('ייבוא Excel — parseXlsxSheet (פענוח xlsx לרשת-תאים)', () => {
  it('unzip + sharedStrings + תאים עברית — round-trip נאמן', () => {
    const grid = parseXlsxSheet(buildXlsx([['שם', 'סכום'], ['בינדר', '60'], ['רות', '']]));
    expect(grid[0]).toEqual(['שם', 'סכום']);
    expect(grid[1]).toEqual(['בינדר', '60']);
    // תא ריק בסוף שורה — פשוט חסר (השורה קצרה), הצרכן קורא '' מחוץ-לטווח
    expect(grid[2][0]).toBe('רות');
  });

  it('קובץ פגום/ריק ⇒ [] (נכשל-רך, לא זורק)', () => {
    expect(parseXlsxSheet(new Uint8Array([1, 2, 3]))).toEqual([]);
  });

  // 🔴 באג-שטח 13.8c: קובץ ששומר את עמודת-התאריך **כמספר-סריאל** (46247) —
  // parseAnyDate נכשל, ובלי תאריך העסקה לא נרשמת ("לא קורא את התרומות בשום צורה").
  it('תאריך כמספר-סריאל של Excel נקרא ונרשם כעסקה', () => {
    expect(excelSerialToIso(46247)).toBe('2026-08-13');
    const grid = [
      ['תאריך', 'תורם', 'סכום', 'מטבע', 'מספר עסקה'],
      ['46247', 'בינדר', '60', '₪', '76430635'], // תאריך = מספר-סריאל
    ];
    const rows = parseSupporterGrid(grid);
    expect(rows).toHaveLength(1);
    expect(rows[0].hist).toEqual([{ d: '2026-08-13', a: 60, txn: '76430635' }]);
  });
});

describe('ייבוא Excel — parseSupporterGrid (זיהוי-כותרות + "תורם")', () => {
  it('שורת-הכותרות מזוהה למרות 3 שורות-פתיח; "תורם" = עמודת-השם', () => {
    const rows = parseSupporterGrid(CREDIT_GRID);
    // רק 2 שורות-הנתונים יובאו — הכותרת/טווח/סה"כ דולגו:
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.name)).toEqual(['בינדר', 'רות']);
  });

  it('כל שדה משובץ למקומו + עסקה→היסטוריה + מטא-דאטת-סליקה (13.8)', () => {
    const [binder, rut] = parseSupporterGrid(CREDIT_GRID);
    expect(binder.idNum).toBe('055647572');
    expect(binder.cat).toBe('הסרת עין הרע');
    expect(binder.forWho).toBe('אסתי סגל');
    // עסקה + כל 8 עמודות-המטא-דאטה (מס'-קבלה ריק ⇒ מושמט; ₪ ⇒ בלי c):
    expect(binder.hist).toEqual([
      { d: '2026-08-13', a: 60, ref: '063848', txn: '76430635', brand: 'ויזה', last4: '6028', clearer: 'ישראכרט', pays: 1, status: 'אושר' },
    ]);
    expect(rut.phone).toBe('052-7663653');
    expect(rut.hist?.[0]).toMatchObject({ a: 300, receipt: '121833', txn: '76340966', ref: '0968784', status: 'אושר' });
  });

  it('13.8 — הוסר אוטומט-העי"ן: קטגוריה "הסרת עין הרע" לא פותחת תיק-מעקב', () => {
    const [binder, rut] = parseSupporterGrid(CREDIT_GRID);
    expect(binder.ayinNames).toBeUndefined(); // אף שהקטגוריה מכילה "עין"
    expect(rut.ayinNames).toBeUndefined();
  });

  // 🔴 באג-שטח 13.8: mergeHist דרס את המטא-דאטה (רק d/a/c) ⇒ העמודות החדשות
  // אבדו כשהרשומה הגיעה לתומך. הנעילה: התומך שנוצר/עודכן שומר את כל השדות.
  it('המטא-דאטה שורדת את מנוע-הייבוא (newSupporterFromRow) ומוצגת', () => {
    const [binderRow] = parseSupporterGrid(CREDIT_GRID);
    const sp = newSupporterFromRow('sp1', binderRow);
    expect(sp.hist?.[0]).toMatchObject({ a: 60, txn: '76430635', ref: '063848', brand: 'ויזה', status: 'אושר' });
    // ומוצג בשורת "כל התרומות":
    const src = supDonEvents(sp)[0].src;
    expect(src).toContain('עסקה 76430635');
    expect(src).toContain('אושר');
  });

  it('13.8b — ייבוא-חוזר *משדרג* עסקה ותיקה (בלי מטא-דאטה) בלי לשכפל', () => {
    const [binderRow] = parseSupporterGrid(CREDIT_GRID);
    // תומך שיובא לפני #121 — רשומה מופשטת (רק d/a), בלי מטא-דאטה:
    const stripped = { ...newSupporterFromRow('sp1', binderRow), hist: [{ d: '2026-08-13', a: 60 }] };
    const merged = mergeSupporterRow(stripped as never, binderRow);
    expect(merged.hist).toHaveLength(1); // לא שוכפל
    expect(merged.hist?.[0]).toMatchObject({ txn: '76430635', ref: '063848', status: 'אושר' }); // שודרג
  });

  it('ייבוא-חוזר אידמפוטנטי: אותה עסקה לא משוכפלת; שונה כן נוספת (dedup d|a|c)', () => {
    const [binderRow, rutRow] = parseSupporterGrid(CREDIT_GRID);
    const sp = newSupporterFromRow('sp1', binderRow);
    // אותו קובץ שוב (אותו תאריך|סכום|מטבע) ⇒ אין כפילות:
    const same = mergeSupporterRow(sp, binderRow);
    expect(same.hist).toHaveLength(1);
    // עסקה אחרת (rut, תאריך+סכום שונים) ⇒ נוספת — והמטא-דאטה שלה נשמרת:
    const plus = mergeSupporterRow(sp, rutRow);
    expect(plus.hist).toHaveLength(2);
    expect(plus.hist?.some((h) => h.txn === '76340966')).toBe(true);
  });

  it('שרשרת מלאה: xlsx bytes → grid → שורות-ייבוא', () => {
    const rows = parseSupporterGrid(parseXlsxSheet(buildXlsx(CREDIT_GRID)));
    expect(rows.map((r) => r.name)).toEqual(['בינדר', 'רות']);
    expect(rows[0].hist?.[0].a).toBe(60);
  });
});
