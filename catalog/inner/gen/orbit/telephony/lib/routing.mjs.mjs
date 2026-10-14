// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:telephony/lib/routing.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function cleanExt(v) {
    return typeof v === 'string' && /^[0-9]{2,6}$/.test(v) ? v : null;
}
export function inner$normDest$list(raw) {
    const list = Array.isArray(raw.value) ? raw.value.map(cleanExt).filter(Boolean) : [];
    return list;
}
export function inner$normalizeRouting$digit(o) {
    const digit = String(o?.digit ?? '');
    return digit;
}
export function inner$normalizeRouting$rawMusic(raw) {
    const rawMusic = typeof raw.queue.music === 'string' && raw.queue.music ? raw.queue.music : '';
    return rawMusic;
}
export function inner$normalizeRouting$safeMusic(raw) {
    const rawMusic = typeof raw.queue.music === 'string' && raw.queue.music ? raw.queue.music : '';
    const safeMusic = (rawMusic && (rawMusic === '$${hold_music}' || !rawMusic.includes('$'))) ? rawMusic : '$${hold_music}';
    return safeMusic;
}
export function inner$normalizeRouting$safeMusic$$step(rawMusic) {
    const safeMusic = (rawMusic && (rawMusic === '$${hold_music}' || !rawMusic.includes('$'))) ? rawMusic : '$${hold_music}';
    return safeMusic;
}
export function inner$normalizeRouting$code(s) {
    const code = typeof s?.code === 'string' && /^[0-9*#]{1,4}$/.test(s.code) ? s.code : null;
    return code;
}
export function inner$normalizeRouting$ext(raw) {
    const ext = cleanExt(raw.priority.ext);
    return ext;
}
export function inner$normalizeRouting$ov(raw) {
    const ov = (Array.isArray(raw.overflow) ? raw.overflow : []).map(cleanExt).filter(Boolean);
    return ov;
}

export const SIGS = {
  inner$normDest$list: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$normalizeRouting$digit: [{"name":"o","d":{"t":"any"},"opt":false}],
  inner$normalizeRouting$rawMusic: [{"name":"raw","d":{"t":"obj","p":[]},"opt":false}],
  inner$normalizeRouting$safeMusic: [{"name":"raw","d":{"t":"obj","p":[]},"opt":false}],
  inner$normalizeRouting$safeMusic$$step: [{"name":"rawMusic","d":{"t":"any"},"opt":false}],
  inner$normalizeRouting$code: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$normalizeRouting$ext: [{"name":"raw","d":{"t":"obj","p":[]},"opt":false}],
  inner$normalizeRouting$ov: [{"name":"raw","d":{"t":"obj","p":[]},"opt":false}],
};
