/**
 * 📇 צורות וערכים (CATALOG-VERBS, 14.10.2026) — שפה קטנה לתיאור "מה חלק מקבל", מחולל-ערכים עם זרע,
 * והשוואה קנונית. בלי תלויות; ה-rng ומחוללי-העברית/הזמנים מגיעים מהמאמת דרך הגשר (B).
 *
 * צורה (desc):
 *   {t:'num',h} · {t:'int',lo,hi} · {t:'str',h} · {t:'bool'} · {t:'lit',v:[…]} · {t:'arr',of,u?,max?} · {t:'tup',of:[…]}
 *   {t:'obj',n?,p:[[key,desc,optional]]} · {t:'rec',of} · {t:'or',of:[…]} · {t:'null'} · {t:'undef'} · {t:'date'}
 *   {t:'fn'} · {t:'any'} · {t:'map',k,v} · {t:'set',of}
 *   h = רמז מהשם (iso · hhmm · isodt · ms · amount · count · year · month · dom · pct · min · id · phone · email · url · he · lat · lon · dow · cur · color)
 * ערכים מקודדים כ-JSON; ערך מיוחד = {"$$":"date",v} · {"$$":"undef"} · {"$$":"fn"} · {"$$":"nan"} · {"$$":"inf",s} · {"$$":"map",e} · {"$$":"set",e} · {"$$":"promise"}.
 */

/* ═══════════════ רמזים מהשם ═══════════════ */

const H = [
  ['isodt', /(at|At|stamp|Stamp|created|updated|Time)Iso$|datetime|DateTime|isoTs/],
  ['ms', /(^|[a-z_])(ms|Ms|MS)$|^now$|Ms[A-Z]|epoch|timestamp|^ts$|^t$|^(times|moments|stamps)$/],
  ['iso', /(^|_)(iso|date|day|dob|birth|due|until|since|checkin|checkout|checkIn|checkOut)$|Iso$|Date$|Day$|^(from|to)Iso|^d[12]?$|date/i],
  ['hhmm', /(^|_)(hhmm|time|clock|hour)$|Time$|Hhmm$|^(t[12])$/],
  ['amount', /amount|sum$|^sum|total|price|ils|Ils|usd|Usd|paid|balance|cost|Cost|fee|Fee|budget|money|cash|debt|salary|rate|Rate/i],
  ['pct', /pct|percent|ratio|Pct|Percent/],
  ['count', /^(n|k|count|qty|parts|size|limit|max|min[A-Z]|num|times|nights|days|weeks|months|steps|len|length|index|idx|i|j|page|per|top|cap|slots|seats|step)$|Count$|Qty$|Index$|Idx$|Limit$|Size$|Nights$|Days$/],
  ['minutes', /(^|_)(min|mins|minutes|minute|offset|delta|shift|dur|duration)$|Min$|Minutes$|Offset$/],
  ['hyear', /hebYear|hYear|^hy$|HebYear|^hyear$/],
  ['year', /year|Year/],
  ['month', /^month$|Month$|^m$/],
  ['dom', /^dom$|dayOfMonth|^dd$/],
  ['dow', /dow|weekday|Weekday|Dow/],
  ['lat', /^lat|Lat$/],
  ['lon', /^(lon|lng)|Lon$|Lng$/],
  ['phone', /phone|Phone|tel$|Tel$|mobile|Mobile/],
  ['email', /email|Email|mail$/],
  ['url', /url|Url|URL|href|link|Link/],
  ['id', /(^|[a-z])(id|Id|ID|ids|Ids|key|Key|slug|Slug|uid|rid)$/],
  ['cur', /currency|Currency|^cur$/],
  ['color', /color|Color|colour/],
  ['he', /name|Name|title|Title|text|Text|note|Note|label|Label|query|^q$|word|Word|desc|msg|message|Message|body|city|City|street|address|caption|term|Term|tag|Tag|cat|Cat|kind|type|status|role/],
];
export function hintOf(name = '') {
  for (const [h, re] of H) if (re.test(name)) return h;
  return '';
}

