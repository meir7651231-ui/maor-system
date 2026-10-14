/**
 * 🧪 ארגז-החול של קורא-ההתנהגות (CATALOG-VERBS, 14.10.2026).
 *
 * קובץ-מקור ⇒ rolldown אורז אותו (עם כל מה שהוא מייבא) לקוד CJS אחד בזיכרון ⇒ הקוד רץ בתוך vm-context ריק:
 *   · אין process, require, fetch, setTimeout, fs, env — רק מה שבא עם V8 (Math, JSON, Intl, Date…) + TextEncoder/URL.
 *   · eval/new Function כבויים (codeGeneration: strings:false, wasm:false).
 *   · שעון קבוע (14.10.2026 09:00Z) ו-Math.random עם זרע — כדי שאותו קלט ייתן אותו פלט.
 *   · טעינת-המודול עם הגבלת-זמן; כל קריאה לחלק — בתוך worker עם שומר-זמן (probe-worker.mjs), env ריק.
 * רק חלקים שהמפקד סימן `pure: true` נשלחים לכאן.
 */
import vm from 'node:vm';
import { SANDBOX_PRELUDE } from './shape.mjs';

const EXT = ['.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx', '.json'];

/**
 * 🪞 SELF: לסקריפטים של המכונה — import.meta.url ⇒ נתיב קבוע, ו-`path` אמיתי-בלי-I/O (חישובי-מחרוזת posix בלבד),
 * כי הקבועים בראש הקובץ (ROOT = path.resolve(dirname(…))) נחשבים בטעינה. שאר המודולים של node נשארים "אדישים".
 */
const CLI_PRELUDE = `var __filename = "/sandbox/part.mjs", __dirname = "/sandbox";
var require = (function (base) {
  var norm = function (p) { var abs = p.charAt(0) === '/'; var out = []; p.split('/').forEach(function (x) { if (!x || x === '.') return; if (x === '..') out.pop(); else out.push(x); }); return (abs ? '/' : '') + out.join('/') || (abs ? '/' : '.'); };
  var P = { sep: '/', delimiter: ':',
    join: function () { return norm([].slice.call(arguments).filter(Boolean).join('/')); },
    resolve: function () { var r = '/sandbox'; [].slice.call(arguments).forEach(function (x) { if (!x) return; r = x.charAt(0) === '/' ? x : r + '/' + x; }); return norm(r); },
    dirname: function (p) { var n = norm(p); var i = n.lastIndexOf('/'); return i <= 0 ? (n.charAt(0) === '/' ? '/' : '.') : n.slice(0, i); },
    basename: function (p, ext) { var b = norm(p).split('/').pop(); return ext && b.slice(-ext.length) === ext ? b.slice(0, -ext.length) : b; },
    extname: function (p) { var b = norm(p).split('/').pop(); var i = b.lastIndexOf('.'); return i > 0 ? b.slice(i) : ''; },
    relative: function (a, b) { var x = P.resolve(a).split('/').filter(Boolean), y = P.resolve(b).split('/').filter(Boolean); var i = 0; while (i < x.length && x[i] === y[i]) i++; return x.slice(i).map(function () { return '..'; }).concat(y.slice(i)).join('/'); },
    isAbsolute: function (p) { return p.charAt(0) === '/'; }, normalize: norm };
  P.posix = P;
  return function (n) { return n === 'path' || n === 'node:path' ? P : base(n); };
})(globalThis.require);
`;

/** אורז קובץ-מקור לקוד CJS אחד (בזיכרון בלבד — לא נכתב שום קובץ). */
export async function bundleFile(abs, opts = {}) {
  return (await bundleWithDeps(abs, opts)).code;
}

