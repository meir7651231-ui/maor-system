// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/apply-outcome.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$applyOutcome$rest(c) {
    const rest = c.queue.slice(1);
    return rest;
}
export function inner$applyOutcome$queue(c, outcome, requeueOutcomes, id) {
    const rest = c.queue.slice(1);
    const queue = requeueOutcomes.includes(outcome) ? [...rest, id] : rest;
    return queue;
}
export function inner$applyOutcome$queue$$step(outcome, requeueOutcomes, id, rest) {
    const queue = requeueOutcomes.includes(outcome) ? [...rest, id] : rest;
    return queue;
}

export const SIGS = {
  inner$applyOutcome$rest: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$applyOutcome$queue: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"outcome","d":{"t":"any"},"opt":false},{"name":"requeueOutcomes","d":{"t":"any"},"opt":false},{"name":"id","d":{"t":"any"},"opt":false}],
  inner$applyOutcome$queue$$step: [{"name":"outcome","d":{"t":"any"},"opt":false},{"name":"requeueOutcomes","d":{"t":"any"},"opt":false},{"name":"id","d":{"t":"any"},"opt":false},{"name":"rest","d":{"t":"any"},"opt":false}],
};
