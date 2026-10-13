/**
 * 📒 פרנסה׳לע — לוח-הזמנים של הקהילה (אשכול 3 · מנוע טהור: בלי store/DOM, בלי Date.now —
 * "עכשיו" תמיד מוזרק כ-epoch/שעון, כך שכל פלט דטרמיניסטי ונבדק-ביחידה).
 *
 * שימוש-חוזר במנוע-הזמנים הקיים (telephony/lib/zmanim.mjs + hebcal.mjs, golden-tested) דרך
 * re-exports אדיטיביים ב-lib/telephony/engine.ts — **בלי לגעת ב-.mjs**. תיקונים מול המקור:
 *   · אזור-הזמן של הקהילה (ברירת-מחדל Asia/Jerusalem) — לא שעון-המכשיר (clockAt).
 *   · התאריך העברי מתחלף בשקיעה (hebDateAt).
 *   · בשבת — זמני השבת **הנוכחית**, לא הבאה (shabbatOf; באג-הלוח-העצמאי במקור).
 *   · מניינים יחסיים לזמנים (sh±N / tz±N / nz±N) + מספרי-חירום (מד״א/הצלה/משטרה/כיבוי) כברירת-
 *     מחדל שהגבאי עורך (מודעות kind='emergency').
 * פשטות כנה (המנוע מחשב רק זניט 90.833°): עלות-השחר = 72 דק׳ לפני-הנץ (=בסיס-המג״א), צאת =
 * שקיעה + N דק׳ (ברירת 40, כמו צאת-השבת של המנוע); אין "משיכיר" (דורש זווית 11.5°); גובה נשמר
 * בהגדרות אך הזמנים מישוריים. עיגול לחומרא: סוף-זמן ⇒ מטה, זמן-התחלה ⇒ מעלה.
 */
import type { IsoDate, ParnasaZmanimPrefs, PrPost, TimeHM } from '../../types/domain';
import {
  CITIES,
  classifyDay,
  geoOf,
  hebcalParts,
  hebrewClosedWindows,
  isDiaspora,
  shabbatTimes,
  sunrise,
  type ClosedWindow,
  type DayClass,
} from '../../lib/telephony/engine';
import { gem, gemYear } from '../../lib/hebrew';

/** אזור-הזמן של הקהילה כשלא הוגדר אחר. */
export const PR_TZ = 'Asia/Jerusalem';
/** עיר-ברירת-המחדל לזמנים (המקור: "לפי אופק בני ברק · הגבאי יכול לשנות"). */
export const PR_DEFAULT_CITY = 'bneibrak';
/** דקות אחרי-השקיעה לצאת-הכוכבים/צאת-השבת כשלא הוגדר (ברירת המנוע והמקור). */
export const PR_TZEIS_MIN = 40;
/** דקות מג״א (עלות-השחר / סוף-היום) ורבנו-תם. */
export const PR_MGA_MIN = 72;
export const PR_RT_MIN = 72;
/** הערת-אמון הלכתית שמוצגת ליד כל טבלת-זמנים (רדיוס-האמון — zmanim.mjs:7-9). */
export const PR_ZMANIM_NOTE = 'הזמנים מחושבים לפי השמש (מישורי, בלי תיקון-גובה) · לשאלות הלכה יש לפנות לרב הקהילה';

/* ---------- מיקום ---------- */

/** מיקום-הזמנים האפקטיבי (אחרי ברירות-מחדל ואימות). */
export interface PrZmanimLoc {
  lat: number;
  lon: number;
  tz: string;
  candleMin: number;
  tzeisMin: number;
  /** שם-המקום לתצוגה ("לפי אופק …"). */
  label: string;
  /** נשמר בלבד — הזמנים מישוריים. */
  elevation: number;
  /** מפתח-העיר ממנוע-הזמנים ('' = נ"צ מותאם). */
  cityKey: string;
  /** מחוץ לישראל ⇒ יו״ט שני של גלויות. */
  diaspora: boolean;
}

const inRange = (v: unknown, min: number, max: number): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : undefined;

const tzCache = new Map<string, boolean>();
function tzValid(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !tz || tz.length > 64) return false;
  let ok = tzCache.get(tz);
  if (ok === undefined) {
    try {
      new Intl.DateTimeFormat('en', { timeZone: tz });
      ok = true;
    } catch {
      ok = false;
    }
    tzCache.set(tz, ok);
  }
  return ok;
}

/**
 * מיקום מהגדרות-הגבאי (db.ui.parnasa.zmanim): נ"צ מותאם (שניהם תקינים) גובר; אחרת עיר מטבלת-
 * המנוע; אחרת בני ברק. הדלקת-נרות: הגדרה ⇒ מנהג-העיר (נ"צ מותאם ⇒ ברירת המנוע). ערך פגום ⇒ ברירה.
 */
