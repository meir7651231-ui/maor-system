// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/image-pick.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const MAX_PX = 320;
export function inner$pickAndCompressImage$scale(img) {
    const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height));
    return scale;
}
export function inner$pickAndCompressImage$w(img) {
    const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    return w;
}
export function inner$pickAndCompressImage$w$$step(img, scale) {
    const w = Math.max(1, Math.round(img.width * scale));
    return w;
}
export function inner$pickAndCompressImage$h(img) {
    const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height));
    const h = Math.max(1, Math.round(img.height * scale));
    return h;
}
export function inner$pickAndCompressImage$h$$step(img, scale) {
    const h = Math.max(1, Math.round(img.height * scale));
    return h;
}

export const SIGS = {
  inner$pickAndCompressImage$scale: [{"name":"img","d":{"t":"any"},"opt":false}],
  inner$pickAndCompressImage$w: [{"name":"img","d":{"t":"any"},"opt":false}],
  inner$pickAndCompressImage$w$$step: [{"name":"img","d":{"t":"any"},"opt":false},{"name":"scale","d":{"t":"num"},"opt":false}],
  inner$pickAndCompressImage$h: [{"name":"img","d":{"t":"any"},"opt":false}],
  inner$pickAndCompressImage$h$$step: [{"name":"img","d":{"t":"any"},"opt":false},{"name":"scale","d":{"t":"num"},"opt":false}],
};
