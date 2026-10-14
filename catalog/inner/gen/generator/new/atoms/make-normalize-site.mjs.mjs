// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/make-normalize-site.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$makeNormalizeSite$normalizeSite$langs(SITE_LANGS, s) {
    const langs = Array.isArray(s.langs)
        ? [...new Set(s.langs.filter((l) => SITE_LANGS.includes(l)))]
        : [];
    return langs;
}
export function inner$makeNormalizeSite$normalizeSite$pts(T, o) {
    const pts = o.points.map((p) => (typeof p === T.k3 && Number.isFinite(p) ? Math.max(0, Math.min(1, p)) : null)).filter((p) => p !== null).slice(0, T.k26);
    return pts;
}

export const SIGS = {
  inner$makeNormalizeSite$normalizeSite$langs: [{"name":"SITE_LANGS","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$makeNormalizeSite$normalizeSite$pts: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"o","d":{"t":"any"},"opt":false}],
};
