// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/cloud-crypto.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$b64$bytes(buf) {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    return bytes;
}
export function inner$b64$s$$after_loop(buf) {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let s = '';
    for (const b of bytes)
        s += String.fromCharCode(b);
    return s;
}

export const SIGS = {
  inner$b64$bytes: [{"name":"buf","d":{"t":"any"},"opt":false}],
  inner$b64$s$$after_loop: [{"name":"buf","d":{"t":"any"},"opt":false}],
};
