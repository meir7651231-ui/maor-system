/**
 * 🌅 מקום השמש (sun-position) — מתי השמש נמצאת `depression` מעלות מתחת לאופק ביום נתון ובמקום נתון:
 * בבוקר (עולה) ובערב (שוקעת), וחצות-היום באמצע. אלגוריתם NOAA — חילוץ של noaaUtcMin מלוח-הזמנים של פרנס׳לע.
 * הליבה בלי עולם של: זמני-היום (נץ/שקיעה/צאת-הכוכבים), "פנס שנדלק בשקיעה", "חמנייה שפונה לשמש". מקורות: origins.json.
 * טהור: היום והמקום מוזרקים; התשובה בדקות-UTC מחצות (שבר).
 * @param {{lat: number, lon: number, depression: number}} spec  depression: 0.833 = נץ/שקיעה, 16.1 = עלות-השחר…
 * @param {string} day  ISO YYYY-MM-DD
 * @returns {{rise: number, noon: number, set: number} | null} null — השמש לא מגיעה לזווית הזאת ביום הזה (קוטב, קיץ צפוני), או זווית מחוץ ל-±90°
 */
export function sunPosition(spec, day) {
  const m0 = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day));
  if (!m0) return null;
  const lat = fin(spec?.lat);
  const lon = fin(spec?.lon);
  const dep = fin(spec?.depression);
  if (Math.abs(lat) > 89 || Math.abs(dep) > 90) return null; // זווית מחוץ לחצי-הכדור — אין לה משמעות
  const RAD = Math.PI / 180;
  const y0 = +m0[1]; const mo = +m0[2]; const d = +m0[3];
  const y = mo <= 2 ? y0 - 1 : y0;
  const m = mo <= 2 ? mo + 12 : mo;
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
  const eqTime = (4 / RAD) * (yv * Math.sin(2 * L0 * RAD) - 2 * e * Math.sin(M * RAD) + 4 * e * yv * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) - 0.5 * yv * yv * Math.sin(4 * L0 * RAD) - 1.25 * e * e * Math.sin(2 * M * RAD));
  const cosHA = Math.cos((90 + dep) * RAD) / (Math.cos(lat * RAD) * Math.cos(decl * RAD)) - Math.tan(lat * RAD) * Math.tan(decl * RAD);
  if (!(cosHA >= -1 && cosHA <= 1)) return null;
  const HA = Math.acos(cosHA) / RAD;
  const noon = 720 - 4 * lon - eqTime;
  return { rise: noon - 4 * HA, noon, set: noon + 4 * HA };
}

function fin(x) { const v = Number(x); return Number.isFinite(v) ? v : 0; }
