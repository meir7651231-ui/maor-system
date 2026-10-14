// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/enginebox/atoms/naming.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$cleanParams$ok(d, v) {
    const ok = d.choices?.some((c) => c.id === v);
    return ok;
}
export function inner$cleanParams$n(v) {
    let n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
    return n;
}
export function inner$fromChip$e(atom, engines) {
    const e = engines.find((x) => x.id === atom.from.engine);
    return e;
}
export function inner$detailDefaults$out$$after_loop(details) {
    const out = {};
    for (const d of details)
        out[d.id] = d.default;
    return out;
}
export function inner$cleanParams$out$$after_loop(details, values) {
    const out = {};
    for (const d of details) {
        const v = values[d.id];
        if (d.type === 'choice') {
            const ok = d.choices?.some((c) => c.id === v);
            out[d.id] = ok ? v : d.default;
            continue;
        }
        let n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
        if (!Number.isFinite(n))
            n = Number(d.default);
        if (d.min !== undefined && n < d.min)
            n = d.min;
        if (d.max !== undefined && n > d.max)
            n = d.max;
        out[d.id] = n;
    }
    return out;
}

export const SIGS = {
  inner$cleanParams$ok: [{"name":"d","d":{"t":"obj","n":"Detail","p":[["id",{"t":"str"},false],["label",{"t":"str"},false],["type",{"t":"lit","v":["number","minutes","choice"]},false],["choices",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["label",{"t":"str"},false]]}}]},true],["min",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["max",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["default",{"t":"or","of":[{"t":"str"},{"t":"num"}]},false]]},"opt":false},{"name":"v","d":{"t":"or","of":[{"t":"str"},{"t":"num"}]},"opt":false}],
  inner$cleanParams$n: [{"name":"v","d":{"t":"or","of":[{"t":"str"},{"t":"num"}]},"opt":false}],
  inner$fromChip$e: [{"name":"atom","d":{"t":"obj","n":"AtomCard","p":[["id",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"obj","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["num",{"t":"num"},false]]},false],["computes",{"t":"str"},false],["worksOn",{"t":"arr","of":{"t":"lit","v":["amount","span","text","sequence","times","waiting"]}},false],["question",{"t":"str"},false],["details",{"t":"arr","of":{"t":"obj","n":"Detail","p":[["id",{"t":"str"},false],["label",{"t":"str"},false],["type",{"t":"lit","v":["number","minutes","choice"]},false],["choices",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["label",{"t":"str"},false]]}}]},true],["min",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["max",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["default",{"t":"or","of":[{"t":"str"},{"t":"num"}]},false]]}},false]]},"opt":false},{"name":"engines","d":{"t":"arr","of":{"t":"obj","n":"EngineCard","p":[["id",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"str"},false],["computes",{"t":"str"},false],["parts",{"t":"arr","of":{"t":"obj","n":"InnerPart","p":[["num",{"t":"num"},false],["name",{"t":"str"},false],["computes",{"t":"str"},false],["atom",{"t":"or","of":[{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},{"t":"undef"}]},true]]}},false],["places",{"t":"arr","of":{"t":"obj","n":"Place","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["results",{"t":"obj","n":"Readonly","p":[["divide",{"t":"any"},true],["merge",{"t":"any"},true],["next",{"t":"any"},true],["round",{"t":"any"},true],["offset",{"t":"any"},true],["escalate",{"t":"any"},true],["rotate",{"t":"any"},true],["fuzzy",{"t":"any"},true]]},false]]}},false]]}},"opt":false}],
  inner$detailDefaults$out$$after_loop: [{"name":"details","d":{"t":"arr","of":{"t":"obj","n":"Detail","p":[["id",{"t":"str"},false],["label",{"t":"str"},false],["type",{"t":"lit","v":["number","minutes","choice"]},false],["choices",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["label",{"t":"str"},false]]}}]},true],["min",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["max",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["default",{"t":"or","of":[{"t":"str"},{"t":"num"}]},false]]}},"opt":false}],
  inner$cleanParams$out$$after_loop: [{"name":"details","d":{"t":"arr","of":{"t":"obj","n":"Detail","p":[["id",{"t":"str"},false],["label",{"t":"str"},false],["type",{"t":"lit","v":["number","minutes","choice"]},false],["choices",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["label",{"t":"str"},false]]}}]},true],["min",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["max",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["default",{"t":"or","of":[{"t":"str"},{"t":"num"}]},false]]}},"opt":false},{"name":"values","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
};