/* ═══════════════ מחולל ═══════════════ */

const pad = (n) => String(n).padStart(2, '0');
const HE_FALLBACK = 'אבגדהוזחטיכלמנסעפצקרשת';
function heText(r, B) {
  if (B && B.heWord) return B.heWord(r, 3, 8);
  let s = '';
  for (let i = r.int(3, 7); i > 0; i--) s += HE_FALLBACK[r.int(0, HE_FALLBACK.length - 1)];
  return s;
}
function isoOf(r, B) {
  return B && B.isoAround ? B.isoAround(r) : '2026-10-' + pad(r.int(1, 28));
}
function msOf(r, B) {
  return B && B.momentAround ? B.momentAround(r) : Date.UTC(2026, 9, 14) + r.int(-5000, 5000) * 60_000;
}

/** מספר לפי רמז. */
export function genNum(h, r, B) {
  switch (h) {
    case 'ms': return msOf(r, B);
    case 'amount': return B && B.amount ? B.amount(r) : r.int(0, 99999) / 100;
    case 'count': return r.pick([0, 1, 1, 2, 3, 3, 4, 5, 7, 12, r.int(0, 30)]);
    case 'minutes': return r.pick([0, 15, 30, 45, 60, 90, 180, r.int(-120, 1500)]);
    case 'year': return r.int(2020, 2031);
    case 'hyear': return r.int(5780, 5795);
    case 'month': return r.int(1, 12);
    case 'dom': return r.int(1, 28);
    case 'dow': return r.int(0, 6);
    case 'pct': return r.int(0, 100);
    case 'lat': return 29 + r.int(0, 4000) / 1000;
    case 'lon': return 34 + r.int(0, 2000) / 1000;
    default: {
      const k = r.int(0, 9);
      if (k <= 3) return r.int(-5, 60);
      if (k <= 5) return r.int(0, 100000) / 100;
      if (k === 6) return 0;
      if (k === 7) return r.int(100, 5000);
      if (k === 8) return -r.int(1, 500) / 4;
      return r.int(1, 12);
    }
  }
}

/** טקסט לפי רמז. בלי פרטים אמיתיים: הכול סינתטי. */
export function genStr(h, r, B) {
  switch (h) {
    case 'iso': return isoOf(r, B);
    case 'hhmm': return pad(r.int(0, 23)) + ':' + pad(r.pick([0, 0, 15, 30, 45, r.int(0, 59)]));
    case 'isodt': { const ms = msOf(r, B); return new Date(ms).toISOString(); }
    case 'ms': return String(msOf(r, B));
    case 'id': return 'id' + r.int(1, 24);
    case 'phone': return '05' + r.int(0, 8) + r.int(1000000, 9999999);
    case 'email': return 'u' + r.int(1, 99) + '@example.test';
    case 'url': return 'https://example.test/p' + r.int(1, 99);
    case 'cur': return r.pick(['ILS', 'USD', 'ILS']);
    case 'color': return '#' + r.int(0, 0xffffff).toString(16).padStart(6, '0');
    case 'amount': return String(r.int(0, 99999) / 100);
    case 'count': return String(r.int(0, 20));
    case 'he': {
      const k = r.int(0, 9);
      if (k === 0) return '';
      if (k <= 6) return heText(r, B);
      return [heText(r, B), heText(r, B), r.bool(0.5) ? heText(r, B) : ''].filter(Boolean).join(' ');
    }
    default: {
      const k = r.int(0, 19);
      if (k === 0) return '';
      if (k <= 8) return heText(r, B);
      if (k <= 11) return heText(r, B) + ' ' + heText(r, B);
      if (k <= 13) return String(r.int(0, 999));
      if (k <= 15) return r.pick(['a', 'b', 'open', 'done', 'x1', 'main']);
      if (k === 16) return r.pick(['Main Hall', 'ABC', 'Open', 'Tel Aviv']);
      if (k <= 18) return '  ' + heText(r, B) + ' ';
      return heText(r, B) + '  ' + heText(r, B);
    }
  }
}

