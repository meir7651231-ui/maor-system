// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/audit/diff.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$diffPair$evaluate$w(ia, ib) {
    const w = Math.max(ia.width, ib.width);
    return w;
}
export function inner$diffPair$evaluate$h(ia, ib) {
    const h = Math.max(ia.height, ib.height);
    return h;
}
export function inner$diffPair$evaluate$gray$g(sw, sh) {
    const g = new Float32Array(sw * sh);
    return g;
}
export function inner$diffPair$evaluate$n(ia, ib) {
    const w = Math.max(ia.width, ib.width);
    const h = Math.max(ia.height, ib.height);
    const n = w * h;
    return n;
}
export function inner$diffPair$evaluate$n$$step(w, h) {
    const n = w * h;
    return n;
}
export function inner$diffPair$evaluate$dd(Aw, Bw, i) {
    const dd = Math.abs(Aw[i] - Bw[i]);
    return dd;
}
export function inner$diffPair$evaluate$sw(ia, ib) {
    const w = Math.max(ia.width, ib.width);
    const sw = Math.max(1, Math.round(w * 0.25));
    return sw;
}
export function inner$diffPair$evaluate$sw$$step(w) {
    const sw = Math.max(1, Math.round(w * 0.25));
    return sw;
}
export function inner$diffPair$evaluate$sh(ia, ib) {
    const h = Math.max(ia.height, ib.height);
    const sh = Math.max(1, Math.round(h * 0.25));
    return sh;
}
export function inner$diffPair$evaluate$sh$$step(h) {
    const sh = Math.max(1, Math.round(h * 0.25));
    return sh;
}
export function inner$diffPair$evaluate$sn(ia, ib) {
    const w = Math.max(ia.width, ib.width);
    const h = Math.max(ia.height, ib.height);
    const sw = Math.max(1, Math.round(w * 0.25));
    const sh = Math.max(1, Math.round(h * 0.25));
    const sn = sw * sh;
    return sn;
}
export function inner$diffPair$evaluate$sn$$step(sw, sh) {
    const sn = sw * sh;
    return sn;
}
export function inner$diffPair$evaluate$gray$g$$after_loop(sw, sh, d) {
    const g = new Float32Array(sw * sh);
    for (let i = 0, j = 0; i < d.length; i += 4, j++)
        g[j] = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    return g;
}
export function inner$diffPair$evaluate$mism$$after_loop(TH, ia, ib, Aw, Bw) {
    const w = Math.max(ia.width, ib.width);
    const h = Math.max(ia.height, ib.height);
    let mism = 0;
    let sum = 0;
    const n = w * h;
    for (let i = 0; i < n; i++) {
        const dd = Math.abs(Aw[i] - Bw[i]);
        sum += dd;
        if (dd > TH)
            mism++;
    }
    return mism;
}
export function inner$diffPair$evaluate$sum$$after_loop(TH, ia, ib, Aw, Bw) {
    const w = Math.max(ia.width, ib.width);
    const h = Math.max(ia.height, ib.height);
    let mism = 0;
    let sum = 0;
    const n = w * h;
    for (let i = 0; i < n; i++) {
        const dd = Math.abs(Aw[i] - Bw[i]);
        sum += dd;
        if (dd > TH)
            mism++;
    }
    return sum;
}
export function inner$diffPair$evaluate$sm$$after_loop(ia, ib, As, Bs) {
    const w = Math.max(ia.width, ib.width);
    const h = Math.max(ia.height, ib.height);
    const sw = Math.max(1, Math.round(w * 0.25));
    const sh = Math.max(1, Math.round(h * 0.25));
    let sm = 0;
    const sn = sw * sh;
    for (let i = 0; i < sn; i++)
        if (Math.abs(As[i] - Bs[i]) > 24)
            sm++;
    return sm;
}

export const SIGS = {
  inner$diffPair$evaluate$w: [{"name":"ia","d":{"t":"any"},"opt":false},{"name":"ib","d":{"t":"any"},"opt":false}],
  inner$diffPair$evaluate$h: [{"name":"ia","d":{"t":"any"},"opt":false},{"name":"ib","d":{"t":"any"},"opt":false}],
  inner$diffPair$evaluate$gray$g: [{"name":"sw","d":{"t":"num"},"opt":false},{"name":"sh","d":{"t":"num"},"opt":false}],
  inner$diffPair$evaluate$n: [{"name":"ia","d":{"t":"any"},"opt":false},{"name":"ib","d":{"t":"any"},"opt":false}],
  inner$diffPair$evaluate$n$$step: [{"name":"w","d":{"t":"num"},"opt":false},{"name":"h","d":{"t":"num"},"opt":false}],
  inner$diffPair$evaluate$dd: [{"name":"Aw","d":{"t":"obj","n":"Float32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"Bw","d":{"t":"obj","n":"Float32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$diffPair$evaluate$sw: [{"name":"ia","d":{"t":"any"},"opt":false},{"name":"ib","d":{"t":"any"},"opt":false}],
  inner$diffPair$evaluate$sw$$step: [{"name":"w","d":{"t":"num"},"opt":false}],
  inner$diffPair$evaluate$sh: [{"name":"ia","d":{"t":"any"},"opt":false},{"name":"ib","d":{"t":"any"},"opt":false}],
  inner$diffPair$evaluate$sh$$step: [{"name":"h","d":{"t":"num"},"opt":false}],
  inner$diffPair$evaluate$sn: [{"name":"ia","d":{"t":"any"},"opt":false},{"name":"ib","d":{"t":"any"},"opt":false}],
  inner$diffPair$evaluate$sn$$step: [{"name":"sw","d":{"t":"num"},"opt":false},{"name":"sh","d":{"t":"num"},"opt":false}],
  inner$diffPair$evaluate$gray$g$$after_loop: [{"name":"sw","d":{"t":"num"},"opt":false},{"name":"sh","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"any"},"opt":false}],
  inner$diffPair$evaluate$mism$$after_loop: [{"name":"TH","d":{"t":"num"},"opt":false},{"name":"ia","d":{"t":"any"},"opt":false},{"name":"ib","d":{"t":"any"},"opt":false},{"name":"Aw","d":{"t":"obj","n":"Float32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"Bw","d":{"t":"obj","n":"Float32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false}],
  inner$diffPair$evaluate$sum$$after_loop: [{"name":"TH","d":{"t":"num"},"opt":false},{"name":"ia","d":{"t":"any"},"opt":false},{"name":"ib","d":{"t":"any"},"opt":false},{"name":"Aw","d":{"t":"obj","n":"Float32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"Bw","d":{"t":"obj","n":"Float32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false}],
  inner$diffPair$evaluate$sm$$after_loop: [{"name":"ia","d":{"t":"any"},"opt":false},{"name":"ib","d":{"t":"any"},"opt":false},{"name":"As","d":{"t":"obj","n":"Float32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false},{"name":"Bs","d":{"t":"obj","n":"Float32Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"obj","n":"ArrayBuffer","p":[["byteLength",{"t":"num"},false],["slice",{"t":"fn"},false]]},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false}],
};
