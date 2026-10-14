// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/ops-particles.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$opsOf$e(SOPS, cls) {
    const e = (SOPS.entities || []).find((x) => x.entity === cls);
    return e;
}

export const SIGS = {
  inner$opsOf$e: [{"name":"SOPS","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
};
