// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/smoke-settings.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$stored$v(raw) {
    let v = JSON.parse(raw || '{}');
    return v;
}
export function inner$stored$v$$after_loop(raw, keys) {
    let v = JSON.parse(raw || '{}');
    for (const k of keys)
        v = v?.[k];
    return v;
}

export const SIGS = {
  inner$stored$v: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$stored$v$$after_loop: [{"name":"raw","d":{"t":"any"},"opt":false},{"name":"keys","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
};
