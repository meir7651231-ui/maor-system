// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/agora/build.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const PLAN = 10;
export function inner$fn$per(n) {
    const per = Math.floor(n / PLAN);
    return per;
}
export function inner$map$out$$after_loop(ln) {
    let out = '';
    for (let i = 0; i < ln.length; i += 2)
        out += `<span class="c${ln[i + 1]}">${esc(ln[i])}</span>`;
    return out;
}

export const SIGS = {
  inner$fn$per: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$map$out$$after_loop: [{"name":"ln","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
};