export function resolveZmanimLoc(z?: ParnasaZmanimPrefs | null): PrZmanimLoc {
  const tz = tzValid(z?.tz) ? (z!.tz as string) : PR_TZ;
  const lat = inRange(z?.lat, -90, 90);
  const lon = inRange(z?.lon, -180, 180);
  const candle = inRange(z?.candleMin, 0, 120);
  const tzeis = inRange(z?.tzeisMin, 0, 120);
  const label = typeof z?.label === 'string' ? z.label.trim() : '';
  const elevation = inRange(z?.elevation, -500, 9000) ?? 0;
  const tzeisMin = Math.round(tzeis ?? PR_TZEIS_MIN);
  if (lat !== undefined && lon !== undefined) {
    const g = geoOf({ geo: { lat, lon } }); // ברירת-הדלקה של המנוע לנ"צ מותאם
    return { lat, lon, tz, candleMin: Math.round(candle ?? g.candle), tzeisMin, label: label || 'מיקום מותאם', elevation, cityKey: '', diaspora: isDiaspora(tz) };
  }
  const key = typeof z?.city === 'string' && Object.prototype.hasOwnProperty.call(CITIES, z.city) ? z.city : PR_DEFAULT_CITY;
  const c = CITIES[key];
  return { lat: c.lat, lon: c.lon, tz, candleMin: Math.round(candle ?? c.candle), tzeisMin, label: label || c.he, elevation, cityKey: key, diaspora: isDiaspora(tz) };
}

/** הערת-המקום לתצוגה. */
export function locNote(loc: PrZmanimLoc): string {
  return 'לפי אופק ' + loc.label;
}

/* ---------- שעון וזמן ---------- */

/** שעון-קיר באזור-הזמן של הקהילה. ms = הרגע (epoch) — לחלונות-הניתוב. */
export interface PrClock {
  iso: IsoDate;
  hhmm: TimeHM;
  /** 0=ראשון … 6=שבת. */
  dow: number;
  ms: number;
}

const WEEKDAY: Readonly<Record<string, number>> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const clockFmts = new Map<string, Intl.DateTimeFormat>();

/** רגע (epoch ms, מוזרק) ⇒ שעון-קיר באזור-הזמן (DST דרך Intl) — לעולם לא שעון-המכשיר. */
export function clockAt(ms: number, tz: string = PR_TZ): PrClock {
  const zone = tzValid(tz) ? tz : PR_TZ;
  let f = clockFmts.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    });
    clockFmts.set(zone, f);
  }
  // רגע לא-תקין (NaN) ⇒ epoch 0 במקום RangeError מ-Intl (מסך לא קורס על קלט-פגום)
  const parts = f.formatToParts(new Date(Number.isFinite(ms) ? ms : 0));
  const get = (t: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === t)?.value ?? '';
  return { iso: `${get('year')}-${get('month')}-${get('day')}`, hhmm: `${get('hour')}:${get('minute')}`, dow: WEEKDAY[get('weekday')] ?? 0, ms };
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** "H:MM"/"HH:MM" ⇒ דקות-מחצות (24:00 = 1440); לא-תקין ⇒ null. */
export function hmToMin(t: unknown): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t ?? '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (mi > 59 || h > 24 || (h === 24 && mi !== 0)) return null;
  return h * 60 + mi;
}

