// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך yeshiva:harness/guard.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$opt$i(argv, k) {
    const i = argv.indexOf(k);
    return i;
}
export function inner$flatMap$w(c) {
    const w = c.trim().split(/\s+/)[0];
    return w;
}
export function inner$stub$msg(f) {
    const msg = `🔒 ${f} בהסגר לזמן המשימה (harness/guard.mjs). זו פקודה הרסנית — אם באמת צריך אותה, בקש מבן-אדם.`;
    return msg;
}

export const SIGS = {
  inner$opt$i: [{"name":"argv","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$flatMap$w: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$stub$msg: [{"name":"f","d":{"t":"any"},"opt":false}],
};
