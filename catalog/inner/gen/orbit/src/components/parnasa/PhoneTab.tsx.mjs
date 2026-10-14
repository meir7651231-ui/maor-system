// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/PhoneTab.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$PhoneTab$hebDateGreeting(lineIds) {
    const hebDateGreeting = lineIds.includes('calendar.dayInfo');
    return hebDateGreeting;
}
export function inner$PhoneTab$rootKey(mode, menu) {
    const rootKey = mode + '|' + menu.root;
    return rootKey;
}
export function inner$PhoneTab$nodes(menu) {
    const nodes = Object.values(menu.nodes);
    return nodes;
}
export function inner$PhoneTab$bizCount(menu) {
    const nodes = Object.values(menu.nodes);
    const bizCount = nodes.filter((n) => n.kind === 'listing').length;
    return bizCount;
}
export function inner$PhoneTab$bizCount$$step(nodes) {
    const bizCount = nodes.filter((n) => n.kind === 'listing').length;
    return bizCount;
}
export function inner$PhoneTab$say$t(said) {
    const t = said.trim();
    return t;
}

export const SIGS = {
  inner$PhoneTab$hebDateGreeting: [{"name":"lineIds","d":{"t":"arr","of":{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]}},"opt":false}],
  inner$PhoneTab$rootKey: [{"name":"mode","d":{"t":"lit","v":["shabbat","now","weekday"]},"opt":false},{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false}],
  inner$PhoneTab$nodes: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false}],
  inner$PhoneTab$bizCount: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false}],
  inner$PhoneTab$bizCount$$step: [{"name":"nodes","d":{"t":"arr","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},"opt":false}],
  inner$PhoneTab$say$t: [{"name":"said","d":{"t":"str"},"opt":false}],
};
