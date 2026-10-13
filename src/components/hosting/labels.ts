/**
 * 🏡 אירוח משפחתי — תוויות, צבעים ורשימות-הבחירה של האפליקציה המקורית, מילה במילה (אשכול 5).
 * הצבעים — טוקני-הסקין (var(--h-…)) של "Aurora Glass" (hosting.css), כך שהם מתחלפים עם הערכה.
 * טהור (בלי store/DOM) — נבדק בהגנות-המקור של hosting-shell.test.
 */
import type { HostBookingStatus, HostFaultStatus, HostMealStatus, HostShabbatMode } from '../../types/domain';
import type { HostLiveStatus } from './lib';

/** לשוניות-המודול (VIEWS במקור). flag = תת-הדגל שמגדר; manage = הרשאת-הגדרות. */
export type HostTab = 'dash' | 'cal' | 'res' | 'units' | 'guests' | 'clean' | 'kitchen' | 'shabbat' | 'maint' | 'reports' | 'set';

/** RES_ST: [תווית, מחלקת-pill, צבע]. */
export const RES_ST: Readonly<Record<HostBookingStatus, readonly [string, string, string]>> = {
  pending: ['ממתינה', 'st-pending', 'var(--h-warn)'],
  confirmed: ['מאושרת', 'st-confirmed', 'var(--h-info)'],
  in: ['בשהייה', 'st-in', 'var(--h-good)'],
  done: ['הושלמה', 'st-done', 'var(--h-faint)'],
  cancelled: ['בוטלה', 'st-cancelled', 'var(--h-crit)'],
};

/** U_LABEL: [תווית, מחלקה]. */
export const U_LABEL: Readonly<Record<HostLiveStatus, readonly [string, string]>> = {
  free: ['פנויה', 'u-free'],
  dirty: ['מלוכלכת', 'u-dirty'],
  blocked: ['חסומה', 'u-blocked'],
  occupied: ['תפוסה', 'u-occupied'],
};
export const U_SC: Readonly<Record<HostLiveStatus, string>> = {
  free: 'var(--h-good)',
  occupied: 'var(--h-info)',
  dirty: 'var(--h-amber)',
  blocked: 'var(--h-crit)',
};

/** KO_ST: [תווית, צבע]. */
export const KO_ST: Readonly<Record<HostMealStatus, readonly [string, string]>> = {
  new: ['חדש', 'var(--h-warn)'],
  prep: ['בהכנה', 'var(--h-info)'],
  qc: ['בקרת איכות', 'var(--h-violet)'],
  ready: ['מוכן', 'var(--h-good)'],
  served: ['נמסר', 'var(--h-faint)'],
  cancelled: ['בוטל', 'var(--h-crit)'],
};

export const KT_TYPES = ['בשרי', 'חלבי', 'פרווה', 'דגים', 'טבעוני', 'ללא גלוטן'] as const;
/** KT_META: [אמוג׳י, צבע] לסוג-מנה. */
export const KT_META: Readonly<Record<string, readonly [string, string]>> = {
  'בשרי': ['🥩', 'var(--h-crit)'],
  'חלבי': ['🧀', 'var(--h-info)'],
  'פרווה': ['🥗', 'var(--h-good)'],
  'דגים': ['🐟', 'var(--h-a4)'],
  'טבעוני': ['🌱', 'var(--h-brand)'],
  'ללא גלוטן': ['🌾', 'var(--h-amber)'],
};
export const ktMeta = (type: string): readonly [string, string] => KT_META[type] ?? ['🍽️', 'var(--h-brand)'];

export const K_ROLES = ['מנהל מטבח', 'טבח', 'טבח-משנה', 'קונדיטור', 'משגיח כשרות', 'עוזר מטבח', 'מלצר / מגיש', 'מוריד / פינוי', 'מסדר שולחן'] as const;
export const ROLE_EMO: Readonly<Record<string, string>> = {
  'מנהל מטבח': '👑',
  'טבח': '🧑‍🍳',
  'טבח-משנה': '🍳',
  'קונדיטור': '🧁',
  'משגיח כשרות': '✡️',
  'עוזר מטבח': '🧹',
  'מלצר / מגיש': '🍽️',
  'מוריד / פינוי': '🧽',
  'מסדר שולחן': '🪑',
};

/** סוגי משימת-ניקיון (taskModal). */
export const CLEAN_TYPES = ['ניקיון אחרי עזיבה', 'ניקיון יומי', 'החלפת מצעים', 'ניקיון עמוק', 'מילוי מוצרים'] as const;

/** MP — עדיפויות-תחזוקה: [קוד, תיאור, צבע]. */
export const MP: readonly (readonly [string, string, string])[] = [
  ['P0', 'סכנת חיים', 'var(--h-crit)'],
  ['P1', 'יחידה לא ראויה', 'var(--h-crit)'],
  ['P2', 'פגיעה בשירות', 'var(--h-warn)'],
  ['P3', 'תקלה רגילה', 'var(--h-info)'],
  ['P4', 'שיפור', 'var(--h-dim)'],
];
export const M_CAT = ['חשמל', 'מים', 'גז', 'ביוב', 'מיזוג/קירור', 'חימום/דוד', 'אינסטלציה', 'מנעולים', 'מעלית', 'כיבוי אש', 'גלאי עשן', 'בריכה', 'ציוד שבת', 'ריהוט', 'אחר'] as const;
export const M_ST: Readonly<Record<HostFaultStatus, readonly [string, string]>> = {
  open: ['פתוחה', 'var(--h-warn)'],
  inprogress: ['בטיפול', 'var(--h-info)'],
  done: ['טופלה', 'var(--h-faint)'],
};
export const CRITS = ['רגיל', 'גבוה', 'קריטי'] as const;
export const PM_FREQS = ['יומי', 'שבועי', 'חודשי', 'רבעוני', 'חצי-שנתי', 'שנתי', 'לפני שבת/חג', 'לפני קיץ', 'לפני חורף'] as const;

/** מדפי-הנלווים בעגלת-הקניות. */
export const SUP_CATS = ['שתייה', 'חד-פעמי', 'נלווה', 'אחר'] as const;

/** SB_MODE: [תווית, צבע]. */
export const SB_MODE: Readonly<Record<HostShabbatMode, readonly [string, string]>> = {
  off: ['כבוי', 'var(--h-dim)'],
  prep: ['הכנות', 'var(--h-warn)'],
  shabbat: ['שבת', 'var(--h-violet)'],
  motzash: ['מוצאי שבת', 'var(--h-info)'],
};
/** באנר-השבת בכל מסך (shabbatBanner). */
export const SB_BANNER: Readonly<Record<Exclude<HostShabbatMode, 'off'>, readonly [string, string]>> = {
  prep: ['🕯️ הכנות לשבת', 'var(--h-warn)'],
  shabbat: ['🕯️ מצב שבת פעיל · פעולות אוטומטיות מושהות', 'var(--h-violet)'],
  motzash: ['✨ מוצאי שבת · פעולות משוחררות', 'var(--h-info)'],
};

/** נקודות-המדידה (tempModal): [ערך, תווית]. */
export const TEMP_DEVICES: readonly (readonly [string, string])[] = [
  ['מקרר', 'מקרר (עד 5°)'],
  ['מקפיא', 'מקפיא (עד 15°-)'],
  ['חימום', 'חימום (מעל 63°)'],
];

/** צבע-רקע/מסגרת שקוף-למחצה מצבע-טוקן (color-mix של המקור). */
export const tint = (c: string, pct: number): string => 'color-mix(in srgb,' + c + ' ' + pct + '%,transparent)';
