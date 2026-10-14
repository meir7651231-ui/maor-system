// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/skin.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$vars$out$$after_loop(o, extra) {
    const out = { ...extra };
    for (const [k, v] of Object.entries(o))
        out['--pn-' + k] = v;
    return out;
}

export const SIGS = {
  inner$vars$out$$after_loop: [{"name":"o","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"extra","d":{"t":"obj","n":"CSSProperties","p":[]},"opt":false}],
};
