// מבקר 195ג (+194): פעולות של בעל העסק בלבד — המסך מסמן אותן לעובד/ת מראש (נעול + «🔒 בעל העסק בלבד»),
// במקום שהעובד/ת ילחץ/תלחץ פעמיים ויקבל/תקבל 403. השרת הוא שאוכף (`request.state.is_owner`); כאן רק התצוגה.
// me=null (מוק / לפני טעינה) ⇒ לא נועלים — השרת מחליט. טהור — נבדק ב-tests/lib.check.ts.
import type { Me } from '../api.ts';
import { exportOwnerOnly } from './dataExport.ts';

/** עובד/ת מחובר/ת שאינו/ה בעל העסק (אותו כלל כמו settingsOwnerOnly במסך ההגדרות). */
export const isStaff = (me: Me | null | undefined) => me?.kind === 'user' && me.owner !== true;

/** השהיות שבעל העסק סימן — app/policy.py OWNER_HOLDS (ר-6, «השהיה קשה»): רק הוא מבטל (מבקר 191א). */
export const OWNER_HOLDS = ['minor', 'deceased', 'insolvency'] as const;
export const isOwnerHold = (paused: string | null | undefined) =>
  (OWNER_HOLDS as readonly string[]).includes((paused ?? '').split(':', 1)[0]);

/** «↻ חידוש» על השהיית-בעלים — נעול לעובד/ת. */
export const resumeLocked = (me: Me | null | undefined, paused: string | null | undefined) => isStaff(me) && isOwnerHold(paused);
/** שם היסטורי (מבקר 195, Dashboard) — מנהל 348: lib/ownerOnly.ts אוחד לכאן, מקור יחיד. */
export const resumeOwnerOnly = resumeLocked;
/** מבקר 195א: «✓ טופל» על התראת-הביטחון «הגדרות רגישות שונו» — בעל העסק בלבד (השרת: 403 OwnerOnly). */
export const OWNER_ONLY_NOTICES = ['settings_changed'] as const;
export const noticeDoneLocked = (me: Me | null | undefined, intent: string | null | undefined) =>
  isStaff(me) && (OWNER_ONLY_NOTICES as readonly string[]).includes(intent ?? '');
/** ייצוא כל המידע על לקוח (זכות עיון) — בעל העסק בלבד. */
export const exportLocked = (me: Me | null | undefined) => exportOwnerOnly(me ?? null);   // מקור יחיד: lib/dataExport.ts
/** סגירת בקשת **מחיקה** במרשם (מאשרת שהמידע נמחק) — בעל העסק בלבד. עיון/תיקון — פתוח לכולם. */
export const dsrCloseLocked = (me: Me | null | undefined, kind: string) => isStaff(me) && kind === 'deletion';

/** מבקר 201: «בדוק ואשר» על מועד הבטחה שמעבר ל-14 יום (q21-19) — הכרעת בעל העסק בלבד (השרת: 403). */
export const promiseDecisionLocked = (me: Me | null | undefined) => isStaff(me);

export const OWNER_ONLY_TEXT = '🔒 בעל העסק בלבד';
export const OWNER_ONLY_TAG = OWNER_ONLY_TEXT;
