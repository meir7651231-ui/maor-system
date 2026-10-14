// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/group-palette-results.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
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
  inner$groupPaletteResults$label: [{"name":"B","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$groupPaletteResults$out$$after_loop: [{"name":"B","d":{"t":"any"},"opt":false},{"name":"indexed","d":{"t":"any"},"opt":false}],
  inner$groupPaletteResults$lastLabel$$after_loop: [{"name":"B","d":{"t":"any"},"opt":false},{"name":"indexed","d":{"t":"any"},"opt":false}],
};
