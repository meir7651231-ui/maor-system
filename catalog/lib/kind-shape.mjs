/**
 * 🧭 סוג לפי צורה (MACHINE-V3, 14.10.2026) — מיפוי-הסוגים המשותף ל-מפקדים, לפותח ולקורא-ההתנהגות.
 *
 * "לא חסר כלום": נקודות, צלילים, תמונות ותורים כבר קיימים בקוד — המילון פשוט לא זיהה אותם, כי הם נכתבו כ"רשומה"
 * או "רשימה". כאן הם מזוהים **לפי הצורה בלבד** (לא לפי העולם):
 *
 *   geo     — נקודה {x, y} · {x, y, z} · {lat, lon|lng} · [x, y] (עם שם של נקודה) · רשימה של נקודות (מסלול)
 *   sound   — צליל {freq|hz|pitch + t|start|dur} או {f, d, g} (כמו tone(f, t, d, g) של פרנס׳לע) · רשימה של צלילים (מנגינה)
 *   image   — מחרוזת `data:image/…` · רשומת-תמונה {width, height} (גודל-בד) או {w, h} עם שם-תמונה · שם-תמונה על מחרוזת
 *   waiting — תור: רשימה של פריטים שה-status שלהם כולל המתנה (wait · waiting · pending · queued · awaiting).
 *             פריט בודד נשאר רשומה (record:x) — ההמתנה היא מצב שלו, לא הסוג שלו
 *
 * שלוש כניסות, אותו כלל: צורה (desc של tsdesc/shape) · טקסט-טיפוס (מפקדים שקוראים `type` כטקסט) · ערך-ריצה (הקורא).
 * מחזירות סוג מהמילון, או null (= "לא אחד מהארבעה" — המיפוי הישן ממשיך). טהור ודטרמיניסטי, בלי תלויות.
 */

const NUM_T = new Set(['num', 'int']);
const live = (d) => (d && d.t === 'or' ? d.of.filter((x) => x.t !== 'null' && x.t !== 'undef') : d ? [d] : []);
const one = (d) => { const l = live(d); return l.length === 1 ? l[0] : null; };
const isNumD = (d) => { const x = one(d); return !!x && NUM_T.has(x.t); };
const fieldsOf = (d) => new Map((d.p || []).map(([k, dd]) => [k, dd]));

/** סטטוסים של המתנה (כל מילה שמכילה את אחד מאלה: 'wait', 'waitlist', 'pending', 'queued', 'awaiting'). */
export const WAIT_WORD = /^(wait|waiting|waitlist|waitlisted|pending|queued|queue|awaiting|await|onhold|on-hold|hold)$/i;
const IMAGE_NAME = /^(img|imgs|image|images|photo|photos|pic|pics|picture|pictures|thumb|thumbnail|avatar|dataUrl|dataUri|bitmap|canvas|sprite)$|(Image|Images|Photo|Photos|Img|Pic|Picture|Thumb|Thumbnail|Avatar|DataUrl|DataUri|Bitmap|Canvas)$/;
const POINT_NAME = /^(p|pt|pts|point|points|pos|position|xy|coord|coords|loc|vertex|vertices|path|center|centre|origin)$|(Point|Points|Pos|Position|Xy|Coord|Coords|Center)$/;

/* ═══════════════ צורה (desc) ═══════════════ */

/** נקודה: x ו-y מספריים (z אופציונלי), או lat ו-lon/lng מספריים. עד 6 שדות — רשומה גדולה עם x,y היא לא "נקודה". */
export function isPointDesc(d) {
  const x = one(d);
  if (!x || x.t !== 'obj' || !x.p || x.p.length > 6) return false;
  const f = fieldsOf(x);
  if (isNumD(f.get('x')) && isNumD(f.get('y'))) return true;
  return isNumD(f.get('lat')) && (isNumD(f.get('lon')) || isNumD(f.get('lng')));
}
/**
 * צליל: תדר מפורש (freq · frequency · hz · pitch) + זמן (התחלה או משך) — או הצורה של `tone(f, t, d, g)` של פרנס׳לע:
 * f + d + g (תדר · משך · עוצמה). {f, t} לבד (מ-עד, כמו חלון-שעות) **אינו** צליל.
 */
