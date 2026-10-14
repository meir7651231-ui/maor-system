// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/coins.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const PN_METALS = {
    gold: { gm: 'pn-c-gm', relief: 'pn-c-relief', seg: [[120, 80, 18], [250, 214, 128]], bead: ['#7c5412', '#fff0bf'], back: '' },
    silver: { gm: 'pn-c-gmS', relief: 'pn-c-reliefS', seg: [[104, 112, 124], [246, 248, 252]], bead: ['#4b5462', '#ffffff'], back: ' pn-sap', swap: { enB: 'enN' } },
    plat: { gm: 'pn-c-gmP', relief: 'pn-c-reliefS', seg: [[112, 122, 140], [252, 253, 255]], bead: ['#59627a', '#ffffff'], back: '' },
};
const letters = (s) => s.replace(/[^\p{L}]/gu, '');
export function inner$cRing$a(n, off, i) {
    const a = ((i + off) / n) * Math.PI * 2 - Math.PI / 2;
    return a;
}
export function inner$weave$c1() {
    const c1 = ((Math.PI * 2 * 43.7) / 40 / 2).toFixed(3);
    return c1;
}
export function inner$weave$c2() {
    const c2 = ((Math.PI * 2 * 47) / 40 / 2).toFixed(3);
    return c2;
}
export function inner$coinFront$ck(key, metal, rim) {
    const ck = key + '|' + metal + '|' + rim;
    return ck;
}
export function inner$coinFront$hit(C_CACHE, key, metal, rim, ic0) {
    const ck = key + '|' + metal + '|' + rim;
    const hit = !ic0 && key ? C_CACHE.get(ck) : undefined;
    return hit;
}
export function inner$coinFront$hit$$step(C_CACHE, key, ic0, ck) {
    const hit = !ic0 && key ? C_CACHE.get(ck) : undefined;
    return hit;
}
export function inner$coinFront$ic(COIN_IC, key, ic0) {
    const ic = ic0 ?? (key ? COIN_IC[key] : undefined) ?? COIN_IC.other;
    return ic;
}
export function inner$coinFront$en(COIN_IC, key, metal, ic0) {
    const ic = ic0 ?? (key ? COIN_IC[key] : undefined) ?? COIN_IC.other;
    const M = PN_METALS[metal] ?? PN_METALS.gold;
    const en = ic.e
        .map(([sh, c]) => {
        const col = M.swap?.[c] ?? c;
        return `<g fill="url(#pn-c-${col})">${sh.startsWith('<') ? sh : `<path d="${sh}"/>`}</g>`;
    })
        .join('');
    return en;
}
export function inner$coinFront$en$$step(ic, M) {
    const en = ic.e
        .map(([sh, c]) => {
        const col = M.swap?.[c] ?? c;
        return `<g fill="url(#pn-c-${col})">${sh.startsWith('<') ? sh : `<path d="${sh}"/>`}</g>`;
    })
        .join('');
    return en;
}
export function inner$coinFront$m(COIN_IC, key, metal, ic0) {
    const ic = ic0 ?? (key ? COIN_IC[key] : undefined) ?? COIN_IC.other;
    const M = PN_METALS[metal] ?? PN_METALS.gold;
    const m = ic.m.replace(/url\(#pn-c-gm\)/g, `url(#${M.gm})`);
    return m;
}
export function inner$coinFront$m$$step(ic, M) {
    const m = ic.m.replace(/url\(#pn-c-gm\)/g, `url(#${M.gm})`);
    return m;
}
export function inner$coinBack$s(n) {
    const s = n == null ? '…' : String(n);
    return s;
}
export function inner$coinBack$unit(n) {
    const unit = n === 1 ? 'בעל מקצוע' : 'בעלי מקצוע';
    return unit;
}
export function inner$monoOf$t(mono) {
    let t = letters(String(mono ?? ''));
    return t;
}
export function inner$monoOf$w(name) {
    const w = String(name || '').replace(/^(ר׳|ר'|הרב|גב׳|גב'|מרת|הגב׳)\s+/, '').replace(/[״"׳']/g, '').trim().split(/\s+/).filter(Boolean);
    return w;
}

export const SIGS = {
  inner$cRing$a: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"off","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$weave$c1: [],
  inner$weave$c2: [],
  inner$coinFront$ck: [{"name":"key","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"metal","d":{"t":"lit","v":["gold","silver","plat"]},"opt":false},{"name":"rim","d":{"t":"lit","v":["beads","weave","masks","matzah"]},"opt":false}],
  inner$coinFront$hit: [{"name":"C_CACHE","d":{"t":"map","k":{"t":"str"},"v":{"t":"str"}},"opt":false},{"name":"key","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"metal","d":{"t":"lit","v":["gold","silver","plat"]},"opt":false},{"name":"rim","d":{"t":"lit","v":["beads","weave","masks","matzah"]},"opt":false},{"name":"ic0","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CoinIc","p":[["e",{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"str"}]}},false],["m",{"t":"str"},false],["flip",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}]},"opt":false}],
  inner$coinFront$hit$$step: [{"name":"C_CACHE","d":{"t":"map","k":{"t":"str"},"v":{"t":"str"}},"opt":false},{"name":"key","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"ic0","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CoinIc","p":[["e",{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"str"}]}},false],["m",{"t":"str"},false],["flip",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}]},"opt":false},{"name":"ck","d":{"t":"str"},"opt":false}],
  inner$coinFront$ic: [{"name":"COIN_IC","d":{"t":"rec","of":{"t":"obj","n":"CoinIc","p":[["e",{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"str"}]}},false],["m",{"t":"str"},false],["flip",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},"opt":false},{"name":"key","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"ic0","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CoinIc","p":[["e",{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"str"}]}},false],["m",{"t":"str"},false],["flip",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}]},"opt":false}],
  inner$coinFront$en: [{"name":"COIN_IC","d":{"t":"rec","of":{"t":"obj","n":"CoinIc","p":[["e",{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"str"}]}},false],["m",{"t":"str"},false],["flip",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},"opt":false},{"name":"key","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"metal","d":{"t":"lit","v":["gold","silver","plat"]},"opt":false},{"name":"ic0","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CoinIc","p":[["e",{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"str"}]}},false],["m",{"t":"str"},false],["flip",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}]},"opt":false}],
  inner$coinFront$en$$step: [{"name":"ic","d":{"t":"obj","n":"CoinIc","p":[["e",{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"str"}]}},false],["m",{"t":"str"},false],["flip",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false},{"name":"M","d":{"t":"obj","n":"Metal","p":[["gm",{"t":"str"},false],["relief",{"t":"str"},false],["seg",{"t":"tup","of":[{"t":"tup","of":[{"t":"num"},{"t":"num"},{"t":"num"}]},{"t":"tup","of":[{"t":"num"},{"t":"num"},{"t":"num"}]}]},false],["bead",{"t":"tup","of":[{"t":"str"},{"t":"str"}]},false],["back",{"t":"str"},false],["swap",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true]]},"opt":false}],
  inner$coinFront$m: [{"name":"COIN_IC","d":{"t":"rec","of":{"t":"obj","n":"CoinIc","p":[["e",{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"str"}]}},false],["m",{"t":"str"},false],["flip",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},"opt":false},{"name":"key","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"metal","d":{"t":"lit","v":["gold","silver","plat"]},"opt":false},{"name":"ic0","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CoinIc","p":[["e",{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"str"}]}},false],["m",{"t":"str"},false],["flip",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}]},"opt":false}],
  inner$coinFront$m$$step: [{"name":"ic","d":{"t":"obj","n":"CoinIc","p":[["e",{"t":"arr","of":{"t":"tup","of":[{"t":"str"},{"t":"str"}]}},false],["m",{"t":"str"},false],["flip",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false},{"name":"M","d":{"t":"obj","n":"Metal","p":[["gm",{"t":"str"},false],["relief",{"t":"str"},false],["seg",{"t":"tup","of":[{"t":"tup","of":[{"t":"num"},{"t":"num"},{"t":"num"}]},{"t":"tup","of":[{"t":"num"},{"t":"num"},{"t":"num"}]}]},false],["bead",{"t":"tup","of":[{"t":"str"},{"t":"str"}]},false],["back",{"t":"str"},false],["swap",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true]]},"opt":false}],
  inner$coinBack$s: [{"name":"n","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false}],
  inner$coinBack$unit: [{"name":"n","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false}],
  inner$monoOf$t: [{"name":"mono","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$monoOf$w: [{"name":"name","d":{"t":"str"},"opt":false}],
};