/** דקות ⇒ "HH:MM" (מודולו יממה). */
export function minToHm(min: number): TimeHM {
  const x = ((Math.round(min) % 1440) + 1440) % 1440;
  return pad2(Math.floor(x / 60)) + ':' + pad2(x % 60);
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** תאריך ISO תקין (YYYY-MM-DD שקיים בלוח). קלט פגום ⇒ הפונקציות כאן מחזירות ריק במקום לזרוק. */
export function isIsoDate(iso: unknown): iso is IsoDate {
  return typeof iso === 'string' && ISO_DATE_RE.test(iso) && Number.isFinite(Date.parse(iso + 'T12:00:00Z'));
}

/** צעד-ימים על ISO (צהרי-UTC — בלי תלות באזור-הזמן של המכשיר). קלט פגום ⇒ ''. */
export function addDaysIso(iso: IsoDate, n: number): IsoDate {
  if (!isIsoDate(iso) || !Number.isFinite(n)) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
}

/** יום-בשבוע של תאריך ISO (0=ראשון); קלט פגום ⇒ -1. */
export function dowOfIso(iso: IsoDate): number {
  if (!isIsoDate(iso)) return -1;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

/* ---------- סיווג-יום וזמני-היום (ממוטמנים — המנוע נקרא פעם לכל תאריך) ---------- */

const CACHE_MAX = 4000;
function remember<V>(m: Map<string, V>, k: string, v: V): V {
  if (m.size >= CACHE_MAX) m.delete(m.keys().next().value as string);
  m.set(k, v);
  return v;
}

export interface PrDayInfo {
  cls: DayClass;
  /** שבת או יו״ט — יום-סגירה. */
  closed: boolean;
}
const dayCache = new Map<string, PrDayInfo>();
const neutralDay = (iso: string): DayClass => ({
  iso, monthHe: '', day: 0, dow: -1, shabbat: false, yomTov: null, erevChag: null, cholHamoed: null, fast: null, roshChodesh: false, name: null, closedReason: null,
});

/** סיווג-היום (שבת/יו״ט/צום/ר״ח…) לפי לוח-המנוע; סגור = שבת או יו״ט. */
export function dayInfo(iso: IsoDate, loc: PrZmanimLoc): PrDayInfo {
  if (!isIsoDate(iso)) return { cls: neutralDay(iso), closed: false };
  const k = (loc.diaspora ? 'D|' : 'I|') + loc.tz + '|' + iso;
  const hit = dayCache.get(k);
  if (hit) return hit;
  const cls = classifyDay(iso, { diaspora: loc.diaspora, tz: loc.tz });
  return remember(dayCache, k, { cls, closed: cls.dow === 6 || !!cls.yomTov });
}

/** זמני-בסיס ליום: נץ, שקיעה, הדלקה (שקיעה−candle), צאת (שקיעה+tzeis); '' בקוטב. */
export interface PrDayTimes {
  sunrise: TimeHM | '';
  sunset: TimeHM | '';
  candle: TimeHM | '';
  tzeis: TimeHM | '';
}
const timesCache = new Map<string, PrDayTimes>();

function tenantOf(loc: PrZmanimLoc): { geo: { lat: number; lon: number; candle: number; he: string }; timezone: string } {
  return { geo: { lat: loc.lat, lon: loc.lon, candle: loc.candleMin, he: loc.label }, timezone: loc.tz };
}

export function dayTimes(iso: IsoDate, loc: PrZmanimLoc): PrDayTimes {
  if (!isIsoDate(iso)) return { sunrise: '', sunset: '', candle: '', tzeis: '' };
  const k = [loc.lat, loc.lon, loc.tz, loc.candleMin, loc.tzeisMin, iso].join('|');
  const hit = timesCache.get(k);
  if (hit) return hit;
  const st = shabbatTimes(iso, tenantOf(loc), { tzeis: loc.tzeisMin });
  return remember(timesCache, k, {
    sunrise: sunrise(iso, loc.lat, loc.lon, loc.tz) ?? '',
    sunset: st?.sunset ?? '',
    candle: st?.candle ?? '',
    tzeis: st?.tzeis ?? '',
  });
}

/* ---------- זווית-שמש (משיכיר של "לוח הקהילה") ---------- */

const RAD = Math.PI / 180;

/**
 * הרגע (דקות-UTC מחצות, שבר) שבו מרכז-השמש `dep` מעלות מתחת לאופק — בבוקר (rise) או בערב. אותו אלגוריתם
 * NOAA של מנוע-הזמנים (telephony/lib/zmanim.mjs, שמחשב רק זניט 90.833° ולא נוגעים בו), עם זניט 90+dep.
 * null כשהשמש לא מגיעה לזווית (קוטב / קיץ צפוני).
 */
function noaaUtcMin(iso: IsoDate, lat: number, lon: number, dep: number, rise: boolean): number | null {
  const [y0, m0, d] = iso.split('-').map(Number);
  const y = m0 <= 2 ? y0 - 1 : y0;
  const m = m0 <= 2 ? m0 + 12 : m0;
  const A = Math.floor(y / 100);
  const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - A + Math.floor(A / 4)) - 1524.5;
  const T = (JD - 2451545.0) / 36525.0;
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * RAD) * 0.000289;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * RAD);
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos((125.04 - 1934.136 * T) * RAD);
  const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) / RAD;
  const yv = Math.tan((eps / 2) * RAD) ** 2;
  const eqTime =
    (4 / RAD) *
    (yv * Math.sin(2 * L0 * RAD) -
      2 * e * Math.sin(M * RAD) +
      4 * e * yv * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
      0.5 * yv * yv * Math.sin(4 * L0 * RAD) -
      1.25 * e * e * Math.sin(2 * M * RAD));
  const cosHA = Math.cos((90 + dep) * RAD) / (Math.cos(lat * RAD) * Math.cos(decl * RAD)) - Math.tan(lat * RAD) * Math.tan(decl * RAD);
  if (!(cosHA >= -1 && cosHA <= 1)) return null;
  const HA = Math.acos(cosHA) / RAD;
  const utc = 720 - 4 * (lon + (rise ? HA : -HA)) - eqTime;
  return ((utc % 1440) + 1440) % 1440;
}

