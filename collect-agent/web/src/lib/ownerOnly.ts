// פעולות שהשרת מתיר לבעל העסק בלבד (403 לעובד/ת) — כדי שהמסך לא יציע לעובד/ת כפתור שייכשל.
// מבקר 195: «↻ חידוש תזכורות» על השהיית-בעלים (critic 191א). הכרעת ראש צוות (ממצא QA 20.11): ייצוא נתוני לקוח.
import type { Me } from '../api.ts';
import { settingsOwnerOnly } from './settings.ts';

/** = app/policy.py OWNER_HOLDS (נבדק מול המקור ב-tests/test_owner_only_ui_sync.py) */
export const OWNER_HOLDS: readonly string[] = ['minor', 'deceased', 'insolvency'];
export const OWNER_ONLY_TAG = '🔒 בעל העסק בלבד';

/** עובד/ת מחובר/ת שאינו/ה בעל העסק. me=null (מוק/לפני טעינה) ⇒ לא נועלים; השרת אוכף בכל מקרה. */
export const isStaff = (me: Me | null) => settingsOwnerOnly(me);
/** חידוש השהיה נעול לעובד/ת כשזו השהיה שבעל העסק סימן (קטין / פטירה / חדלות פירעון). */
export const resumeLocked = (me: Me | null, paused: string | null | undefined) =>
  isStaff(me) && OWNER_HOLDS.includes((paused ?? '').split(':')[0]);
/** ייצוא כל נתוני לקוח — בעל העסק בלבד. */
export const exportLocked = (me: Me | null) => isStaff(me);
