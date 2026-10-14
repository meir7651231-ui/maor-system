// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/requests.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const HE_END = '(?![א-ת])';
const PN_OCCASIONS = [
    {
        k: 'בר מצווה',
        re: /בר[ -]?מצו?וה|הנחת תפילין/,
        need: [['צלם', /צל(ם|ום)|וידאו/], ['קייטרינג', /קייטרינג|מגשי/], ['אולם', /אולם/], ['תפילין', /תפילין|סת["״]ם/], ['מלמד לדרשה', /מלמד|דרשה/], ['חליפה וכובע', /חליפ|חייט|כובע/], ['עוגות ומגשים', /עוג|מאפ|חלות/], ['תזמורת', /תזמורת|זמר|מוזיק|נגן/], ['הסעות', /הסע|אוטובוס|מיניבוס/], ['הזמנות', /הזמנ|דפוס|גרפי/]],
    },
    {
        k: 'חתונה',
        re: /חתונה|חתן|כלה|אירוסין|ווארט|וורט|תנאים|שבע ברכות|שידוך/,
        need: [['אולם', /אולם/], ['קייטרינג', /קייטרינג|מגשי/], ['צלם', /צל(ם|ום)|וידאו/], ['תזמורת', /תזמורת|זמר|מוזיק/], ['פאות', new RegExp('פא(ה|ות)' + HE_END + '|פאנית')], ['שמלה', /שמל|תפיר|אופנ/], ['תכשיטים', /תכשיט|צורף|שעונ/], ['תפילין', /תפילין|סת["״]ם/], ['דירה', /תיווך|נדל|דירות להשכרה/], ['הובלה', /הובל/], ['ריהוט ושיפוץ', /שיפוץ|ריהוט|נגר/], ['הזמנות', /הזמנ|דפוס|גרפי/]],
    },
    {
        k: 'ברית ולידה',
        re: /ברית|לידה|נולד|שלום זכר|קידוש לבת|יולדת|תינוק|פדיון הבן/,
        need: [['מוהל', /מוהל/], ['קייטרינג', /קייטרינג|מגשי/], ['צלם', /צל(ם|ום)/], ['עוגות ומגשים', /עוג|מאפ|חלות/], ['ארוחות ליולדת', /ארוח|משלוח|אוכל/], ['ניקיון ועזרה בבית', /ניקיון|עוזרת/], ['ציוד לתינוק', /תינוק|עגל|לול/]],
    },
    {
        k: 'מעבר דירה',
        re: /מעבר דירה|לעבור דירה|עוברים דירה|דירה חדשה|הובל|מקרר|מכונת כביסה/,
        need: [['הובלה', /הובל/], ['ניקיון', /ניקיון/], ['שיפוצים', /שיפוץ|טיח|ריצוף|צבע/], ['חשמלאי', /חשמל/], ['אינסטלטור', /אינסטל|נזיל|סתימ/], ['מזגנים', /מזגן|מיזוג/], ['מזוזות', /מזוז|סת["״]ם/], ['תיווך', /תיווך|נדל/]],
    },
    {
        k: 'שיפוץ',
        re: /שיפוץ|ריצוף|טיח|מטבח חדש|בנייה|הרחבה|צביעה/,
        need: [['חשמלאי', /חשמל/], ['אינסטלטור', /אינסטל|נזיל|סתימ/], ['מזגנים', /מזגן|מיזוג/], ['ניקיון אחרי שיפוץ', /ניקיון/], ['הובלה ופינוי', /הובל/], ['מזוזות', /מזוז|סת["״]ם/]],
    },
    {
        k: 'תקלה בבית',
        re: /נזיל|סתימ|דוד|צנרת|אינסטל|קצר|חשמל|מזגן/,
        need: [['אינסטלטור', /אינסטל|נזיל|סתימ/], ['חשמלאי', /חשמל/], ['מזגנים', /מזגן|מיזוג/], ['שיפוצים (תיקון אחרי)', /שיפוץ|טיח|ריצוף/], ['ניקיון', /ניקיון/]],
    },
    {
        k: 'לימודים',
        re: /מלמד|שיעור|גמרא|משניות|מבחן|חיזוק|חברותא|ישיבה|תלמוד תורה/,
        need: [['מלמד', /מלמד|שיעור|גמרא/], ['ספרים', /ספר|יודאיק/], ['הסעות', /הסע|מיניבוס/], ['אבחון וליווי', /אבחון|ייעוץ|טיפול/]],
    },
    {
        k: 'שבת וחג',
        re: /שבת|פסח|סוכות|סוכה|חנוכה|פורים|משלוח מנות|ראש השנה|יום טוב/,
        need: [['חלות ועוגות', /חלות|עוג|מאפ/], ['קייטרינג', /קייטרינג|מגשי/], ['ניקיון', /ניקיון/], ['סוכות וסכך', /סוכ|סכך/], ['יודאיקה', /יודאיק|סת["״]ם|ספר/], ['משלוחים', /משלוח/]],
    },
    {
        k: 'אבלות',
        re: /שבעה|אבל|לוויה|נפטר|יארצייט|יאָרצייט|מצבה|קדיש/,
        need: [['אוכל לבית האבל', /קייטרינג|ארוח|משלוח|אוכל/], ['הסעות', /הסע|מיניבוס/], ['מצבה', /מצב/], ['אומרים קדיש ומשניות', /מלמד|שיעור|משניות/], ['ניקיון', /ניקיון/]],
    },
];
function entText(l) {
    return [l.title, l.name, l.desc, l.tagline ?? '', ...(Array.isArray(l.services) ? l.services.map((s) => s.name) : [])].join(' ');
}
export function inner$relatedFor$t(text) {
    const t = String(text ?? '');
    return t;
}
export function inner$relatedFor$o(text) {
    const t = String(text ?? '');
    const o = PN_OCCASIONS.find((x) => x.re.test(t));
    return o;
}
export function inner$relatedFor$o$$step(t) {
    const o = PN_OCCASIONS.find((x) => x.re.test(t));
    return o;
}
export function inner$relatedFor$all(listings) {
    const all = listings.filter((l) => l.status === 'approved');
    return all;
}
export function inner$relatedFor$who(listings, used, re) {
    const all = listings.filter((l) => l.status === 'approved');
    const who = all.filter((e) => !used.has(e.id) && re.test(entText(e))).slice(0, 2);
    return who;
}
export function inner$relatedFor$who$$step(all, used, re) {
    const who = all.filter((e) => !used.has(e.id) && re.test(entText(e))).slice(0, 2);
    return who;
}
export function inner$boardRequests$rs(requests, filter) {
    const rs = filter === 'open' ? requests.filter((r) => r.status !== 'closed') : filter === 'jobs' ? requests.filter((r) => r.job && r.status !== 'closed') : requests.slice();
    return rs;
}
export function inner$boardRequests$t$x(r) {
    const x = Date.parse(r.createdAt);
    return x;
}
export function inner$reqDateText$ms(createdAt) {
    const ms = Date.parse(String(createdAt ?? ''));
    return ms;
}

export const SIGS = {
  inner$relatedFor$t: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$relatedFor$o: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$relatedFor$o$$step: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$relatedFor$all: [{"name":"listings","d":{"t":"arr","of":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$relatedFor$who: [{"name":"listings","d":{"t":"arr","of":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"used","d":{"t":"set","of":{"t":"str"}},"opt":false},{"name":"re","d":{"t":"any"},"opt":false}],
  inner$relatedFor$who$$step: [{"name":"all","d":{"t":"arr","of":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"used","d":{"t":"set","of":{"t":"str"}},"opt":false},{"name":"re","d":{"t":"any"},"opt":false}],
  inner$boardRequests$rs: [{"name":"requests","d":{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[["id",{"t":"str"},false],["text",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["urgent",{"t":"bool"},false],["quiet",{"t":"bool"},false],["job",{"t":"bool"},false],["requester",{"t":"obj","n":"PrRequester","p":[["name",{"t":"str"},false],["phone",{"t":"str"},false]]},false],["status",{"t":"lit","v":["open","answered","closed"]},false],["responses",{"t":"arr","of":{"t":"obj","n":"PrResponse","p":[["listingId",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["closedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}},"opt":false},{"name":"filter","d":{"t":"lit","v":["all","open","jobs"]},"opt":false}],
  inner$boardRequests$t$x: [{"name":"r","d":{"t":"obj","n":"PrRequest","p":[["id",{"t":"str"},false],["text",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["urgent",{"t":"bool"},false],["quiet",{"t":"bool"},false],["job",{"t":"bool"},false],["requester",{"t":"obj","n":"PrRequester","p":[["name",{"t":"str"},false],["phone",{"t":"str"},false]]},false],["status",{"t":"lit","v":["open","answered","closed"]},false],["responses",{"t":"arr","of":{"t":"obj","n":"PrResponse","p":[["listingId",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["closedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$reqDateText$ms: [{"name":"createdAt","d":{"t":"str"},"opt":false}],
};
