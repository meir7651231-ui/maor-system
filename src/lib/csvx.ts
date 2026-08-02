/**
 * עזרי CSV משותפים — ייצוא (BOM ‏UTF-8, בריחת תווים והגנת הזרקת נוסחאות,
 * עקבי עם components/reports/csv.ts) ופענוח CSV אמיתי: שדות מצוטטים,
 * פסיקים/גרשיים/שורות בתוך שדה ו-CRLF. כולל parseAnyDate לקליטת תאריכים מאקסל.
 */

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
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/**
 * קריאת קובץ טקסט לייבוא: UTF-8, ואם זוהו תווי החלפה (�) — ניסיון שני
 * ב-windows-1255 (קבצים מאקסל ישן). helper משותף לכל מסלולי הייבוא
 * (ילדים / משפחות / תומכות / גיליון מעקב) — P0.5.
 */
export async function readCsvFileText(file: File): Promise<string> {
  const txt = await file.text();
  if (!txt.includes('�')) return txt;
  return new Promise<string>((resolve, reject) => {
    const rd = new FileReader();
    rd.onload = () => resolve(String(rd.result));
    rd.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
    rd.readAsText(file, 'windows-1255');
  });
}

/**
 * פענוח CSV מלא: שדות מצוטטים ("..."), גרשיים כפולים בתוך ציטוט,
 * פסיקים ומעברי שורה בתוך שדה, CRLF. שורות ריקות לגמרי מדולגות.
 */
export function parseCsv(text: string): string[][] {
  const t = text.replace(/^\uFEFF/, '');
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
      } else if (ch === '"' && (i + 1 >= t.length || t[i + 1] === ',' || t[i + 1] === '\n' || t[i + 1] === '\r')) {
        q = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"' && cur === '') {
      q = true;
    } else if (ch === ',') {
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
