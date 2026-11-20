// ─────────────────────────────────────────────────────────────────────────────
// סגירה-הלכתית קרובה (שבת/חג) לווידג'ט-הבית — גשר **דק** למנוע-הזמנים בלבד.
//
// ⚡ 20.11.2026 (bundle-split שלב ב׳): nextClosure ישב ב-components/telephony/lib.ts, שמייבא
// את engine.ts ⇒ index.mjs (מחולל) + simulate.mjs + report.mjs. כיוון ש-home/widgets.tsx (בבנדל
// הראשי) צריך רק את nextClosure — כל מנוע-הטלפוניה נגרר לכל כניסה. כאן: רק zmanim.mjs
// (+hebcal/config שלו). גוף-הפונקציה זהה בית-בבית (ratchet השוואה מול engine).
// components/telephony/lib.ts מייצא-מחדש את nextClosure מכאן — ה-API לא השתנה.
// ─────────────────────────────────────────────────────────────────────────────
import type { OrgConfig } from '../../types/config';
import type { ClosedWindow, CityGeo } from './engine';
// @ts-expect-error — untyped .mjs resolved on disk (TS7016); typed via the casts below.
import { hebrewClosedWindows as rawHebrewClosedWindows, CITIES as rawCITIES } from '../../../telephony/lib/zmanim.mjs';

const hebrewClosedWindows = rawHebrewClosedWindows as (
  fromIso: string,
  windowDays: number,
  tenant: unknown,
  opt?: Record<string, unknown>,
) => ClosedWindow[];
const CITIES = rawCITIES as Record<string, CityGeo>;

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
