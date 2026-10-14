// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/AdForm.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function emptyPrAd(slot = 'booklet') {
    return {
        id: '', slot, kind: slot === 'booklet' ? 'half' : 'line', target: '', advertiser: '', headline: '', body: '', phone: '', from: '', to: '',
        price: 0, paid: false, paidAt: '', active: true, createdAt: '', updatedAt: '',
    };
}
const num = (t) => {
    const n = Number(String(t).trim());
    return Number.isFinite(n) && n >= 0 ? n : 0;
};
export function inner$num$n(t) {
    const n = Number(String(t).trim());
    return n;
}
export function inner$dmy$m(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    return m;
}
export function inner$FeaturedForm$fill$l(listings, key) {
    const l = listings.find((x) => x.id === key);
    return l;
}
export function inner$FeaturedForm$opts(listings) {
    const opts = listings.filter((l) => l.status !== 'rejected').sort((a, b) => a.name.localeCompare(b.name, 'he'));
    return opts;
}
export function inner$FeaturedForm$cur(listings, f) {
    const cur = listings.find((l) => l.id === f.key) ?? null;
    return cur;
}
export function inner$FeaturedForm$submit$next(f, cur, PR_FEATURED_OPEN) {
    const next = {
        ...cur,
        featuredUntil: f.until || PR_FEATURED_OPEN,
        promoPrice: num(f.price),
        promoLine: f.tag.trim() || undefined,
        promoUrl: f.url.trim() || undefined,
        promoNote: f.note.trim() || undefined,
    };
    return next;
}
export function inner$SpForm$isCoin(props) {
    const isCoin = props.place === 'coin';
    return isCoin;
}
export function inner$SpForm$isHome(props) {
    const isHome = props.place === 'home';
    return isHome;
}
export function inner$SpForm$submit$draft(props, isCoin, isHome, base, f) {
    const draft = {
        ...(base ?? emptyPrAd(isHome ? 'board' : 'category')),
        slot: isHome ? 'board' : 'category',
        kind: 'line',
        target: isHome ? '' : isCoin ? f.cat : props.place,
        advertiser: f.name.trim(),
        headline: f.line.trim(),
        phone: f.phone.trim(),
        url: f.url.trim() || undefined,
        coin: isCoin ? true : undefined,
        mono: isCoin && f.mono.trim() ? [...f.mono.trim()].slice(0, 3).join('') : undefined,
        price: num(f.price),
        from: f.from,
        to: f.to,
        paid: f.paid,
    };
    return draft;
}
export function inner$AdForm$init$kind(base) {
    const kind = base && (base.kind === 'full' || base.kind === 'small') ? base.kind : 'half';
    return kind;
}
export function inner$AdForm$submit$draft(base, f) {
    const draft = {
        ...(base ?? emptyPrAd('booklet')),
        slot: 'booklet',
        kind: f.size,
        advertiser: f.who.trim(),
        headline: f.head.trim(),
        body: f.body.trim(),
        phone: f.phone.trim(),
        price: num(f.price),
        paid: f.paid,
        from: f.from,
        to: f.to,
        active: f.active,
    };
    return draft;
}

export const SIGS = {
  inner$num$n: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$dmy$m: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$FeaturedForm$fill$l: [{"name":"listings","d":{"t":"arr","of":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"key","d":{"t":"str"},"opt":false}],
  inner$FeaturedForm$opts: [{"name":"listings","d":{"t":"arr","of":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$FeaturedForm$cur: [{"name":"listings","d":{"t":"arr","of":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"f","d":{"t":"obj","n":"FtState","p":[["key",{"t":"str"},false],["price",{"t":"str"},false],["touched",{"t":"bool"},false],["tag",{"t":"str"},false],["url",{"t":"str"},false],["until",{"t":"str"},false],["note",{"t":"str"},false]]},"opt":false}],
  inner$FeaturedForm$submit$next: [{"name":"f","d":{"t":"obj","n":"FtState","p":[["key",{"t":"str"},false],["price",{"t":"str"},false],["touched",{"t":"bool"},false],["tag",{"t":"str"},false],["url",{"t":"str"},false],["until",{"t":"str"},false],["note",{"t":"str"},false]]},"opt":false},{"name":"cur","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false},{"name":"PR_FEATURED_OPEN","d":{"t":"str"},"opt":false}],
  inner$SpForm$isCoin: [{"name":"props","d":{"t":"obj","p":[["place",{"t":"str"},false],["ad",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}]},false],["onClose",{"t":"fn"},false],["onQueue",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true]]},"opt":false}],
  inner$SpForm$isHome: [{"name":"props","d":{"t":"obj","p":[["place",{"t":"str"},false],["ad",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}]},false],["onClose",{"t":"fn"},false],["onQueue",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true]]},"opt":false}],
  inner$SpForm$submit$draft: [{"name":"props","d":{"t":"obj","p":[["place",{"t":"str"},false],["ad",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}]},false],["onClose",{"t":"fn"},false],["onQueue",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true]]},"opt":false},{"name":"isCoin","d":{"t":"bool"},"opt":false},{"name":"isHome","d":{"t":"bool"},"opt":false},{"name":"base","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}]},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["line",{"t":"str"},false],["phone",{"t":"str"},false],["url",{"t":"str"},false],["cat",{"t":"str"},false],["mono",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["paid",{"t":"bool"},false]]},"opt":false}],
  inner$AdForm$init$kind: [{"name":"base","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}]},"opt":false}],
  inner$AdForm$submit$draft: [{"name":"base","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}]},"opt":false},{"name":"f","d":{"t":"obj","p":[["who",{"t":"str"},false],["size",{"t":"lit","v":["small","full","half"]},false],["head",{"t":"str"},false],["phone",{"t":"str"},false],["body",{"t":"str"},false],["price",{"t":"str"},false],["touched",{"t":"bool"},false],["paid",{"t":"bool"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["active",{"t":"bool"},false]]},"opt":false}],
};
