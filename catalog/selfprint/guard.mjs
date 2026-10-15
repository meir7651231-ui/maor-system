/**
 * 🚫 שומר-העיוורון של מנוע-השרטוטים-העצמי (SELFPRINT, 15.10.2026).
 *
 * אותו שומר כמו של BLUEPRINTS/GROW (מתכוני-יד, combos, combo-*, lab-data, found/ — לא נקראים), ובנוסף:
 *   · `catalog/blueprints/shapes.mjs` — 25 השרטוטים שכתב AI. אסור לקרוא ואסור לייבא.
 *   · `catalog/blueprints/library.json` + `ledger.json` — הפלט של הכורה הישן (צורות-העל שלו נגזרות מ-shapes.mjs).
 * הקריאה (fs) נחסמת, והייבוא (ESM) נחסם דרך module.registerHooks — כל שרטוט כאן נבנה ע״י המכונה עצמה.
 */
import fs from 'node:fs';
import module from 'node:module';
import { fileURLToPath } from 'node:url';

export const HIDDEN = [
  /catalog\/combiner\/verb-recipes\.json$/, /catalog\/combiner\/combos\.json$/, /catalog\/recipes\/combo-[^/]*$/,
  /catalog\/combiner\/lab-data\.json$/, /catalog\/blueprints\/found\//,
  /catalog\/blueprints\/shapes\.mjs$/, /catalog\/blueprints\/library\.json$/, /catalog\/blueprints\/ledger\.json$/,
  /catalog\/blueprints\/search\.mjs$/, // מייבא את shapes.mjs
  /catalog\/spfair\/hidden\//, // RINGS-PORT: המבחן הנסתר (נעול ב-sha256) — המנוע לא קורא ולא מייבא
];
export const hiddenPath = (p) => { const s = String(p instanceof URL ? fileURLToPath(p) : p).replace(/\\/g, '/'); return HIDDEN.some((r) => r.test(s)); };

export function guard() {
  if (fs.readFileSync.__spGuard) return;
  const wrap = (orig, name) => { const f = function (p, ...a) { if (hiddenPath(p)) throw new Error('🚫 מנוע-השרטוטים-העצמי לא קורא את ' + p + ' (' + name + ')'); return orig.call(this, p, ...a); }; f.__spGuard = true; f.__orig = orig; return f; };
  fs.readFileSync = wrap(fs.readFileSync, 'readFileSync');
  fs.openSync = wrap(fs.openSync, 'openSync');
  fs.createReadStream = wrap(fs.createReadStream, 'createReadStream');
  fs.promises.readFile = wrap(fs.promises.readFile, 'promises.readFile');
  module.syncBuiltinESMExports();
  if (module.registerHooks) {
    module.registerHooks({
      resolve(spec, ctx, next) {
        const r = next(spec, ctx);
        if (r && r.url && r.url.startsWith('file:') && hiddenPath(new URL(r.url))) throw new Error('🚫 מנוע-השרטוטים-העצמי לא מייבא את ' + r.url);
        return r;
      },
    });
  }
}
guard();
