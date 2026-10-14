// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/enginebox/source.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$engineRequestLine$t(text) {
    const t = String(text ?? '').replace(/\s+/g, ' ').trim();
    return t;
}
export function inner$engineRequestLine$clip(text) {
    const t = String(text ?? '').replace(/\s+/g, ' ').trim();
    const clip = t.length > 120 ? t.slice(0, 119) + '…' : t;
    return clip;
}
export function inner$engineRequestLine$clip$$step(t) {
    const clip = t.length > 120 ? t.slice(0, 119) + '…' : t;
    return clip;
}
export function inner$engineBoxSource$inBox(catalog) {
    const inBox = new Set(catalog.map((p) => p.id));
    return inBox;
}

export const SIGS = {
  inner$engineRequestLine$t: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$engineRequestLine$clip: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$engineRequestLine$clip$$step: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$engineBoxSource$inBox: [{"name":"catalog","d":{"t":"arr","of":{"t":"obj","n":"Part","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"lit","v":["פרנסה׳לע","אירוח משפחתי","אורביט"]},false],["what",{"t":"str"},false],["module",{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},false],["flag",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gives",{"t":"arr","of":{"t":"obj","n":"Give","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["via",{"t":"or","of":[{"t":"lit","v":["hosting.today","hosting.availability","parnasa.findPro","parnasa.shabbat","parnasa.minyanim","parnasa.emergency","calendar.dayInfo"]},{"t":"undef"}]},true],["live",{"t":"bool"},false]]}},false],["needs",{"t":"arr","of":{"t":"obj","n":"Need","p":[["plug",{"t":"lit","v":["reminder","emergency","times.shabbat","times.prayers","times.blocked","pro.match","availability","booking","request.text","message.text","voice.menu","print.page","date.hebrew","payment.link","person","day.summary"]},false],["label",{"t":"str"},false],["result",{"t":"str"},false],["at",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"CodeSite","p":[["file",{"t":"str"},false],["marker",{"t":"str"},false]]}]},true],["live",{"t":"bool"},false]]}},false]]}},"opt":false}],
};