/**
 * שעת-קיר (באזור-הזמן של הקהילה) שבה השמש `dep` מעלות מתחת לאופק — למשל משיכיר = 11.5° בבוקר. עיגול לפי
 * mode (זמן-התחלה ⇒ 'ceil', לחומרא). '' בקלט פגום / כשהשמש לא מגיעה לזווית.
 */
export function sunAngleTime(iso: IsoDate, loc: PrZmanimLoc, dep: number, rise: boolean, mode: 'floor' | 'ceil' | 'round' = 'round'): TimeHM | '' {
  if (!isIsoDate(iso) || !Number.isFinite(dep)) return '';
  const u = noaaUtcMin(iso, loc.lat, loc.lon, dep, rise);
  if (u === null) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const mm = mode === 'floor' ? Math.floor(u) : mode === 'ceil' ? Math.ceil(u) : Math.round(u);
  return clockAt(Date.UTC(y, m - 1, d) + mm * 60000, loc.tz).hhmm;
}

/* ---------- סגירת שבת/יו״ט ברגע נתון ---------- */

/** מצב-סגירה ברגע: מהדלקת-הנרות בערב ועד צאת ביום-הסגור האחרון של הרצף. */
export interface PrClosure {
  closed: boolean;
  /** 'שבת' או שם-החג הראשון ברצף. */
  reason: string;
  kind: 'shabbat' | 'yomtov' | '';
  /** יום-הסגירה האחרון ושעת-הצאת שלו. */
  endIso: IsoDate | '';
  endTime: TimeHM | '';
  /** 'מוצ״ש' / 'מוצאי החג'. */
  motzei: string;
}
export type PrClosureFn = (iso: IsoDate, hhmm: TimeHM) => PrClosure;

const OPEN: PrClosure = { closed: false, reason: '', kind: '', endIso: '', endTime: '', motzei: '' };

/**
 * האם הרגע (תאריך+שעה באזור-הזמן) בתוך שבת/יו״ט: יום-סגור לפני-צאת, או ערב-יום-סגור מהדלקת-
 * הנרות. רצף רב-יומי (יו״ט+שבת) ממוזג. קוטב (אין שקיעה) ⇒ היום-הסגור כולו סגור (fail-closed,
 * כמו המנוע). אותה הגדרה כמו hebrewClosedWindows של הטלפוניה.
 */
export function closureAt(iso: IsoDate, hhmm: TimeHM, loc: PrZmanimLoc): PrClosure {
  const now = hmToMin(hhmm) ?? 0;
  const today = dayInfo(iso, loc);
  const next = addDaysIso(iso, 1);
  const t = dayTimes(iso, loc);
  const tzeis = hmToMin(t.tzeis);
  const candle = hmToMin(t.candle);
  let start: IsoDate | '' = '';
  if (today.closed && (tzeis === null || now < tzeis)) start = iso;
  else if (dayInfo(next, loc).closed && candle !== null && now >= candle) start = next;
  if (!start) return OPEN;
  let first = start;
  for (let i = 0; i < 4 && dayInfo(addDaysIso(first, -1), loc).closed; i++) first = addDaysIso(first, -1);
  let last = start;
  for (let i = 0; i < 6 && dayInfo(addDaysIso(last, 1), loc).closed; i++) last = addDaysIso(last, 1);
  let reason = '';
  for (let d = first; d <= last && !reason; d = addDaysIso(d, 1)) reason = dayInfo(d, loc).cls.yomTov ?? '';
  return {
    closed: true,
    reason: reason || 'שבת',
    kind: dayInfo(first, loc).cls.yomTov ? 'yomtov' : 'shabbat',
    endIso: last,
    endTime: dayTimes(last, loc).tzeis || '23:59',
    motzei: dayInfo(last, loc).cls.dow === 6 ? 'מוצ״ש' : 'מוצאי החג',
  };
}

/** פונקציית-סגירה קשורה-למיקום (למנוע-הסטטוס/הדירוג ב-lib.ts). */
export function makeClosureFn(loc: PrZmanimLoc): PrClosureFn {
  return (iso, hhmm) => closureAt(iso, hhmm, loc);
}

/* ---------- התאריך העברי (מתחלף בשקיעה) ---------- */

export interface PrHebDate {
  /** התאריך הלועזי שהיום-העברי מעוגן אליו (אחרי השקיעה ⇒ מחר). */
  anchorIso: IsoDate;
  day: number;
  monthHe: string;
  year: number;
  text: string;
  /** אחרי השקיעה (ליל היום העברי הבא). */
  night: boolean;
}

