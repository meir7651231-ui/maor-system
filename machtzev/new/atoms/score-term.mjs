/** חוט · score-term — ניקוד מונח-מול-שאילתה. חוזה: score-term.contract.md
 *  חולץ מ-maor/src/lib/search.ts; שקעים: norm, distance (חוט לא מכיר חוט). */
export function scoreTerm(q, term, norm, distance) {
  const nq = norm(q);
  const nt = norm(term);
  if (!nq || !nt) return 0;
  if (nt === nq) return 100;
  if (nt.startsWith(nq)) return 80;
  if (nq.length >= 5 && (nq.endsWith('ימ') || nq.endsWith('ות'))) {
    const stem = nq.slice(0, -2);
    if (nt === stem || nt.startsWith(stem)) return 70;
  }
  if (nq.length >= 2 && nt.includes(nq)) return 62;
  if (nq.length >= 3 && !/^\d+$/.test(nq)) {
    const sq = nq.replace(/[יו]/g, '');
    const st = nt.replace(/[יו]/g, '');
    if (sq.length >= 2 && sq === st) return 58;
    const max = nt.length >= 6 ? 2 : 1;
    const d = distance(nq, nt);
    if (d <= max) return 52 - d * 4;
  }
  return 0;
}