/** "כל דבר" ⇒ סוג אחד מבין אלה (לרשימה אחידה / לפרמטר-טיפוס). */
const ANY_CHOICES = (hint) => [{ t: 'bool' }, { t: 'num', h: hint }, { t: 'str', h: hint }, { t: 'obj', p: [['id', { t: 'str', h: 'id' }, false], ['name', { t: 'str', h: 'he' }, false], ['n', { t: 'num', h: 'count' }, true]] }];
/**
 * פרמטר-טיפוס (T, M extends number|string): בוחרים ענף אחד למקרה ושומרים ב-B.tpick — כך times: M[] ו-now: M
 * מאותו סוג, ו-items: T[] היא רשימה אחידה (כולה כן/לא, או כולה מספרים…).
 */
function resolveTp(d, r, B, hint) {
  const pick = B && B.tpick;
  if (pick && pick.has(d.id)) return pick.get(d.id);
  const opts = d.of.t === 'or' ? d.of.of.filter((x) => x.t !== 'null' && x.t !== 'undef') : d.of.t === 'any' ? ANY_CHOICES(hint) : [d.of];
  const got = opts.length ? opts[r.int(0, opts.length - 1)] : { t: 'any' };
  if (pick) pick.set(d.id, got);
  return got;
}
const MAX_DEPTH = 6;
/** ערך לפי צורה. `h` = רמז מהשם (נגבר על-ידי רמז שבצורה). */
export function gen(d, r, B, depth = 0, h = '') {
  if (!d) return null;
  const hint = d.h || h;
  // מילון-הקוד: מחרוזות ומספרים שכתובים בקובץ עצמו ('Adar', 'open', 5786…) — כך הקלטים פוגעים בתחום של החלק
  const pool = B && B.pool;
  if (pool && (d.t === 'str' || d.t === 'num' || d.t === 'any') && (!hint || hint === 'he' || hint === 'id') && r.bool(0.3)) {
    const xs = d.t === 'num' ? pool.num : d.t === 'str' ? pool.str : pool.str.concat(pool.num);
    if (xs.length) return xs[r.int(0, xs.length - 1)];
  }
  switch (d.t) {
    case 'num': return genNum(hint, r, B);
    case 'int': return r.int(d.lo ?? 0, d.hi ?? 12);
    case 'str': return genStr(hint, r, B);
    case 'bool': return r.bool();
    case 'lit': return d.v.length ? d.v[r.int(0, d.v.length - 1)] : null;
    case 'null': return null;
    case 'undef': return { $$: 'undef' };
    case 'date': return { $$: 'date', v: msOf(r, B) };
    case 'fn': return { $$: 'fn' };
    case 'any': {
      const k = r.int(0, 5);
      return k <= 1 ? genNum(hint, r, B) : k <= 3 ? genStr(hint, r, B) : k === 4 ? r.bool() : null;
    }
    case 'arr': {
      if (depth >= MAX_DEPTH) return [];
      const max = d.max ?? (depth >= 2 ? 3 : 6);
      const n = r.int(0, max);
      const out = [];
      const seen = new Set();
      // רשימה אחידה: מאיחוד בוחרים ענף אחד לכל הרשימה; "כל דבר" ⇒ סוג אחד לכל הרשימה
      let of = d.of && d.of.t === 'tp' ? resolveTp(d.of, r, B, hint) : d.of;
      if (of && of.t === 'or' && r.bool(0.85)) { const live = of.of.filter((x) => x.t !== 'null' && x.t !== 'undef'); if (live.length) of = live[r.int(0, live.length - 1)]; }
      if (of && of.t === 'any') of = ANY_CHOICES(hint)[r.int(0, 3)];
      for (let i = 0; i < n; i++) {
        const v = gen(of, r, B, depth + 1, hint);
        if (d.u) { const c = canon(v); if (seen.has(c)) continue; seen.add(c); }
        out.push(v);
      }
      return out;
    }
    case 'tup': return d.of.map((x) => gen(x, r, B, depth + 1, hint));
    case 'tp': return gen(resolveTp(d, r, B, hint), r, B, depth, hint);
    case 'obj': {
      if (depth >= MAX_DEPTH) return {};
      const o = {};
      for (const [k, pd, opt] of d.p) {
        if (opt && r.bool(0.35)) continue;
        o[k] = gen(pd, r, B, depth + 1, hintOf(k));
      }
      return o;
    }
    case 'rec': {
      if (depth >= MAX_DEPTH) return {};
      const o = {};
      for (let i = r.int(0, 3); i > 0; i--) o['k' + r.int(1, 9)] = gen(d.of, r, B, depth + 1, hint);
      return o;
    }
    case 'or': {
      const live = d.of.filter((x) => x.t !== 'null' && x.t !== 'undef');
      if (!live.length || r.bool(0.12)) return d.of.some((x) => x.t === 'null') ? null : { $$: 'undef' };
      return gen(live[r.int(0, live.length - 1)], r, B, depth, hint);
    }
    case 'map': {
      const e = [];
      for (let i = r.int(0, 3); i > 0; i--) e.push([gen(d.k, r, B, depth + 1), gen(d.v, r, B, depth + 1)]);
      return { $$: 'map', e };
    }
    case 'set': {
      const e = [];
      for (let i = r.int(0, 4); i > 0; i--) e.push(gen(d.of, r, B, depth + 1, hint));
      return { $$: 'set', e };
    }
    default: return null;
  }
}

