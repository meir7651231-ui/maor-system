// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/contract.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$optionsFor$out$$after_loop(atom, engine) {
    const out = [];
    for (const p of engine.places) {
        const r = p.results[atom.id];
        if (!r || !atom.worksOn.includes(p.kind))
            continue;
        out.push({ atom: atom.id, place: p.id, placeName: p.name, kind: p.kind, result: r });
    }
    return out;
}

export const SIGS = {
  inner$optionsFor$out$$after_loop: [{"name":"atom","d":{"t":"obj","n":"AtomCard","p":[["id",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"obj","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["num",{"t":"num"},false]]},false],["computes",{"t":"str"},false],["worksOn",{"t":"arr","of":{"t":"lit","v":["amount","span","text","sequence","times","waiting"]}},false],["question",{"t":"str"},false],["details",{"t":"arr","of":{"t":"obj","n":"Detail","p":[["id",{"t":"str"},false],["label",{"t":"str"},false],["type",{"t":"lit","v":["number","minutes","choice"]},false],["choices",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["label",{"t":"str"},false]]}}]},true],["min",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["max",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["default",{"t":"or","of":[{"t":"str"},{"t":"num"}]},false]]}},false]]},"opt":false},{"name":"engine","d":{"t":"obj","n":"EngineCard","p":[["id",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"str"},false],["computes",{"t":"str"},false],["parts",{"t":"arr","of":{"t":"obj","n":"InnerPart","p":[["num",{"t":"num"},false],["name",{"t":"str"},false],["computes",{"t":"str"},false],["atom",{"t":"or","of":[{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},{"t":"undef"}]},true]]}},false],["places",{"t":"arr","of":{"t":"obj","n":"Place","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["results",{"t":"obj","n":"Readonly","p":[["divide",{"t":"any"},true],["merge",{"t":"any"},true],["next",{"t":"any"},true],["round",{"t":"any"},true],["offset",{"t":"any"},true],["escalate",{"t":"any"},true],["rotate",{"t":"any"},true],["fuzzy",{"t":"any"},true]]},false]]}},false]]},"opt":false}],
};
