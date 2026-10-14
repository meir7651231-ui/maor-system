/**
 * 🧭 מכוון לפי השמש (MACHINE-V2, 14.10.2026) — הפועל ה-61: לאיזה כיוון בשמיים נמצאת השמש (אזימוט, מעלות מהצפון
 * בכיוון השעון: 90 = מזרח, 180 = דרום, 270 = מערב), ביום ובמקום נתונים, ברגע נתון.
 *
 * למה פועל משלו: החוקים של "מוצא את מקום השמש" (sun-position) בודקים **זמנים** (זריחה < חצות-היום < שקיעה) —
 * מספר אחד של מעלות לא נבדק בהם, ולכן החמנייה ("יודעת לאיזה כיוון השמש") נשארה 🔎.
 *
 * **אין לו ליבה.** בכוונה: הוא נמצא רק כ**שילוב** של חלקים מוכחים שכבר יש לנו (combine.mjs · צורת `graph` ·
 * catalog/recipes/combo-sun-heading-number.json) — זמני-היום ⇒ הכדור של היקום-3D ⇒ הסיבוב של היקום-3D ⇒ מרחק-המטבע ⇒ זווית-מיחס.
 * `ref` כאן הוא רק מבחן-החוקים (שהחוקים עוברים על מימוש נכון ונכשלים על המוטנטים) — הוא לא חלק בקטלוג.
 *
 * הקישור (`bind: 'spec'`): קלט 0 = מקום {lat, lon} · קלט 1 = רגע, בדקות-UTC מחצות (כמו sun-position) · קלט 2 = יום ISO.
 * החוקים בוחרים בעצמם קו-רוחב ורגעים (e.put), ומוצאים את הזריחה / חצות-היום / השקיעה מליבת sun-position — אין שעון.
 */
import { isNum, isStr, isObj } from './shape.mjs';
import { sunPosition } from '../core/sun-position.mjs';

const FAIL = (s) => s;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const RAD = Math.PI / 180;
const fin = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);

/** מבחן-החוקים: אזימוט מנוסחת הספרים (נטיית NOAA + זווית-שעה). לא חלק בקטלוג — רק כדי להראות שהחוקים עוברים על מימוש נכון. */
function declOf(day) {
  const m0 = ISO.exec(String(day)) && String(day).split('-').map(Number);
  if (!m0) return null;
  const [y0, mo, d] = m0;
  const y = mo <= 2 ? y0 - 1 : y0; const m = mo <= 2 ? mo + 12 : mo;
  const A = Math.floor(y / 100);
  const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - A + Math.floor(A / 4)) - 1524.5;
  const T = (JD - 2451545.0) / 36525.0;
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * RAD) * 0.000289;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * RAD);
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos((125.04 - 1934.136 * T) * RAD);
  return Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) / RAD;
}
export function sunHeadingRef(spec, minutes, day) {
  const sp = sunPosition({ lat: fin(spec?.lat), lon: fin(spec?.lon), depression: 0 }, day);
  const decl = declOf(day);
  if (!sp || decl === null || !Number.isFinite(Number(minutes))) return null;
  const ha = ((Number(minutes) - sp.noon) / 4) * RAD;
  const lat = fin(spec?.lat) * RAD;
  const az = Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(lat) - Math.tan(decl * RAD) * Math.cos(lat)) / RAD + 180;
  return ((az % 360) + 360) % 360;
}

/* ═══════════════ הרתמה של החוקים ═══════════════ */

/** היום (הקלט שאינו המקום ואינו הרגע ונראה כמו ISO). */
const dayOf = (e) => e.args.find((a, k) => k !== e.i && k !== e.j && isStr(a) && ISO.test(a));
/** לקו-רוחב נתון: הזריחה/חצות-היום/השקיעה (מליבת sun-position) + az(m) = הקריאה לחלק עם המקום הזה ברגע m. */
function sky(e, lat) {
  if (!isObj(e.x) || !isNum(e.y)) return null;
  const day = dayOf(e);
  if (!day) return null;
  const lon = fin(e.x.lon);
  const sp = sunPosition({ lat, lon, depression: 0.833 }, day);
  if (!sp || sp.set - sp.rise < 120) return null;
  const spec = { ...e.x, lat, lon };
  const az = (m) => { const v = e.f(Object.assign(e.put(spec, e.i), { [e.j]: m })); return isNum(v) ? v : NaN; };
  return { ...sp, az };
}
/** קו-רוחב צפוני בינוני. `south` — הרבה מעל נטיית-השמש (≥30° > 23.44°+5°), שם השמש תמיד בדרום בחצות-היום. */
const midLat = (e, south) => (south ? 30 : 20) + e.r.int(0, south ? 3000 : 4000) / 100;
const between = (e, a, b) => a + (b - a) * (0.05 + e.r.int(0, 900) / 1000);
const deg = (v) => (Number.isFinite(v) ? Math.round(v * 10) / 10 + '°' : String(v));

/* ═══════════════ מוטנטים ═══════════════ */

const mut = (f) => () => (s, m, d) => { const a = sunHeadingRef(s, m, d); return a === null ? null : f(a, s, d, m); };
const hash01 = (...xs) => { let h = 0x811c9dc5; const s = xs.map(String).join('|'); for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; return h / 4294967296; };

