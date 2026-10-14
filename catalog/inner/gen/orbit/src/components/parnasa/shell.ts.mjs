// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/shell.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$hebNow$dayText(h) {
    const dayText = h.text.split(' ').slice(0, -1).join(' ');
    return dayText;
}
export function inner$periodOf$n(m, d) {
    const n = m === 7 ? d - 15 : m === 8 ? 15 + d : 44 + d;
    return n;
}
export function inner$localDay$t(at) {
    const t = Date.parse(String(at ?? ''));
    return t;
}
export function inner$pushkeFill$goal(approved) {
    const goal = Math.max(30, approved * 2);
    return goal;
}
export function inner$pushkeFill$f(n, approved) {
    const goal = Math.max(30, approved * 2);
    const f = Math.min(1, Math.max(0, n) / goal);
    return f;
}
export function inner$pushkeFill$f$$step(n, goal) {
    const f = Math.min(1, Math.max(0, n) / goal);
    return f;
}
export function inner$dedicationOf$t(text) {
    const t = String(text ?? '').trim();
    return t;
}

export const SIGS = {
  inner$hebNow$dayText: [{"name":"h","d":{"t":"obj","n":"PrHebDate","p":[["anchorIso",{"t":"str"},false],["day",{"t":"num"},false],["monthHe",{"t":"str"},false],["year",{"t":"num"},false],["text",{"t":"str"},false],["night",{"t":"bool"},false]]},"opt":false}],
  inner$periodOf$n: [{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false}],
  inner$localDay$t: [{"name":"at","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$pushkeFill$goal: [{"name":"approved","d":{"t":"num"},"opt":false}],
  inner$pushkeFill$f: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"approved","d":{"t":"num"},"opt":false}],
  inner$pushkeFill$f$$step: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"goal","d":{"t":"num"},"opt":false}],
  inner$dedicationOf$t: [{"name":"text","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
};
