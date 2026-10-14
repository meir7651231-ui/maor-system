// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/commands.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function norm(s) {
    return s.toLowerCase().replace(/\s+/g, ' ').trim();
}
export function inner$filterCommands$q(query) {
    const q = norm(query);
    return q;
}
export function inner$filterCommands$tokens(query) {
    const q = norm(query);
    const tokens = q.split(' ');
    return tokens;
}
export function inner$filterCommands$tokens$$step(q) {
    const tokens = q.split(' ');
    return tokens;
}
export function inner$filterCommands$nl(c) {
    const nl = norm(c.label);
    return nl;
}
export function inner$filterCommands$score(query, c) {
    const q = norm(query);
    const nl = norm(c.label);
    let score = nl === q ? 100 : nl.startsWith(q) ? 60 : nl.includes(q) ? 40 : 20;
    return score;
}
export function inner$filterCommands$score$$step(q, nl) {
    let score = nl === q ? 100 : nl.startsWith(q) ? 60 : nl.includes(q) ? 40 : 20;
    return score;
}

export const SIGS = {
  inner$filterCommands$q: [{"name":"query","d":{"t":"str"},"opt":false}],
  inner$filterCommands$tokens: [{"name":"query","d":{"t":"str"},"opt":false}],
  inner$filterCommands$tokens$$step: [{"name":"q","d":{"t":"str"},"opt":false}],
  inner$filterCommands$nl: [{"name":"c","d":{"t":"obj","n":"Command","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["data","work","add","import","customreport","dedup","incoming","nedarim","openDonor"]},false],["label",{"t":"str"},false],["hint",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["group",{"t":"lit","v":["ניווט","פעולה","תורם"]},false],["keywords",{"t":"str"},false],["arg",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$filterCommands$score: [{"name":"query","d":{"t":"str"},"opt":false},{"name":"c","d":{"t":"obj","n":"Command","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["data","work","add","import","customreport","dedup","incoming","nedarim","openDonor"]},false],["label",{"t":"str"},false],["hint",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["group",{"t":"lit","v":["ניווט","פעולה","תורם"]},false],["keywords",{"t":"str"},false],["arg",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$filterCommands$score$$step: [{"name":"q","d":{"t":"str"},"opt":false},{"name":"nl","d":{"t":"str"},"opt":false}],
};
