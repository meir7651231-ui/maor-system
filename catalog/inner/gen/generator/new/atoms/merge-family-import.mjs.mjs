// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/merge-family-import.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$mergeFamilyImport$out$$after_loop(f, obj) {
    const out = { ...f };
    for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (v)
            out[k] = v;
    }
    return out;
}

export const SIGS = {
  inner$mergeFamilyImport$out$$after_loop: [{"name":"f","d":{"t":"any"},"opt":false},{"name":"obj","d":{"t":"any"},"opt":false}],
};
