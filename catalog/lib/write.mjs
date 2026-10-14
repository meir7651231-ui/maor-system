/**
 * ⚡ «כותב רק כשצריך» (SELF-V2, 14.10.2026): קובץ-פלט נכתב רק כשהתוכן השתנה, ואטומית (קובץ-זמני ⇒ rename).
 * כך קורא במקביל (rebuild --check, בדיקה אחרת, שלב שהתחיל מוקדם) לא רואה חצי-קובץ, ו"לא נגעו בו" (אותו mtime) אומר משהו.
 */
import fs from 'node:fs';
import path from 'node:path';

export function writeIfChanged(abs, text) {
  try { if (fs.readFileSync(abs, 'utf8') === text) return false; } catch { /* קובץ חדש */ }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const tmp = abs + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, abs);
  return true;
}
