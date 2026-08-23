/** קופסת-חיבורים · חיפוש — מחווטת את חוטי-החיפוש. חוזה: search.contract.md
 *  זה המקום היחיד שבו החוטים נפגשים (חוקי-החשמלאי, LAW.md). */
import { levenshtein } from '../atoms/levenshtein.mjs';
import { normSearch } from '../atoms/norm-search.mjs';
import { expandQuery } from '../atoms/xlat.mjs';
import { ruleExact } from '../atoms/rule-exact.mjs';
import { rulePrefix } from '../atoms/rule-prefix.mjs';
import { rulePlural } from '../atoms/rule-plural.mjs';
import { ruleContains } from '../atoms/rule-contains.mjs';
import { ruleSkeleton } from '../atoms/rule-skeleton.mjs';
import { ruleTypo } from '../atoms/rule-typo.mjs';
import { smartScore } from '../atoms/smart-score.mjs';
import { smartFilter } from '../atoms/smart-filter.mjs';

// ── החיווט ──
// הקסקדה: הסדר הזה הוא *המשמעות* — והוא חי כאן, לא בחוטים (הכרעת-בעלים).
// שינוי-דירוג = סידור-מחדש של השורות האלה, אפס נגיעה בכללים עצמם.
const CASCADE = [ruleExact, rulePrefix, rulePlural, ruleContains, ruleSkeleton,
  (nq, nt) => ruleTypo(nq, nt, levenshtein)];
const wiredScore = (q, term) => {
  const nq = normSearch(q), nt = normSearch(term);
  if (!nq || !nt) return 0;
  for (const rule of CASCADE) { const s = rule(nq, nt); if (s != null) return s; }
  return 0;
};
const wiredExpand = (q, norm)  => expandQuery(q, norm || normSearch);
const wiredSmart  = (q, terms) => smartScore(q, terms, normSearch, wiredExpand, wiredScore);

// ── החשיפה ──
export const score  = wiredSmart;
export const expand = (q) => wiredExpand(q);
export const search = (q, items, getTerms, limit) =>
  smartFilter(q, items, getTerms, (x) => !!normSearch(x), wiredSmart, limit);
