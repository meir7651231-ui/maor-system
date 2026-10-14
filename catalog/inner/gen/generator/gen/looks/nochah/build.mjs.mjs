// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/nochah/build.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function inner$railRow$sub(r) {
    const on = !!r.doing;
    const sub = on ? (r.where || r.doing) : (r.absent ? 'ב' + r.absent : r.next ? 'הבא ב־' + r.next : 'סיים להיום');
    return sub;
}
export function inner$railRow$sub$$step(r, on) {
    const sub = on ? (r.where || r.doing) : (r.absent ? 'ב' + r.absent : r.next ? 'הבא ב־' + r.next : 'סיים להיום');
    return sub;
}
export function inner$railRow$say(r) {
    const on = !!r.doing;
    const say = on
        ? `פעיל · ${esc(r.doing)}${r.size != null ? ` · ${r.size} נפשות` : ''} · עד ${r.till}`
        : (r.absent ? `לא פעיל · ב${r.absent}${r.sub ? ` · מחליף: ${esc(r.sub)}` : ''}` : 'לא פעיל');
    return say;
}
export function inner$railRow$say$$step(r, on) {
    const say = on
        ? `פעיל · ${esc(r.doing)}${r.size != null ? ` · ${r.size} נפשות` : ''} · עד ${r.till}`
        : (r.absent ? `לא פעיל · ב${r.absent}${r.sub ? ` · מחליף: ${esc(r.sub)}` : ''}` : 'לא פעיל');
    return say;
}

export const SIGS = {
  inner$railRow$sub: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$railRow$sub$$step: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"on","d":{"t":"bool"},"opt":false}],
  inner$railRow$say: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$railRow$say$$step: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"on","d":{"t":"bool"},"opt":false}],
};
