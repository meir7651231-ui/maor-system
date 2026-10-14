// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/enginebox/goal/routeAdapter.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const nameOf = (p) => p.emoji + ' ' + p.name;
const ANCHOR = '@anchor:';
const needCode = (plug, module) => plug + '>' + module;
function routePartsFor(catalog, anchors = new Set()) {
    const modules = [...new Set(catalog.map((p) => p.module))].sort();
    return catalog.map((p) => {
        const gives = [];
        for (const g of p.gives) {
            if (!g.live)
                continue;
            gives.push(g.plug);
            for (const m of modules)
                if (m !== p.module)
                    gives.push(needCode(g.plug, m));
        }
        if (anchors.has(p.id))
            gives.push(ANCHOR + p.id);
        const needs = p.needs.filter((n) => n.live).map((n) => needCode(n.plug, p.module));
        return { id: p.id, name: p.name, gives: [...new Set(gives)], needs: [...new Set(needs)] };
    });
}
const plugOfCode = (code) => code.split('>')[0];
export function inner$routePartsFor$modules(catalog) {
    const modules = [...new Set(catalog.map((p) => p.module))].sort();
    return modules;
}
export function inner$routePartsFor$map$needs(p) {
    const needs = p.needs.filter((n) => n.live).map((n) => needCode(n.plug, p.module));
    return needs;
}
export function inner$classify$on(catalog) {
    const on = new Set(catalog.map((p) => p.id));
    return on;
}
export function inner$classify$planned(plug, catalog) {
    const planned = catalog.filter((p) => p.gives.some((g) => !g.live && g.plug === plug));
    return planned;
}
export function inner$missingOf$partNames(parts) {
    const partNames = parts.map(nameOf);
    return partNames;
}
export function inner$missingOf$line(kind, parts, label) {
    const partNames = parts.map(nameOf);
    const line = kind === 'none'
        ? `חסר מנוע שנותן ${label}`
        : kind === 'planned'
            ? `${label} עוד לא זמין · בקרוב`
            : `${label} נמצא ב-${partNames.join(' / ')}, שעוד לא הודלק אצלכם`;
    return line;
}
export function inner$missingOf$line$$step(kind, label, partNames) {
    const line = kind === 'none'
        ? `חסר מנוע שנותן ${label}`
        : kind === 'planned'
            ? `${label} עוד לא זמין · בקרוב`
            : `${label} נמצא ב-${partNames.join(' / ')}, שעוד לא הודלק אצלכם`;
    return line;
}
export function inner$anchorKeys$g(catalog, id) {
    const g = catalog.find((p) => p.id === id);
    return g;
}
export function inner$innerMissingOf$map$plug(code) {
    const plug = plugOfCode(code);
    return plug;
}
export function inner$shapeRoute$added(r) {
    const added = r.steps.map((s) => s.add);
    return added;
}
export function inner$shapeRoute$parsed(keys) {
    const parsed = keys.map((k) => {
        const [giver, plug, needer] = k.split('>');
        return { giver, plug, needer };
    });
    return parsed;
}
export function inner$shapeRoute$map$giver(k) {
    const [giver, plug, needer] = k.split('>');
    return giver;
}
export function inner$shapeRoute$map$plug(k) {
    const [giver, plug, needer] = k.split('>');
    return plug;
}
export function inner$shapeRoute$map$needer(k) {
    const [giver, plug, needer] = k.split('>');
    return needer;
}
export function inner$shapeRoute$line(p, out) {
    let line = out.length ? `הוסף את ${nameOf(p)} וחבר אותו ל-${out.join(' ול-')}` : `הוסף את ${nameOf(p)}`;
    return line;
}
export function inner$shapeRoute$sorted(keys) {
    const sorted = [...keys].sort();
    return sorted;
}
export function inner$startIdsOf$on(catalog) {
    const on = new Set(catalog.map((p) => p.id));
    return on;
}
export function inner$goalRoutes$parts(catalog, anchors) {
    const parts = routePartsFor(catalog, anchors);
    return parts;
}
export function inner$goalRoutes$goal$$after_loop(catalog, startIds, liveGoal, anchors) {
    const parts = routePartsFor(catalog, anchors);
    const goal = [...liveGoal];
    for (const id of [...anchors].sort()) {
        if (startIds.includes(id)) {
            // העוגן כבר בפנים — היעד הוא הצרכים החיים שלו.
            for (const n of parts.find((p) => p.id === id).needs)
                goal.push(n);
        }
        else
            goal.push(ANCHOR + id);
    }
    return goal;
}

