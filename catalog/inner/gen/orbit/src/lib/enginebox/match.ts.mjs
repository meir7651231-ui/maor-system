// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/enginebox/match.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$pairs$out$$after_loop(givers, needers, side) {
    const out = [];
    for (const g of givers) {
        for (const n of needers) {
            if (g.id === n.id || g.module === n.module)
                continue;
            for (const give of g.gives) {
                for (const need of n.needs) {
                    if (give.plug !== need.plug)
                        continue;
                    out.push({ g, n, plug: give.plug, gives: give.label, result: need.result, side, giveLive: give.live, needLive: need.live });
                }
            }
        }
    }
    return out;
}

export const SIGS = {
  inner$pairs$out$$after_loop: [{"name":"givers","d":{"t":"arr","of":{"t":"obj","n":"Part","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"lit","v":["פרנסה׳לע","אירוח משפחתי","אורביט"]},false],["what",{"t":"str"},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["flag",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gives",{"t":"arr","of":{"t":"obj","n":"Give","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["via",{"t":"or","of":[{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},{"t":"undef"}]},true],["live",{"t":"bool"},false]]}},false],["needs",{"t":"arr","of":{"t":"obj","n":"Need","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["result",{"t":"str"},false],["at",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CodeSite","p":[["file",{"t":"str"},false],["marker",{"t":"str"},false]]}]},true],["live",{"t":"bool"},false]]}},false]]}},"opt":false},{"name":"needers","d":{"t":"arr","of":{"t":"obj","n":"Part","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"lit","v":["פרנסה׳לע","אירוח משפחתי","אורביט"]},false],["what",{"t":"str"},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["flag",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gives",{"t":"arr","of":{"t":"obj","n":"Give","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["via",{"t":"or","of":[{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},{"t":"undef"}]},true],["live",{"t":"bool"},false]]}},false],["needs",{"t":"arr","of":{"t":"obj","n":"Need","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["result",{"t":"str"},false],["at",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CodeSite","p":[["file",{"t":"str"},false],["marker",{"t":"str"},false]]}]},true],["live",{"t":"bool"},false]]}},false]]}},"opt":false},{"name":"side","d":{"t":"lit","v":["from","into"]},"opt":false}],
};
