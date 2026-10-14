// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/engineroute/text.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const PREFIX_LETTERS = 'והבלמשכ';
const MAX_PREFIX = 4;
const MIN_REST = 2;
const FINALS = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };
const display = (s) => s
    .replace(/[֑-ׇ]/g, '') // ניקוד/טעמים
    .replace(/[״"׳'`]/g, '')
    .replace(/[^א-תa-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean);
const unfinal = (w) => w.replace(/[ךםןףץ]/g, (c) => FINALS[c]);
function singulars(w) {
    const out = [w];
    if (w.length >= 4 && w.endsWith('ים'))
        out.push(w.slice(0, -2));
    if (w.length >= 4 && w.endsWith('ות')) {
        const base = w.slice(0, -2);
        out.push(base, base + 'ה', base + 'ת');
    }
    return out;
}
function readings(w, stripPrefix) {
    const bases = [w];
    if (stripPrefix) {
        for (let k = 1; k <= MAX_PREFIX && w.length - k >= MIN_REST; k++) {
            if (!PREFIX_LETTERS.includes(w[k - 1]))
                break;
            bases.push(w.slice(k));
        }
    }
    const out = new Set();
    for (const b of bases)
        for (const s of singulars(b))
            out.add(s);
    return out;
}
export function inner$singulars$base(w) {
    const base = w.slice(0, -2);
    return base;
}
export function inner$goalFromText$shown(text) {
    const shown = display(String(text ?? ''));
    return shown;
}
export function inner$goalFromText$toks(text) {
    const shown = display(String(text ?? ''));
    const toks = shown.map(unfinal);
    return toks;
}
export function inner$goalFromText$toks$$step(shown) {
    const toks = shown.map(unfinal);
    return toks;
}
export function inner$goalFromText$reads(text) {
    const shown = display(String(text ?? ''));
    const toks = shown.map(unfinal);
    const reads = toks.map((t) => readings(t, true));
    return reads;
}
export function inner$goalFromText$reads$$step(toks) {
    const reads = toks.map((t) => readings(t, true));
    return reads;
}
export function inner$goalFromText$used(text) {
    const shown = display(String(text ?? ''));
    const toks = shown.map(unfinal);
    const used = toks.map(() => false);
    return used;
}
export function inner$goalFromText$used$$step(toks) {
    const used = toks.map(() => false);
    return used;
}
export function inner$readings$out$$after_loop(bases) {
    const out = new Set();
    for (const b of bases)
        for (const s of singulars(b))
            out.add(s);
    return out;
}
export function inner$goalFromText$ok$$after_loop(text, used, e, n, i) {
    const shown = display(String(text ?? ''));
    const toks = shown.map(unfinal);
    const reads = toks.map((t) => readings(t, true));
    let ok = true;
    for (let j = 0; j < n && ok; j++) {
        if (used[i + j])
            ok = false;
        else if (!reads[i + j].has(e.phrase[j]) && !singulars(e.phrase[j]).some((s) => reads[i + j].has(s)))
            ok = false;
    }
    return ok;
}
export function inner$goalFromText$plugs$$after_loop(hits) {
    const plugs = [];
    for (const h of hits)
        if (!plugs.includes(h.plug))
            plugs.push(h.plug);
    return plugs;
}
export function inner$routeText$targets$$after_loop(route, step) {
    const targets = [];
    for (const l of route.links)
        if (l.giver === step.add && !targets.includes(l.needer))
            targets.push(l.needer);
    return targets;
}

export const SIGS = {
  inner$singulars$base: [{"name":"w","d":{"t":"str"},"opt":false}],
  inner$goalFromText$shown: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$goalFromText$toks: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$goalFromText$toks$$step: [{"name":"shown","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$goalFromText$reads: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$goalFromText$reads$$step: [{"name":"toks","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$goalFromText$used: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$goalFromText$used$$step: [{"name":"toks","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$readings$out$$after_loop: [{"name":"bases","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$goalFromText$ok$$after_loop: [{"name":"text","d":{"t":"str"},"opt":false},{"name":"used","d":{"t":"arr","of":{"t":"bool"}},"opt":false},{"name":"e","d":{"t":"obj","n":"Entry","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["phrase",{"t":"arr","of":{"t":"str"}},false]]},"opt":false},{"name":"n","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$goalFromText$plugs$$after_loop: [{"name":"hits","d":{"t":"arr","of":{"t":"obj","p":[["at",{"t":"num"},false],["word",{"t":"str"},false],["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false]]}},"opt":false}],
  inner$routeText$targets$$after_loop: [{"name":"route","d":{"t":"obj","n":"Route","p":[["steps",{"t":"arr","of":{"t":"obj","n":"RouteStep","p":[["add",{"t":"str"},false],["links",{"t":"arr","of":{"t":"obj","n":"RouteLink","p":[["giver",{"t":"str"},false],["plug",{"t":"str"},false],["needer",{"t":"str"},false]]}},false]]}},false],["links",{"t":"arr","of":{"t":"obj","n":"RouteLink","p":[["giver",{"t":"str"},false],["plug",{"t":"str"},false],["needer",{"t":"str"},false]]}},false],["missing",{"t":"arr","of":{"t":"str"}},false],["addedCount",{"t":"num"},false]]},"opt":false},{"name":"step","d":{"t":"obj","n":"RouteStep","p":[["add",{"t":"str"},false],["links",{"t":"arr","of":{"t":"obj","n":"RouteLink","p":[["giver",{"t":"str"},false],["plug",{"t":"str"},false],["needer",{"t":"str"},false]]}},false]]},"opt":false}],
};
