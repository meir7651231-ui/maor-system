// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/editor.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const DN = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'מוצ״ש'];
const hasSched = (d) => d.always === true || d.hours.length > 0;
const n = (xs) => (Array.isArray(xs) ? xs.length : 0);
export function inner$completeness$items(d) {
    const items = [
        [20, !!(d.name.trim() && d.title.trim() && d.category && d.phone.trim()), 'basic', 'שם, מקצוע וטלפון'],
        [12, d.desc.trim().length >= 60, 'basic', 'ספרו על העסק'],
        [6, !!(d.tagline ?? '').trim(), 'basic', 'משפט מפתח'],
        [10, !!d.logo, 'design', 'העלו לוגו'],
        [4, !!d.palette, 'design', 'בחרו צבע לדף'],
        [15, d.services.length >= 2, 'svc', 'הוסיפו מחירון'],
        [12, n(d.photos) >= 1, 'photos', 'הוסיפו תמונות'],
        [8, hasSched(d), 'hours', 'הגדירו שעות'],
        [5, n(d.faq) >= 1, 'faq', 'שאלות נפוצות'],
        [4, n(d.pay) >= 1, 'pay', 'אמצעי תשלום'],
        [4, !!(d.city.trim() || d.area.trim()), 'basic', 'אזור שירות'],
    ];
    return items;
}
export function inner$hoursSum$keys(d) {
    const keys = new Set(d.hours.map((h) => h.from + '-' + h.to));
    return keys;
}
export function inner$hoursSum$days(d) {
    const days = [...new Set(d.hours.map((x) => x.dow))].sort((a, b) => a - b).map((x) => DN[x] ?? '');
    return days;
}
export function inner$schedOf$wk(hours) {
    const wk = hours.filter((h) => h.dow >= 0 && h.dow <= 5);
    return wk;
}
export function inner$schedOf$from(hours) {
    const wk = hours.filter((h) => h.dow >= 0 && h.dow <= 5);
    const count = new Map();
    for (const h of wk)
        count.set(h.from + '|' + h.to, (count.get(h.from + '|' + h.to) ?? 0) + 1);
    let best = '';
    let n = 0;
    for (const [k, c] of count)
        if (c > n)
            [best, n] = [k, c];
    const [from, to] = best.split('|');
    return from;
}
export function inner$schedOf$from$$step(best) {
    const [from, to] = best.split('|');
    return from;
}
export function inner$schedOf$to(hours) {
    const wk = hours.filter((h) => h.dow >= 0 && h.dow <= 5);
    const count = new Map();
    for (const h of wk)
        count.set(h.from + '|' + h.to, (count.get(h.from + '|' + h.to) ?? 0) + 1);
    let best = '';
    let n = 0;
    for (const [k, c] of count)
        if (c > n)
            [best, n] = [k, c];
    const [from, to] = best.split('|');
    return to;
}
export function inner$schedOf$to$$step(best) {
    const [from, to] = best.split('|');
    return to;
}
export function inner$schedOf$count$$after_loop(hours) {
    const wk = hours.filter((h) => h.dow >= 0 && h.dow <= 5);
    const count = new Map();
    for (const h of wk)
        count.set(h.from + '|' + h.to, (count.get(h.from + '|' + h.to) ?? 0) + 1);
    return count;
}
export function inner$schedOf$best$$after_loop(hours) {
    const wk = hours.filter((h) => h.dow >= 0 && h.dow <= 5);
    const count = new Map();
    for (const h of wk)
        count.set(h.from + '|' + h.to, (count.get(h.from + '|' + h.to) ?? 0) + 1);
    let best = '';
    let n = 0;
    for (const [k, c] of count)
        if (c > n)
            [best, n] = [k, c];
    return best;
}
export function inner$schedOf$n$$after_loop(hours) {
    const wk = hours.filter((h) => h.dow >= 0 && h.dow <= 5);
    const count = new Map();
    for (const h of wk)
        count.set(h.from + '|' + h.to, (count.get(h.from + '|' + h.to) ?? 0) + 1);
    let best = '';
    let n = 0;
    for (const [k, c] of count)
        if (c > n)
            [best, n] = [k, c];
    return n;
}
export function inner$rebaseDraft$out$$after_loop(live, c, s) {
    const out = { ...live };
    for (const k of new Set([...Object.keys(c), ...Object.keys(s)]))
        if (JSON.stringify(c[k]) !== JSON.stringify(s[k]))
            out[k] = c[k];
    return out;
}

export const SIGS = {
  inner$completeness$items: [{"name":"d","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$hoursSum$keys: [{"name":"d","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$hoursSum$days: [{"name":"d","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$schedOf$wk: [{"name":"hours","d":{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},"opt":false}],
  inner$schedOf$from: [{"name":"hours","d":{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},"opt":false}],
  inner$schedOf$from$$step: [{"name":"best","d":{"t":"str"},"opt":false}],
  inner$schedOf$to: [{"name":"hours","d":{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},"opt":false}],
  inner$schedOf$to$$step: [{"name":"best","d":{"t":"str"},"opt":false}],
  inner$schedOf$count$$after_loop: [{"name":"hours","d":{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},"opt":false}],
  inner$schedOf$best$$after_loop: [{"name":"hours","d":{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},"opt":false}],
  inner$schedOf$n$$after_loop: [{"name":"hours","d":{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},"opt":false}],
  inner$rebaseDraft$out$$after_loop: [{"name":"live","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false},{"name":"c","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"s","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
};
