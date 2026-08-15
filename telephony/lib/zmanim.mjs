// ─────────────────────────────────────────────────────────────────────────────
// telephony · zmanim — מנוע-זמנים הלכתי טהור: שקיעה → הדלקת-נרות / צאת-הכוכבים.
//
// היום סגירת-שבת/חג היא יום-אזרחי-מלא (00:00~23:59) ושישי נחתך ב-shabbatFriEnd
// סטטי. הלכתית הגבול הוא שקיעה→צאת. כאן חישוב-שמש NOAA טהור (מ-ISO+lat/lon, בלי
// Date.now/random) שנותן זמן-מקומי מדויק, ומ-ז הדלקת-נרות (שקיעה−N) וצאת (שקיעה+N).
//
// אף מרכזייה לא מחשבת זמנים הלכתיים אמיתיים לניתוב — זה הפיצ׳ר עם רדיוס-האמון
// ההלכתי הגדול ביותר. downstream (חישוב-מקומי בלבד, אין ספק/שירות).
// מגודר calendar.zmanim; כבוי ⇒ ביט-זהה למסלול-היום.
// ─────────────────────────────────────────────────────────────────────────────

import { classifyDay } from './hebcal.mjs';
import { isDiaspora } from './config.mjs';

const DEG = Math.PI / 180;
const rad = (d) => d * DEG;
const deg = (r) => r / DEG;

// טבלת-ערים (lat, lon מזרח-חיובי, מנהג הדלקת-נרות בדקות לפני-שקיעה). ניתן-להרחבה.
export const CITIES = {
  jerusalem: { he: 'ירושלים', lat: 31.778, lon: 35.235, candle: 40 },
  telaviv: { he: 'תל אביב', lat: 32.083, lon: 34.800, candle: 18 },
  bneibrak: { he: 'בני ברק', lat: 32.083, lon: 34.833, candle: 22 },
  haifa: { he: 'חיפה', lat: 32.816, lon: 34.989, candle: 30 },
  beitshemesh: { he: 'בית שמש', lat: 31.750, lon: 34.988, candle: 25 },
  ashdod: { he: 'אשדוד', lat: 31.804, lon: 34.655, candle: 22 },
  beersheva: { he: 'באר שבע', lat: 31.252, lon: 34.791, candle: 22 },
  netanya: { he: 'נתניה', lat: 32.328, lon: 34.857, candle: 18 },
  tzfat: { he: 'צפת', lat: 32.965, lon: 35.496, candle: 30 },
  default: { he: 'ברירת-מחדל (ירושלים)', lat: 31.778, lon: 35.235, candle: 40 },
};

/** גיאו-לוקיישן אפקטיבי: tenant.geo{lat,lon,candle?} גובר, אחרת עיר, אחרת ברירת-מחדל. */
export function geoOf(tenant) {
  const g = tenant && tenant.geo;
  if (g && Number.isFinite(g.lat) && Number.isFinite(g.lon)) {
    return { lat: g.lat, lon: g.lon, candle: Number.isFinite(g.candle) ? g.candle : 18, he: g.he || 'מותאם' };
  }
  const key = (tenant && tenant.city && CITIES[tenant.city]) ? tenant.city : 'default';
  return CITIES[key];
}

// יום-יוליאני ב-0h UT מתאריך גרגוריאני.
function julianDay(y, m, d) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

/**
 * זמן-שקיעה (או זריחה) ב-UTC-דקות-מחצות עבור תאריך+נ״צ. אלגוריתם NOAA.
 * @param {number} y @param {number} m @param {number} d
 * @param {number} lat @param {number} lon (מזרח-חיובי)
 * @param {boolean} sunset true=שקיעה, false=זריחה
 * @returns {number|null} דקות-UTC, או null בקוטב (השמש לא שוקעת/עולה)
 */
