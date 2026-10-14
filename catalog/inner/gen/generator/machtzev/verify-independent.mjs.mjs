// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/verify-independent.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$opt$i(argv, f) {
    const i = argv.indexOf(f);
    return i;
}
export function inner$police$sum(r) {
    const sum = (r.stdout.match(/המשטרה [^\n]*/) || [''])[0];
    return sum;
}
export function inner$police$rec(r) {
    const sum = (r.stdout.match(/המשטרה [^\n]*/) || [''])[0];
    const rec = { status: r.status, summary: sum, failed: (r.stdout.match(/^failed [^\n]*/gm) || []), yellow: (r.stdout.match(/^yellow [^\n]*/gm) || []),
        ran: (r.stdout.match(/^ran ([a-z-]+)/gm) || []).map((l) => l.slice(4)), otherAlarms: (r.stderr.match(/🚨.*$/gm) || []).filter((l) => !/שער רשום שלא רץ ולא דווח/.test(l)).length, unknownToTools: (r.stderr.match(/שער רשום שלא רץ ולא דווח: ([a-z-]+)/g) || []).map((l) => l.split(': ')[1]) };
    return rec;
}
export function inner$police$rec$$step(r, sum) {
    const rec = { status: r.status, summary: sum, failed: (r.stdout.match(/^failed [^\n]*/gm) || []), yellow: (r.stdout.match(/^yellow [^\n]*/gm) || []),
        ran: (r.stdout.match(/^ran ([a-z-]+)/gm) || []).map((l) => l.slice(4)), otherAlarms: (r.stderr.match(/🚨.*$/gm) || []).filter((l) => !/שער רשום שלא רץ ולא דווח/.test(l)).length, unknownToTools: (r.stderr.match(/שער רשום שלא רץ ולא דווח: ([a-z-]+)/g) || []).map((l) => l.split(': ')[1]) };
    return rec;
}

export const SIGS = {
  inner$opt$i: [{"name":"argv","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$police$sum: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$police$rec: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$police$rec$$step: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"sum","d":{"t":"any"},"opt":false}],
};
