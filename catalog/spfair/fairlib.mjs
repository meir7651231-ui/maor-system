/**
 * ⚖️ SP-FAIR — החלקים הטהורים של הוו (בלי תופעות-לוואי; hook.mjs מתקין אותם). ראו hook.mjs.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '../..');
export const P = {
  growLib: path.join(ROOT, 'catalog/grow/lib.mjs'),
  growMain: path.join(ROOT, 'catalog/grow/grow.mjs'),
  spMain: path.join(ROOT, 'catalog/selfprint/selfprint.mjs'),
  spBudget: path.join(ROOT, 'catalog/selfprint/budget.json'),
  targets: path.join(HERE, 'targets.mjs'),
};
export const SALT = Number(process.env.SPFAIR_SALT || 0) >>> 0;
export const ROUNDS = process.env.SPFAIR_ROUNDS ? Number(process.env.SPFAIR_ROUNDS) : null;
/** השורה במנוע שאחריה נכנס הברז — חייבת להופיע בדיוק פעם אחת, אחרת עוצרים (המנוע השתנה ⇒ המבחן לא תקף). */
export const TAP_AT = 'const wrong = wrongImprovements(R, H0.things, replacements);';
export const TAP = ' globalThis.__spfairTap?.({ R, B0, H0, bps, rounds, replacements, wrong });';

export const asPath = (p) => String(p instanceof URL ? fileURLToPath(p) : p);
const IS_GROW_CHILD = /catalog[\\/]selfprint[\\/]grow-run\.mjs$/.test(process.argv[1] || '');
const targetsBlocked = () => IS_GROW_CHILD || globalThis.__spfairEngine === true;
export const blockedTargets = (p) => targetsBlocked() && path.resolve(asPath(p)) === P.targets;

/** budget.json כפי שהמנוע יקרא אותו בהרצה הזו (null ⇒ בלי שינוי). */
export function budgetText(orig, salt = SALT, rounds = ROUNDS) {
  if (!salt && rounds === null) return null;
  const b = JSON.parse(orig);
  if (rounds !== null) b.rounds = rounds;
  if (salt) b.spfair = { salt };
  return JSON.stringify(b, null, 1);
}
