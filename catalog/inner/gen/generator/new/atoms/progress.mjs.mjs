// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/progress.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const ZERO_COUNTS = () => ({ donated: 0, noanswer: 0, refused: 0, callback: 0, done: 0, skip: 0 });
export function inner$progress$counts() {
    const counts = ZERO_COUNTS();
    return counts;
}
export function inner$progress$counts$$after_loop(c, requeueOutcomes) {
    const counts = ZERO_COUNTS();
    const seen = {};
    for (const e of c.log) {
        if (requeueOutcomes.includes(e.outcome)) {
            const s = (seen[e.outcome] ??= new Set());
            if (s.has(e.id))
                continue;
            s.add(e.id);
        }
        counts[e.outcome]++;
    }
    return counts;
}
export function inner$progress$seen$$after_loop(c, requeueOutcomes) {
    const counts = ZERO_COUNTS();
    const seen = {};
    for (const e of c.log) {
        if (requeueOutcomes.includes(e.outcome)) {
            const s = (seen[e.outcome] ??= new Set());
            if (s.has(e.id))
                continue;
            s.add(e.id);
        }
        counts[e.outcome]++;
    }
    return seen;
}

export const SIGS = {
  inner$progress$counts: [],
  inner$progress$counts$$after_loop: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"requeueOutcomes","d":{"t":"any"},"opt":false}],
  inner$progress$seen$$after_loop: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"requeueOutcomes","d":{"t":"any"},"opt":false}],
};
