/**
 * 🔨 מפתח-ההתאמה של המד (ATOMS-DECOMPOSE, 14.10.2026) — לא קובץ-בדיקה.
 * לכל אחד מ-27 המקומות שפורקו **ביד** (zmanim · whatNeed · bookings): אילו מקומות/פונקציות של המפרק נחשבים "מצא אותו".
 * הכלל: אותו מקור-נתונים ואותו סוג (הסוג נבדק ב-`recall`). מקום-יד שהמפרק לא יכול למצוא (נגזרת של כמה נתונים, הגדרה ב-ui,
 * חישוב שמש) — ברשימה ריקה, וזה נספר כ"לא נמצא". כתוב ביד אחרי קריאת שני הצדדים; כל שורה = טענה שאפשר לבדוק.
 */
import type { RecallKey } from '../meter';

export const RECALL_KEYS: readonly RecallKey[] = [
  // 🕯️ מחשבון הזמנים — פונקציות-גישה של zmanimBoard.ts
  { hand: 'zmanim.day', any: ['zmanimBoard.fn.dayTimes'] }, // נץ⇢שקיעה
  { hand: 'zmanim.shabbat', any: ['zmanimBoard.fn.shabbatOf'] }, // הדלקה⇢צאת
  { hand: 'zmanim.times', any: ['zmanimBoard.fn.dayZmanim', 'zmanimBoard.fn.markZmanim'] },
  { hand: 'zmanim.closedDays', any: ['zmanimBoard.fn.upcomingClosures'] },
  // 📒 "מה צריך?" — ישויות פרנסה׳לע
  { hand: 'whatNeed.requests', any: ['parnasa.prRequests.@?waiting'] },
  { hand: 'whatNeed.text', any: ['parnasa.prRequests.text'] },
  { hand: 'whatNeed.names', any: ['parnasa.prListings.name', 'parnasa.prListings.desc'] },
  { hand: 'whatNeed.hours', any: ['parnasa.prListings.hours[].from~to'] },
  { hand: 'whatNeed.openings', any: ['parnasa.prListings.hours[].from', 'parnasa.prListings.hours[].to'] },
  { hand: 'whatNeed.adSlot', any: ['parnasa.prAds.@seq'] },
  { hand: 'whatNeed.adPrice', any: ['parnasa.prAds.price'] },
  // 🛏️ מנהל ההזמנות — ישויות האירוח + פונקציות-גישה של transitions.ts
  { hand: 'bookings.turnover', any: [] }, // הגדרה ב-db.ui.hosting — לא אוסף
  { hand: 'bookings.day', any: [] }, // "יום עבודה" — מושג, לא נתון
  { hand: 'bookings.stay', any: ['hosting.hostBookings.checkIn~checkOut'] },
  { hand: 'bookings.balance', any: ['hosting.fn.bookingBalance'] },
  { hand: 'bookings.total', any: ['hosting.fn.bookingTotal'] },
  { hand: 'bookings.untilArrival', any: [] }, // נגזרת: מהיום עד הכניסה
  { hand: 'bookings.nights', any: [] }, // נגזרת: תפוסה לילה-לילה
  { hand: 'bookings.guestStays', any: ['hosting.hostBookings.guestId@seq'] },
  { hand: 'bookings.unitStays', any: ['hosting.hostBookings.unitId@seq'] },
  { hand: 'bookings.sacredDays', any: [] }, // לוח עברי — לא נתון של המודול
  { hand: 'bookings.unitFaults', any: ['hosting.hostRecords:fault.unitId@seq'] },
  { hand: 'bookings.arrivals', any: ['hosting.hostBookings.checkIn'] },
  { hand: 'bookings.cleaning', any: ['hosting.hostRecords:clean.@?waiting'] },
  { hand: 'bookings.faults', any: ['hosting.hostRecords:fault.@?waiting'] },
  { hand: 'bookings.unpaid', any: [] }, // נגזרת: יתרה > 0
  { hand: 'bookings.guests', any: ['hosting.hostRecords:guest.name', 'hosting.hostUnits.name'] },
];
