// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/photoGallery.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$fitDimensions$scale(w, h, max) {
    const scale = Math.min(1, max / Math.max(w, h));
    return scale;
}

export const SIGS = {
  inner$fitDimensions$scale: [{"name":"w","d":{"t":"num"},"opt":false},{"name":"h","d":{"t":"num"},"opt":false},{"name":"max","d":{"t":"num"},"opt":false}],
};
