/**
 * 📇 גשר הקטלוג ⇄ המאמת (CATALOG-VERBS, 14.10.2026).
 * הקטלוג לא כותב מחוללים וחוקים מחדש — הוא לוקח אותם מהמאמת של המפעל (`src/lib/atoms/verify`)
 * ואת 8 החלקים הקטנים עצמם (`src/lib/atoms/parts`), שהם המימוש-לדוגמה של 8 פעלי-הארגז.
 * בסקריפטים: `loadBridge()` (catalog/lib/load-bridge.mjs) אורז את הקובץ הזה ל-ESM. בבדיקות: מייבאים ישירות.
 * טהור. לא נכנס לאפליקציה.
 */
export { rng, subSeed, heWord, typo, farWord, isoAround, momentAround, amount, STEPS, flags, atomCase } from '../../src/lib/atoms/verify/gen';
export { ATOM_LAWS, ATOM_INPUTS, violations } from '../../src/lib/atoms/verify/laws';
export { divideSpan, divideAmount } from '../../src/lib/atoms/parts/divide';
export { mergeRuns } from '../../src/lib/atoms/parts/merge';
export { nextAfter } from '../../src/lib/atoms/parts/next';
export { roundTo } from '../../src/lib/atoms/parts/round';
export { offsetAll } from '../../src/lib/atoms/parts/offset';
export { escalationState } from '../../src/lib/atoms/parts/escalate';
export { turnOf, dayIndex } from '../../src/lib/atoms/parts/rotate';
export { fuzzyFind, normHe } from '../../src/lib/atoms/parts/fuzzy';