/** צורה מסוג-הקטלוג (כשאין טיפוס — JS, Dart). */
export function descFromKind(kind = 'unknown', name = '', type = '') {
  const h = hintOf(name);
  const k = kind.startsWith('record:') ? 'record' : kind;
  switch (k) {
    case 'number': return { t: 'num', h: h || (/^int$/.test(type) ? 'count' : '') };
    case 'amount': return { t: 'num', h: 'amount' };
    case 'text': return { t: 'str', h: h || 'he' };
    case 'bool': return { t: 'bool' };
    case 'date': return { t: 'str', h: 'iso' };
    case 'times': return /num|ms|int|Ms/.test(type + name) ? { t: 'num', h: 'ms' } : { t: 'str', h: 'hhmm' };
    case 'span': return { t: 'obj', p: [['from', { t: 'num' }, false], ['to', { t: 'num' }, false]] };
    case 'list': return { t: 'arr', of: { t: 'any', h } };
    case 'sequence': return { t: 'arr', of: { t: 'num' } };
    case 'choice': return { t: 'str', h: h || 'id' };
    case 'record': return { t: 'obj', n: kind.slice(7), p: [['id', { t: 'str', h: 'id' }, true], ['name', { t: 'str', h: 'he' }, true], ['date', { t: 'str', h: 'iso' }, true], ['amount', { t: 'num', h: 'amount' }, true], ['status', { t: 'str', h: 'id' }, true]] };
    default: return { t: 'any', h };
  }
}

/* ═══════════════ השוואה ═══════════════ */

const numCanon = (n) => {
  if (Object.is(n, -0)) return 0;
  if (!Number.isFinite(n)) return n;
  return Number.isInteger(n) ? n : Number(n.toPrecision(12));
};
/** מחרוזת קנונית: מפתחות ממוינים, מספרים ב-12 ספרות. */
export function canon(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return String(numCanon(v));
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (typeof v === 'object') return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  return JSON.stringify(String(v));
}
export const same = (a, b) => canon(a) === canon(b);

