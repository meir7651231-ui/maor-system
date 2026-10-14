// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/donation-partition-diff.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$donationPartitionDiff$before(prevDocs, id) {
    const before = prevDocs.get(id);
    return before;
}
export function inner$donationPartitionDiff$sets$$after_loop(prevDocs, nextDocs) {
    const sets = [];
    for (const [id, doc] of nextDocs) {
        const before = prevDocs.get(id);
        if (!before || JSON.stringify(before) !== JSON.stringify(doc))
            sets.push(doc);
    }
    return sets;
}
export function inner$donationPartitionDiff$deletes$$after_loop(prevDocs, nextDocs) {
    const deletes = [];
    for (const id of prevDocs.keys())
        if (!nextDocs.has(id))
            deletes.push(id);
    return deletes;
}

export const SIGS = {
  inner$donationPartitionDiff$before: [{"name":"prevDocs","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"id","d":{"t":"any"},"opt":false}],
  inner$donationPartitionDiff$sets$$after_loop: [{"name":"prevDocs","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"nextDocs","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$donationPartitionDiff$deletes$$after_loop: [{"name":"prevDocs","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"nextDocs","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
};
