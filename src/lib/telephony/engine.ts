// ─────────────────────────────────────────────────────────────────────────────
// Bridge: the maor React app → the pure telephony engine (telephony/lib, browser-safe ESM).
//
// The engine is authored + hardened as .mjs under telephony/ (677 tests, 5 golden sets).
// TypeScript resolves those real .mjs files on disk, so an ambient `declare module` never
// wins over them (a wildcard only fills in for *unresolved* specifiers). The robust seam is
// therefore right here: import the untyped functions (one @ts-expect-error per specifier to
// swallow the "no declaration file" TS7016), then re-export them through explicit typed
// signatures. Downstream (components/telephony/lib.ts + the wizard) sees real types.
//
// The engine invariant (the moat) is unchanged: pure-downstream, no provider/API/trunk,
// no tax-receipt issuance. This file only bridges — it adds no behavior.
// ─────────────────────────────────────────────────────────────────────────────

// @ts-expect-error — untyped .mjs resolved on disk (TS7016); typed via the casts below.
import { validateTenant as rawValidateTenant, buildTenant as rawBuildTenant } from '../../../telephony/lib/index.mjs';
// @ts-expect-error — untyped .mjs resolved on disk (TS7016); typed via the casts below.
import { simulateCall as rawSimulateCall, explainCall as rawExplainCall } from '../../../telephony/lib/simulate.mjs';
// @ts-expect-error — untyped .mjs resolved on disk (TS7016); typed via the casts below.
import { trustReport as rawTrustReport } from '../../../telephony/lib/report.mjs';
// @ts-expect-error — untyped .mjs resolved on disk (TS7016); typed via the casts below.
import { hebrewClosedWindows as rawHebrewClosedWindows, CITIES as rawCITIES } from '../../../telephony/lib/zmanim.mjs';
// 📒 פרנסה׳לע (12.10) — re-exports **אדיטיביים** לזמני-היום/השבוע של לוח-הקהילה והחוברת.
// זהים-מקור: אותו מנוע (zmanim.mjs/hebcal.mjs/config.mjs) שכבר בבנדל דרך nextClosure — אפס
// התנהגות-חדשה, אפס נגיעה ב-.mjs (golden-suite). שני הייבואים למטה = מפרט-הטיפוס בלבד.
// @ts-expect-error — untyped .mjs resolved on disk (TS7016); typed via the casts below.
import { sunrise as rawSunrise, sunset as rawSunset, shabbatTimes as rawShabbatTimes, geoOf as rawGeoOf } from '../../../telephony/lib/zmanim.mjs';
// @ts-expect-error — untyped .mjs resolved on disk (TS7016); typed via the casts below.
import { classifyDay as rawClassifyDay, hebParts as rawHebcalParts } from '../../../telephony/lib/hebcal.mjs';
// @ts-expect-error — untyped .mjs resolved on disk (TS7016); typed via the casts below.
import { isDiaspora as rawIsDiaspora } from '../../../telephony/lib/config.mjs';

/** תוצאת אימות-דייר — ok + שגיאות/אזהרות + הדייר המנורמל (עובר לסימולטור). */
export interface ValidateResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  tenant: unknown;
}

/** תוצאת בניית-קונפיג — קבצי-ה-PBX (path→תוכן) + manifest, כשה-ok. */
export interface BuildResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  files?: Record<string, string>;
  manifest?: Record<string, unknown>;
  tenant?: unknown;
}

/** תוצאת סימולציית-שיחה — המסלול שהמנוע יבחר + התוצאה. */
export interface SimResult {
  path: string[];
  outcome: string;
  reason?: string;
}

/** תיאור-שיחה קריא-לאדם (סיכום עברי + שורות-הסבר). */
export interface ExplainResult {
  outcome: string;
  reason: string;
  summary: string;
  lines: string[];
  sim: unknown;
}

/** בדיקה בודדת בדוח-האמון. */
export interface TrustCheck {
  key: string;
  label: string;
  pass: boolean;
  severity: string;
  detail: string;
}

/** דוח-אמון — ציון A–F, מוכנות-להפעלה, ורשימת-הכשלים. */
export interface TrustResult {
  tenantId: string;
  checks: TrustCheck[];
  failing: TrustCheck[];
  score: number;
  grade: string;
  ready: boolean;
}

export const validateTenant = rawValidateTenant as (raw: unknown) => ValidateResult;
export const buildTenant = rawBuildTenant as (
  raw: unknown,
  opts?: { anchorDate?: string; calendarWindow?: number },
) => BuildResult;
export const simulateCall = rawSimulateCall as (
  tenant: unknown,
  call?: Record<string, unknown>,
  opts?: Record<string, unknown>,
) => SimResult;
export const explainCall = rawExplainCall as (
  tenant: unknown,
  call?: Record<string, unknown>,
  opts?: Record<string, unknown>,
) => ExplainResult;
export const trustReport = rawTrustReport as (bundle: unknown, opt?: Record<string, unknown>) => TrustResult;

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

/* ── 📒 re-exports אדיטיביים (פרנסה׳לע, 12.10) — חתימות-טיפוס בלבד מעל אותו מנוע ── */

/** שעת-זריחה/שקיעה מקומית "HH:MM" (זניט 90.833°, DST דרך Intl) לתאריך+נ״צ+אזור-זמן; null בקוטב. */
export const sunrise = rawSunrise as (iso: string, lat: number, lon: number, tz?: string) => string | null;
export const sunset = rawSunset as (iso: string, lat: number, lon: number, tz?: string) => string | null;

/** זמני-שבת/חג לתאריך: שקיעה, הדלקת-נרות (שקיעה−candle) וצאת (שקיעה+tzeis, ברירת 40). */
export interface ShabbatTimes {
  sunset: string;
  candle: string;
  tzeis: string;
}
export const shabbatTimes = rawShabbatTimes as (iso: string, tenant: unknown, opt?: { tzeis?: number }) => ShabbatTimes | null;

/** גיאו אפקטיבי: tenant.geo{lat,lon,candle?} גובר, אחרת עיר, אחרת ברירת-מחדל (ירושלים). */
export const geoOf = rawGeoOf as (tenant: unknown) => CityGeo;

/** סיווג-יום עברי מלא (Intl בלבד): שבת/יו״ט/ערב-חג/חוה״מ/צום/ר״ח + סיבת-סגירה. */
export interface DayClass {
  iso: string;
  monthHe: string;
  day: number;
  dow: number;
  shabbat: boolean;
  yomTov: string | null;
  erevChag: string | null;
  cholHamoed: string | null;
  fast: string | null;
  roshChodesh: boolean;
  name: string | null;
  closedReason: string | null;
}
export const classifyDay = rawClassifyDay as (iso: string, opt?: { diaspora?: boolean; tz?: string }) => DayClass;

/** חלקי-התאריך-העברי לתאריך ISO (בצהריים, באזור-הזמן הנתון — דטרמיניסטי, בלי שעון-המכשיר). */
export interface HebcalParts {
  day: number;
  monthName: string;
  monthHe: string;
  year: number;
  dow: number;
}
export const hebcalParts = rawHebcalParts as (iso: string, tz?: string) => HebcalParts;

/** האם אזור-הזמן מחוץ לישראל (יו״ט שני של גלויות) — ההכרעה המרוכזת של המנוע. */
export const isDiaspora = rawIsDiaspora as (tz?: string) => boolean;
