// גבי עיצוב: תוספות מעל lib/ownerOnly.ts (מקור יחיד ל-isStaff / OWNER_HOLDS / resumeLocked — מבקר 195):
// ייצוא (lib/dataExport.ts exportOwnerOnly) וסגירת בקשת **מחיקה** במרשם — בעל העסק בלבד. טהור.
import type { Me } from '../api.ts';
import { exportOwnerOnly } from './dataExport.ts';
import { isStaff, OWNER_HOLDS, OWNER_ONLY_TAG, resumeLocked } from './ownerOnly.ts';

export { isStaff, OWNER_HOLDS, OWNER_ONLY_TAG, resumeLocked };
export const isOwnerHold = (paused: string | null | undefined) => OWNER_HOLDS.includes((paused ?? '').split(':', 1)[0]);
/** ייצוא כל המידע על לקוח (זכות עיון) — בעל העסק בלבד. */
export const exportLocked = (me: Me | null | undefined) => exportOwnerOnly(me ?? null);
/** סגירת בקשת **מחיקה** (מאשרת שהמידע נמחק) — בעל העסק בלבד. עיון/תיקון — פתוח לכולם. */
export const dsrCloseLocked = (me: Me | null | undefined, kind: string) => isStaff(me ?? null) && kind === 'deletion';
