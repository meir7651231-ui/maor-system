// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/csvx.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$csvEscape$v(x) {
    let v = String(x ?? '');
    return v;
}
export function inner$parseCsv$t(text) {
    const t = text.replace(/^\uFEFF/, '');
    return t;
}
export function inner$parseCsv$nl(text) {
    const t = text.replace(/^\uFEFF/, '');
    const nl = t.indexOf('\n');
    return nl;
}
export function inner$parseCsv$nl$$step(t) {
    const nl = t.indexOf('\n');
    return nl;
}
export function inner$parseCsv$firstLine(text) {
    const t = text.replace(/^\uFEFF/, '');
    const nl = t.indexOf('\n');
    const firstLine = nl < 0 ? t : t.slice(0, nl);
    return firstLine;
}
export function inner$parseCsv$firstLine$$step(t, nl) {
    const firstLine = nl < 0 ? t : t.slice(0, nl);
    return firstLine;
}
export function inner$parseCsv$delim(text) {
    const t = text.replace(/^\uFEFF/, '');
    const nl = t.indexOf('\n');
    const firstLine = nl < 0 ? t : t.slice(0, nl);
    const delim = (firstLine.split('\t').length - 1) > (firstLine.split(',').length - 1) ? '\t' : ',';
    return delim;
}
export function inner$parseCsv$delim$$step(firstLine) {
    const delim = (firstLine.split('\t').length - 1) > (firstLine.split(',').length - 1) ? '\t' : ',';
    return delim;
}
export function inner$parseAnyDate$s(v) {
    const s = String(v || '').trim();
    return s;
}
export function inner$parseAnyDate$iso(v) {
    const s = String(v || '').trim();
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return iso;
}
export function inner$parseAnyDate$iso$$step(s) {
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return iso;
}
export function inner$parseAnyDate$probe(v) {
    const s = String(v || '').trim();
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const y = +iso[1];
    const mon = +iso[2];
    const day = +iso[3];
    const probe = new Date(Date.UTC(y, mon - 1, day));
    return probe;
}
export function inner$parseAnyDate$probe$$step(y, mon, day) {
    const probe = new Date(Date.UTC(y, mon - 1, day));
    return probe;
}
export function inner$parseAnyDate$m(v) {
    const s = String(v || '').trim();
    const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
    return m;
}
export function inner$parseAnyDate$m$$step(s) {
    const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
    return m;
}
export function inner$parseAnyDate$probe_L149(v, y) {
    const s = String(v || '').trim();
    const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
    const day = +m[1];
    const mon = +m[2];
    const probe = new Date(Date.UTC(y, mon - 1, day));
    return probe;
}
export function inner$parseAnyDate$probe_L149$$step(day, mon, y) {
    const probe = new Date(Date.UTC(y, mon - 1, day));
    return probe;
}
export function inner$parseAnyDate$b() {
    const b = new Date(Date.UTC(1899, 11, 30));
    return b;
}
export function inner$decodeCsvBuffer$nuls$$after_loop(probe) {
    let nuls = 0;
    for (const b of probe)
        if (b === 0)
            nuls++;
    return nuls;
}

export const SIGS = {
  inner$csvEscape$v: [{"name":"x","d":{"t":"or","of":[{"t":"str"},{"t":"num"}]},"opt":false}],
  inner$parseCsv$t: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$parseCsv$nl: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$parseCsv$nl$$step: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$parseCsv$firstLine: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$parseCsv$firstLine$$step: [{"name":"t","d":{"t":"str"},"opt":false},{"name":"nl","d":{"t":"num"},"opt":false}],
  inner$parseCsv$delim: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$parseCsv$delim$$step: [{"name":"firstLine","d":{"t":"str"},"opt":false}],
  inner$parseAnyDate$s: [{"name":"v","d":{"t":"str"},"opt":false}],
  inner$parseAnyDate$iso: [{"name":"v","d":{"t":"str"},"opt":false}],
  inner$parseAnyDate$iso$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$parseAnyDate$probe: [{"name":"v","d":{"t":"str"},"opt":false}],
  inner$parseAnyDate$probe$$step: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"mon","d":{"t":"num"},"opt":false},{"name":"day","d":{"t":"num"},"opt":false}],
  inner$parseAnyDate$m: [{"name":"v","d":{"t":"str"},"opt":false}],
  inner$parseAnyDate$m$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$parseAnyDate$probe_L149: [{"name":"v","d":{"t":"str"},"opt":false},{"name":"y","d":{"t":"num"},"opt":false}],
  inner$parseAnyDate$probe_L149$$step: [{"name":"day","d":{"t":"num"},"opt":false},{"name":"mon","d":{"t":"num"},"opt":false},{"name":"y","d":{"t":"num"},"opt":false}],
  inner$parseAnyDate$b: [],
  inner$decodeCsvBuffer$nuls$$after_loop: [{"name":"probe","d":{"t":"obj","n":"Uint8Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false}],
};
