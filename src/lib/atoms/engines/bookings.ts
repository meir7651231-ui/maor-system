/**
 * 🛏️ מנוע ההזמנות — כרטיס-מנוע (ATOMS-ENGINES, 14.10.2026).
 * פירוק עצמאי מ-src/components/hosting/transitions.ts ו-lib.ts (המיקום בהערה ליד כל חלק).
 * נתונים בלבד — בלי חישוב, בלי store/DOM. הקריאה מהנתונים האמיתיים — bookingsData.ts.
 */
import type { EngineCard } from '../contract';

export const BOOKINGS_CARD: EngineCard = {
  id: 'bookings',
  name: 'מנוע ההזמנות',
  emoji: '🛏️',
  from: 'אירוח משפחתי',
  computes: 'מנהל יחידות ולילות: בודק זמינות, מתמחר, עוקב אחרי תשלום, הגעה, עזיבה, ניקיון ותקלות.',
  parts: [
    // transitions.ts:84 nightsBetween · :90 addDaysIso
    { num: 1, name: 'לילות בין תאריכים', computes: 'סופר כמה לילות יש בין תאריך כניסה לתאריך יציאה.' },
    // transitions.ts:96 overlaps
    { num: 2, name: 'חפיפה', computes: 'אומר אם שתי שהיות נופלות על אותו לילה.' },
    // transitions.ts:178 occupiedRoomIds · :201 checkAvailability
    { num: 3, name: 'זמינות', computes: 'בודק אם יחידה או חדרים בה פנויים בתאריכים, כולל יחידה חסומה בתקלה.' },
    // transitions.ts:235 priceQuote · :260 withSystemCharges
    { num: 4, name: 'הצעת מחיר', computes: 'לינה (מחיר כפול לילות) ועוד דמי ניקיון ועוד מע״מ, מעוגל.' },
    // transitions.ts:125 bookingTotal · :128 bookingPaid · :131 bookingBalance
    { num: 5, name: 'יתרה', computes: 'כמה חויב, כמה שולם, וכמה נשאר לשלם בכל הזמנה.' },
    // transitions.ts:361 canSetBookingStatus
    { num: 6, name: 'מכונת סטטוס', computes: 'ממתינה ⇐ מאושרת ⇐ בשהייה ⇐ הושלמה, או בוטלה; מה מותר לעבור למה.' },
    // lib.ts:121 arrivalsOn · :129 departuresOn
    { num: 7, name: 'הגעות ועזיבות', computes: 'מי מגיע ומי עוזב היום, כולל מי שמאחר.' },
    // lib.ts:100 unitLiveStatus
    { num: 8, name: 'מצב יחידה עכשיו', computes: 'חסומה, תפוסה, לניקיון או פנויה — ברגע הזה.' },
    // lib.ts:319 sacredDayOf · :338 arrivalWarnings
    { num: 9, name: 'אזהרת שבת וחג', computes: 'מזהיר כשכניסה או עזיבה נופלות בשבת או ביום טוב.' },
    // transitions.ts:370 AFTER_CHECKOUT_CLEAN · :420 unitFreeAfter · :434 releasedUnitStatus
    { num: 10, name: 'ניקיון אחרי עזיבה', computes: 'עזיבה פותחת משימת ניקיון, והיחידה משתחררת רק כשאין משימה פתוחה.' },
    // transitions.ts:441 faultBlocksUnit · :453 otherBlockingFault
    { num: 11, name: 'תקלה חוסמת', computes: 'תקלה דחופה (P0/P1) חוסמת יחידה עד שכל התקלות החוסמות בה נסגרות.' },
    // lib.ts:416 calendarBars
    { num: 12, name: 'פסי יומן', computes: 'מצייר כל שהייה כפס על הימים, ומפריד שהיות חופפות לנתיבים.' },
    // lib.ts:137 openBalances
    { num: 13, name: 'יתרות פתוחות', computes: 'כל הזמנה עם חוב, גם אחרי עזיבה, מהחוב הגדול לקטן.' },
  ],
  places: [
    {
      id: 'bookings.turnover',
      engine: 'bookings',
      name: 'החלון בין עזיבה לכניסה (11:00 עד 15:00 כברירת מחדל)',
      kind: 'span',
      results: { divide: 'חלון הניקיון מחולק לתורנויות שוות בין המנקים' },
    },
    {
      id: 'bookings.day',
      engine: 'bookings',
      name: 'יום עבודה',
      kind: 'span',
      results: { divide: 'תורים שווים ביום (קבלת אורחים, סיור ביחידה)' },
    },
    {
      id: 'bookings.stay',
      engine: 'bookings',
      name: 'התאריכים של הזמנה אחת',
      kind: 'span',
      results: { divide: 'ניקיון באמצע שהייה ארוכה (השהייה מחולקת לחלקים שווים)' },
    },
    {
      id: 'bookings.balance',
      engine: 'bookings',
      name: 'היתרה לתשלום של הזמנה',
      kind: 'amount',
      results: {
        divide: 'היתרה בתשלומים שווים',
        round: 'היתרה מעוגלת לשקל שלם',
      },
    },
    {
      id: 'bookings.total',
      engine: 'bookings',
      name: 'המחיר הכולל של הזמנה',
      kind: 'amount',
      results: {
        divide: 'מחיר לאדם או ללילה',
        round: 'מחיר עגול להצעה',
      },
    },
    {
      id: 'bookings.untilArrival',
      engine: 'bookings',
      name: 'הזמן מהיום עד הכניסה',
      kind: 'span',
      results: { divide: 'מועדי תשלום או תזכורות במרווחים שווים עד ההגעה' },
    },
    {
      id: 'bookings.nights',
      engine: 'bookings',
      name: 'הלילות של כל יחידה, פנוי או תפוס',
      kind: 'sequence',
      results: {
        merge: 'פנוי 3 לילות ברצף',
        next: 'הלילה הפנוי הבא ביחידה',
      },
    },
    {
      id: 'bookings.guestStays',
      engine: 'bookings',
      name: 'ההזמנות של כל אורח, לפי תאריך',
      kind: 'sequence',
      results: { merge: 'הזמנות צמודות של אותו אורח = שהייה אחת' },
    },
    {
      id: 'bookings.unitStays',
      engine: 'bookings',
      name: 'ההזמנות של כל יחידה, לפי תאריך',
      kind: 'sequence',
      results: {
        merge: 'הזמנות צמודות ביחידה = רצף אחד עם חלון ניקיון בין עזיבה לכניסה',
        next: 'ההזמנה הבאה ביחידה',
      },
    },
    {
      id: 'bookings.sacredDays',
      engine: 'bookings',
      name: 'ימי שבת וחג בשבועות הקרובים',
      kind: 'sequence',
      results: {
        merge: 'חגים ושבת צמודים = חלון סגור אחד',
        next: 'השבת או החג הבא שבו יש אורחים',
      },
    },
    {
      id: 'bookings.unitFaults',
      engine: 'bookings',
      name: 'התקלות הפתוחות של כל יחידה',
      kind: 'sequence',
      results: { merge: 'כמה תקלות פתוחות ביחידה = חסימה אחת עד שהאחרונה נסגרת' },
    },
    {
      id: 'bookings.arrivals',
      engine: 'bookings',
      name: 'מועדי ההגעה',
      kind: 'times',
      results: {
        next: 'ההגעה הבאה שעוד לא הגיעה',
        offset: 'תזכורת יום לפני כל הגעה',
        round: 'שעת הגעה מעוגלת לחצי שעה',
      },
    },
    {
      id: 'bookings.cleaning',
      engine: 'bookings',
      name: 'משימות ניקיון פתוחות',
      kind: 'waiting',
      results: {
        escalate: 'עוברת למנקה הבא אם אין אישור',
        rotate: 'כל משימת ניקיון חדשה למנקה הבא בתור',
      },
    },
    {
      id: 'bookings.faults',
      engine: 'bookings',
      name: 'תקלות פתוחות',
      kind: 'waiting',
      results: {
        escalate: 'תקלה בלי טיפול עוברת לאחראי הבא',
        rotate: 'תקלות בתורות בין אנשי התחזוקה',
      },
    },
    {
      id: 'bookings.unpaid',
      engine: 'bookings',
      name: 'יתרות פתוחות',
      kind: 'waiting',
      results: {
        escalate: 'יתרה שלא נסגרה עוברת מתזכורת לאורח למנהל',
        rotate: 'הגבייה מתחלקת בתורות בין אנשי הצוות',
      },
    },
    {
      id: 'bookings.guests',
      engine: 'bookings',
      name: 'שמות האורחים והיחידות',
      kind: 'text',
      results: { fuzzy: 'מוצא אורח או יחידה גם עם שגיאת כתיב' },
    },
  ],
};