/** @type {import('./verbs').Verb[]} */
export const SUN_VERBS = [
  {
    id: 'sun-heading', he: 'מכוון לפי השמש', bind: 'spec',
    composed: 'catalog/recipes/combo-sun-heading-number.json',
    means: 'לאיזה כיוון בשמיים השמש ברגע נתון (אזימוט: מעלות מהצפון בכיוון השעון) — בבוקר במזרח, בצהריים בדרום, בערב במערב',
    takes: ['geo|record', 'number', 'date'], gives: 'number',
    fit: (e) => isObj(e.x) && isNum(e.x.lat) && isNum(e.x.lon) && isNum(e.y) && !!dayOf(e) && isNum(e.out),
    witness: (e) => isNum(e.out) && e.out > 1 && e.out < 359,
    laws: [
      {
        id: 'sun-heading.range', says: 'תמיד כיוון על המצפן: 0° ≤ אזימוט < 360°', catches: 'מוסיף 90° בלי לגלגל',
        check: (e) => {
          const s = sky(e, midLat(e, false));
          const vals = [e.out];
          if (s) for (let k = 0; k < 3; k++) vals.push(s.az(between(e, s.rise - 240, s.set + 240)));
          const bad = vals.find((v) => !(isNum(v) && v >= 0 && v < 360));
          return bad === undefined ? true : FAIL('מחוץ למצפן: ' + deg(bad));
        },
      },
      {
        id: 'sun-heading.morning-east', says: 'בבוקר (בין הזריחה לחצות-היום, קו-רוחב צפוני 20°–60°) השמש במזרח: 0° < אזימוט < 180°', catches: 'מזרח ומערב הפוכים',
        check: (e) => {
          const s = sky(e, midLat(e, false));
          if (!s) return null;
          const m = between(e, s.rise, s.noon); const a = s.az(m);
          return a > 0 && a < 180 ? true : FAIL('בוקר (' + Math.round(m - s.rise) + ' דק׳ אחרי הזריחה) ⇒ ' + deg(a));
        },
      },
      {
        id: 'sun-heading.evening-west', says: 'אחר-הצהריים (בין חצות-היום לשקיעה) השמש במערב: 180° < אזימוט < 360°', catches: 'תקוע בכיוון אחד',
        check: (e) => {
          const s = sky(e, midLat(e, false));
          if (!s) return null;
          const m = between(e, s.noon, s.set); const a = s.az(m);
          return a > 180 && a < 360 ? true : FAIL('ערב (' + Math.round(s.set - m) + ' דק׳ לפני השקיעה) ⇒ ' + deg(a));
        },
      },
      {
        id: 'sun-heading.noon-south', says: 'בחצות-היום, כשקו-הרוחב גבוה מנטיית-השמש ב-5° לפחות, השמש בדרום: |אזימוט − 180°| < 3°', catches: 'מוסט ב-90°',
        check: (e) => {
          const s = sky(e, midLat(e, true));
          if (!s) return null;
          const a = s.az(s.noon);
          return Math.abs(a - 180) < 3 ? true : FAIL('חצות-היום ⇒ ' + deg(a));
        },
      },
      {
        id: 'sun-heading.monotone', says: 'מהזריחה עד השקיעה הכיוון רק עולה (מזרח ⇒ דרום ⇒ מערב)', catches: 'כיוון אקראי',
        check: (e) => {
          const s = sky(e, midLat(e, true));
          if (!s) return null;
          const n = 9; const pts = [];
          for (let k = 0; k <= n; k++) pts.push(s.az(s.rise + ((s.set - s.rise) * (k + 0.5)) / (n + 1)));
          for (let k = 1; k < pts.length; k++) if (!(pts[k] > pts[k - 1])) return FAIL('יורד: ' + pts.map(deg).join(' ⇒ '));
          return true;
        },
      },
      {
        id: 'sun-heading.symmetric', says: 'סימטרי סביב חצות-היום: אזימוט(חצות − Δ) + אזימוט(חצות + Δ) = 360° (±0.5°)', catches: 'שעון מאחר ב-20 דקות',
        check: (e) => {
          const s = sky(e, midLat(e, true));
          if (!s) return null;
          const d = between(e, 0, s.noon - s.rise);
          const a = s.az(s.noon - d); const b = s.az(s.noon + d);
          return Math.abs(a + b - 360) <= 0.5 ? true : FAIL('±' + Math.round(d) + ' דק׳ ⇒ ' + deg(a) + ' + ' + deg(b) + ' = ' + deg(a + b));
        },
      },
    ],
    ref: {
      sig: [{ name: 'spec', d: { t: 'obj', p: [['lat', { t: 'num' }, false], ['lon', { t: 'num' }, false]] } }, { name: 'minutes', d: { t: 'int', lo: 0, hi: 1439 } }, { name: 'day', d: { t: 'str', h: 'iso' } }],
      fn: () => sunHeadingRef,
    },
    mutants: {
      'sun-heading.range': mut((a) => a + 90),
      'sun-heading.morning-east': mut((a) => (360 - a) % 360),
      'sun-heading.evening-west': mut(() => 90),
      'sun-heading.noon-south': mut((a) => (a + 90) % 360),
      'sun-heading.monotone': mut((a, s, d, m) => Math.floor(hash01(s?.lat, s?.lon, d, m) * 3600) / 10),
      'sun-heading.symmetric': () => (s, m, d) => sunHeadingRef(s, Number(m) - 20, d),
    },
    cues: { en: ['azimuth', 'bearing', 'heading', 'compass', 'direction'], he: ['כיוון', 'אזימוט', 'מצפן', 'פונה'] },
  },
];
