// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/decode-csv-buffer.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$decodeCsvBuffer$nuls$$after_loop(probe) {
    let nuls = 0;
    for (const b of probe)
        if (b === 0)
            nuls++;
    return nuls;
}

export const SIGS = {
  inner$decodeCsvBuffer$nuls$$after_loop: [{"name":"probe","d":{"t":"obj","n":"Uint8Array","p":[["BYTES_PER_ELEMENT",{"t":"num"},false],["buffer",{"t":"any"},false],["byteLength",{"t":"num"},false],["byteOffset",{"t":"num"},false],["copyWithin",{"t":"fn"},false],["every",{"t":"fn"},false],["fill",{"t":"fn"},false],["filter",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["forEach",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["join",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["length",{"t":"num"},false],["map",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["reverse",{"t":"fn"},false],["set",{"t":"fn"},false],["slice",{"t":"fn"},false],["some",{"t":"fn"},false],["sort",{"t":"fn"},false],["subarray",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["toString",{"t":"fn"},false],["valueOf",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false}],
};
