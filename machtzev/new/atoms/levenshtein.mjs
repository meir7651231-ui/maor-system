/** חוט · levenshtein — מרחק-עריכה בין שתי מחרוזות. חוזה: levenshtein.contract.md
 *  חולץ כלשונו מ-maor/src/lib/search.ts — שורה מתגלגלת, זיכרון O(min). */
export function levenshtein(a, b) {
  const la = a.length;
  const lb = b.length;
  if (!la) return lb;
  if (!lb) return la;
  const dp = [];
  for (let j = 0; j <= lb; j++) dp[j] = j;
  for (let i = 1; i <= la; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= lb; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[lb];
}
