// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:yeshiva/rminhu.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const HAD = 'חד שיעורא';
const PLIGA = 'פליגא';
const LO = 'לא שייך';
const VERDICTS = [HAD, PLIGA, LO];
function checkRuling(r) {
    if (!r || !r.src)
        return 'מקור בלי שם (src) — «ורמינהו» חייב לנקוב את המקור';
    const v = String(r.verdict || '');
    if (!VERDICTS.includes(v))
        return `פסק אינו אחד משלושה (${VERDICTS.join(' / ')}): «${v}»`;
    const why = String(r.why || '');
    //    «פליגא» בלי חילוק אינו פסק (gate.py: unresolved אם len<25 על המחרוזת המלאה).
    if (v === PLIGA && (v + ': ' + why).length < 25)
        return `«פליגא» בלי הכרעה על ${r.src}: מי גובר ולמה? (חילוק לפני הכרעה)`;
    if (!why)
        return `פסק בלי סיבה על ${r.src}`;
    return null;
}
const SEP = String.fromCharCode(0);
export function inner$checkRuling$v(r) {
    const v = String(r.verdict || '');
    return v;
}
export function inner$checkRuling$why(r) {
    const why = String(r.why || '');
    return why;
}
export function inner$report$key(rec) {
    const key = [rec.engine, rec.matter, rec.fp].join(SEP);
    return key;
}
export function inner$report$body(rec) {
    const body = rec.none ? { matter: rec.matter, none: rec.none }
        : { matter: rec.matter, sources: rec.rulings.map((r) => [r.src, `${r.verdict}: ${r.why}`]) };
    return body;
}
export function inner$rminhu$txt(searched, none) {
    const txt = none || (searched.length ? `חיפשתי ב-${searched.join(' · ')}; לא מצינו` : '');
    return txt;
}
export function inner$rminhu$line(engine, matter, searched, none) {
    const txt = none || (searched.length ? `חיפשתי ב-${searched.join(' · ')}; לא מצינו` : '');
    const line = `⚪ ${engine}: ${matter} — ורמינהו: ${txt}`;
    return line;
}
export function inner$rminhu$line$$step(engine, matter, txt) {
    const line = `⚪ ${engine}: ${matter} — ורמינהו: ${txt}`;
    return line;
}
export function inner$rminhu$bad(rulings) {
    const bad = rulings.map(checkRuling).filter(Boolean);
    return bad;
}
export function inner$rminhu$hit(rulings) {
    const hit = rulings.find((r) => r.verdict === HAD) || null;
    return hit;
}
export function inner$rminhu$fp(rulings) {
    const fp = rulings.map((r) => `${r.src}=${r.verdict}`).join('|');
    return fp;
}
export function inner$rminhu$line_L129(engine, matter, searched, rulings, digest) {
    const hit = rulings.find((r) => r.verdict === HAD) || null;
    const line = hit
        ? `🕯️ ${engine}: ${matter} — ורמינהו: ${rulings.length} מקורות · חד שיעורא ${hit.src} · ${digest}`
        : `⚪ ${engine}: ${matter} — ורמינהו: ${rulings.length} מקורות נפסקו, לא מצינו חד-שיעורא: ${digest}${searched.length ? ` · חיפשתי: ${searched.join('/')}` : ''}`;
    return line;
}
export function inner$rminhu$line_L129$$step(engine, matter, searched, rulings, hit, digest) {
    const line = hit
        ? `🕯️ ${engine}: ${matter} — ורמינהו: ${rulings.length} מקורות · חד שיעורא ${hit.src} · ${digest}`
        : `⚪ ${engine}: ${matter} — ורמינהו: ${rulings.length} מקורות נפסקו, לא מצינו חד-שיעורא: ${digest}${searched.length ? ` · חיפשתי: ${searched.join('/')}` : ''}`;
    return line;
}
export function inner$digestOf$k(r) {
    const k = `${r.verdict}\u0001${r.why}`;
    return k;
}
export function inner$digestOf$parts(maxGroups, groups) {
    const parts = [...groups.values()].slice(0, maxGroups).map((g) => {
        const names = g.srcs.slice(0, 3).join(',') + (g.srcs.length > 3 ? `,+${g.srcs.length - 3}` : '');
        const why = g.why.length > 110 ? g.why.slice(0, 110) + '…' : g.why;
        return g.srcs.length === 1 ? `${names}=${g.verdict}(${why})` : `${g.srcs.length}× ${g.verdict} [${names}]: ${why}`;
    });
    return parts;
}
export function inner$digestOf$map$names(g) {
    const names = g.srcs.slice(0, 3).join(',') + (g.srcs.length > 3 ? `,+${g.srcs.length - 3}` : '');
    return names;
}
export function inner$digestOf$map$why(g) {
    const why = g.why.length > 110 ? g.why.slice(0, 110) + '…' : g.why;
    return why;
}

export const SIGS = {
  inner$checkRuling$v: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$checkRuling$why: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$report$key: [{"name":"rec","d":{"t":"any"},"opt":false}],
  inner$report$body: [{"name":"rec","d":{"t":"any"},"opt":false}],
  inner$rminhu$txt: [{"name":"searched","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"none","d":{"t":"str"},"opt":false}],
  inner$rminhu$line: [{"name":"engine","d":{"t":"any"},"opt":false},{"name":"matter","d":{"t":"any"},"opt":false},{"name":"searched","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"none","d":{"t":"str"},"opt":false}],
  inner$rminhu$line$$step: [{"name":"engine","d":{"t":"any"},"opt":false},{"name":"matter","d":{"t":"any"},"opt":false},{"name":"txt","d":{"t":"str"},"opt":false}],
  inner$rminhu$bad: [{"name":"rulings","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$rminhu$hit: [{"name":"rulings","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$rminhu$fp: [{"name":"rulings","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$rminhu$line_L129: [{"name":"engine","d":{"t":"any"},"opt":false},{"name":"matter","d":{"t":"any"},"opt":false},{"name":"searched","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"rulings","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"digest","d":{"t":"str"},"opt":false}],
  inner$rminhu$line_L129$$step: [{"name":"engine","d":{"t":"any"},"opt":false},{"name":"matter","d":{"t":"any"},"opt":false},{"name":"searched","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"rulings","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"hit","d":{"t":"any"},"opt":false},{"name":"digest","d":{"t":"str"},"opt":false}],
  inner$digestOf$k: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$digestOf$parts: [{"name":"maxGroups","d":{"t":"num"},"opt":false},{"name":"groups","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$digestOf$map$names: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$digestOf$map$why: [{"name":"g","d":{"t":"any"},"opt":false}],
};
