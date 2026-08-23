/** קופסת-חיבורים · חיפוש — מחווטת את חוטי-החיפוש. חוזה: search.contract.md
 *  זה המקום היחיד שבו החוטים נפגשים (חוקי-החשמלאי, LAW.md). */
import { levenshtein } from '../atoms/levenshtein.mjs';
import { normSearch } from '../atoms/norm-search.mjs';
import { expandQuery } from '../atoms/xlat.mjs';
import { scoreTerm } from '../atoms/score-term.mjs';
import { smartScore } from '../atoms/smart-score.mjs';
import { smartFilter } from '../atoms/smart-filter.mjs';

// ── החיווט ──
const wiredScore  = (q, term)  => scoreTerm(q, term, normSearch, levenshtein);
const wiredExpand = (q, norm)  => expandQuery(q, norm || normSearch);
const wiredSmart  = (q, terms) => smartScore(q, terms, normSearch, wiredExpand, wiredScore);

// ── החשיפה ──
export const score  = wiredSmart;
export const expand = (q) => wiredExpand(q);
export const search = (q, items, getTerms, limit) =>
  smartFilter(q, items, getTerms, (x) => !!normSearch(x), wiredSmart, limit);
