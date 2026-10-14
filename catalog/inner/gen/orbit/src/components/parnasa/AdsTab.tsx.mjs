// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/AdsTab.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$CountUp$useEffect$to(props) {
    const to = Math.round(props.n);
    return to;
}
export function inner$CountUp$useEffect$step$k(t0, t) {
    const k = Math.min(1, (t - t0) / 1000);
    return k;
}
export function inner$RevPanel$paidN(R) {
    const paidN = R.ads.filter((a) => a.paid).length;
    return paidN;
}
export function inner$RevPanel$mx(R) {
    const mx = Math.max(R.featSum, R.spSum, R.dedSum, 1);
    return mx;
}
export function inner$SponPanel$map$n(counts, c) {
    const n = counts.get(c.key) ?? 0;
    return n;
}
export function inner$BookletAdsPanel$all(ads, order) {
    const all = ads
        .filter((a) => a.slot === 'booklet')
        .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.advertiser.localeCompare(b.advertiser, 'he') || a.id.localeCompare(b.id));
    return all;
}
export function inner$BookletAdsPanel$sum(live) {
    const sum = live.reduce((t, a) => t + (a.price > 0 ? a.price : 0), 0);
    return sum;
}
export function inner$BookletAdsPanel$paid(live) {
    const paid = live.filter((a) => a.paid).reduce((t, a) => t + (a.price > 0 ? a.price : 0), 0);
    return paid;
}
export function inner$BookletAdsPanel$due(live) {
    const sum = live.reduce((t, a) => t + (a.price > 0 ? a.price : 0), 0);
    const paid = live.filter((a) => a.paid).reduce((t, a) => t + (a.price > 0 ? a.price : 0), 0);
    const due = sum - paid;
    return due;
}
export function inner$BookletAdsPanel$due$$step(sum, paid) {
    const due = sum - paid;
    return due;
}
export function inner$BookletAdsPanel$unpaid(live) {
    const unpaid = live.filter((a) => !a.paid).length;
    return unpaid;
}
export function inner$BookletAdsPanel$pct(live) {
    const sum = live.reduce((t, a) => t + (a.price > 0 ? a.price : 0), 0);
    const paid = live.filter((a) => a.paid).reduce((t, a) => t + (a.price > 0 ? a.price : 0), 0);
    const pct = sum ? Math.round((paid / sum) * 100) : 0;
    return pct;
}
export function inner$BookletAdsPanel$pct$$step(sum, paid) {
    const pct = sum ? Math.round((paid / sum) * 100) : 0;
    return pct;
}
export function inner$BookletAdsPanel$editing(ads, editId) {
    const editing = editId ? (ads.find((a) => a.id === editId) ?? null) : null;
    return editing;
}

export const SIGS = {
  inner$CountUp$useEffect$to: [{"name":"props","d":{"t":"obj","p":[["n",{"t":"num"},false],["fmt",{"t":"fn"},false]]},"opt":false}],
  inner$CountUp$useEffect$step$k: [{"name":"t0","d":{"t":"num"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false}],
  inner$RevPanel$paidN: [{"name":"R","d":{"t":"obj","n":"PnRevenue","p":[["feats",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["featAct",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["featSum",{"t":"num"},false],["spons",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["spSum",{"t":"num"},false],["gatesOn",{"t":"num"},false],["homeOn",{"t":"bool"},false],["coinOn",{"t":"bool"},false],["ded",{"t":"bool"},false],["dedSum",{"t":"num"},false],["jobs",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["jobSum",{"t":"num"},false],["ads",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["adSum",{"t":"num"},false],["adPaid",{"t":"num"},false],["adDue",{"t":"num"},false],["due",{"t":"num"},false],["monthly",{"t":"num"},false],["year",{"t":"num"},false]]},"opt":false}],
  inner$RevPanel$mx: [{"name":"R","d":{"t":"obj","n":"PnRevenue","p":[["feats",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["featAct",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["featSum",{"t":"num"},false],["spons",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["spSum",{"t":"num"},false],["gatesOn",{"t":"num"},false],["homeOn",{"t":"bool"},false],["coinOn",{"t":"bool"},false],["ded",{"t":"bool"},false],["dedSum",{"t":"num"},false],["jobs",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["jobSum",{"t":"num"},false],["ads",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["adSum",{"t":"num"},false],["adPaid",{"t":"num"},false],["adDue",{"t":"num"},false],["due",{"t":"num"},false],["monthly",{"t":"num"},false],["year",{"t":"num"},false]]},"opt":false}],
  inner$SponPanel$map$n: [{"name":"counts","d":{"t":"map","k":{"t":"str"},"v":{"t":"num"}},"opt":false},{"name":"c","d":{"t":"obj","n":"PrCategory","p":[["key",{"t":"lit","v":["home","events","health","build","elec","car","fin","tech","edu","stam","fashion","food","realestate","trade","other"]},false],["name",{"t":"str"},false],["short",{"t":"str"},false],["icon",{"t":"str"},false],["color",{"t":"str"},false],["num",{"t":"str"},false]]},"opt":false}],
  inner$BookletAdsPanel$all: [{"name":"ads","d":{"t":"arr","of":{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"order","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$BookletAdsPanel$sum: [{"name":"live","d":{"t":"arr","of":{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false}],
  inner$BookletAdsPanel$paid: [{"name":"live","d":{"t":"arr","of":{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false}],
  inner$BookletAdsPanel$due: [{"name":"live","d":{"t":"arr","of":{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false}],
  inner$BookletAdsPanel$due$$step: [{"name":"sum","d":{"t":"num"},"opt":false},{"name":"paid","d":{"t":"num"},"opt":false}],
  inner$BookletAdsPanel$unpaid: [{"name":"live","d":{"t":"arr","of":{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false}],
  inner$BookletAdsPanel$pct: [{"name":"live","d":{"t":"arr","of":{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false}],
  inner$BookletAdsPanel$pct$$step: [{"name":"sum","d":{"t":"num"},"opt":false},{"name":"paid","d":{"t":"num"},"opt":false}],
  inner$BookletAdsPanel$editing: [{"name":"ads","d":{"t":"arr","of":{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"editId","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
};
