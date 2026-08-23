/** חוט · smart-filter — סינון+מיון לפי ציון. חוזה: smart-filter.contract.md */
export function smartFilter(q, items, getTerms, hasQuery, scoreOf, limit) {
  if (!hasQuery(q)) return limit !== undefined ? items.slice(0, limit) : items.slice();
  const scored = [];
  for (const it of items) {
    const sc = scoreOf(q, getTerms(it));
    if (sc > 0) scored.push({ it, sc });
  }
  scored.sort((a, b) => b.sc - a.sc);
  const out = scored.map((x) => x.it);
  return limit !== undefined ? out.slice(0, limit) : out;
}