/** היום והחודש העבריים בלי שנה ("ב׳ חשוון" — rdate של לוח-הבקשות במקור). */
export function hebDayMonth(iso: string, tz: string = PR_TZ): string {
  if (!isIsoDate(iso)) return '';
  const p = hebcalParts(iso, tz);
  return p.day ? gem(p.day) + ' ' + p.monthHe : '';
}

/** תאריך במילים (dateFmt של המקור, לבוררי-התאריך): "יום ד׳, 11 בנובמבר 2026 · א׳ כסלו". */
export function dateWords(iso: string, tz: string = PR_TZ): string {
  if (!isIsoDate(iso)) return iso;
  const civil = new Date(iso + 'T12:00:00').toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  const p = hebcalParts(iso, tz);
  return civil + (p.day ? ' · ' + gem(p.day) + ' ' + p.monthHe : '');
}

/** "ה׳ חשוון תשפ״ז" לתאריך לועזי (בצהריים, באזור-הזמן). */
export function hebDateText(iso: IsoDate, tz: string = PR_TZ): string {
  if (!isIsoDate(iso)) return '';
  const p = hebcalParts(iso, tz);
  return gem(p.day) + ' ' + p.monthHe + ' ' + gemYear(p.year);
}

/** התאריך העברי ברגע הנתון — מתחלף בשקיעה (תיקון: במקור לא התחלף עד חצות). */
export function hebDateAt(clock: PrClock, loc: PrZmanimLoc): PrHebDate {
  const ss = hmToMin(dayTimes(clock.iso, loc).sunset);
  const night = ss !== null && (hmToMin(clock.hhmm) ?? 0) >= ss;
  const anchorIso = night ? addDaysIso(clock.iso, 1) : clock.iso;
  if (!isIsoDate(anchorIso)) return { anchorIso, day: 0, monthHe: '', year: 0, text: '', night };
  const p = hebcalParts(anchorIso, loc.tz);
  return { anchorIso, day: p.day, monthHe: p.monthHe, year: p.year, text: gem(p.day) + ' ' + p.monthHe + ' ' + gemYear(p.year), night };
}

/* ---------- זמני היום ---------- */

export interface PrZman {
  key: string;
  label: string;
  sub: string;
  time: TimeHM | '';
}

/**
 * זמני-היום (בסדר כרונולוגי): עלות (נץ−72) · נץ · סוף ק״ש מג״א/גר״א · סוף תפילה · חצות ·
 * מנחה גדולה/קטנה · פלג · [הדלקת נרות בערב שבת/חג] · שקיעה · צאת (או "צאת השבת/החג" + ר״ת
 * ביום-הסגור האחרון). שעה זמנית גר״א = (שקיעה−נץ)/12; מג״א = (שקיעה+72 − (נץ−72))/12.
 */
export function dayZmanim(iso: IsoDate, loc: PrZmanimLoc): PrZman[] {
  const t = dayTimes(iso, loc);
  const sr = hmToMin(t.sunrise);
  const ss = hmToMin(t.sunset);
  const ok = sr !== null && ss !== null;
  const gra = ok ? (ss - sr) / 12 : 0;
  const dawn = ok ? sr - PR_MGA_MIN : 0;
  const mga = ok ? (ss + PR_MGA_MIN - dawn) / 12 : 0;
  const at = (min: number, mode: 'floor' | 'ceil' | 'round'): TimeHM | '' =>
    ok ? minToHm(mode === 'floor' ? Math.floor(min) : mode === 'ceil' ? Math.ceil(min) : Math.round(min)) : '';
  const today = dayInfo(iso, loc);
  const tomorrow = dayInfo(addDaysIso(iso, 1), loc);
  const lastClosedDay = today.closed && !tomorrow.closed;
  const rows: PrZman[] = [
    { key: 'alot', label: 'עלות השחר', sub: PR_MGA_MIN + ' דק׳ לפני הנץ', time: at(dawn, 'round') },
    { key: 'netz', label: 'נץ החמה', sub: '', time: t.sunrise },
    { key: 'shmaMga', label: 'סוף זמן ק״ש', sub: 'מגן אברהם', time: at(dawn + 3 * mga, 'floor') },
    { key: 'shmaGra', label: 'סוף זמן ק״ש', sub: 'גר״א', time: at((sr ?? 0) + 3 * gra, 'floor') },
    { key: 'tefila', label: 'סוף זמן תפילה', sub: 'גר״א', time: at((sr ?? 0) + 4 * gra, 'floor') },
    { key: 'chatzot', label: 'חצות היום', sub: '', time: at((sr ?? 0) + 6 * gra, 'round') },
    { key: 'minchaG', label: 'מנחה גדולה', sub: '', time: at((sr ?? 0) + 6.5 * gra, 'ceil') },
    { key: 'minchaK', label: 'מנחה קטנה', sub: '', time: at((sr ?? 0) + 9.5 * gra, 'ceil') },
    { key: 'plag', label: 'פלג המנחה', sub: '', time: at((sr ?? 0) + 10.75 * gra, 'ceil') },
  ];
  // הדלקת-נרות לפני-השקיעה: ערב יום-סגור, או יו״ט שלמחרתו שבת (מאש-קיימת). ביו״ט-ראשון שלמחרתו
  // יו״ט-שני / בשבת שלמחרתה חג — מדליקים רק אחרי צאת ⇒ לא מוצג כזמן-הדלקה.
  if (tomorrow.closed && (!today.closed || tomorrow.cls.dow === 6)) {
    rows.push({ key: 'candle', label: 'הדלקת נרות', sub: tomorrow.cls.yomTov ? 'ערב ' + tomorrow.cls.yomTov : 'ערב שבת', time: t.candle });
  }
  rows.push({ key: 'shkia', label: 'שקיעה', sub: '', time: t.sunset });
  if (lastClosedDay) {
    rows.push({ key: 'end', label: today.cls.dow === 6 ? 'צאת השבת' : 'צאת החג', sub: loc.tzeisMin + ' דק׳ אחרי השקיעה', time: t.tzeis });
    rows.push({ key: 'rt', label: 'רבנו תם', sub: PR_RT_MIN + ' דק׳', time: at((ss ?? 0) + PR_RT_MIN, 'ceil') });
  } else {
    rows.push({ key: 'tzeis', label: 'צאת הכוכבים', sub: loc.tzeisMin + ' דק׳ אחרי השקיעה', time: t.tzeis });
  }
  return rows;
}

