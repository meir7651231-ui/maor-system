// ─────────────────────────────────────────────────────────────────────────────
// telephony · closure — "זמני שבת/חג" לווידג'ט-הבית, על מנוע-הזמנים בלבד.
//
// לילה 11.11.2026: נפרד מ-./lib (שמייבא את כל מנוע-הטלפוניה לאשף) כדי שבנדל-הכניסה
// יכיל רק את zmanim/hebcal. אותה פונקציה בדיוק — הבדיקות ב-__tests__/lib.test.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { hebrewClosedWindows, CITIES } from '../../lib/telephony/zmanim';
import type { OrgConfig } from '../../types/config';

/** סגירה-קרובה (שבת/חג) לתצוגת-בית: הדלקת-נרות, צאת, סיבה ועיר-העוגן. */
export interface NextClosure {
  reason: string;
  kind: string;
  startIso: string;
  candle: string;
  endIso: string;
  tzeis: string;
  cityHe: string;
}

/**
 * הסגירה ההלכתית הבאה (שבת/יו״ט) בחלון 10 הימים הקרובים — לווידג'ט-הבית
 * "זמני שבת/חג". רץ על מנוע-הזמנים הטהור (NOAA, חישוב-מקומי בלבד — downstream,
 * אין ספק/שירות). דורש עיר-עוגן; בלי telephony ⇒ null (אין נ״צ). דטרמיניסטי.
 * @param config קונפיג-הארגון (config.telephony.city) @param todayIso עוגן היום
 */
export function nextClosure(config: OrgConfig, todayIso: string): NextClosure | null {
  const tel = config.telephony;
  if (!tel) return null;
  const city = tel.city || 'default';
  const tenant = { city, timezone: 'Asia/Jerusalem' };
  const wins = hebrewClosedWindows(todayIso, 10, tenant, {});
  const w = wins[0];
  if (!w) return null;
  const cityHe = (tel.city && CITIES[tel.city]) ? CITIES[tel.city].he : CITIES.jerusalem.he;
  return { reason: w.reason, kind: w.kind, startIso: w.startIso, candle: w.startTime, endIso: w.endIso, tzeis: w.endTime, cityHe };
}
