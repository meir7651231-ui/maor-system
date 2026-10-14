// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/phoneSim.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function simNode(menu, st) {
    const last = st.trail[st.trail.length - 1];
    if (!last)
        return null;
    return Object.hasOwn(menu.nodes, last.node.id) ? menu.nodes[last.node.id] : last.node;
}
export function inner$simStart$root(menu) {
    const root = Object.hasOwn(menu.nodes, menu.root) ? menu.nodes[menu.root] : undefined;
    return root;
}
export function inner$simNode$last(st) {
    const last = st.trail[st.trail.length - 1];
    return last;
}
export function inner$simPress$node(menu, st) {
    const node = simNode(menu, st);
    return node;
}
export function inner$simSay$node(menu, st) {
    const node = simNode(menu, st);
    return node;
}
export function inner$hebrewVoice$list(voices) {
    const list = Array.isArray(voices) ? voices : [];
    return list;
}
export function inner$hebrewVoice$he(voices) {
    const list = Array.isArray(voices) ? voices : [];
    const he = list.filter((v) => /^(he|iw)(?:[-_]|$)/i.test(String(v?.lang ?? '')));
    return he;
}
export function inner$hebrewVoice$he$$step(list) {
    const he = list.filter((v) => /^(he|iw)(?:[-_]|$)/i.test(String(v?.lang ?? '')));
    return he;
}

export const SIGS = {
  inner$simStart$root: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false}],
  inner$simNode$last: [{"name":"st","d":{"t":"obj","n":"PhoneSimState","p":[["trail",{"t":"arr","of":{"t":"obj","n":"PhoneSimStep","p":[["node",{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]},false],["via",{"t":"str"},false]]}},false],["buf",{"t":"str"},false]]},"opt":false}],
  inner$simPress$node: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false},{"name":"st","d":{"t":"obj","n":"PhoneSimState","p":[["trail",{"t":"arr","of":{"t":"obj","n":"PhoneSimStep","p":[["node",{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]},false],["via",{"t":"str"},false]]}},false],["buf",{"t":"str"},false]]},"opt":false}],
  inner$simSay$node: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false},{"name":"st","d":{"t":"obj","n":"PhoneSimState","p":[["trail",{"t":"arr","of":{"t":"obj","n":"PhoneSimStep","p":[["node",{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]},false],["via",{"t":"str"},false]]}},false],["buf",{"t":"str"},false]]},"opt":false}],
  inner$hebrewVoice$list: [{"name":"voices","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"arr","of":{"t":"tp","id":"T","of":{"t":"obj","p":[["lang",{"t":"str"},false]]}}}]},"opt":false}],
  inner$hebrewVoice$he: [{"name":"voices","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"arr","of":{"t":"tp","id":"T","of":{"t":"obj","p":[["lang",{"t":"str"},false]]}}}]},"opt":false}],
  inner$hebrewVoice$he$$step: [{"name":"list","d":{"t":"arr","of":{"t":"tp","id":"T","of":{"t":"obj","p":[["lang",{"t":"str"},false]]}}},"opt":false}],
};
