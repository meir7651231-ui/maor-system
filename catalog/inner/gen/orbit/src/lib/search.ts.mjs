// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/search.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function levenshtein(a, b) {
    const la = a.length;
    const lb = b.length;
    if (!la)
        return lb;
    if (!lb)
        return la;
    // שורה מתגלגלת אחת במקום מטריצה מלאה
    const dp = [];
    for (let j = 0; j <= lb; j++)
        dp[j] = j;
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
export function inner$scoreTerm$stem(nq) {
    const stem = nq.slice(0, -2);
    return stem;
}
export function inner$scoreTerm$sq(nq) {
    const sq = nq.replace(/[יו]/g, '');
    return sq;
}
export function inner$scoreTerm$st(nt) {
    const st = nt.replace(/[יו]/g, '');
    return st;
}
export function inner$scoreTerm$max(nt) {
    const max = nt.length >= 6 ? 2 : 1;
    return max;
}
export function inner$scoreTerm$d(nq, nt) {
    const d = levenshtein(nq, nt);
    return d;
}
export function inner$smartFilter$out(scored) {
    const out = scored.map((x) => x.it);
    return out;
}
export function inner$expandQuery$out$$after_loop(XLAT_NORM, q, nq) {
    const out = [q];
    for (const x of XLAT_NORM) {
        if (x.nheb === nq)
            out.push(...x.aliases);
        else if (x.naliases.includes(nq))
            out.push(x.heb);
    }
    return out;
}

export const SIGS = {
  inner$scoreTerm$stem: [{"name":"nq","d":{"t":"str"},"opt":false}],
  inner$scoreTerm$sq: [{"name":"nq","d":{"t":"str"},"opt":false}],
  inner$scoreTerm$st: [{"name":"nt","d":{"t":"str"},"opt":false}],
  inner$scoreTerm$max: [{"name":"nt","d":{"t":"str"},"opt":false}],
  inner$scoreTerm$d: [{"name":"nq","d":{"t":"str"},"opt":false},{"name":"nt","d":{"t":"str"},"opt":false}],
  inner$smartFilter$out: [{"name":"scored","d":{"t":"arr","of":{"t":"obj","p":[["it",{"t":"tp","id":"T","of":{"t":"any"}},false],["sc",{"t":"num"},false]]}},"opt":false}],
  inner$expandQuery$out$$after_loop: [{"name":"XLAT_NORM","d":{"t":"arr","of":{"t":"obj","p":[["heb",{"t":"str"},false],["nheb",{"t":"str"},false],["aliases",{"t":"arr","of":{"t":"str"}},false],["naliases",{"t":"arr","of":{"t":"str"}},false]]}},"opt":false},{"name":"q","d":{"t":"str"},"opt":false},{"name":"nq","d":{"t":"str"},"opt":false}],
};
