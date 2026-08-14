/**
 * עזרי CSV משותפים — ייצוא (BOM ‏UTF-8, בריחת תווים והגנת הזרקת נוסחאות,
 * עקבי עם components/reports/csv.ts) ופענוח CSV אמיתי: שדות מצוטטים,
 * פסיקים/גרשיים/שורות בתוך שדה ו-CRLF. כולל parseAnyDate לקליטת תאריכים מאקסל.
 */

import { guardExport } from './exportGate';

export type Cell = string | number;

/** בריחת תא: הגנת CSV injection ‏(=+-@) + ציטוט פסיקים/גרשיים/שורות. */
export function csvEscape(x: Cell): string {
  let v = String(x ?? '');
  // תא שמתחיל בתו נוסחה מקבל גרש מוביל — כמו ב-reports/csv.ts
  if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
  return v.includes(',') || v.includes('"') || v.includes('\n') || v.includes('\r')
    ? '"' + v.replace(/"/g, '""') + '"'
    : v;
}

/** שורות → טקסט CSV עם BOM ‏(UTF-8) כדי שאקסל יפתח עברית תקינה. */
export function toCsv(rows: Cell[][]): string {
  return '\uFEFF' + rows.map((r) => r.map(csvEscape).join(',')).join('\n');
}

/** מוריד קובץ CSV — שורת כותרת + שורות נתונים. */
export function downloadCsv(filename: string, rows: Cell[][]): void {
  if (!guardExport()) return; // 🔐 שער יציאת-מידע (core.export כבוי בכרטיס-העובד)
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/**
 * פענוח בייטים של קובץ-ייבוא לטקסט — טהור ונבדק-ביחידה:
 * 1. ‏BOM של UTF-16 (‏FF FE / FE FF) ⇒ פענוח UTF-16 (ייצוא ExportHistory
 *    ממסופי-הסליקה מגיע כך — בקשת-בעלים 9.8).
 * 2. בלי BOM אך עם הרבה בייטי-NUL ⇒ ‏UTF-16LE (אקסל בלי BOM).
 * 3. אחרת UTF-8; תווי-החלפה (�) ⇒ ניסיון שני ב-windows-1255 (אקסל ישן).
 */
export function decodeCsvBuffer(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(buf);
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(buf);
  const probe = bytes.subarray(0, 400);
  let nuls = 0;
  for (const b of probe) if (b === 0) nuls++;
  if (probe.length > 8 && nuls > probe.length / 5) return new TextDecoder('utf-16le').decode(buf);
  const utf8 = new TextDecoder('utf-8').decode(buf);
  if (!utf8.includes('�')) return utf8;
  try {
    return new TextDecoder('windows-1255').decode(buf);
  } catch {
    return utf8;
  }
}

/**
 * קריאת קובץ טקסט לייבוא — helper משותף לכל מסלולי הייבוא
 * (ילדים / משפחות / תומכות / גיליון מעקב) — P0.5; הפענוח ב-decodeCsvBuffer.
 */
export async function readCsvFileText(file: File): Promise<string> {
  return decodeCsvBuffer(await file.arrayBuffer());
}

/**
 * פענוח CSV מלא: שדות מצוטטים ("..."), גרשיים כפולים בתוך ציטוט,
 * פסיקים ומעברי שורה בתוך שדה, CRLF. שורות ריקות לגמרי מדולגות.
 */
export function parseCsv(text: string): string[][] {
  const t = text.replace(/^\uFEFF/, '');
  // \u05D6\u05D9\u05D4\u05D5\u05D9-\u05DE\u05E4\u05E8\u05D9\u05D3 (\u05D1\u05E7\u05E9\u05EA-\u05D1\u05E2\u05DC\u05D9\u05DD 9.8): \u05E9\u05D5\u05E8\u05D4 \u05E8\u05D0\u05E9\u05D5\u05E0\u05D4 \u05E2\u05DD \u05D9\u05D5\u05EA\u05E8 \u05D8\u05D0\u05D1\u05D9\u05DD \u05DE\u05E4\u05E1\u05D9\u05E7\u05D9\u05DD \u21D2 TSV
  // (\u05D9\u05D9\u05E6\u05D5\u05D0 ExportHistory \u05DE\u05DE\u05E1\u05D5\u05E3-\u05D4\u05E1\u05DC\u05D9\u05E7\u05D4); \u05D0\u05D7\u05E8\u05EA \u05E4\u05E1\u05D9\u05E7\u05D9\u05DD \u2014 \u05D0\u05E4\u05E1 \u05E9\u05D9\u05E0\u05D5\u05D9 \u05DC\u05E7\u05D1\u05E6\u05D9\u05DD \u05E7\u05D9\u05D9\u05DE\u05D9\u05DD.
  const nl = t.indexOf('\n');
  const firstLine = nl < 0 ? t : t.slice(0, nl);
  const delim = (firstLine.split('\t').length - 1) > (firstLine.split(',').length - 1) ? '\t' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) {
      if (ch === '"' && t[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"' && (i + 1 >= t.length || t[i + 1] === delim || t[i + 1] === '\n' || t[i + 1] === '\r')) {
        q = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"' && cur === '') {
      q = true;
    } else if (ch === delim) {
      row.push(cur);
      cur = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && t[i + 1] === '\n') i++;
      row.push(cur);
      cur = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else {
      cur += ch;
    }
  }
  if (cur !== '' || row.length) {
    row.push(cur);
    if (row.some((c) => c.trim() !== '')) rows.push(row);
  }
  return rows;
}

/**
 * תאריך מכל פורמט נפוץ בקבצי ייבוא → ISO ‏(YYYY-MM-DD), או '' אם לא זוהה:
 * ISO כמו-שהוא · D/M/Y (גם מפרידי נקודה/מקף, גם שנה דו-ספרתית) ·
 * מספר סידורי של אקסל (בסיס 30/12/1899).
 */
export function parseAnyDate(v: string): string {
  const s = String(v || '').trim();
  if (!s) return '';
  // ISO: אותה אימות-קיום כמו ענף ה-D/M/Y למטה — אחרת '2015-06-31'/'2019-02-30'
  // היו נשמרים כתאריך בלתי-אפשרי (זיהום נתונים בייבוא).
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const y = +iso[1];
    const mon = +iso[2];
    const day = +iso[3];
    if (mon < 1 || mon > 12 || day < 1 || day > 31) return '';
    const probe = new Date(Date.UTC(y, mon - 1, day));
    if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mon - 1 || probe.getUTCDate() !== day) return '';
    return s;
  }
  const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (m) {
    const day = +m[1];
    const mon = +m[2];
    let y = +m[3];
    // ציר דו-ספרתי דינמי: עד ~10 שנים קדימה = 20xx, אחרת 19xx. מתעדכן עם הזמן —
    // היה קשיח על 26 ⇒ מ-2027 "27" היה נקרא בשקט כ-1927 (זיהום נתונים בייבוא).
    if (y < 100) {
      const cut = (new Date().getFullYear() % 100) + 10;
      y += y <= cut ? 2000 : 1900;
    }
    // אימות טווח + קיום התאריך בפועל (31/02, חודש 13 וכו' → ריק, לא זבל)
    if (mon < 1 || mon > 12 || day < 1 || day > 31) return '';
    const probe = new Date(Date.UTC(y, mon - 1, day));
    if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mon - 1 || probe.getUTCDate() !== day) return '';
    return y + '-' + String(mon).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  }
  if (/^\d{5}$/.test(s)) {
    const b = new Date(Date.UTC(1899, 11, 30));
    b.setUTCDate(b.getUTCDate() + +s);
    return b.toISOString().slice(0, 10);
  }
  return '';
}
