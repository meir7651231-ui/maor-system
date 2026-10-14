// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/model.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function listingImageLen(l) {
    return (typeof l.logo === 'string' ? l.logo.length : 0) + (Array.isArray(l.photos) ? l.photos.reduce((a, p) => a + (typeof p === 'string' ? p.length : 0), 0) : 0);
}
function inRange(v, min, max) {
    return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : undefined;
}
export function inner$fixOpt$k(f) {
    const k = f.slice(0, -2);
    return k;
}
export function inner$docBytes$j(o) {
    const j = JSON.stringify(o) ?? '';
    return j;
}
export function inner$healParnasaPrefs$n(z, k) {
    const n = inRange(z[k], 0, 120);
    return n;
}
export function inner$orgImageLen$n$$after_loop(listings, exceptId) {
    let n = 0;
    for (const l of listings)
        if (l.id !== exceptId)
            n += listingImageLen(l);
    return n;
}

export const SIGS = {
  inner$fixOpt$k: [{"name":"f","d":{"t":"str"},"opt":false}],
  inner$docBytes$j: [{"name":"o","d":{"t":"any"},"opt":false}],
  inner$healParnasaPrefs$n: [{"name":"z","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"k","d":{"t":"str"},"opt":false}],
  inner$orgImageLen$n$$after_loop: [{"name":"listings","d":{"t":"arr","of":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"exceptId","d":{"t":"str"},"opt":false}],
};
