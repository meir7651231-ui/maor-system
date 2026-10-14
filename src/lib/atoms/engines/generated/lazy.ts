/**
 * 🔨 טעינה עצלה, מנוע-מנוע — נוצר אוטומטית ע״י המפרק — לא לערוך ידנית. להרצה מחדש: node scripts/atoms-decompose.mjs
 * כל מנוע ב-chunk משלו: הארגז טוען רק את המנוע שנבחר (במקום את כולם יחד דרך index.ts).
 */
import type { GenEngine } from '../../decompose/types';

export const GENERATED_IDS = ["calendar","courses","diary","families","home","hosting","parnasa","platform","shop","shop7","shop8","supporters","telephony","timer","tzedaka","wall","zmanimBoard"] as const;

export const GENERATED_LOADERS: Readonly<Record<string, () => Promise<GenEngine>>> = {
  calendar: () => import('./calendar').then((m) => m.GEN_CALENDAR),
  courses: () => import('./courses').then((m) => m.GEN_COURSES),
  diary: () => import('./diary').then((m) => m.GEN_DIARY),
  families: () => import('./families').then((m) => m.GEN_FAMILIES),
  home: () => import('./home').then((m) => m.GEN_HOME),
  hosting: () => import('./hosting').then((m) => m.GEN_HOSTING),
  parnasa: () => import('./parnasa').then((m) => m.GEN_PARNASA),
  platform: () => import('./platform').then((m) => m.GEN_PLATFORM),
  shop: () => import('./shop').then((m) => m.GEN_SHOP),
  shop7: () => import('./shop7').then((m) => m.GEN_SHOP7),
  shop8: () => import('./shop8').then((m) => m.GEN_SHOP8),
  supporters: () => import('./supporters').then((m) => m.GEN_SUPPORTERS),
  telephony: () => import('./telephony').then((m) => m.GEN_TELEPHONY),
  timer: () => import('./timer').then((m) => m.GEN_TIMER),
  tzedaka: () => import('./tzedaka').then((m) => m.GEN_TZEDAKA),
  wall: () => import('./wall').then((m) => m.GEN_WALL),
  zmanimBoard: () => import('./zmanimBoard').then((m) => m.GEN_ZMANIM_BOARD),
};
