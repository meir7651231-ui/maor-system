// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/cockpit-progress.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$cockpitProgress$done$$after_loop(queue, doneIds) {
    let done = 0;
    for (const t of queue.tasks)
        if (doneIds.has(t.id))
            done++;
    return done;
}

export const SIGS = {
  inner$cockpitProgress$done$$after_loop: [{"name":"queue","d":{"t":"any"},"opt":false},{"name":"doneIds","d":{"t":"any"},"opt":false}],
};