const FREQ = ['freq', 'frequency', 'hz', 'pitch'];
const WHEN = ['t', 'time', 'at', 'start', 'when', 'd', 'dur', 'duration', 'len'];
export function isToneDesc(d) {
  const x = one(d);
  if (!x || x.t !== 'obj' || !x.p || x.p.length > 8) return false;
  const f = fieldsOf(x);
  if (FREQ.some((k) => isNumD(f.get(k))) && WHEN.some((k) => isNumD(f.get(k)))) return true;
  return isNumD(f.get('f')) && isNumD(f.get('d')) && (isNumD(f.get('g')) || isNumD(f.get('gain')));
}
/** תמונה: {width, height} מספריים (גודל-בד), או {w, h} עם שם-תמונה; או שדה data/src/dataUrl לצד רוחב וגובה. */
export function isImageRecDesc(d, name = '') {
  const x = one(d);
  if (!x || x.t !== 'obj' || !x.p) return false;
  const f = fieldsOf(x);
  const wh = isNumD(f.get('width')) && isNumD(f.get('height'));
  const shortWh = isNumD(f.get('w')) && isNumD(f.get('h'));
  const named = IMAGE_NAME.test(name) || IMAGE_NAME.test(x.n || '');
  if (wh && (x.p.length <= 3 || named || f.has('data') || f.has('src') || f.has('dataUrl'))) return true;
  return shortWh && named;
}
/** פריט מחכה: שדה status (או state) שאחת האפשרויות שלו היא המתנה. */
export function isWaitingDesc(d) {
  const x = one(d);
  if (!x || x.t !== 'obj' || !x.p) return false;
  const f = fieldsOf(x);
  for (const k of ['status', 'state', 'stage']) {
    const s = f.get(k);
    if (!s) continue;
    const lits = live(s).flatMap((y) => (y.t === 'lit' ? y.v : []));
    if (lits.some((v) => typeof v === 'string' && WAIT_WORD.test(v))) return true;
  }
  return false;
}

/** desc ⇒ geo/sound/image/waiting, או null. `name` = שם הקלט/הערך (רמז לתמונה ולזוג [x, y]). */
export function shapeKindOfDesc(d, name = '') {
  const x = one(d);
  if (!x) return null;
  if (x.t === 'obj') {
    if (isPointDesc(x)) return 'geo';
    if (isToneDesc(x)) return 'sound';
    if (isImageRecDesc(x, name)) return 'image';
    // פריט בודד עם סטטוס-המתנה נשאר רשומה (record:x) — "מחכה" הוא תור: רשימה של פריטים שאחד הסטטוסים שלהם הוא המתנה
    return null;
  }
  if (x.t === 'tup') return (x.of.length === 2 || x.of.length === 3) && x.of.every(isNumD) && POINT_NAME.test(name) ? 'geo' : null;
  if (x.t === 'arr' || x.t === 'set') {
    const el = one(x.of);
    if (!el) return null;
    if (el.t === 'obj') {
      if (isPointDesc(el)) return 'geo';
      if (isToneDesc(el)) return 'sound';
      if (isWaitingDesc(el)) return 'waiting';
      return null;
    }
    if (el.t === 'tup' && (el.of.length === 2 || el.of.length === 3) && el.of.every(isNumD)) return 'geo';
    return null;
  }
  if (x.t === 'str') return IMAGE_NAME.test(name) ? 'image' : null;
  return null;
}

/* ═══════════════ טקסט-טיפוס ═══════════════ */

