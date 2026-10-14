// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/decompose/meter.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$recall$keyOf(keys) {
    const keyOf = new Map(keys.map((k) => [k.hand, k.any]));
    return keyOf;
}
export function inner$recall$any(keys, h) {
    const keyOf = new Map(keys.map((k) => [k.hand, k.any]));
    const any = keyOf.get(h.id) ?? [];
    return any;
}
export function inner$recall$any$$step(keyOf, h) {
    const any = keyOf.get(h.id) ?? [];
    return any;
}
export function inner$countByEngine$out$$after_loop(conns) {
    const out = {};
    for (const c of conns)
        out[c.engine] = (out[c.engine] ?? 0) + 1;
    return out;
}
export function inner$recall$kinds$$after_loop(engines) {
    const kinds = new Map();
    for (const e of engines) {
        for (const p of e.places)
            kinds.set(p.id, p.kind);
        for (const p of e.fnPlaces)
            kinds.set(p.id, p.kind);
    }
    return kinds;
}
export function inner$recall$found$$after_loop(engines, hand, keys) {
    const kinds = new Map();
    for (const e of engines) {
        for (const p of e.places)
            kinds.set(p.id, p.kind);
        for (const p of e.fnPlaces)
            kinds.set(p.id, p.kind);
    }
    const keyOf = new Map(keys.map((k) => [k.hand, k.any]));
    const found = [];
    const missed = [];
    for (const h of hand) {
        const any = keyOf.get(h.id) ?? [];
        if (any.some((id) => kinds.get(id) === h.kind))
            found.push(h.id);
        else
            missed.push(h.id);
    }
    return found;
}
export function inner$recall$missed$$after_loop(engines, hand, keys) {
    const kinds = new Map();
    for (const e of engines) {
        for (const p of e.places)
            kinds.set(p.id, p.kind);
        for (const p of e.fnPlaces)
            kinds.set(p.id, p.kind);
    }
    const keyOf = new Map(keys.map((k) => [k.hand, k.any]));
    const found = [];
    const missed = [];
    for (const h of hand) {
        const any = keyOf.get(h.id) ?? [];
        if (any.some((id) => kinds.get(id) === h.kind))
            found.push(h.id);
        else
            missed.push(h.id);
    }
    return missed;
}

