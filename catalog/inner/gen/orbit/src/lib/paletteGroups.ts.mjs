// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/paletteGroups.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$bucketOf$i(key, b) {
    const i = b.findIndex(([p]) => key.startsWith(p));
    return i;
}
export function inner$groupPaletteResults$label(B, b) {
    const label = b < B.length ? B[b][1] : '';
    return label;
}
export function inner$groupPaletteResults$out$$after_loop(B, indexed) {
    const out = [];
    let lastLabel = '';
    for (const { it, b } of indexed) {
        const label = b < B.length ? B[b][1] : '';
        // שני דליים חולקים כותרת ('nav-'/'act-') — הכותרת לא מוכפלת
        out.push({ ...it, section: label && label !== lastLabel ? label : undefined });
        if (label)
            lastLabel = label;
    }
    return out;
}
export function inner$groupPaletteResults$lastLabel$$after_loop(B, indexed) {
    const out = [];
    let lastLabel = '';
    for (const { it, b } of indexed) {
        const label = b < B.length ? B[b][1] : '';
        // שני דליים חולקים כותרת ('nav-'/'act-') — הכותרת לא מוכפלת
        out.push({ ...it, section: label && label !== lastLabel ? label : undefined });
        if (label)
            lastLabel = label;
    }
    return lastLabel;
}

export const SIGS = {
  inner$bucketOf$i: [{"name":"key","d":{"t":"str"},"opt":false},{"name":"b","d":{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"str"}]}},"opt":false}],
  inner$groupPaletteResults$label: [{"name":"B","d":{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"str"}]}},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$groupPaletteResults$out$$after_loop: [{"name":"B","d":{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"str"}]}},"opt":false},{"name":"indexed","d":{"t":"arr","of":{"t":"obj","p":[["it",{"t":"tp","id":"T","of":{"t":"obj","n":"KeyedCmd","p":[["key",{"t":"str"},false],["section",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["i",{"t":"num"},false],["b",{"t":"num"},false]]}},"opt":false}],
  inner$groupPaletteResults$lastLabel$$after_loop: [{"name":"B","d":{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"str"}]}},"opt":false},{"name":"indexed","d":{"t":"arr","of":{"t":"obj","p":[["it",{"t":"tp","id":"T","of":{"t":"obj","n":"KeyedCmd","p":[["key",{"t":"str"},false],["section",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["i",{"t":"num"},false],["b",{"t":"num"},false]]}},"opt":false}],
};