export const SIGS = {
  inner$routePartsFor$modules: [{"name":"catalog","d":{"t":"arr","of":{"t":"obj","n":"Part","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"lit","v":["פרנסה׳לע","אירוח משפחתי","אורביט"]},false],["what",{"t":"str"},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["flag",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gives",{"t":"arr","of":{"t":"obj","n":"Give","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["via",{"t":"or","of":[{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},{"t":"undef"}]},true],["live",{"t":"bool"},false]]}},false],["needs",{"t":"arr","of":{"t":"obj","n":"Need","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["result",{"t":"str"},false],["at",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CodeSite","p":[["file",{"t":"str"},false],["marker",{"t":"str"},false]]}]},true],["live",{"t":"bool"},false]]}},false]]}},"opt":false}],
  inner$routePartsFor$map$needs: [{"name":"p","d":{"t":"obj","n":"Part","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"lit","v":["פרנסה׳לע","אירוח משפחתי","אורביט"]},false],["what",{"t":"str"},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["flag",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gives",{"t":"arr","of":{"t":"obj","n":"Give","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["via",{"t":"or","of":[{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},{"t":"undef"}]},true],["live",{"t":"bool"},false]]}},false],["needs",{"t":"arr","of":{"t":"obj","n":"Need","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["result",{"t":"str"},false],["at",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CodeSite","p":[["file",{"t":"str"},false],["marker",{"t":"str"},false]]}]},true],["live",{"t":"bool"},false]]}},false]]},"opt":false}],
  inner$classify$on: [{"name":"catalog","d":{"t":"arr","of":{"t":"obj","n":"Part","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"lit","v":["פרנסה׳לע","אירוח משפחתי","אורביט"]},false],["what",{"t":"str"},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["flag",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gives",{"t":"arr","of":{"t":"obj","n":"Give","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["via",{"t":"or","of":[{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},{"t":"undef"}]},true],["live",{"t":"bool"},false]]}},false],["needs",{"t":"arr","of":{"t":"obj","n":"Need","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["result",{"t":"str"},false],["at",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CodeSite","p":[["file",{"t":"str"},false],["marker",{"t":"str"},false]]}]},true],["live",{"t":"bool"},false]]}},false]]}},"opt":false}],
  inner$classify$planned: [{"name":"plug","d":{"t":"str"},"opt":false},{"name":"catalog","d":{"t":"arr","of":{"t":"obj","n":"Part","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"lit","v":["פרנסה׳לע","אירוח משפחתי","אורביט"]},false],["what",{"t":"str"},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["flag",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gives",{"t":"arr","of":{"t":"obj","n":"Give","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["via",{"t":"or","of":[{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},{"t":"undef"}]},true],["live",{"t":"bool"},false]]}},false],["needs",{"t":"arr","of":{"t":"obj","n":"Need","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["result",{"t":"str"},false],["at",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CodeSite","p":[["file",{"t":"str"},false],["marker",{"t":"str"},false]]}]},true],["live",{"t":"bool"},false]]}},false]]}},"opt":false}],
  inner$missingOf$partNames: [{"name":"parts","d":{"t":"arr","of":{"t":"obj","n":"Part","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"lit","v":["פרנסה׳לע","אירוח משפחתי","אורביט"]},false],["what",{"t":"str"},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["flag",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gives",{"t":"arr","of":{"t":"obj","n":"Give","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["via",{"t":"or","of":[{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},{"t":"undef"}]},true],["live",{"t":"bool"},false]]}},false],["needs",{"t":"arr","of":{"t":"obj","n":"Need","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["result",{"t":"str"},false],["at",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CodeSite","p":[["file",{"t":"str"},false],["marker",{"t":"str"},false]]}]},true],["live",{"t":"bool"},false]]}},false]]}},"opt":false}],
  inner$missingOf$line: [{"name":"kind","d":{"t":"lit","v":["none","off","planned"]},"opt":false},{"name":"parts","d":{"t":"arr","of":{"t":"obj","n":"Part","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"lit","v":["פרנסה׳לע","אירוח משפחתי","אורביט"]},false],["what",{"t":"str"},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["flag",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gives",{"t":"arr","of":{"t":"obj","n":"Give","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["via",{"t":"or","of":[{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},{"t":"undef"}]},true],["live",{"t":"bool"},false]]}},false],["needs",{"t":"arr","of":{"t":"obj","n":"Need","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["result",{"t":"str"},false],["at",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CodeSite","p":[["file",{"t":"str"},false],["marker",{"t":"str"},false]]}]},true],["live",{"t":"bool"},false]]}},false]]}},"opt":false},{"name":"label","d":{"t":"str"},"opt":false}],
  inner$missingOf$line$$step: [{"name":"kind","d":{"t":"lit","v":["none","off","planned"]},"opt":false},{"name":"label","d":{"t":"str"},"opt":false},{"name":"partNames","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$anchorKeys$g: [{"name":"catalog","d":{"t":"arr","of":{"t":"obj","n":"Part","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"lit","v":["פרנסה׳לע","אירוח משפחתי","אורביט"]},false],["what",{"t":"str"},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["flag",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gives",{"t":"arr","of":{"t":"obj","n":"Give","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["via",{"t":"or","of":[{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},{"t":"undef"}]},true],["live",{"t":"bool"},false]]}},false],["needs",{"t":"arr","of":{"t":"obj","n":"Need","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["result",{"t":"str"},false],["at",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CodeSite","p":[["file",{"t":"str"},false],["marker",{"t":"str"},false]]}]},true],["live",{"t":"bool"},false]]}},false]]}},"opt":false},{"name":"id","d":{"t":"str"},"opt":false}],
  inner$innerMissingOf$map$plug: [{"name":"code","d":{"t":"str"},"opt":false}],
  inner$shapeRoute$added: [{"name":"r","d":{"t":"obj","n":"Route","p":[["steps",{"t":"arr","of":{"t":"obj","n":"RouteStep","p":[["add",{"t":"str"},false],["links",{"t":"arr","of":{"t":"obj","n":"RouteLink","p":[["giver",{"t":"str"},false],["plug",{"t":"str"},false],["needer",{"t":"str"},false]]}},false]]}},false],["links",{"t":"arr","of":{"t":"obj","n":"RouteLink","p":[["giver",{"t":"str"},false],["plug",{"t":"str"},false],["needer",{"t":"str"},false]]}},false],["missing",{"t":"arr","of":{"t":"str"}},false],["addedCount",{"t":"num"},false]]},"opt":false}],
  inner$shapeRoute$parsed: [{"name":"keys","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$shapeRoute$map$giver: [{"name":"k","d":{"t":"str"},"opt":false}],
  inner$shapeRoute$map$plug: [{"name":"k","d":{"t":"str"},"opt":false}],
  inner$shapeRoute$map$needer: [{"name":"k","d":{"t":"str"},"opt":false}],
  inner$shapeRoute$line: [{"name":"p","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Part","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"lit","v":["פרנסה׳לע","אירוח משפחתי","אורביט"]},false],["what",{"t":"str"},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["flag",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gives",{"t":"arr","of":{"t":"obj","n":"Give","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["via",{"t":"or","of":[{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},{"t":"undef"}]},true],["live",{"t":"bool"},false]]}},false],["needs",{"t":"arr","of":{"t":"obj","n":"Need","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["result",{"t":"str"},false],["at",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CodeSite","p":[["file",{"t":"str"},false],["marker",{"t":"str"},false]]}]},true],["live",{"t":"bool"},false]]}},false]]}]},"opt":false},{"name":"out","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$shapeRoute$sorted: [{"name":"keys","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$startIdsOf$on: [{"name":"catalog","d":{"t":"arr","of":{"t":"obj","n":"Part","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"lit","v":["פרנסה׳לע","אירוח משפחתי","אורביט"]},false],["what",{"t":"str"},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["flag",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gives",{"t":"arr","of":{"t":"obj","n":"Give","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["via",{"t":"or","of":[{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},{"t":"undef"}]},true],["live",{"t":"bool"},false]]}},false],["needs",{"t":"arr","of":{"t":"obj","n":"Need","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["result",{"t":"str"},false],["at",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CodeSite","p":[["file",{"t":"str"},false],["marker",{"t":"str"},false]]}]},true],["live",{"t":"bool"},false]]}},false]]}},"opt":false}],
  inner$goalRoutes$parts: [{"name":"catalog","d":{"t":"arr","of":{"t":"obj","n":"Part","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"lit","v":["פרנסה׳לע","אירוח משפחתי","אורביט"]},false],["what",{"t":"str"},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["flag",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gives",{"t":"arr","of":{"t":"obj","n":"Give","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["via",{"t":"or","of":[{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},{"t":"undef"}]},true],["live",{"t":"bool"},false]]}},false],["needs",{"t":"arr","of":{"t":"obj","n":"Need","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["result",{"t":"str"},false],["at",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CodeSite","p":[["file",{"t":"str"},false],["marker",{"t":"str"},false]]}]},true],["live",{"t":"bool"},false]]}},false]]}},"opt":false},{"name":"anchors","d":{"t":"set","of":{"t":"str"}},"opt":false}],
  inner$goalRoutes$goal$$after_loop: [{"name":"catalog","d":{"t":"arr","of":{"t":"obj","n":"Part","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"lit","v":["פרנסה׳לע","אירוח משפחתי","אורביט"]},false],["what",{"t":"str"},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["flag",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gives",{"t":"arr","of":{"t":"obj","n":"Give","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["via",{"t":"or","of":[{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},{"t":"undef"}]},true],["live",{"t":"bool"},false]]}},false],["needs",{"t":"arr","of":{"t":"obj","n":"Need","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["result",{"t":"str"},false],["at",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CodeSite","p":[["file",{"t":"str"},false],["marker",{"t":"str"},false]]}]},true],["live",{"t":"bool"},false]]}},false]]}},"opt":false},{"name":"startIds","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"liveGoal","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"anchors","d":{"t":"set","of":{"t":"str"}},"opt":false}],
};