/** "כלום": null, undefined מקודד, או מערך/טקסט ריק לא נחשבים — רק null/undef. */
export const isNil = (v) => v === null || v === undefined || (typeof v === 'object' && v.$$ === 'undef');
export const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
export const isStr = (v) => typeof v === 'string';
export const isArr = Array.isArray;
export const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && !('$$' in v);

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^\d{1,2}:\d{2}$/;
const ISODT = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;
/** מחלקת-ערך: לפיה מתאימים פועל לחלק. */
export function classOf(v) {
  if (isNil(v)) return 'nil';
  if (typeof v === 'number') return Number.isFinite(v) ? 'num' : 'nan';
  if (typeof v === 'boolean') return 'bool';
  if (typeof v === 'string') return ISO.test(v) ? 'iso' : ISODT.test(v) ? 'isodt' : HHMM.test(v) ? 'hhmm' : 'str';
  if (Array.isArray(v)) return 'arr';
  if (v.$$) return v.$$;
  return 'obj';
}
/** ערך שאפשר לסדר על ציר: מספר, תאריך (ימים), שעה (דקות), רגע (דקות), תאריך-JS. */
export function toNum(v) {
  const c = classOf(v);
  if (c === 'num') return v;
  if (c === 'iso') return Date.parse(v + 'T00:00:00Z') / 86_400_000;
  if (c === 'hhmm') { const [h, m] = v.split(':').map(Number); return h * 60 + m; }
  if (c === 'isodt') return Date.parse(v.length <= 16 ? v.replace(' ', 'T') + ':00Z' : v) / 60_000;
  if (c === 'date') return v.v / 60_000;
  return NaN;
}
export const axisClass = (c) => c === 'num' || c === 'iso' || c === 'hhmm' || c === 'isodt' || c === 'date';

/** שוויון-מספרים עם סובלנות (ואופציה למודולו — מכונת 16 התאים). */
export function numEq(a, b, mod = 0) {
  if (!isNum(a) || !isNum(b)) return same(a, b);
  if (mod) return (((a - b) % mod) + mod) % mod === 0;
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
}

/** האם a תת-רצף של b (לפי סדר, לפי ערך). */
export function isSubseq(a, b) {
  let j = 0;
  const cb = b.map(canon);
  for (const x of a.map(canon)) {
    while (j < cb.length && cb[j] !== x) j++;
    if (j >= cb.length) return false;
    j++;
  }
  return true;
}
/** האם a תמורה של b. */
export function isPerm(a, b) {
  if (a.length !== b.length) return false;
  const m = new Map();
  for (const x of b) { const c = canon(x); m.set(c, (m.get(c) ?? 0) + 1); }
  for (const x of a) { const c = canon(x); const n = m.get(c); if (!n) return false; m.set(c, n - 1); }
  return true;
}
/** ערבוב דטרמיניסטי (Fisher-Yates); אם יצא אותו סדר — סיבוב באחד. */
export function shuffle(xs, r) {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = r.int(0, i); [a[i], a[j]] = [a[j], a[i]]; }
  if (a.length > 1 && same(a, xs)) a.push(a.shift());
  return a;
}
/** שרשור; ברשימה "ייחודית" (u) — בלי כפולים. */
export function cat(a, b, unique = false) {
  if (!unique) return a.concat(b);
  const s = new Set(a.map(canon));
  return a.concat(b.filter((x) => !s.has(canon(x))));
}

/** ערכי-מפה כרשימת [מפתח, ערך]: אובייקט, Map מקודד, או מערך זוגות. null = לא מפה. */
export function entriesOf(v) {
  if (isObj(v)) return Object.entries(v);
  if (v && v.$$ === 'map') return v.e.map(([k, x]) => [canon(k), x]);
  if (isArr(v) && v.every((x) => isArr(x) && x.length === 2)) return v.map(([k, x]) => [canon(k), x]);
  return null;
}

/* ═══════════════ ארגז-חול: קוד שרץ בתוך ההקשר ═══════════════ */

