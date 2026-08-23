/** חוט · smart-score — ניקוד רב-מילתי עם AND והרחבת-תעתיקים.
 *  חוזה: smart-score.contract.md · חולץ מ-maor/src/lib/search.ts; שקעים: norm/expand/score. */
export function smartScore(q, terms, norm, expand, score) {
  const toks = norm(q).split(/\s+/).filter(Boolean);
  if (!toks.length) return 0;
  let phrase = 0;
  if (toks.length > 1) {
    for (const exp of expand(q.trim(), norm)) {
      for (const term of terms) {
        phrase = Math.max(phrase, score(exp, term));
        if (phrase >= 100) break;
      }
      if (phrase >= 100) break;
    }
  }
  let total = 0;
  for (const tok of toks) {
    let best = 0;
    for (const exp of expand(tok, norm)) {
      for (const term of terms) {
        best = Math.max(best, score(exp, term));
        if (best >= 100) break;
      }
      if (best >= 100) break;
    }
    if (!best) { total = 0; break; }
    total += best;
  }
  return Math.max(total, phrase);
}
