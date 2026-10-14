// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:yeshiva/kushya-sources.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$registerAll$register$done(ctx, k) {
    const done = (ctx.answers.__kush || []).some((w) => String(k.kind).includes(w));
    return done;
}
export function inner$registerAll$register$tag(k) {
    const tag = `${k.kind} ${String(k.text).split(':')[0]}`;
    return tag;
}
export function inner$registerAll$register$instances(MI) {
    const instances = Object.fromEntries(MI.candidates.map((x) => [x.name, x.ent]));
    return instances;
}
export function inner$registerAll$register$subs(R) {
    const subs = Object.keys(R);
    return subs;
}
export function inner$registerAll$register$n(R, subs) {
    const n = subs.reduce((s, x) => s + R[x].length, 0);
    return n;
}
export function inner$registerAll$register$rows(res) {
    const rows = Object.values(res.sentRows || {}).reduce((s, x) => s + x.length, 0);
    return rows;
}
export function inner$registerAll$register$ws(k) {
    const ws = [...String(k.text).matchAll(/«([^»]+)»/g)].map((m) => m[1]).slice(0, 12);
    return ws;
}
export function inner$registerAll$register$hits(k, c) {
    const ws = [...String(k.text).matchAll(/«([^»]+)»/g)].map((m) => m[1]).slice(0, 12);
    const hits = ws.map((w) => ({ w, n: c.filter((d) => d.text.includes(w)).length }));
    return hits;
}
export function inner$registerAll$register$hits$$step(c, ws) {
    const hits = ws.map((w) => ({ w, n: c.filter((d) => d.text.includes(w)).length }));
    return hits;
}

export const SIGS = {
  inner$registerAll$register$done: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$tag: [{"name":"k","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$instances: [{"name":"MI","d":{"t":"obj","p":[["candidates",{"t":"arr","of":{"t":"obj","p":[["ent",{"t":"any"},false],["name",{"t":"any"},false],["sources",{"t":"any"},false],["n",{"t":"any"},false],["ex",{"t":"any"},false],["qty",{"t":"arr","of":{"t":"obj","p":[["unit",{"t":"any"},false],["vals",{"t":"arr","of":{"t":"any"}},false],["sources",{"t":"any"},false]]}},false]]}},false],["units",{"t":"arr","of":{"t":"obj","p":[["unit",{"t":"any"},false],["sources",{"t":"any"},false]]}},false],["corpus",{"t":"any"},false],["sentRows",{"t":"any"},false]]},"opt":false}],
  inner$registerAll$register$subs: [{"name":"R","d":{"t":"obj","n":"res","p":[]},"opt":false}],
  inner$registerAll$register$n: [{"name":"R","d":{"t":"obj","n":"res","p":[]},"opt":false},{"name":"subs","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$registerAll$register$rows: [{"name":"res","d":{"t":"obj","p":[["candidates",{"t":"arr","of":{"t":"obj","p":[["ent",{"t":"any"},false],["name",{"t":"any"},false],["sources",{"t":"any"},false],["n",{"t":"any"},false],["ex",{"t":"any"},false],["qty",{"t":"arr","of":{"t":"obj","p":[["unit",{"t":"any"},false],["vals",{"t":"arr","of":{"t":"any"}},false],["sources",{"t":"any"},false]]}},false]]}},false],["units",{"t":"arr","of":{"t":"obj","p":[["unit",{"t":"any"},false],["sources",{"t":"any"},false]]}},false],["corpus",{"t":"any"},false],["sentRows",{"t":"any"},false]]},"opt":false}],
  inner$registerAll$register$ws: [{"name":"k","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$hits: [{"name":"k","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$registerAll$register$hits$$step: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"ws","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
};