export const SIGS = {
  inner$recall$keyOf: [{"name":"keys","d":{"t":"arr","of":{"t":"obj","n":"RecallKey","p":[["hand",{"t":"str"},false],["any",{"t":"arr","of":{"t":"str"}},false]]}},"opt":false}],
  inner$recall$any: [{"name":"keys","d":{"t":"arr","of":{"t":"obj","n":"RecallKey","p":[["hand",{"t":"str"},false],["any",{"t":"arr","of":{"t":"str"}},false]]}},"opt":false},{"name":"h","d":{"t":"obj","p":[["id",{"t":"str"},false],["kind",{"t":"str"},false]]},"opt":false}],
  inner$recall$any$$step: [{"name":"keyOf","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"h","d":{"t":"obj","p":[["id",{"t":"str"},false],["kind",{"t":"str"},false]]},"opt":false}],
  inner$countByEngine$out$$after_loop: [{"name":"conns","d":{"t":"arr","of":{"t":"obj","n":"RealConnection","p":[["engine",{"t":"str"},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["preview",{"t":"obj","n":"GenericPreview","p":[["title",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"str"}},false]]},false]]}},"opt":false}],
  inner$recall$kinds$$after_loop: [{"name":"engines","d":{"t":"arr","of":{"t":"obj","n":"GenEngine","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"str"},false],["computes",{"t":"str"},false],["entities",{"t":"arr","of":{"t":"str"}},false],["parts",{"t":"arr","of":{"t":"obj","n":"GenPart","p":[["num",{"t":"num"},false],["name",{"t":"str"},false],["computes",{"t":"str"},false],["fn",{"t":"str"},false],["takes",{"t":"arr","of":{"t":"lit","v":["amount","span","text","sequence","times","waiting"]}},false],["gives",{"t":"or","of":[{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},{"t":"null"}]},false],["atom",{"t":"or","of":[{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},{"t":"undef"}]},true]]}},false],["places",{"t":"arr","of":{"t":"obj","n":"GenPlace","p":[["id",{"t":"str"},false],["engine",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["results",{"t":"obj","n":"Readonly","p":[["divide",{"t":"any"},true],["merge",{"t":"any"},true],["next",{"t":"any"},true],["round",{"t":"any"},true],["offset",{"t":"any"},true],["escalate",{"t":"any"},true],["rotate",{"t":"any"},true],["fuzzy",{"t":"any"},true]]},false],["spec",{"t":"obj","n":"ExtractSpec","p":[["entity",{"t":"str"},false],["where",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"bool"},{"t":"str"},{"t":"num"},{"t":"arr","of":{"t":"any"}}]}}]},true],["path",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["to",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["unit",{"t":"or","of":[{"t":"lit","v":["number","date","clock"]},{"t":"undef"}]},true],["dateField",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["groupBy",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["field",{"t":"str"},false],["open",{"t":"arr","of":{"t":"any"}},false]]}]},true],["done",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["since",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["echo",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},false],["personal",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["fnPlaces",{"t":"arr","of":{"t":"obj","n":"GenFnPlace","p":[["id",{"t":"str"},false],["engine",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["fn",{"t":"str"},false],["takes",{"t":"str"},false]]}},false],["unclassified",{"t":"rec","of":{"t":"num"}},false]]}},"opt":false}],
  inner$recall$found$$after_loop: [{"name":"engines","d":{"t":"arr","of":{"t":"obj","n":"GenEngine","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"str"},false],["computes",{"t":"str"},false],["entities",{"t":"arr","of":{"t":"str"}},false],["parts",{"t":"arr","of":{"t":"obj","n":"GenPart","p":[["num",{"t":"num"},false],["name",{"t":"str"},false],["computes",{"t":"str"},false],["fn",{"t":"str"},false],["takes",{"t":"arr","of":{"t":"lit","v":["amount","span","text","sequence","times","waiting"]}},false],["gives",{"t":"or","of":[{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},{"t":"null"}]},false],["atom",{"t":"or","of":[{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},{"t":"undef"}]},true]]}},false],["places",{"t":"arr","of":{"t":"obj","n":"GenPlace","p":[["id",{"t":"str"},false],["engine",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["results",{"t":"obj","n":"Readonly","p":[["divide",{"t":"any"},true],["merge",{"t":"any"},true],["next",{"t":"any"},true],["round",{"t":"any"},true],["offset",{"t":"any"},true],["escalate",{"t":"any"},true],["rotate",{"t":"any"},true],["fuzzy",{"t":"any"},true]]},false],["spec",{"t":"obj","n":"ExtractSpec","p":[["entity",{"t":"str"},false],["where",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"bool"},{"t":"str"},{"t":"num"},{"t":"arr","of":{"t":"any"}}]}}]},true],["path",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["to",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["unit",{"t":"or","of":[{"t":"lit","v":["number","date","clock"]},{"t":"undef"}]},true],["dateField",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["groupBy",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["field",{"t":"str"},false],["open",{"t":"arr","of":{"t":"any"}},false]]}]},true],["done",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["since",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["echo",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},false],["personal",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["fnPlaces",{"t":"arr","of":{"t":"obj","n":"GenFnPlace","p":[["id",{"t":"str"},false],["engine",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["fn",{"t":"str"},false],["takes",{"t":"str"},false]]}},false],["unclassified",{"t":"rec","of":{"t":"num"}},false]]}},"opt":false},{"name":"hand","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["kind",{"t":"str"},false]]}},"opt":false},{"name":"keys","d":{"t":"arr","of":{"t":"obj","n":"RecallKey","p":[["hand",{"t":"str"},false],["any",{"t":"arr","of":{"t":"str"}},false]]}},"opt":false}],
  inner$recall$missed$$after_loop: [{"name":"engines","d":{"t":"arr","of":{"t":"obj","n":"GenEngine","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"str"},false],["computes",{"t":"str"},false],["entities",{"t":"arr","of":{"t":"str"}},false],["parts",{"t":"arr","of":{"t":"obj","n":"GenPart","p":[["num",{"t":"num"},false],["name",{"t":"str"},false],["computes",{"t":"str"},false],["fn",{"t":"str"},false],["takes",{"t":"arr","of":{"t":"lit","v":["amount","span","text","sequence","times","waiting"]}},false],["gives",{"t":"or","of":[{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},{"t":"null"}]},false],["atom",{"t":"or","of":[{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},{"t":"undef"}]},true]]}},false],["places",{"t":"arr","of":{"t":"obj","n":"GenPlace","p":[["id",{"t":"str"},false],["engine",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["results",{"t":"obj","n":"Readonly","p":[["divide",{"t":"any"},true],["merge",{"t":"any"},true],["next",{"t":"any"},true],["round",{"t":"any"},true],["offset",{"t":"any"},true],["escalate",{"t":"any"},true],["rotate",{"t":"any"},true],["fuzzy",{"t":"any"},true]]},false],["spec",{"t":"obj","n":"ExtractSpec","p":[["entity",{"t":"str"},false],["where",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"bool"},{"t":"str"},{"t":"num"},{"t":"arr","of":{"t":"any"}}]}}]},true],["path",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["to",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["unit",{"t":"or","of":[{"t":"lit","v":["number","date","clock"]},{"t":"undef"}]},true],["dateField",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["groupBy",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["field",{"t":"str"},false],["open",{"t":"arr","of":{"t":"any"}},false]]}]},true],["done",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["since",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["echo",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},false],["personal",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["fnPlaces",{"t":"arr","of":{"t":"obj","n":"GenFnPlace","p":[["id",{"t":"str"},false],["engine",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["fn",{"t":"str"},false],["takes",{"t":"str"},false]]}},false],["unclassified",{"t":"rec","of":{"t":"num"}},false]]}},"opt":false},{"name":"hand","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["kind",{"t":"str"},false]]}},"opt":false},{"name":"keys","d":{"t":"arr","of":{"t":"obj","n":"RecallKey","p":[["hand",{"t":"str"},false],["any",{"t":"arr","of":{"t":"str"}},false]]}},"opt":false}],
};
