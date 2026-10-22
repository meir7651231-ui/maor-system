/**
 * עזרי ייצוא — CSV עם BOM ‏(UTF-8) כדי שאקסל יפתח עברית תקינה,
 * בריחת פסיקים/גרשיים והגנה מפני הזרקת נוסחאות (=+-@).
 */

import { guardExport, refusalResult } from '../../lib/exportGate';

export type Cell = string | number;

function esc(x: Cell): string {
  let v = String(x ?? '');
  // הגנת CSV injection — תא שמתחיל בתו נוסחה מקבל גרש מוביל
  if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
  // כולל \r (עקבי עם csvx.ts csvEscape) — אחרת \r פנימי שובר שורה בפענוח/אקסל
  return v.includes(',') || v.includes('"') || v.includes('\n') || v.includes('\r')
    ? '"' + v.replace(/"/g, '""') + '"'
    : v;
}

/** false רק כשהשער סירב בדמו (22.10.2026: בלי טוסט-הצלחה אחרי הודעת-הדמו); מחוץ לדמו true — ביט-זהה. */
function download(name: string, mime: string, text: string): boolean {
  if (!guardExport()) return refusalResult(); // 🔐 שער יציאת-מידע (core.export כבוי בכרטיס-העובד); false רק בדמו
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: mime }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return true;
}

/** מוריד קובץ CSV — שורת כותרת + שורות נתונים. */
export function downloadCsv(name: string, rows: Cell[][]): boolean {
  return download(name, 'text/csv;charset=utf-8', rows.map((r) => r.map(esc).join(',')).join('\n'));
}

/** מוריד דוח טקסט פשוט (למשל הדוח התקופתי). */
export function downloadText(name: string, lines: string[]): boolean {
  return download(name, 'text/plain;charset=utf-8', lines.join('\n'));
}
