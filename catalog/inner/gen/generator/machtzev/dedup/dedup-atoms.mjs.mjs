// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/dedup/dedup-atoms.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const balanced = (s, i) => { let d = 0; for (let j = i; j < s.length; j++) {
    if (s[j] === '(')
        d++;
    else if (s[j] === ')' && --d === 0)
        return s.slice(i + 1, j);
} return null; };
const splitTop = (s) => { const out = []; let d = 0, q = null, cur = ''; for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
        cur += c;
        if (c === q && s[i - 1] !== '\\')
            q = null;
        continue;
    }
    if (c === "'" || c === '"')
        q = c;
    else if ('([{'.includes(c))
        d++;
    else if (')]}'.includes(c))
        d--;
    if (c === ',' && d === 0) {
        out.push(cur.trim());
        cur = '';
        continue;
    }
    cur += c;
} if (cur.trim())
    out.push(cur.trim()); return out; };
export function inner$examplesOf$got(inner) {
    const [got, want] = splitTop(inner);
    return got;
}
export function inner$examplesOf$want(inner) {
    const [got, want] = splitTop(inner);
    return want;
}
export function inner$examplesOf$ci(e, inner) {
    const [got, want] = splitTop(inner);
    const ci = got.indexOf(e.name + '(');
    return ci;
}
export function inner$examplesOf$ci$$step(e, got) {
    const ci = got.indexOf(e.name + '(');
    return ci;
}
export function inner$examplesOf$args(e, inner) {
    const [got, want] = splitTop(inner);
    const ci = got.indexOf(e.name + '(');
    const args = balanced(got, ci + e.name.length);
    return args;
}
export function inner$examplesOf$args$$step(e, got, ci) {
    const args = balanced(got, ci + e.name.length);
    return args;
}

export const SIGS = {
  inner$examplesOf$got: [{"name":"inner","d":{"t":"any"},"opt":false}],
  inner$examplesOf$want: [{"name":"inner","d":{"t":"any"},"opt":false}],
  inner$examplesOf$ci: [{"name":"e","d":{"t":"any"},"opt":false},{"name":"inner","d":{"t":"any"},"opt":false}],
  inner$examplesOf$ci$$step: [{"name":"e","d":{"t":"any"},"opt":false},{"name":"got","d":{"t":"str"},"opt":false}],
  inner$examplesOf$args: [{"name":"e","d":{"t":"any"},"opt":false},{"name":"inner","d":{"t":"any"},"opt":false}],
  inner$examplesOf$args$$step: [{"name":"e","d":{"t":"any"},"opt":false},{"name":"got","d":{"t":"str"},"opt":false},{"name":"ci","d":{"t":"num"},"opt":false}],
};
