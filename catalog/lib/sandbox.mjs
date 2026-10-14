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

/** אורז קובץ-מקור לקוד CJS אחד (בזיכרון בלבד — לא נכתב שום קובץ). */
export async function bundleFile(abs, { alias = {}, expose = [], esm = true } = {}) {
  const { rolldown } = await import('rolldown');
  const { builtinModules } = await import('node:module');
  // פונקציה/מחלקה פנימית (לא מיוצאת) ⇒ מוסיפים לה ייצוא בזיכרון, כדי שאפשר יהיה לקרוא לה (הקובץ בדיסק לא משתנה)
  const tail = !expose.length ? '' : esm ? '\nexport { ' + expose.join(', ') + ' };\n' : '\n;try { module.exports.__catalog = Object.assign(module.exports.__catalog || {}, { ' + expose.join(', ') + ' }); } catch (e) {}\n';
  const plugins = tail ? [{ name: 'catalog-expose', transform(code, id) { return id === abs ? code + tail : null; } }] : [];
  const b = await rolldown({
    input: abs, platform: 'neutral', logLevel: 'silent', treeshake: false, plugins,
    // מודולים של node (fs, path, child_process…) לא נארזים — בארגז-החול require שלהם מחזיר "מודול אדיש" בלי I/O
    external: [/^node:/, ...builtinModules],
    resolve: { extensions: EXT, alias, mainFields: ['module', 'main'], conditionNames: ['import', 'default'] },
    transform: { jsx: { runtime: 'classic', pragma: 'h' } },
    moduleTypes: { '.css': 'empty', '.svg': 'text', '.png': 'empty', '.md': 'text', '.txt': 'text' },
  });
  try {
    const { output } = await b.generate({ format: 'cjs', exports: 'named', codeSplitting: false });
    return output[0].code;
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
