// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/bulkContact.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function normEmail(s) {
    return (s || '').trim().toLowerCase();
}
export function inner$bulkMailRecipients$e(sp) {
    const e = normEmail(sp.email || '');
    return e;
}
export function inner$bulkMailRecipients$seen$$after_loop(sups) {
    const seen = new Set();
    const out = [];
    for (const sp of sups) {
        const e = normEmail(sp.email || '');
        if (!e || !e.includes('@'))
            continue;
        if (seen.has(e))
            continue;
        seen.add(e);
        out.push({ id: sp.id, name: sp.name || '', email: sp.email.trim() });
    }
    return seen;
}
export function inner$bulkMailRecipients$out$$after_loop(sups) {
    const seen = new Set();
    const out = [];
    for (const sp of sups) {
        const e = normEmail(sp.email || '');
        if (!e || !e.includes('@'))
            continue;
        if (seen.has(e))
            continue;
        seen.add(e);
        out.push({ id: sp.id, name: sp.name || '', email: sp.email.trim() });
    }
    return out;
}

export const SIGS = {
  inner$bulkMailRecipients$e: [{"name":"sp","d":{"t":"tp","id":"T","of":{"t":"obj","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["email",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$bulkMailRecipients$seen$$after_loop: [{"name":"sups","d":{"t":"arr","of":{"t":"tp","id":"T","of":{"t":"obj","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["email",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}},"opt":false}],
  inner$bulkMailRecipients$out$$after_loop: [{"name":"sups","d":{"t":"arr","of":{"t":"tp","id":"T","of":{"t":"obj","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["email",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}},"opt":false}],
};
