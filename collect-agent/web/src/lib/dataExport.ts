// מנהל 310: ייצוא כל המידע על לקוח אחד (בקשת עיון, סעיף 13) — מעל GET /customers/{cid}/data (מנהל 309).
// החלק הטהור: שם הקובץ ותוכנו. ההורדה עצמה (DOM) ב-downloadJson.
import type { Me } from '../api.ts';

/** הכרעת ראש צוות 20.11: ייצוא = בעל העסק בלבד. עובד/ת מחובר/ת ⇒ במקום הכפתור הסבר (השרת מחזיר 403).
 *  me=null (מוק/לפני טעינה) ⇒ לא חוסמים במסך; השרת אוכף. אותו דפוס כמו holdOwnerOnly/settingsOwnerOnly. */
export const exportOwnerOnly = (me: Me | null) => me?.kind === 'user' && me.owner !== true;

/** שם קובץ ASCII בלבד: מזהה הלקוח והתאריך, בלי השם.
 *  1) Chromium מתעלם מ-download="…" עם עברית ושומר «download» בלי סיומת (נתפס ב-e2e/live.mjs).
 *  2) שם לקוח בתיקיית ההורדות הוא מידע אישי גלוי; השם נמצא בתוך הקובץ. */
export function dataExportFileName(cid: number, today: string): string {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(today) ? today : 'export';
  const id = Math.trunc(Number(cid));
  return `gabi-data-request-customer-${Number.isFinite(id) && id > 0 ? id : 0}-${day}.json`;
}

/** מנהל 429 (מבקר 259🟡): ייצוא כל נתוני העסק (GET /export, TERMS §9 / DPA 4.3). שם קובץ ASCII: תאריך בלבד. */
export function businessExportFileName(today: string): string {
  return `gabi-business-export-${/^\d{4}-\d{2}-\d{2}$/.test(today) ? today : 'export'}.json`;
}

/** תוכן הקובץ: JSON קריא (הזחה), כפי שהשרת החזיר — בלי להוסיף או להסיר שדות. */
export const dataExportText = (data: unknown): string => `${JSON.stringify(data, null, 2)}\n`;

/** הורדה בדפדפן (לא נבדק ב-node; מכוסה ב-e2e/live.mjs). */
export function downloadJson(fileName: string, data: unknown): void {
  const url = URL.createObjectURL(new Blob([dataExportText(data)], { type: 'application/json;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