/** מפרק טקסט-טיפוס TS לצורה גסה (רק מה שהסוגים כאן צריכים): אובייקט-ליטרלי, מערך, טופל, איחוד, ליטרלים, number/string. */
export function descOfTypeText(t, depth = 0) {
  let s = String(t || '').trim();
  if (!s || depth > 4) return { t: 'any' };
  s = s.replace(/^readonly\s+/, '');
  const top = splitTop(s, '|');
  if (top.length > 1) return { t: 'or', of: top.map((x) => descOfTypeText(x, depth + 1)) };
  let m = /^(?:Readonly)?Array<(.+)>$/.exec(s);
  if (m) return { t: 'arr', of: descOfTypeText(m[1], depth + 1) };
  if (s.endsWith('[]') && balanced(s.slice(0, -2))) return { t: 'arr', of: descOfTypeText(unparen(s.slice(0, -2)), depth + 1) };
  if (s.startsWith('[') && s.endsWith(']')) return { t: 'tup', of: splitTop(s.slice(1, -1), ',').filter(Boolean).map((x) => descOfTypeText(x.replace(/^\w+\??:\s*/, ''), depth + 1)) };
  if (s.startsWith('{') && s.endsWith('}')) {
    const p = [];
    for (const seg of splitTop(s.slice(1, -1), ';').flatMap((x) => splitTop(x, ','))) {
      m = /^\s*(?:readonly\s+)?["']?([A-Za-z_$][\w$]*)["']?(\?)?\s*:\s*([\s\S]+)$/.exec(seg);
      if (m) p.push([m[1], descOfTypeText(m[3], depth + 1), !!m[2]]);
    }
    return { t: 'obj', p };
  }
  if (/^'[^']*'$|^"[^"]*"$/.test(s)) return { t: 'lit', v: [s.slice(1, -1)] };
  if (/^-?\d+(\.\d+)?$/.test(s)) return { t: 'lit', v: [Number(s)] };
  if (s === 'number' || s === 'bigint') return { t: 'num' };
  if (s === 'string') return { t: 'str' };
  if (s === 'boolean' || s === 'true' || s === 'false') return { t: 'bool' };
  if (s === 'null') return { t: 'null' };
  if (s === 'undefined' || s === 'void') return { t: 'undef' };
  if (s.startsWith('(') && s.endsWith(')') && balanced(s.slice(1, -1))) return descOfTypeText(s.slice(1, -1), depth + 1);
  return { t: 'any' };
}
function balanced(s) {
  let d = 0;
  for (const c of s) { if ('{[(<'.includes(c)) d++; else if ('}])>'.includes(c)) d--; if (d < 0) return false; }
  return d === 0;
}
const unparen = (s) => (s.startsWith('(') && s.endsWith(')') && balanced(s.slice(1, -1)) ? s.slice(1, -1) : s);
function splitTop(s, sep) {
  const out = [];
  let d = 0; let q = null; let cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { cur += c; if (c === q && s[i - 1] !== '\\') q = null; continue; }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if ('{[(<'.includes(c)) d++;
    else if ('}])>'.includes(c) && !(c === '>' && s[i - 1] === '=')) d--;
    if (c === sep && d === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** טקסט-טיפוס ⇒ geo/sound/image/waiting, או null. */
export function shapeKindOfType(typeText, name = '') {
  const s = String(typeText || '');
  if (!s || s === 'unknown' || s === 'any') return null;
  return shapeKindOfDesc(descOfTypeText(s), name);
}

/* ═══════════════ ערך-ריצה ═══════════════ */

const isN = (v) => typeof v === 'number' && Number.isFinite(v);
const isO = (v) => !!v && typeof v === 'object' && !Array.isArray(v) && !('$$' in v);
export function isPointValue(v) {
  if (!isO(v)) return false;
  const k = Object.keys(v);
  if (k.length > 6) return false;
  return (isN(v.x) && isN(v.y)) || (isN(v.lat) && (isN(v.lon) || isN(v.lng)));
}
export function isToneValue(v) {
  if (!isO(v)) return false;
  if (FREQ.some((k) => isN(v[k])) && WHEN.some((k) => isN(v[k]))) return true;
  return isN(v.f) && isN(v.d) && (isN(v.g) || isN(v.gain));
}
export const isImageValue = (v) => (typeof v === 'string' && /^data:image\//.test(v)) || (isO(v) && isN(v.width) && isN(v.height) && Object.keys(v).length <= 4);
export const isWaitingValue = (v) => isO(v) && ['status', 'state', 'stage'].some((k) => typeof v[k] === 'string' && WAIT_WORD.test(v[k]));

/** ערך ⇒ geo/sound/image/waiting, או null. רשימה — רק כשכל הפריטים (ויש לפחות אחד) מאותו סוג; תור = לפחות פריט מחכה אחד. */
export function shapeKindOfValue(v) {
  if (isPointValue(v)) return 'geo';
  if (isToneValue(v)) return 'sound';
  if (isImageValue(v)) return 'image';
  if (Array.isArray(v) && v.length) {
    if (v.every(isPointValue) || (v.every((p) => Array.isArray(p) && (p.length === 2 || p.length === 3) && p.every(isN)) && v.length >= 2)) return 'geo';
    if (v.every(isToneValue)) return 'sound';
    if (v.every(isO) && v.some(isWaitingValue)) return 'waiting';
  }
  return null;
}

export const SHAPE_KINDS = ['geo', 'sound', 'image', 'waiting'];

/* ═══════════════ החומר כקלט מחולל (מכונת-השילוב, צורת `on`) ═══════════════ */

const INT = (lo, hi) => ({ t: 'int', lo, hi });
/** כתובות-תמונה קצרות ושונות (פיקסל אחד, צבע אחר) — לא קבצים אמיתיים, רק הצורה `data:image/…`. */
const DATA_URIS = ['R0lGODlhAQABAAAAACw=', 'R0lGODlhAQABAIAAAP8=', 'R0lGODlhAQABAIAAAAA=', 'R0lGODlhAQABAPAAAAA=', 'R0lGODlhAQABAJEAAAA=', 'R0lGODlhAQABAHAAAP8='].map((b) => 'data:image/gif;base64,' + b);
/**
 * הצורה הקנונית של כל חומר, כדי להריץ חלק כללי **על החומר עצמו**: `one` = פריט, `many` = רשימה.
 * מספרים שלמים בטווח קטן — כך יש גם כפולים (מסיר-כפולים) וגם השוואה מדויקת.
 *   geo     — נקודה {x, y} · מסלול = רשימת נקודות
 *   sound   — צליל {f, t, d, g} (tone של פרנס׳לע: תדר · התחלה · משך · עוצמה) · מנגינה = רשימת צלילים
 *   image   — תמונה {src: data:image/…, width, height} · אלבום = רשימת תמונות
 *   waiting — בקשה {id, status: wait|pending|active|done} · תור = רשימת בקשות
 */
export const MATERIAL_DESC = {
  geo: { t: 'obj', n: 'Point', p: [['x', INT(-40, 40), false], ['y', INT(-40, 40), false]] },
  sound: { t: 'obj', n: 'Tone', p: [['f', INT(110, 880), false], ['t', INT(0, 4000), false], ['d', INT(40, 900), false], ['g', INT(1, 100), false]] },
  image: { t: 'obj', n: 'Picture', p: [['src', { t: 'lit', v: DATA_URIS }, false], ['width', INT(1, 64), false], ['height', INT(1, 64), false]] },
  waiting: { t: 'obj', n: 'Request', p: [['id', { t: 'lit', v: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'] }, false], ['status', { t: 'lit', v: ['wait', 'pending', 'active', 'done'] }, false]] },
};
export const materialDesc = (kind, many) => {
  const one1 = MATERIAL_DESC[kind];
  if (!one1) return null;
  return many || kind === 'waiting' ? { t: 'arr', of: one1, max: 6 } : one1;
};
