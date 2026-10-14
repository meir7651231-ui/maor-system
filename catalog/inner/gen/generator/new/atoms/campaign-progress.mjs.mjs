// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/campaign-progress.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$campaignProgress$pct(campaign, T, sum) {
    const goal = campaign.goal || 0;
    const pct = goal > 0 ? Math.min(T.k1, Math.round((sum / goal) * T.k1)) : 0;
    return pct;
}
export function inner$campaignProgress$pct$$step(T, sum, goal) {
    const pct = goal > 0 ? Math.min(T.k1, Math.round((sum / goal) * T.k1)) : 0;
    return pct;
}

export const SIGS = {
  inner$campaignProgress$pct: [{"name":"campaign","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"sum","d":{"t":"num"},"opt":false}],
  inner$campaignProgress$pct$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"sum","d":{"t":"num"},"opt":false},{"name":"goal","d":{"t":"num"},"opt":false}],
};