/** כמו bundleFile, ומחזיר גם את כל הקבצים שנארזו (deps — מוחלטים, ממוינים) — בשביל מטמון-התוצאות (lib/cache.mjs). */
export async function bundleWithDeps(abs, { alias = {}, expose = [], esm = true, cli = false } = {}) {
  const { rolldown } = await import('rolldown');
  const { builtinModules } = await import('node:module');
  // פונקציה/מחלקה פנימית (לא מיוצאת) ⇒ מוסיפים לה ייצוא בזיכרון, כדי שאפשר יהיה לקרוא לה (הקובץ בדיסק לא משתנה)
  const tail = !expose.length ? '' : esm ? '\nexport { ' + expose.join(', ') + ' };\n' : '\n;try { module.exports.__catalog = Object.assign(module.exports.__catalog || {}, { ' + expose.join(', ') + ' }); } catch (e) {}\n';
  const plugins = tail ? [{ name: 'catalog-expose', transform(code, id) { return id === abs ? code + tail : null; } }] : [];
  // 🪞 SELF: סקריפט של המכונה — נקודת-הכניסה של שורת-הפקודה (`if (process.argv…) {…}`, `await main()`) היא לא חלק; בזיכרון בלבד
  if (cli) { const { stripCli } = await import('./strip-cli.mjs'); plugins.unshift({ name: 'catalog-strip-cli', transform(code, id) { return /\.m?js$/.test(id) ? stripCli(code) : null; } }); }
  const b = await rolldown({
    input: abs, platform: 'neutral', logLevel: 'silent', treeshake: false, plugins,
    // מודולים של node (fs, path, child_process…) לא נארזים — בארגז-החול require שלהם מחזיר "מודול אדיש" בלי I/O
    external: [/^node:/, ...builtinModules, ...(cli ? ['typescript', 'rolldown', 'playwright'] : [])],
    resolve: { extensions: EXT, alias, mainFields: ['module', 'main'], conditionNames: ['import', 'default'] },
    transform: { jsx: { runtime: 'classic', pragma: 'h' } },
    moduleTypes: { '.css': 'empty', '.svg': 'text', '.png': 'empty', '.md': 'text', '.txt': 'text' },
  });
  try {
    const { output } = await b.generate({ format: 'cjs', exports: 'named', codeSplitting: false });
    const deps = [...new Set((output[0].moduleIds ?? []).filter((id) => typeof id === 'string' && id.startsWith('/')))].sort();
    // import.meta.url ב-CJS ⇒ __filename; בארגז-החול אין קובץ — נתיב קבוע (רק למכונה עצמה, כדי שהאחרים יישארו ביט-זהים)
    return { code: cli ? CLI_PRELUDE + output[0].code.replace(/^#!.*\n/, '') : output[0].code, deps };
  } finally {
    await b.close();
  }
}

/** טוען קוד מאורז לתוך הקשר ריק. מחזיר את הייצוא (אובייקט בתוך ההקשר) ואת ההקשר. */
export function loadInSandbox(code, { timeoutMs = 3000 } = {}) {
  const noop = () => {};
  const ctx = vm.createContext(
    { console: { log: noop, warn: noop, error: noop, info: noop, debug: noop, trace: noop }, TextEncoder, TextDecoder, URL, URLSearchParams },
    // microtaskMode: הבטחות שנוצרו בתוך ההקשר רצות רק בתוך הקריאה עצמה — קוד אסינכרוני לא ממשיך לרוץ "ברקע"
    { codeGeneration: { strings: false, wasm: false }, name: 'catalog-probe', microtaskMode: 'afterEvaluate' },
  );
  vm.runInContext(SANDBOX_PRELUDE, ctx, { timeout: timeoutMs });
  vm.runInContext('globalThis.module = { exports: {} }; globalThis.exports = module.exports;', ctx);
  vm.runInContext(code, ctx, { timeout: timeoutMs, filename: 'part.cjs' });
  return { ctx, exports: vm.runInContext('module.exports', ctx) };
}

/** קריאה לפונקציה שבתוך ההקשר: args מקודדים ⇒ {v} · {err} · {async:true}. */
export function callerFor(ctx, fn, seedBase = 0, self = undefined) {
  let n = 0;
  const invoke = vm.runInContext('__invoke', ctx);
  return (args) => {
    try {
      const s = invoke(fn, JSON.stringify(args), (seedBase + n++) >>> 0, self);
      if (s.length > 2_000_000) return { err: 'output too large' };
      const v = JSON.parse(s);
      if (v && v.$$ === 'promise') return { async: true };
      return { v };
    } catch (err) {
      return { err: String((err && err.message) || err).slice(0, 160) };
    }
  };
}

/** מוצא את הפונקציה של חלק בתוך הייצוא: שם רגיל, או "מחלקה.מתודה" (על מופע ריק / סטטי). */
export function resolvePart(exports, symbol, method) {
  const lookup = (name) => {
    if (exports == null) return undefined;
    if (exports[name] !== undefined) return exports[name];
    if (exports.__catalog && exports.__catalog[name] !== undefined) return exports.__catalog[name];
    if (exports.default && exports.default.__catalog && exports.default.__catalog[name] !== undefined) return exports.default.__catalog[name];
    if (typeof exports === 'function' && exports.name === name) return exports;
    if (exports.default && (exports.default.name === name || typeof exports.default[name] !== 'undefined')) return exports.default.name === name ? exports.default : exports.default[name];
    return undefined;
  };
  if (!method) { const fn = lookup(symbol); return typeof fn === 'function' ? { fn } : null; }
  const C = lookup(method.cls);
  if (typeof C !== 'function') return null;
  const fn = method.static ? C[method.member] : C.prototype && C.prototype[method.member];
  if (typeof fn !== 'function') return null;
  return { fn, self: method.static ? C : Object.create(C.prototype) };
}
