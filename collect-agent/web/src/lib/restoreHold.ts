// critic סבב 177: עצירת שליחה אחרי שחזור מגיבוי (app/restore_guard.py). טהור — נבדק ב-tests/lib.check.ts.
import type { Me, RestoreHold } from '../api.ts';

/** כמו restore_guard.NOTE_MIN — השרת דוחה (422) תיעוד קצר יותר */
export const HOLD_NOTE_MIN = 5;
export const holdCanRelease = (note: string) => note.trim().length >= HOLD_NOTE_MIN;
/** רק בעל העסק משחרר: הטוקן המשותף, או (critic 179) עובד מחובר בתפקיד בעלים — השרת מחזיר 403 לשאר.
 *  me=null (מוק/לפני טעינה) ⇒ לא חוסמים בממשק; השרת אוכף. */
export const holdOwnerOnly = (me: Me | null) => me?.kind === 'user' && me.owner !== true;

const ddmm = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10).split('-').reverse().join('.');
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' }).split('-').reverse().join('.');
};

export function holdText(h: RestoreHold): string {
  return `שוחזר ב-${ddmm(h.restored_at)}. עד שתאשרו, גבי לא שולחת שום תזכורת או תשובה ללקוחות. `
    + (h.ledger_applied > 0 ? `${h.ledger_applied} הסרות שנוספו אחרי הגיבוי הוחזרו אוטומטית מיומן ההסרות. ` : '')
    + 'לפני החידוש: החילו מחדש כל בקשת הסרה, מחיקה או התממה שהתקבלה מאז הגיבוי, ותעדו כאן מה בדקתם.';
}
