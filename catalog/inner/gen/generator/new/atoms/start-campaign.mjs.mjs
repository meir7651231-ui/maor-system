// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/start-campaign.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$startCampaign$seen$$after_loop(ids) {
    const seen = new Set();
    const queue = [];
    for (const id of ids) {
        if (!id || seen.has(id))
            continue;
        seen.add(id);
        queue.push(id);
    }
    return seen;
}
export function inner$startCampaign$queue$$after_loop(ids) {
    const seen = new Set();
    const queue = [];
    for (const id of ids) {
        if (!id || seen.has(id))
            continue;
        seen.add(id);
        queue.push(id);
    }
    return queue;
}

export const SIGS = {
  inner$startCampaign$seen$$after_loop: [{"name":"ids","d":{"t":"any"},"opt":false}],
  inner$startCampaign$queue$$after_loop: [{"name":"ids","d":{"t":"any"},"opt":false}],
};