/** שורת-זמן בלוח: עבר (מעומעם) / הבא (מודגש). */
export interface PrBoardZman extends PrZman {
  past: boolean;
  next: boolean;
}

/** זמני-היום מסומנים מול השעון — past לשעה שעברה, next לראשון שטרם הגיע. */
export function markZmanim(rows: readonly PrZman[], clock: PrClock): PrBoardZman[] {
  const now = hmToMin(clock.hhmm) ?? 0;
  let nextSet = false;
  return rows.map((r) => {
    const m = hmToMin(r.time);
    const past = m !== null && m <= now;
    const next = !nextSet && m !== null && m > now;
    if (next) nextSet = true;
    return { ...r, past, next };
  });
}

/* ---------- השבת הנוכחית / הקרובה ---------- */

export interface PrShabbat {
  friIso: IsoDate;
  satIso: IsoDate;
  candle: TimeHM | '';
  end: TimeHM | '';
  rabbeinuTam: TimeHM | '';
  /** הרגע בתוך השבת הזו (מהדלקה בערב-שבת ועד צאת). */
  current: boolean;
  hebDate: string;
  /** שבת מברכים — שם החודש הבא ('' אם לא; לא באלול). */
  mevarchim: string;
  /** השבת היא גם יו״ט — שם החג ('' אם לא). */
  holiday: string;
}

/**
 * השבת לתצוגה: בשבת עצמה (עד צאת) — **השבת הנוכחית** (תיקון באג-המקור שקפץ לשבוע הבא);
 * אחרי צאת-השבת — השבת הבאה; ראשון–שישי — השבת הקרובה.
 */
export function shabbatOf(clock: PrClock, loc: PrZmanimLoc): PrShabbat {
  if (!isIsoDate(clock.iso)) return { friIso: '', satIso: '', candle: '', end: '', rabbeinuTam: '', current: false, hebDate: '', mevarchim: '', holiday: '' };
  const now = hmToMin(clock.hhmm) ?? 0;
  let sat = clock.dow === 6 ? clock.iso : addDaysIso(clock.iso, 6 - clock.dow);
  if (clock.dow === 6) {
    const end = hmToMin(dayTimes(sat, loc).tzeis);
    if (end !== null && now >= end) sat = addDaysIso(sat, 7);
  }
  const fri = addDaysIso(sat, -1);
  const tf = dayTimes(fri, loc);
  const ts = dayTimes(sat, loc);
  const candle = hmToMin(tf.candle);
  const end = hmToMin(ts.tzeis);
  const ssSat = hmToMin(ts.sunset);
  const current = (clock.iso === fri && candle !== null && now >= candle) || (clock.iso === sat && (end === null || now < end));
  const hp = hebcalParts(sat, loc.tz);
  const mevarchim = hp.day >= 23 && hp.day <= 29 && hp.monthName !== 'Elul' ? hebcalParts(addDaysIso(sat, 8), loc.tz).monthHe : '';
  return {
    friIso: fri,
    satIso: sat,
    candle: tf.candle,
    end: ts.tzeis,
    rabbeinuTam: ssSat === null ? '' : minToHm(ssSat + PR_RT_MIN),
    current,
    hebDate: gem(hp.day) + ' ' + hp.monthHe + ' ' + gemYear(hp.year),
    mevarchim,
    holiday: dayInfo(sat, loc).cls.yomTov ?? '',
  };
}

