// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/site-campaign-progress.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$campaignProgress$goal(c, T) {
    const goal = typeof c?.goal === T.k1 && c.goal > 0 ? c.goal : 0;
    return goal;
}
export function inner$campaignProgress$raised(c, T) {
    const raised = typeof c?.raised === T.k1 && c.raised > 0 ? c.raised : 0;
    return raised;
}
export function inner$campaignProgress$pct(c, T) {
    const goal = typeof c?.goal === T.k1 && c.goal > 0 ? c.goal : 0;
    const raised = typeof c?.raised === T.k1 && c.raised > 0 ? c.raised : 0;
    const pct = goal > 0 ? Math.max(0, Math.min(T.k2, Math.round((raised / goal) * T.k2))) : 0;
    return pct;
}
export function inner$campaignProgress$pct$$step(T, goal, raised) {
    const pct = goal > 0 ? Math.max(0, Math.min(T.k2, Math.round((raised / goal) * T.k2))) : 0;
    return pct;
}
export function inner$campaignProgress$t(c, T) {
    const t = Date.parse(c.end.slice(0, T.k3) + 'T00:00:00');
    return t;
}
export function inner$campaignProgress$diff(c, nowMs, T) {
    const t = Date.parse(c.end.slice(0, T.k3) + 'T00:00:00');
    const diff = Math.ceil((t - nowMs) / T.k4);
    return diff;
}
export function inner$campaignProgress$diff$$step(nowMs, T, t) {
    const diff = Math.ceil((t - nowMs) / T.k4);
    return diff;
}

export const SIGS = {
  inner$campaignProgress$goal: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$campaignProgress$raised: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$campaignProgress$pct: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$campaignProgress$pct$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"goal","d":{"t":"num"},"opt":false},{"name":"raised","d":{"t":"num"},"opt":false}],
  inner$campaignProgress$t: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$campaignProgress$diff: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"nowMs","d":{"t":"num"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$campaignProgress$diff$$step: [{"name":"nowMs","d":{"t":"num"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false}],
};
