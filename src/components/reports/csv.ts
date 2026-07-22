/**
 * עזרי ייצוא — CSV עם BOM ‏(UTF-8) כדי שאקסל יפתח עברית תקינה,
 * בריחת פסיקים/גרשיים והגנה מפני הזרקת נוסחאות (=+-@).
 */

export type Cell = string | number;

function esc(x: Cell): string {
  let v = String(x ?? '');
  // הגנת CSV injection — תא שמתחיל בתו נוסחה מקבל גרש מוביל
  if (/^[=+\-@]/.test(v)) v = "'" + v;
  return v.includes(',') || v.includes('"') || v.includes('\n')
    ? '"' + v.replace(/"/g, '""') + '"'
    : v;
}

function download(name: string, mime: string, text: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: mime }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/** מוריד קובץ CSV — שורת כותרת + שורות נתונים. */
export function downloadCsv(name: string, rows: Cell[][]): void {
  download(name, 'text/csv;charset=utf-8', rows.map((r) => r.map(esc).join(',')).join('\n'));
}

/** מוריד דוח טקסט פשוט (למשל הדוח התקופתי). */
export function downloadText(name: string, lines: string[]): void {
  download(name, 'text/plain;charset=utf-8', lines.join('\n'));
}