/** חלונות-שבת/חג שטרם הסתיימו (כולל הנוכחי) — מנוע-הטלפוניה, לכותרת "שבת/חג קרוב". */
export function upcomingClosures(clock: PrClock, loc: PrZmanimLoc, days = 10): ClosedWindow[] {
  if (!isIsoDate(clock.iso)) return [];
  const wins = hebrewClosedWindows(addDaysIso(clock.iso, -3), days + 3, tenantOf(loc), { tzeis: loc.tzeisMin, diaspora: loc.diaspora });
  const now = clock.iso + ' ' + clock.hhmm;
  return wins.filter((w) => w.endIso + ' ' + w.endTime > now);
}

/* ---------- זמני השבוע (לחוברת/ללוח) ---------- */

export const PR_DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'] as const;

export interface PrWeekRow {
  iso: IsoDate;
  dow: number;
  dayName: string;
  hebDate: string;
  alot: TimeHM | '';
  sunrise: TimeHM | '';
  shmaGra: TimeHM | '';
  chatzot: TimeHM | '';
  sunset: TimeHM | '';
  tzeis: TimeHM | '';
  /** הדלקת-נרות (ערב שבת/חג) — '' ביום רגיל. */
  candle: TimeHM | '';
  /** צאת השבת/החג (יום-הסגור האחרון) — '' ביום רגיל. */
  end: TimeHM | '';
  /** שם היום-המיוחד (חג/צום/ר״ח/חוה״מ) — '' ביום רגיל. */
  holiday: string;
}

/** טבלת-זמנים ל-N ימים מתאריך (ברירת 7) — אותם חישובים כמו dayZmanim. */
export function weekZmanim(fromIso: IsoDate, loc: PrZmanimLoc, days = 7): PrWeekRow[] {
  const out: PrWeekRow[] = [];
  for (let i = 0; i < Math.max(0, Math.min(days, 60)); i++) {
    const iso = addDaysIso(fromIso, i);
    const z = dayZmanim(iso, loc);
    const get = (k: string): TimeHM | '' => z.find((r) => r.key === k)?.time ?? '';
    const dow = dowOfIso(iso);
    const cls = dayInfo(iso, loc).cls;
    out.push({
      iso,
      dow,
      dayName: PR_DAY_NAMES[dow] ?? '',
      hebDate: hebDateText(iso, loc.tz),
      alot: get('alot'),
      sunrise: get('netz'),
      shmaGra: get('shmaGra'),
      chatzot: get('chatzot'),
      sunset: get('shkia'),
      tzeis: get('tzeis') || get('end'),
      candle: get('candle'),
      end: get('end'),
      holiday: cls.dow === 6 && !cls.yomTov ? '' : cls.name ?? '',
    });
  }
  return out;
}

/* ---------- מניינים (יחסיים לזמנים) ---------- */

export interface PrMinyanTime {
  postId: string;
  shul: string;
  place: string;
  prayer: string;
  time: TimeHM;
  /** הטוקן המקורי ("sh-15" / "06:45"). */
  token: string;
}

/**
 * טוקן-זמן ⇒ שעה: "HH:MM" קבוע · "sh±N" שקיעה±דק׳ · "tz±N" צאת±דק׳ · "nz±N" נץ±דק׳ (תוספת על
 * המקור — מניין ותיקין). טוקן לא-תקין / בסיס חסר (קוטב) ⇒ ''.
 */
export function resolveTimeToken(token: unknown, t: PrDayTimes): TimeHM | '' {
  const s = String(token ?? '').trim();
  const fixed = hmToMin(s);
  if (fixed !== null) return fixed < 1440 ? minToHm(fixed) : '';
  const m = /^(sh|tz|nz)\s*([+-]\s*\d{1,3})?$/i.exec(s);
  if (!m) return '';
  const kind = m[1].toLowerCase();
  const base = hmToMin(kind === 'sh' ? t.sunset : kind === 'tz' ? t.tzeis : t.sunrise);
  if (base === null) return '';
  return minToHm(base + (m[2] ? Number(m[2].replace(/\s/g, '')) : 0));
}

/** מודעה מאושרת שטרם ירדה מהלוח (until כולל). */
export function postActiveOn(p: PrPost, iso: IsoDate): boolean {
  return p.approved === true && (!p.until || p.until >= iso);
}

