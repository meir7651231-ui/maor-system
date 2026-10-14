// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/slugify.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$slugify$lat(orgName, HEB2LAT) {
    const lat = [...orgName.trim().toLowerCase()].map((ch) => HEB2LAT[ch] ?? ch).join('');
    return lat;
}
export function inner$slugify$base(orgName, HEB2LAT) {
    const lat = [...orgName.trim().toLowerCase()].map((ch) => HEB2LAT[ch] ?? ch).join('');
    let base = lat.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/--+/g, '-');
    return base;
}
export function inner$slugify$base$$step(lat) {
    let base = lat.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/--+/g, '-');
    return base;
}
export function inner$slugify$cand(base, i) {
    const cand = base + '-' + i;
    return cand;
}

export const SIGS = {
  inner$slugify$lat: [{"name":"orgName","d":{"t":"any"},"opt":false},{"name":"HEB2LAT","d":{"t":"any"},"opt":false}],
  inner$slugify$base: [{"name":"orgName","d":{"t":"any"},"opt":false},{"name":"HEB2LAT","d":{"t":"any"},"opt":false}],
  inner$slugify$base$$step: [{"name":"lat","d":{"t":"str"},"opt":false}],
  inner$slugify$cand: [{"name":"base","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
};
