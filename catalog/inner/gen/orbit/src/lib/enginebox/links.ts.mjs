// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/enginebox/links.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function linkKey(giver, plug, needer) {
    return giver + '>' + plug + '>' + needer;
}
export function inner$parseLink$giver(key) {
    const [giver, plug, needer] = key.split('>');
    return giver;
}
export function inner$parseLink$plug(key) {
    const [giver, plug, needer] = key.split('>');
    return plug;
}
export function inner$parseLink$needer(key) {
    const [giver, plug, needer] = key.split('>');
    return needer;
}
export function inner$computeValid$out$$after_loop(PARTS) {
    const out = [];
    for (const g of PARTS) {
        for (const give of g.gives) {
            if (!give.live)
                continue;
            for (const n of PARTS) {
                if (n.module === g.module)
                    continue;
                for (const need of n.needs) {
                    if (need.live && need.plug === give.plug)
                        out.push(linkKey(g.id, give.plug, n.id));
                }
            }
        }
    }
    return out;
}

export const SIGS = {
  inner$parseLink$giver: [{"name":"key","d":{"t":"str"},"opt":false}],
  inner$parseLink$plug: [{"name":"key","d":{"t":"str"},"opt":false}],
  inner$parseLink$needer: [{"name":"key","d":{"t":"str"},"opt":false}],
  inner$computeValid$out$$after_loop: [{"name":"PARTS","d":{"t":"arr","of":{"t":"obj","n":"Part","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"lit","v":["פרנסה׳לע","אירוח משפחתי","אורביט"]},false],["what",{"t":"str"},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["flag",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gives",{"t":"arr","of":{"t":"obj","n":"Give","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["via",{"t":"or","of":[{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},{"t":"undef"}]},true],["live",{"t":"bool"},false]]}},false],["needs",{"t":"arr","of":{"t":"obj","n":"Need","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["result",{"t":"str"},false],["at",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CodeSite","p":[["file",{"t":"str"},false],["marker",{"t":"str"},false]]}]},true],["live",{"t":"bool"},false]]}},false]]}},"opt":false}],
};
