/**
 * ⚖️ SP-FAIR — הוו-הריצה של המבחן ההוגן למנוע-השרטוטים-העצמי (15.10.2026).
 *
 * המנוע (catalog/selfprint/*.mjs + budget.json) **קפוא** — לא נוגעים בקובץ. הוו הזה נטען ב-`--import` (גם בתהליכי-הצמיחה
 * הבנים, דרך NODE_OPTIONS) ומשנה רק שלושה דברים, כולם מחוץ לכללי-המנוע:
 *   1. **זרע-הדגימה של הצמיחה** (SPFAIR_SALT ≠ 0): `catalog/grow/grow.mjs` מקבל עותק של `catalog/grow/lib.mjs` שבו
 *      `sampleIdx(total, cap, seed)` נקרא עם `seed ^ SALT`. זה החלק האקראי היחיד של הצמיחה (20% מהתקציב בכל קומה);
 *      כל שאר הפונקציות — אותו מודול בדיוק (`export *`). SALT = 0 ⇒ אין עותק בכלל.
 *   2. **מספר הסבבים** (SPFAIR_ROUNDS): הקריאה של selfprint.mjs ל-budget.json מקבלת את אותו קובץ עם `rounds` אחר.
 *      ועם SALT ≠ 0 נוסף שדה `spfair` (לא נקרא ע״י אף כלל) — רק כדי שמפתח-המטמון של הצמיחה יהיה שונה.
 *   3. **ברז-מדידה**: שורה אחת שנוספת אחרי `const wrong = wrongImprovements(...)` ב-run() ומעבירה הפניות (מדף, שרטוטים)
 *      לכלי-המדידה. בלי השפעה על הריצה — מוכח: בלי SALT ובלי ROUNDS הפלטים זהים בבתים לקבצים שבענף (fair.mjs › same).
 *
 * ובנוסף **שומר-המטרות**: `catalog/spfair/targets.mjs` (מימושי-הייחוס של המטרות שהמנוע לא כוון אליהן) חסום לקריאה
 * ולייבוא כל עוד המנוע רץ (globalThis.__spfairEngine) — ובתהליכי-הצמיחה תמיד.
 */
import fs from 'node:fs';
import path from 'node:path';
import module from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { P, SALT, ROUNDS, TAP_AT, TAP, asPath, blockedTargets, budgetText } from './fairlib.mjs';

export { SALT, ROUNDS, TAP_AT, blockedTargets, budgetText };
const SHIM = 'spfair-shim';
const ORIG_READ = fs.readFileSync;
/** budget.json כפי שהוא בדיסק (בלי ההתאמה של ההרצה). */
export const rawBudget = () => String(ORIG_READ(P.spBudget, 'utf8'));

if (!globalThis.__spfairHook) {
  globalThis.__spfairHook = true;
  const orig = fs.readFileSync;
  const wrapped = function (p, ...a) {
    if (typeof p === 'string' || p instanceof URL) {
      if (blockedTargets(p)) throw new Error('🚫 SP-FAIR: המנוע לא קורא את מטרות-המדידה (' + asPath(p) + ')');
      if (path.resolve(asPath(p)) === P.spBudget) { const t = orig.call(this, p, ...a); const r = budgetText(String(t)); return r === null ? t : r; }
    }
    return orig.call(this, p, ...a);
  };
  fs.readFileSync = wrapped;
  module.syncBuiltinESMExports();
  module.registerHooks({
    resolve(spec, ctx, next) {
      if (spec.startsWith(SHIM + ':')) return { url: spec, shortCircuit: true };
      const r = next(spec, ctx);
      if (r?.url?.startsWith('file:')) {
        const fp = fileURLToPath(r.url);
        if (blockedTargets(fp)) throw new Error('🚫 SP-FAIR: המנוע לא מייבא את מטרות-המדידה');
        if (SALT && fp === P.growLib && ctx.parentURL?.startsWith('file:') && fileURLToPath(ctx.parentURL) === P.growMain) return { url: SHIM + ':grow-lib', shortCircuit: true };
      }
      return r;
    },
    load(url, ctx, next) {
      if (url === SHIM + ':grow-lib') {
        const real = pathToFileURL(P.growLib).href;
        return { format: 'module', shortCircuit: true, source: `export * from ${JSON.stringify(real)};\nimport * as R from ${JSON.stringify(real)};\nexport function sampleIdx(total, cap, seed) { return R.sampleIdx(total, cap, (seed ^ ${SALT}) >>> 0); }\n` };
      }
      const r = next(url, ctx);
      if (url.startsWith('file:') && fileURLToPath(url) === P.spMain) {
        const src = String(r.source);
        const n = src.split(TAP_AT).length - 1;
        if (n !== 1) throw new Error('SP-FAIR: נקודת-הברז נמצאה ' + n + ' פעמים ב-selfprint.mjs — המנוע השתנה');
        return { ...r, source: src.replace(TAP_AT, TAP_AT + TAP) };
      }
      return r;
    },
  });
}