/** מבוא שרץ בתוך vm-context: שעון קבוע, Math.random עם זרע, והמרות קידוד ⇄ ערך. */
export const SANDBOX_PRELUDE = String.raw`
(function(){
  const RealDate = Date; const FIX = Date.UTC(2026, 9, 14, 9, 0, 0);
  class FDate extends RealDate { constructor(...a){ if (a.length === 0) super(FIX); else super(...a); } static now(){ return FIX; } }
  globalThis.Date = FDate;
  let s = 0x2545f491;
  Math.random = function(){ s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  globalThis.__reseed = function(x){ s = x >>> 0; };
  function rv(v){
    if (Array.isArray(v)) return v.map(rv);
    if (v && typeof v === 'object') {
      if ('$$' in v) {
        switch (v.$$) {
          case 'date': return new FDate(v.v);
          case 'undef': return undefined;
          case 'fn': return function(){ return arguments[0]; };
          case 'nan': return NaN;
          case 'inf': return v.s * Infinity;
          case 'map': return new Map(v.e.map(function(p){ return [rv(p[0]), rv(p[1])]; }));
          case 'set': return new Set(v.e.map(rv));
        }
      }
      const o = {}; for (const k in v) o[k] = rv(v[k]); return o;
    }
    return v;
  }
  let budget = 0;
  function dp(v, d){
    if (++budget > 200000) throw new Error('output too large');
    if (v === undefined) return { $$: 'undef' };
    if (v === null) return null;
    const t = typeof v;
    if (t === 'number') return Number.isNaN(v) ? { $$: 'nan' } : Number.isFinite(v) ? v : { $$: 'inf', s: v > 0 ? 1 : -1 };
    if (t === 'string' || t === 'boolean') return v;
    if (t === 'bigint') return String(v);
    if (t === 'function') return { $$: 'fn' };
    if (t === 'symbol') return String(v);
    if (d > 14) return { $$: 'deep' };
    if (v instanceof RealDate) { const x = v.getTime(); return { $$: 'date', v: Number.isFinite(x) ? x : null }; }
    if (typeof v.then === 'function') return { $$: 'promise' };
    if (v instanceof Map) return { $$: 'map', e: Array.from(v.entries()).map(function(p){ return [dp(p[0], d + 1), dp(p[1], d + 1)]; }) };
    if (v instanceof Set) return { $$: 'set', e: Array.from(v.values()).map(function(x){ return dp(x, d + 1); }) };
    if (Array.isArray(v) || ArrayBuffer.isView(v)) return Array.from(v, function(x){ return dp(x, d + 1); });
    const o = {}; for (const k of Object.keys(v)) o[k] = dp(v[k], d + 1); return o;
  }
  // require של חבילה שלא הותקנה ⇒ "מודול אדיש": כל גישה/קריאה מחזירה את עצמו, בלי שום פעולה (בלי I/O)
  const inert = new Proxy(function(){}, { get(t, k){ return k === Symbol.toPrimitive ? function(){ return ''; } : k === 'then' ? undefined : inert; }, apply(){ return inert; }, construct(){ return inert; } });
  globalThis.require = function(){ return inert; };
  globalThis.h = inert; globalThis.React = inert; globalThis.Fragment = inert;
  // process ריק: בלי env, בלי argv, exit זורק — סקריפט שרץ בטעינה נעצר, אבל לא נוגע בשום דבר
  globalThis.process = { env: {}, argv: [], platform: 'sandbox', versions: {}, exitCode: 0, cwd(){ return '/'; }, exit(){ throw new Error('process.exit'); }, on(){ return this; }, once(){ return this; }, nextTick(){}, hrtime(){ return [0, 0]; }, memoryUsage(){ return {}; }, stdout: { write(){ return true; } }, stderr: { write(){ return true; } } };
  globalThis.__invoke = function(f, json, seed, self){
    __reseed(seed);
    const a = rv(JSON.parse(json));
    const r = f.apply(self, a);
    if (r && typeof r.then === 'function') return '{"$$":"promise"}';
    budget = 0;
    return JSON.stringify(dp(r, 0));
  };
})();
`;