function solarEventUTCmin(y, m, d, lat, lon, sunset) {
  const JD = julianDay(y, m, d);
  const T = (JD - 2451545.0) / 36525.0;
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = Math.sin(rad(M)) * (1.914602 - T * (0.004817 + 0.000014 * T))
    + Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * T)
    + Math.sin(rad(3 * M)) * 0.000289;
  const trueLong = L0 + C;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(rad(125.04 - 1934.136 * T));
  const eps0 = 23 + (26 + ((21.448 - T * (46.815 + T * (0.00059 - T * 0.001813)))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(rad(125.04 - 1934.136 * T));
  const decl = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda))));
  const yv = Math.tan(rad(eps / 2)) ** 2;
  const eqTime = 4 * deg(
    yv * Math.sin(rad(2 * L0))
    - 2 * e * Math.sin(rad(M))
    + 4 * e * yv * Math.sin(rad(M)) * Math.cos(rad(2 * L0))
    - 0.5 * yv * yv * Math.sin(rad(4 * L0))
    - 1.25 * e * e * Math.sin(rad(2 * M)),
  );
  // זווית-שעה לזניט 90.833° (כולל שבירה+רדיוס-השמש).
  const zenith = 90.833;
  const cosHA = (Math.cos(rad(zenith)) / (Math.cos(rad(lat)) * Math.cos(rad(decl)))) - Math.tan(rad(lat)) * Math.tan(rad(decl));
  if (cosHA > 1 || cosHA < -1) return null; // אין שקיעה/זריחה (קוטב)
  const HA = deg(Math.acos(cosHA)); // מעלות (חיובי)
  // lon מזרח-חיובי: זריחה=720-4*(lon+HA)-eqTime · שקיעה=720-4*(lon-HA)-eqTime.
  const utc = 720 - 4 * (lon + (sunset ? -HA : HA)) - eqTime;
  return ((utc % 1440) + 1440) % 1440;
}

// המרת UTC-דקות בתאריך נתון ל-"HH:MM" מקומי באזור-הזמן (מטפל ב-DST דרך Intl).
const _zfmt = new Map();
function localHHMM(iso, utcMin, tz) {
  const [y, m, d] = iso.split('-').map(Number);
  const instant = Date.UTC(y, m - 1, d, 0, 0, 0) + Math.round(utcMin) * 60000;
  let f = _zfmt.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    _zfmt.set(tz, f);
  }
  const parts = f.formatToParts(new Date(instant));
  const hh = parts.find((p) => p.type === 'hour')?.value;
  const mm = parts.find((p) => p.type === 'minute')?.value;
  return `${hh}:${mm}`;
}

/** שעת-שקיעה מקומית "HH:MM" לתאריך+נ״צ+אזור-זמן. null בקוטב. */
export function sunset(iso, lat, lon, tz = 'Asia/Jerusalem') {
  const [y, m, d] = iso.split('-').map(Number);
  const u = solarEventUTCmin(y, m, d, lat, lon, true);
  return u == null ? null : localHHMM(iso, u, tz);
}
/** שעת-זריחה מקומית "HH:MM". */
export function sunrise(iso, lat, lon, tz = 'Asia/Jerusalem') {
  const [y, m, d] = iso.split('-').map(Number);
  const u = solarEventUTCmin(y, m, d, lat, lon, false);
  return u == null ? null : localHHMM(iso, u, tz);
}

