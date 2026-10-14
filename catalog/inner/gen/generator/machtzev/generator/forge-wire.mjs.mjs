// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/forge-wire.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const TONE_RE = [/^tone-(info|neutral|accent|primary)$/, /^tone-(ok|success|good)$/, /^tone-(err|error|danger|bad)$/, /^tone-(warn|warning)$/];
const variantOf = (a, tone) => { const v = (a.items && a.items.variants) || []; const re = TONE_RE[tone]; const i = re ? v.findIndex((x) => re.test(x)) : -1; return i; };
export function inner$variantOf$i(a, re) {
    const v = (a.items && a.items.variants) || [];
    const i = re ? v.findIndex((x) => re.test(x)) : -1;
    return i;
}
export function inner$variantOf$i$$step(v, re) {
    const i = re ? v.findIndex((x) => re.test(x)) : -1;
    return i;
}
export function inner$wireForge$own(a) {
    let own = a.items && a.items.slots ? Math.max(0, a.fieldSlots - a.items.demo * a.items.slots) : a.fieldSlots;
    return own;
}
export function inner$wireForge$fields(a) {
    const fields = Array.from({ length: a.fieldSlots }, () => "''");
    return fields;
}
export function inner$wireForge$valNum(ctx) {
    const valNum = !!ctx.value && ctx.value.isNum !== false;
    return valNum;
}
export function inner$wireForge$texts0(ctx) {
    const valNum = !!ctx.value && ctx.value.isNum !== false;
    const texts0 = [['label', ctx.label], ...(ctx.value && !valNum ? [['value', ctx.value.str]] : []), ['sub', ctx.sub], ['message', ctx.message && ctx.message !== ctx.label ? ctx.message : null]].filter(([, e]) => e);
    return texts0;
}
export function inner$wireForge$texts0$$step(ctx, valNum) {
    const texts0 = [['label', ctx.label], ...(ctx.value && !valNum ? [['value', ctx.value.str]] : []), ['sub', ctx.sub], ['message', ctx.message && ctx.message !== ctx.label ? ctx.message : null]].filter(([, e]) => e);
    return texts0;
}
export function inner$wireForge$texts(ctx) {
    const valNum = !!ctx.value && ctx.value.isNum !== false;
    const texts0 = [['label', ctx.label], ...(ctx.value && !valNum ? [['value', ctx.value.str]] : []), ['sub', ctx.sub], ['message', ctx.message && ctx.message !== ctx.label ? ctx.message : null]].filter(([, e]) => e);
    const need = ctx.need || [];
    const texts = [...texts0.filter(([k]) => need.includes(k)).sort((a, b) => need.indexOf(a[0]) - need.indexOf(b[0])), ...texts0.filter(([k]) => !need.includes(k))];
    return texts;
}
export function inner$wireForge$texts$$step(texts0, need) {
    const texts = [...texts0.filter(([k]) => need.includes(k)).sort((a, b) => need.indexOf(a[0]) - need.indexOf(b[0])), ...texts0.filter(([k]) => !need.includes(k))];
    return texts;
}
export function inner$wireForge$extra(fields) {
    const extra = [`fields: [${fields.join(', ')}]`];
    return extra;
}
export function inner$wireForge$wantRows(ctx) {
    const need = ctx.need || [];
    const wantRows = !need.length || need.some((k) => k === 'rows' || k === 'items');
    return wantRows;
}
export function inner$wireForge$wantRows$$step(need) {
    const wantRows = !need.length || need.some((k) => k === 'rows' || k === 'items');
    return wantRows;
}
export function inner$wireForge$d(a, own, j) {
    const demo = a.fieldDemo || [];
    const d = demo[own + j];
    return d;
}
export function inner$wireForge$d$$step(demo, own, j) {
    const d = demo[own + j];
    return d;
}
export function inner$wireForge$vi(ctx, a) {
    const vi = variantOf(a, ctx.tone);
    return vi;
}
export function inner$wireForge$baseArgs(base) {
    const baseArgs = base.call.slice(base.call.indexOf('(') + 1, base.call.lastIndexOf(')')).trim();
    return baseArgs;
}

export const SIGS = {
  inner$variantOf$i: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"re","d":{"t":"any"},"opt":false}],
  inner$variantOf$i$$step: [{"name":"v","d":{"t":"any"},"opt":false},{"name":"re","d":{"t":"any"},"opt":false}],
  inner$wireForge$own: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$wireForge$fields: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$wireForge$valNum: [{"name":"ctx","d":{"t":"any"},"opt":false}],
  inner$wireForge$texts0: [{"name":"ctx","d":{"t":"any"},"opt":false}],
  inner$wireForge$texts0$$step: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"valNum","d":{"t":"bool"},"opt":false}],
  inner$wireForge$texts: [{"name":"ctx","d":{"t":"any"},"opt":false}],
  inner$wireForge$texts$$step: [{"name":"texts0","d":{"t":"arr","of":{"t":"arr","of":{"t":"any"}}},"opt":false},{"name":"need","d":{"t":"any"},"opt":false}],
  inner$wireForge$extra: [{"name":"fields","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$wireForge$wantRows: [{"name":"ctx","d":{"t":"any"},"opt":false}],
  inner$wireForge$wantRows$$step: [{"name":"need","d":{"t":"any"},"opt":false}],
  inner$wireForge$d: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"own","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$wireForge$d$$step: [{"name":"demo","d":{"t":"any"},"opt":false},{"name":"own","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$wireForge$vi: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$wireForge$baseArgs: [{"name":"base","d":{"t":"any"},"opt":false}],
};
