/**
 * 💬 צ׳אט-תמיכה חי (17.8) — מנוע טהור (בלי firebase/DOM). מראה+מבנה בהשראת
 * הצ׳אט של בנייה-חכמה (בועות נכנס/יוצא, מפרידי-יום, "נראה לאחרונה"), אבל אצל
 * מאור זה **חי-באמת** דרך Firestore (onSnapshot) — הפונקציות-החיות ב-cloudConfig.
 *
 * הצדדים: `user` = הלקוח (הארגון, פותח מ-❓), `admin` = תמיכת-אורביט (מייל-על,
 * מלוח-הבקרה). מסמך-שיחה פר-uid (supportChats/{uid}) + תת-אוסף messages.
 * הכול טקסט בלבד (בלי מדיה) — פשוט, בטוח, וזול. הגבלות-גודל מקבילות ל-Rules.
 */

/** צד-השולח בהודעה. */
export type SupportSide = 'user' | 'admin';

/** הודעת-צ׳אט בודדת (supportChats/{uid}/messages/{id}). */
export interface SupportMsg {
  from: SupportSide;
  text: string;
  at: string; // ISO
}

/** מסמך-השיחה (supportChats/{uid}) — מטא לרשימת-השיחות ולתגי-"לא-נקרא". */
export interface SupportThread {
  email?: string;
  orgName?: string;
  lastText?: string;
  lastAt?: string;
  lastFrom?: SupportSide;
  unreadAdmin?: number; // הודעות-לקוח שהתמיכה טרם קראה
  unreadUser?: number; // תשובות-תמיכה שהלקוח טרם קרא
}

/** תקרת-אורך הודעה (מקבילה ל-Rules) — טקסט ארוך יותר נחתך. */
export const SUPPORT_MSG_MAX = 2000;

/** ניקוי טקסט-הודעה: trim + חיתוך-לתקרה. ריק ⇒ '' (השולח חוסם ריק). */
export function sanitizeSupportText(raw: string): string {
  return (raw ?? '').replace(/\s+$/u, '').replace(/^\s+/u, '').slice(0, SUPPORT_MSG_MAX);
}

/** האם הטקסט שליח (לא-ריק אחרי ניקוי). */
export function isSendableSupportText(raw: string): boolean {
  return sanitizeSupportText(raw).length > 0;
}

/** מיון הודעות לפי זמן עולה (ישן→חדש) — יציב, לא-משנה-מקור. */
export function sortSupportMsgs(msgs: SupportMsg[]): SupportMsg[] {
  return [...msgs].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
}

/** שעת-ההודעה HH:MM (מקומי) — פרסור עמיד (T אם חסר). */
export function supportMsgTime(at: string): string {
  const d = new Date(at.includes('T') ? at : at + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

/**
 * תווית-יום למפריד-שיחה: "היום" / "אתמול" / dd/mm/yyyy. הבסיס (todayIso) מוזרם
 * כדי לשמור טוהר (בלי Date.now במנוע) — הרכיב מזרים isoToday().
 */
export function supportDayLabel(at: string, todayIso: string): string {
  const day = at.slice(0, 10);
  if (day === todayIso) return 'היום';
  // אתמול = יום-אחד לפני todayIso (חישוב על ה-ISO, צהריים מקומי)
  const t = new Date(todayIso + 'T12:00:00');
  t.setDate(t.getDate() - 1);
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const dd = String(t.getDate()).padStart(2, '0');
  if (day === `${y}-${m}-${dd}`) return 'אתמול';
  const [yy, mm, d2] = day.split('-');
  return d2 && mm && yy ? `${d2}/${mm}/${yy}` : day;
}

/** קיצור-תצוגה של הודעה אחרונה ברשימת-השיחות (עד N תווים). */
export function supportPreview(text: string | undefined, max = 40): string {
  const t = (text ?? '').replace(/\s+/gu, ' ').trim();
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

/** מספר "לא-נקרא" לצד נתון (לתג-מונה). לא-שלילי; חסר ⇒ 0. */
export function supportUnread(thread: SupportThread | null | undefined, side: SupportSide): number {
  if (!thread) return 0;
  const n = side === 'admin' ? thread.unreadAdmin : thread.unreadUser;
  return typeof n === 'number' && n > 0 ? n : 0;
}

/* ───────────── 💬 צ׳אט-צוות תוך-ארגוני (17.8) — קבוצתי, כל הצוות בערוץ אחד ─────────────
 * שונה מצ׳אט-התמיכה: אין 'from' דו-ערכי אלא `sender` (מייל, זהות) + `name` (תצוגה);
 * "שלי" = sender==המייל-שלי. אותם עזרי-זמן/ניקוי. Path: teamChats/{slug}/messages. */
export interface TeamMsg {
  sender: string; // מייל-השולח (זהות יציבה)
  name: string; // שם-תצוגה (למשל קידומת-המייל)
  text: string;
  at: string; // ISO
}

/** מיון הודעות-צוות לפי זמן עולה — יציב, לא-משנה-מקור. */
export function sortTeamMsgs(msgs: TeamMsg[]): TeamMsg[] {
  return [...msgs].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
}

/**
 * 🔴 מונה הודעות-צוות שלא-נקראו (לחיווי על-המסך, בקשת-בעלים 30.8) — נגזרת טהורה:
 * כל הודעה שזמנה **אחרי** סימן-הנקרא (`lastReadIso`) ו**אינה שלי** (sender≠myEmail).
 * דטרמיניסטי (בלי Date.now); myEmail מושווה case-insensitive; חסר-סימן ⇒ הכול-חדש
 * (למעט שלי). ההודעות-שלי לעולם לא נספרות כלא-נקראות.
 */
export function teamUnreadCount(msgs: TeamMsg[], lastReadIso: string, myEmail: string): number {
  const mine = (myEmail || '').toLowerCase();
  const since = lastReadIso || '';
  let n = 0;
  for (const m of msgs) {
    if ((m.sender ?? '').toLowerCase() === mine) continue;
    if ((m.at || '') > since) n++;
  }
  return n;
}

/** הזמן האחרון בין הודעות-צוות (לסימון-נקרא) — '' כשאין הודעות. */
export function latestTeamAt(msgs: TeamMsg[]): string {
  let mx = '';
  for (const m of msgs) if ((m.at || '') > mx) mx = m.at;
  return mx;
}

/** מיון רשימת-שיחות (לוח-הבקרה): לא-נקראות-לתמיכה קודם, ואז לפי lastAt יורד. */
export function sortSupportThreads(
  threads: Array<SupportThread & { uid: string }>,
): Array<SupportThread & { uid: string }> {
  return [...threads].sort((a, b) => {
    const ua = supportUnread(a, 'admin');
    const ub = supportUnread(b, 'admin');
    if ((ua > 0) !== (ub > 0)) return ua > 0 ? -1 : 1; // לא-נקרא ראשון
    const la = a.lastAt ?? '';
    const lb = b.lastAt ?? '';
    return la < lb ? 1 : la > lb ? -1 : 0; // חדש ראשון
  });
}