const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const fromMin = (min) => { const x = ((min % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };

/**
 * זמני-שבת/חג לתאריך: הדלקת-נרות (שקיעה−candle) וצאת-הכוכבים (שקיעה+tzeis).
 * @param {string} iso @param {object} tenant (geo/city/timezone)
 * @param {{tzeis?:number}} [opt] דקות-צאת (ברירת 40)
 * @returns {{sunset:string, candle:string, tzeis:string}|null}
 */
export function shabbatTimes(iso, tenant, opt = {}) {
  const geo = geoOf(tenant);
  const tz = (tenant && tenant.timezone) || 'Asia/Jerusalem';
  const ss = sunset(iso, geo.lat, geo.lon, tz);
  if (!ss) return null;
  const tzeisMin = Number.isFinite(opt.tzeis) ? opt.tzeis : 40;
  return { sunset: ss, candle: fromMin(toMin(ss) - geo.candle), tzeis: fromMin(toMin(ss) + tzeisMin) };
}

function addDaysIso(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d, 12, 0, 0) + n * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

/**
 * חלונות-סגירה מדויקים (הלכתי) לחלון-תאריכים: כל רצף שבת/יו״ט רצוף ממוזג לחלון
 * אחד [הדלקת-נרות בערב → צאת-הכוכבים ביום-האחרון]. מטפל בחג-רב-יומי ובשבת-סמוכה-לחג.
 * דורש classifyDay (לוח-עברי) + מנוע-הזמנים. טהור, דטרמיניסטי.
 * @param {string} fromIso עוגן @param {number} windowDays אורך-חלון
 * @param {object} tenant (geo/city/timezone) @param {{tzeis?:number,diaspora?:boolean}} [opt]
 * @returns {Array<{startIso,startTime,endIso,endTime,reason,kind,days}>}
 */
export function hebrewClosedWindows(fromIso, windowDays, tenant, opt = {}) {
  const tz = (tenant && tenant.timezone) || 'Asia/Jerusalem';
  const diaspora = opt.diaspora != null ? opt.diaspora : isDiaspora(tz); // F17: הכרעה-מרוכזת
  // סיווג פר-יום (יו״ט או שבת = סגור).
  const incYt = opt.includeYomTov !== false;
  const incSh = opt.includeShabbat !== false;
  const cls = [];
  // סורקים 2 ימים נוספים (נחיל-עומק) כדי שרצף רב-יומי הנוגע בקצה-החלון יושלם
  // ולא ייחתם בצאת-היום-הראשון; רק רצפים שמתחילים בתוך החלון נפלטים.
  for (let i = 0; i <= windowDays + 2; i++) {
    const iso = addDaysIso(fromIso, i);
    const c = classifyDay(iso, { diaspora, tz });
    const yt = incYt ? (c.yomTov || null) : null;
    const sh = incSh && c.dow === 6;
    cls.push({ iso, closed: !!yt || sh, yomTov: yt, shabbat: sh, inWindow: i <= windowDays });
  }
  // מיזוג-רצפים → חלונות [ערב-הדלקה → יום-אחרון-צאת].
  const out = [];
  let i = 0;
  while (i < cls.length) {
    if (!cls[i].closed) { i++; continue; }
    let j = i;
    while (j + 1 < cls.length && cls[j + 1].closed) j++;
    const first = cls[i]; const last = cls[j];
    if (!first.inWindow) { i = j + 1; continue; } // רצף שמתחיל אחרי-החלון — מדולג
    const erevIso = addDaysIso(first.iso, -1);
    const st = shabbatTimes(erevIso, tenant, opt);
    const en = shabbatTimes(last.iso, tenant, opt);
    const reason = cls.slice(i, j + 1).map((x) => x.yomTov).find(Boolean) || 'שבת';
    const kind = first.yomTov ? 'yomtov' : 'shabbat';
    if (st && en) {
      out.push({ startIso: erevIso, startTime: st.candle, endIso: last.iso, endTime: en.tzeis, reason, kind, days: j - i + 1 });
    } else {
      // נחיל-5 F14: שקיעה לא-מחושבת (קו-רוחב קוטבי, cosHA∉[-1,1]) ⇒ **נפילה-בטוחה
      // לסגירת-יום-מלא** של הרצף (fail-CLOSED), במקום להשמיט את החלון ולהשאיר את הקו
      // פתוח לתוך השבת/החג. כשל-פתיחה בפיצ׳ר-האמון-ההלכתי אסור. (geo ישראלי לעולם
      // מחשב שקיעה ⇒ ביט-זהה; הענף נוגע רק לקהילה ארקטית עם zmanim דלוק.)
      out.push({ startIso: first.iso, startTime: '00:00', endIso: last.iso, endTime: '23:59', reason, kind, days: j - i + 1 });
    }
    i = j + 1;
  }
  return out;
}