/** כל זמני-המניינים ליום (מודעות kind='minyan' מאושרות, לפי ימי-התוקף), ממוינים לפי שעה. */
export function resolveMinyanim(posts: readonly PrPost[], iso: IsoDate, loc: PrZmanimLoc): PrMinyanTime[] {
  const dow = dowOfIso(iso);
  const t = dayTimes(iso, loc);
  const out: PrMinyanTime[] = [];
  for (const p of posts) {
    if (p.kind !== 'minyan' || !postActiveOn(p, iso)) continue;
    if (Array.isArray(p.days) && p.days.length && !p.days.includes(dow)) continue;
    for (const pr of Array.isArray(p.prayers) ? p.prayers : []) {
      for (const tok of Array.isArray(pr?.times) ? pr.times : []) {
        const time = resolveTimeToken(tok, t);
        if (time) out.push({ postId: p.id, shul: p.title, place: p.place, prayer: pr.prayer, time, token: String(tok) });
      }
    }
  }
  return out.sort((a, b) => a.time.localeCompare(b.time) || a.shul.localeCompare(b.shul, 'he') || a.prayer.localeCompare(b.prayer, 'he'));
}

/** המניין הבא מהשעה (אותו יום) — null כשאין עוד היום. */
export function nextMinyan(list: readonly PrMinyanTime[], clock: PrClock): PrMinyanTime | null {
  return list.find((x) => x.time >= clock.hhmm) ?? null;
}

/* ---------- מספרי חירום ---------- */

export interface PrEmergency {
  label: string;
  phone: string;
  note: string;
}

/** ברירות-מחדל (הגבאי עורך: מודעות kind='emergency' מאושרות מחליפות את הרשימה כולה). */
export const PR_EMERGENCY_DEFAULTS: readonly PrEmergency[] = [
  { label: 'מד״א', phone: '101', note: 'מגן דוד אדום — אמבולנס' },
  { label: 'איחוד הצלה', phone: '1221', note: 'עזרה ראשונה מהירה' },
  { label: 'משטרה', phone: '100', note: '' },
  { label: 'כיבוי אש', phone: '102', note: 'כבאות והצלה' },
];

/** הרשימה האפקטיבית: מודעות-חירום מאושרות (נעוצות ראשונות, אח"כ לפי יצירה) — או ברירות-המחדל. */
export function emergencyNumbers(posts: readonly PrPost[], todayIso?: IsoDate): PrEmergency[] {
  const own = posts
    .filter((p) => p.kind === 'emergency' && p.approved === true && (!todayIso || !p.until || p.until >= todayIso) && String(p.phone ?? '').trim())
    .slice()
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || String(a.createdAt).localeCompare(String(b.createdAt)) || a.id.localeCompare(b.id));
  if (!own.length) return PR_EMERGENCY_DEFAULTS.map((e) => ({ ...e }));
  return own.map((p) => ({ label: p.title.trim() || p.phone.trim(), phone: p.phone.trim(), note: p.text.trim() }));
}

/** טיוטות-מודעה לזריעת ברירות-המחדל (כפתור "ערוך את מספרי-החירום" — הגבאי מתחיל מהן). */
export function emergencyDrafts(): Array<Pick<PrPost, 'kind' | 'title' | 'phone' | 'text'>> {
  return PR_EMERGENCY_DEFAULTS.map((e) => ({ kind: 'emergency', title: e.label, phone: e.phone, text: e.note }));
}

/* ---------- הלוח כולו ---------- */

export interface PrZmanimBoard {
  clock: PrClock;
  loc: PrZmanimLoc;
  note: string;
  hebDate: PrHebDate;
  /** שם היום-המיוחד ('' ביום רגיל). */
  dayName: string;
  zmanim: PrBoardZman[];
  nextZman: PrBoardZman | null;
  minyanim: PrMinyanTime[];
  nextMinyan: PrMinyanTime | null;
  shabbat: PrShabbat;
  closure: PrClosure;
  closures: ClosedWindow[];
  emergency: PrEmergency[];
}

/** כל לוח-הזמנים לרגע נתון — מקור אחד לממשק (הלוח) ולבדיקות. */
export function buildZmanimBoard(clock: PrClock, loc: PrZmanimLoc, posts: readonly PrPost[]): PrZmanimBoard {
  const zmanim = markZmanim(dayZmanim(clock.iso, loc), clock);
  const minyanim = resolveMinyanim(posts, clock.iso, loc);
  return {
    clock,
    loc,
    note: locNote(loc) + ' · ' + PR_ZMANIM_NOTE,
    hebDate: hebDateAt(clock, loc),
    dayName: dayInfo(clock.iso, loc).cls.name ?? '',
    zmanim,
    nextZman: zmanim.find((z) => z.next) ?? null,
    minyanim,
    nextMinyan: nextMinyan(minyanim, clock),
    shabbat: shabbatOf(clock, loc),
    closure: closureAt(clock.iso, clock.hhmm, loc),
    closures: upcomingClosures(clock, loc),
    emergency: emergencyNumbers(posts, clock.iso),
  };
}
