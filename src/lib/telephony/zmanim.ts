// ─────────────────────────────────────────────────────────────────────────────
// Bridge (slim): maor → telephony/lib/zmanim.mjs בלבד.
//
// לילה 11.11.2026: ווידג'ט-הבית "זמני שבת/חג" ייבא את nextClosure דרך engine.ts, שמייבא
// גם את index/validate/generate/simulate/report — ‏~90KB גולמי של מנוע-הטלפוניה ישב בבנדל-
// הכניסה (rollup לא מנער .mjs עם קוד ברמה-העליונה). כאן רק מנוע-הזמנים (+hebcal/config
// שהוא תלוי בהם). engine.ts מייצא-מחדש מכאן ⇒ אותם אובייקטים בדיוק, אפס שינוי-התנהגות.
// ─────────────────────────────────────────────────────────────────────────────

// @ts-expect-error — untyped .mjs resolved on disk (TS7016); typed via the casts below.
import { hebrewClosedWindows as rawHebrewClosedWindows, CITIES as rawCITIES } from '../../../telephony/lib/zmanim.mjs';

/** חלון-סגירה הלכתי מדויק — הדלקת-נרות (startTime) → צאת (endTime), עם הסיבה. */
export interface ClosedWindow {
  startIso: string;
  startTime: string;
  endIso: string;
  endTime: string;
  reason: string;
  kind: string;
  days: number;
}
export const hebrewClosedWindows = rawHebrewClosedWindows as (
  fromIso: string,
  windowDays: number,
  tenant: unknown,
  opt?: Record<string, unknown>,
) => ClosedWindow[];

/** נ״צ עיר-עוגן לזמנים (שם-עברי + מנהג הדלקה בדקות לפני-שקיעה). */
export interface CityGeo {
  he: string;
  lat: number;
  lon: number;
  candle: number;
}
export const CITIES = rawCITIES as Record<string, CityGeo>;
