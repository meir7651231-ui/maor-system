// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/lib.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function prNorm(s) {
    return String(s ?? '')
        .replace(/\u05BE/g, ' ') // מקף עברי (־)
        .replace(/[\u0591-\u05C7]/g, '')
        .replace(/[״׳"'`]/g, '')
        .replace(/[.,!?;:()\-/\\+*_=&]/g, ' ')
        .replace(/ך/g, 'כ')
        .replace(/ם/g, 'מ')
        .replace(/ן/g, 'נ')
        .replace(/ף/g, 'פ')
        .replace(/ץ/g, 'צ')
        .replace(/וו/g, 'ו')
        .replace(/יי/g, 'י')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}
const CONCEPT_SRC = [
    { k: 'plumb', l: 'אינסטלציה', c: 'elec', w: 'נזילה,נזילות,נוזל,דולף,דולפת,דליפה,מטפטף,טפטוף,רטיבות,סתימה,סתום,סתומה,סתימות,ביוב,כיור,אסלה,ברז,ברזים,דוד,דודים,דוד שמש,מים חמים,אין מים,לחץ מים,צנרת,צינור,צינורות,אינסטלציה,אינסטלטור,שרברב,מקלחת,ניאגרה', t: 'אינסטל,שרברב,נזיל,סתימ,ביוב,דוד,צנרת,ברז,דליפ' },
    { k: 'elec', l: 'חשמל', c: 'elec', w: 'חשמל,חשמלאי,קצר,קצר בחשמל,לוח חשמל,שקע,שקעים,פחת,נפל החשמל,אין חשמל,תאורה,מנורה,נורה,נורות,הארקה,מפסק,פקקים', t: 'חשמל,לוח,קצר,תאור,שקע' },
    { k: 'ac', l: 'מיזוג', c: 'elec', w: 'מזגן,מזגנים,מיזוג,מיזוג אוויר,קירור,מילוי גז,טכנאי מזגנים,חם בבית,חימום,תנור חימום,רדיאטור,מפזר חום,הסקה,קר בבית', t: 'מזגנ,מיזוג,קירור,חימומ,רדיאטור' },
    { k: 'appl', l: 'מכשירי חשמל', c: 'elec', w: 'מכונת כביסה,כביסה,מייבש,מדיח,תנור,מקרר,מקפיא,פלטה,מיחם,מכשירי חשמל,טכנאי', t: 'כביס,מקרר,מדיח,תנור,מכשיר,טכנאי,פלט' },
    { k: 'build', l: 'שיפוצים', c: 'build', w: 'שיפוץ,שיפוצים,קבלן,ריצוף,רצף,טיח,צבע,צבעי,צביעה,גבס,איטום,גג,הריסה,בנייה,מרפסת,סוכה', t: 'שיפוצ,קבלנ,ריצופ,רצפ,טיח,צבע,צביע,גבס,איטומ,בניי' },
    { k: 'carp', l: 'נגרות ואלומיניום', c: 'build', w: 'נגר,נגרות,ארון,ארונות,מטבח,דלת,דלתות,חלון,חלונות,תריס,תריסים,אלומיניום,מסגר,ריתוך,מנעול,מנעולן,פורץ', t: 'נגר,ארונ,מטבח,דלת,חלונ,תריס,אלומיניומ,מסגר,מנעול' },
    { k: 'move', l: 'הובלות', c: 'car', w: 'הובלה,הובלות,מוביל,מובילים,מעבר דירה,עוברים דירה,ארגזים,משאית,רהיטים,אחסון', t: 'הובל,מוביל,משאית,אחסונ' },
    { k: 'car', l: 'רכב', c: 'car', w: 'רכב,אוטו,מוסך,מכונאי,פנצר,צמיג,צמיגים,טסט,מצבר,חשמלאי רכב', t: 'רכב,מוסכ,מכונאי,צמיג,מצבר' },
    { k: 'ride', l: 'הסעות', c: 'car', w: 'הסעה,הסעות,מונית,נהג,נסיעה,שדה תעופה,נתבג,מיניבוס', t: 'הסע,מונית,נהג,מיניבוס' },
    { k: 'fin', l: 'חשבונות ומס', c: 'fin', w: 'רואה חשבון,רוח,הנהלת חשבונות,מנהלת חשבונות,מנהל חשבונות,מס הכנסה,החזר מס,החזרי מס,דוח שנתי,מעמ,ביטוח לאומי,משכורות,תלושי שכר', t: 'חשבונ,מס,מעמ,שכר,הנהלת' },
    { k: 'law', l: 'עריכת דין', c: 'fin', w: 'עורך דין,עורכת דין,עוד,צוואה,ירושה,חוזה,נוטריון,תביעה,משפט,משפטי', t: 'עורך,עורכת,נוטריונ,צווא,משפט,חוזי' },
    { k: 'ins', l: 'ביטוח ומשכנתאות', c: 'fin', w: 'ביטוח,ביטוחים,סוכן ביטוח,משכנתא,משכנתאות,פנסיה,חיסכון', t: 'ביטוח,משכנת,פנסי' },
    { k: 'tech', l: 'מחשבים', c: 'tech', w: 'מחשב,מחשבים,לפטופ,מחשב נייד,מדפסת,אינטרנט,ראוטר,רשת,וירוס,שחזור,טלפון כשר,סינון,נטפרי,פלאפון', t: 'מחשב,מדפס,רשת,סינונ,טלפונ,אינטרנט' },
    { k: 'design', l: 'עיצוב ודפוס', c: 'tech', w: 'עיצוב,גרפיקה,גרפיקאי,מעצב,מעצבת,לוגו,הזמנות,דפוס,הדפסה,הדפסות,אתר,בניית אתרים,שלט,שלטים', t: 'עיצוב,גרפ,מעצב,לוגו,דפוס,הדפס,אתר' },
    { k: 'edu', l: 'לימוד ושיעורים', c: 'edu', w: 'מלמד,מלמדים,שיעור,שיעורים,שיעור פרטי,שיעורי עזר,מורה,מורה פרטית,חברותא,גמרא,משניות,חומש,לימוד,ללמוד,קריאה,חשבון,אנגלית,מתמטיקה,בר מצווה,הכנה לבר מצווה,דרשה', t: 'מלמד,שיעור,מורה,חברות,גמרא,משני,לימוד,קריא,אנגלית,מתמטיק,חומש' },
    { k: 'kids', l: 'גנים ומטפלות', c: 'edu', w: 'גן,גנון,משפחתון,מטפלת,בייביסיטר,שמרטף,צהרון,קייטנה,קייטנות', t: 'משפחתונ,מטפלת,צהרונ,קייטנ,גנון' },
    { k: 'stam', l: 'סת״ם', c: 'stam', w: 'סופר,סופר סתם,סתם,מזוזה,מזוזות,תפילין,בדיקת מזוזות,ספר תורה,מגילה,קריאת מגילה,טלית,ציצית,יודאיקה,ספרים,כריכה,כורך,ארבעת המינים,ארבעה מינים,אתרוג,אתרוגים,לולב,לולבים,הדסים,ערבות,חנוכיה,חנוכייה,חנוכיות,פמוט,פמוטים', t: 'סופר,סתמ,מזוז,תפילינ,מגיל,ציצית,יודאיק,כריכ,ספרי,אתרוג,לולב,חנוכי' },
    { k: 'events', l: 'שמחות', c: 'events', w: 'שמחה,שמחות,חתונה,חתונות,בר מצווה,ברית,בריתות,אירוסין,וורט,תנאים,קידושא,שבע ברכות,קייטרינג,אולם,אולמות,בדחן,פרחים,מסיבה,מסיבות,מסיבת חנוכה,סעודה,סעודות,סעודת פורים', t: 'שמח,חתונ,ברית,קייטרינג,אולמ,בדחנ,אירוע,מסיב,סעוד' },
    { k: 'photo', l: 'צילום ומוזיקה', c: 'events', w: 'צלם,צלמת,צילום,וידאו,תזמורת,זמר,נגן,קלידן,כליזמר,להקה,מוזיקה', t: 'צלמ,צילומ,וידאו,תזמורת,זמר,נגנ,קלידנ,להק,מוזיק' },
    { k: 'health', l: 'בריאות וטיפולים', c: 'health', w: 'רופא,רופאה,רפואה,טיפול,מטפל,פיזיותרפיה,פיזיותרפיסט,רפלקסולוגיה,דיקור,עיסוי,קלינאית תקשורת,ריפוי בעיסוק,פסיכולוג,פסיכולוגית,כאבי גב,שיניים,רופא שיניים,אופטיקה,משקפיים,תזונה,דיאטנית,דולה,מיילדת,הדרכת כלות,הדרכת חתנים,ייעוץ,יועץ,ייעוץ זוגי', t: 'רופא,רפוא,טיפול,פיזיו,רפלקסו,דיקור,עיסוי,קלינאי,פסיכולוג,שיניימ,אופטי,משקפ,תזונ,דיאט,דולה,הדרכ,ייעוצ,יועצ' },
    { k: 'fashion', l: 'פאות ותפירה', c: 'fashion', w: 'פאה,פאות,שייטל,שייטלים,סירוק,פאנית,חייט,תופרת,תפירה,תיקוני תפירה,קיצור,שמלה,שמלות,חליפה,כובע,כובעים,בגדים,אופנה,תחפושת,תחפושות', t: 'תחפוש,פאה,פאות,פאנית,שייטל,סירוק,חייט,תופר,תפיר,שמל,חליפ,כובע,בגד,אופנ' },
    { k: 'home', l: 'ניקיון וגינון', c: 'home', w: 'ניקיון,נקיון,ניקיון לפסח,מנקה,עוזרת,עוזרת בית,גינון,גנן,גינה,הדברה,גוקים,מזיקים,שטיחים,ספות,ניקוי ספות,הגעלה,הגעלת כלים,ליבון,הכשרת מטבח', t: 'ניקי,נקי,מנק,עוזרת,גינ,גננ,הדבר,מזיק,שטיח,ספות,הגעל' },
    { k: 'food', l: 'מזון ואפייה', c: 'food', w: 'עוגה,עוגות,אפייה,חלות,חלה,מאפה,מאפייה,קונדיטוריה,עוגיות,משלוחים,אוכל,בישול,מגשי אירוח,מגשים,פירות,ירקות,בשר,סושי,משלוח מנות,משלוחי מנות,סופגניות,סופגניה,סופגנייה,לביבות', t: 'עוג,אפי,חלות,מאפ,קונדיט,משלוח,אוכל,בישול,מגש,פירות,ירק,בשר,סופגני' },
    { k: 'realestate', l: 'נדל״ן', c: 'realestate', w: 'דירה,דירות,דירה להשכרה,להשכרה,השכרה,למכירה,תיווך,מתווך,שמאי,נכס,נדלן', t: 'דיר,תיווכ,מתווכ,שמאי,נכס,נדלנ,השכר' },
    { k: 'trade', l: 'חנויות ומסחר', c: 'trade', w: 'חנות,חנויות,סיטונאות,צעצועים,מתנות,כלי בית,כלי כסף,ספרי קודש,סכך,קישוטי סוכה,קישוטים,נוי סוכה', t: 'חנות,סיטונ,צעצוע,מתנ,כלי,סככ,קישוט' },
];
const PR_CONCEPTS = CONCEPT_SRC.map((c) => ({
    k: c.k,
    l: c.l,
    c: c.c,
    w: c.w.split(','),
    t: c.t.split(',').map(prNorm).filter(Boolean),
}));
const CONCEPT_BY_KEY = new Map(PR_CONCEPTS.map((c) => [c.k, c]));
const PREFIX_RE = /^(וכש|וש|וה|וב|ול|ומ|שה|שב|של|מה|בה|לה|כש|ו|ה|ב|ל|מ|ש|כ)(?=.{3,})/;
function approvedListings(listings) {
    return listings.filter((l) => l.status === 'approved');
}
const digits = (p) => String(p ?? '').replace(/\D/g, '');
function dialCodeOf(l) {
    const s = String(l.dialCode ?? '').trim();
    return /^\d{3}$/.test(s) ? s : '';
}
const when = (x) => (x.updatedAt || x.createdAt || '') + '|' + x.id;
const PR_ESCALATE_MS = { normal: 3 * 3600_000, urgent: 3600_000 };
const PR_URGENT_TTL_MS = 48 * 3600_000;
const createdMs = (r) => Date.parse(r.createdAt);
function isUrgent(r, nowMs) {
    if (r.status === 'closed')
        return false;
    if (!(r.urgent === true || /^\s*דחוף/.test(r.text)))
        return false;
    const t = createdMs(r);
    return !Number.isFinite(t) || nowMs - t < PR_URGENT_TTL_MS;
}
const phoneKey = (p) => {
    const d = digits(p);
    return d.length >= 9 ? d.slice(-9) : '';
};
function requestRecipients(r, listings) {
    if (!r.category || r.job)
        return [];
    const own = phoneKey(r.requester?.phone);
    return listings.filter((l) => l.status === 'approved' &&
        l.source === 'owner' &&
        l.category === r.category &&
        !(own && [l.phone, l.phone2, l.whatsapp].some((p) => phoneKey(p) === own)));
}
function adActiveOn(ad, todayIso) {
    return ad.active !== false && (!ad.from || ad.from <= todayIso) && (!ad.to || ad.to >= todayIso);
}
function activeAds(ads, slot, todayIso, target) {
    return ads
        .filter((a) => a.slot === slot && !a.coin && adActiveOn(a, todayIso) && (target === undefined || a.target === target))
        .sort((a, b) => a.advertiser.localeCompare(b.advertiser, 'he') || a.id.localeCompare(b.id));
}
function dayNumber(iso) {
    const t = Date.parse(String(iso) + 'T12:00:00Z');
    return Number.isFinite(t) ? Math.floor(t / 86_400_000) : 0;
}
export function inner$tokMatch$st(tok) {
    const st = tok.replace(PREFIX_RE, '');
    return st;
}
export function inner$analyzeQuery$q(raw) {
    const q = prNorm(raw);
    return q;
}
export function inner$analyzeQuery$toks(raw) {
    const q = prNorm(raw);
    const toks = q.split(' ').filter(Boolean);
    return toks;
}
export function inner$analyzeQuery$toks$$step(q) {
    const toks = q.split(' ').filter(Boolean);
    return toks;
}
export function inner$analyzeQuery$pq(raw) {
    const q = prNorm(raw);
    const pq = ' ' + q + ' ';
    return pq;
}
export function inner$analyzeQuery$pq$$step(q) {
    const pq = ' ' + q + ' ';
    return pq;
}
export function inner$analyzeQuery$parts(s) {
    const parts = s.split(' ');
    return parts;
}
export function inner$analyzeQuery$cons(sc) {
    const cons = [...sc.entries()].map(([k, s]) => ({ k, s })).sort((x, y) => y.s - x.s);
    return cons;
}
export function inner$analyzeQuery$top(sc) {
    const cons = [...sc.entries()].map(([k, s]) => ({ k, s })).sort((x, y) => y.s - x.s);
    const top = cons.length ? cons[0].s : 0;
    return top;
}
export function inner$analyzeQuery$top$$step(cons) {
    const top = cons.length ? cons[0].s : 0;
    return top;
}
export function inner$searchListings$tx(l) {
    const tx = prNorm([l.title, l.desc, l.tagline ?? '', ...(Array.isArray(l.services) ? l.services : []).map((x) => x?.name ?? '')].join(' '));
    return tx;
}
export function inner$searchListings$tw(l) {
    const tx = prNorm([l.title, l.desc, l.tagline ?? '', ...(Array.isArray(l.services) ? l.services : []).map((x) => x?.name ?? '')].join(' '));
    const tw = tx.split(' ').filter(Boolean);
    return tw;
}
export function inner$searchListings$tw$$step(tx) {
    const tw = tx.split(' ').filter(Boolean);
    return tw;
}
export function inner$searchListings$nw(l) {
    const nw = prNorm(l.name).split(' ').filter((w) => w.length > 1);
    return nw;
}
export function inner$searchListings$lw(l) {
    const lw = prNorm(l.city + ' ' + l.area).split(' ').filter((w) => w.length > 1);
    return lw;
}
export function inner$searchListings$ph(l) {
    const ph = [l.phone, l.phone2, l.whatsapp].map(digits).join('|');
    return ph;
}
export function inner$searchListings$C(c) {
    const C = CONCEPT_BY_KEY.get(c.k);
    return C;
}
export function inner$searchListings$forEach$isCon(a, i) {
    const isCon = a.conHit.has(i);
    return isCon;
}
export function inner$searchListings$concepts(a) {
    const concepts = a.cons
        .map((c) => CONCEPT_BY_KEY.get(c.k)?.l ?? '')
        .filter(Boolean)
        .slice(0, 2);
    return concepts;
}
export function inner$matchesAll$qq(q) {
    const qq = prNorm(q).split(' ').filter(Boolean);
    return qq;
}
export function inner$filterListings$base(listings, o) {
    let base = o.includeAll ? listings.slice() : approvedListings(listings);
    return base;
}
export function inner$filterListings$q(o) {
    const q = (o.q ?? '').trim();
    return q;
}
export function inner$groupByCategory$approved(listings) {
    const approved = approvedListings(listings);
    return approved;
}
export function inner$dialCodeOf$s(l) {
    const s = String(l.dialCode ?? '').trim();
    return s;
}
export function inner$uniqueGates$map$filter$k(l) {
    const k = String(l.id);
    return k;
}
export function inner$dialCodeHolders$c(l) {
    const c = dialCodeOf(l);
    return c;
}
export function inner$listingStatus$dd(d, k) {
    const dd = (d + k) % 7;
    return dd;
}
export function inner$listingStatus$dayWins(wins, d, k) {
    const dd = (d + k) % 7;
    const dayWins = wins.filter((w) => w.dow === dd).sort((a, b) => a.f - b.f);
    return dayWins;
}
export function inner$listingStatus$dayWins$$step(wins, dd) {
    const dayWins = wins.filter((w) => w.dow === dd).sort((a, b) => a.f - b.f);
    return dayWins;
}
export function inner$listingStatus$when(d, k, PR_DAY_NAMES) {
    const dd = (d + k) % 7;
    const when = k === 0 ? 'היום' : k === 1 ? 'מחר' : dd === 6 ? 'במוצ״ש' : 'ביום ' + PR_DAY_NAMES[dd];
    return when;
}
export function inner$listingStatus$when$$step(k, dd, PR_DAY_NAMES) {
    const when = k === 0 ? 'היום' : k === 1 ? 'מחר' : dd === 6 ? 'במוצ״ש' : 'ביום ' + PR_DAY_NAMES[dd];
    return when;
}
export function inner$hoursText$byDay() {
    const byDay = Array.from({ length: 7 }, () => '');
    return byDay;
}
export function inner$pendingApprovals$listings(db) {
    const listings = db.prListings.filter((l) => l.status === 'pending').sort((a, b) => when(a).localeCompare(when(b)));
    return listings;
}
export function inner$pendingApprovals$posts(db, todayIso) {
    const posts = db.prPosts.filter((p) => !p.approved && (!p.until || p.until >= todayIso)).sort((a, b) => when(a).localeCompare(when(b)));
    return posts;
}
export function inner$isUrgent$t(r) {
    const t = createdMs(r);
    return t;
}
export function inner$phoneKey$d(p) {
    const d = digits(p);
    return d;
}
export function inner$requestRecipients$own(r) {
    const own = phoneKey(r.requester?.phone);
    return own;
}
export function inner$routeRequest$recipients(r, listings) {
    const recipients = requestRecipients(r, listings);
    return recipients;
}
export function inner$routeRequest$t(r) {
    const t = createdMs(r);
    return t;
}
export function inner$routeRequest$esc(r, nowMs) {
    const t = createdMs(r);
    const esc = t + (isUrgent(r, nowMs) ? PR_ESCALATE_MS.urgent : PR_ESCALATE_MS.normal);
    return esc;
}
export function inner$routeRequest$esc$$step(r, nowMs, t) {
    const esc = t + (isUrgent(r, nowMs) ? PR_ESCALATE_MS.urgent : PR_ESCALATE_MS.normal);
    return esc;
}
export function inner$inMinsText$m(ms) {
    const m = Math.max(1, Math.ceil(ms / 60000));
    return m;
}
export function inner$inMinsText$h(ms) {
    const m = Math.max(1, Math.ceil(ms / 60000));
    const h = Math.floor(m / 60);
    return h;
}
export function inner$inMinsText$h$$step(m) {
    const h = Math.floor(m / 60);
    return h;
}
export function inner$inMinsText$r(ms) {
    const m = Math.max(1, Math.ceil(ms / 60000));
    const r = m % 60;
    return r;
}
export function inner$inMinsText$r$$step(m) {
    const r = m % 60;
    return r;
}
export function inner$inMinsText$H(ms) {
    const m = Math.max(1, Math.ceil(ms / 60000));
    const h = Math.floor(m / 60);
    const H = h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : h + ' שעות';
    return H;
}
export function inner$inMinsText$H$$step(h) {
    const H = h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : h + ' שעות';
    return H;
}
export function inner$sensitiveTopic$s(text) {
    const s = String(text ?? '');
    return s;
}
export function inner$businessView$quiet(r) {
    const quiet = r.quiet === true;
    return quiet;
}
export function inner$businessView$name(r) {
    const name = typeof r.requester?.name === 'string' ? r.requester.name : '';
    return name;
}
export function inner$businessView$phone(r) {
    const phone = typeof r.requester?.phone === 'string' ? r.requester.phone : '';
    return phone;
}
export function inner$snippet$t(s) {
    const t = String(s ?? '').replace(/\s+/g, ' ').trim();
    return t;
}
export function inner$needsCare$answered(r) {
    const answered = Array.isArray(r.responses) && r.responses.length > 0;
    return answered;
}
export function inner$needsCare$t(r) {
    const t = createdMs(r);
    return t;
}
export function inner$needsCare$started(todayIso, a) {
    const started = !a.from || a.from <= todayIso;
    return started;
}
export function inner$needsCare$live(todayIso, a) {
    const started = !a.from || a.from <= todayIso;
    const live = started && (!a.to || a.to >= todayIso);
    return live;
}
export function inner$needsCare$live$$step(todayIso, a, started) {
    const live = started && (!a.to || a.to >= todayIso);
    return live;
}
export function inner$dayNumber$t(iso) {
    const t = Date.parse(String(iso) + 'T12:00:00Z');
    return t;
}
export function inner$adRotation$active(ads, slot, todayIso, target) {
    const active = activeAds(ads, slot, todayIso, target);
    return active;
}
export function inner$adRotation$index(ads, slot, todayIso, target) {
    const active = activeAds(ads, slot, todayIso, target);
    const index = ((dayNumber(todayIso) % active.length) + active.length) % active.length;
    return index;
}
export function inner$adRotation$index$$step(todayIso, active) {
    const index = ((dayNumber(todayIso) % active.length) + active.length) % active.length;
    return index;
}
export function inner$adsLedger$price(a) {
    const price = typeof a.price === 'number' && Number.isFinite(a.price) && a.price > 0 ? a.price : 0;
    return price;
}
export function inner$dialCodeHolders$out$$after_loop(gates) {
    const out = new Map();
    for (const g of gates) {
        for (const l of g.items) {
            const c = dialCodeOf(l);
            if (c)
                out.set(c, [...(out.get(c) ?? []), l]);
        }
    }
    return out;
}
export function inner$adsLedger$out$$after_loop(ads, todayIso) {
    const out = { count: 0, paidCount: 0, total: 0, paid: 0, due: 0, upcoming: 0 };
    for (const a of ads) {
        if (a.active === false || (a.to && a.to < todayIso))
            continue;
        const price = typeof a.price === 'number' && Number.isFinite(a.price) && a.price > 0 ? a.price : 0;
        out.count++;
        out.total += price;
        if (a.paid) {
            out.paidCount++;
            out.paid += price;
        }
        else if (!a.from || a.from <= todayIso)
            out.due += price;
        else
            out.upcoming += price;
    }
    return out;
}

export const SIGS = {
  inner$tokMatch$st: [{"name":"tok","d":{"t":"str"},"opt":false}],
  inner$analyzeQuery$q: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$analyzeQuery$toks: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$analyzeQuery$toks$$step: [{"name":"q","d":{"t":"str"},"opt":false}],
  inner$analyzeQuery$pq: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$analyzeQuery$pq$$step: [{"name":"q","d":{"t":"str"},"opt":false}],
  inner$analyzeQuery$parts: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$analyzeQuery$cons: [{"name":"sc","d":{"t":"map","k":{"t":"str"},"v":{"t":"num"}},"opt":false}],
  inner$analyzeQuery$top: [{"name":"sc","d":{"t":"map","k":{"t":"str"},"v":{"t":"num"}},"opt":false}],
  inner$analyzeQuery$top$$step: [{"name":"cons","d":{"t":"arr","of":{"t":"obj","p":[["k",{"t":"str"},false],["s",{"t":"num"},false]]}},"opt":false}],
  inner$searchListings$tx: [{"name":"l","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$searchListings$tw: [{"name":"l","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$searchListings$tw$$step: [{"name":"tx","d":{"t":"str"},"opt":false}],
  inner$searchListings$nw: [{"name":"l","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$searchListings$lw: [{"name":"l","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$searchListings$ph: [{"name":"l","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$searchListings$C: [{"name":"c","d":{"t":"obj","p":[["k",{"t":"str"},false],["s",{"t":"num"},false]]},"opt":false}],
  inner$searchListings$forEach$isCon: [{"name":"a","d":{"t":"obj","n":"PrAnalysis","p":[["q",{"t":"str"},false],["raw",{"t":"str"},false],["toks",{"t":"arr","of":{"t":"str"}},false],["cons",{"t":"arr","of":{"t":"obj","p":[["k",{"t":"str"},false],["s",{"t":"num"},false]]}},false],["conHit",{"t":"set","of":{"t":"num"}},false]]},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$searchListings$concepts: [{"name":"a","d":{"t":"obj","n":"PrAnalysis","p":[["q",{"t":"str"},false],["raw",{"t":"str"},false],["toks",{"t":"arr","of":{"t":"str"}},false],["cons",{"t":"arr","of":{"t":"obj","p":[["k",{"t":"str"},false],["s",{"t":"num"},false]]}},false],["conHit",{"t":"set","of":{"t":"num"}},false]]},"opt":false}],
  inner$matchesAll$qq: [{"name":"q","d":{"t":"str"},"opt":false}],
  inner$filterListings$base: [{"name":"listings","d":{"t":"arr","of":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"o","d":{"t":"obj","n":"PrBrowseOpts","p":[["q",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["category",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emergency",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["includeAll",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["openOnly",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["clock",{"t":"obj","n":"PrClock","p":[["iso",{"t":"str"},false],["hhmm",{"t":"str"},false],["dow",{"t":"num"},false],["ms",{"t":"num"},false]]},false],["closureAt",{"t":"fn"},false]]}]},true],["todayIso",{"t":"str"},false]]},"opt":false}],
  inner$filterListings$q: [{"name":"o","d":{"t":"obj","n":"PrBrowseOpts","p":[["q",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["category",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emergency",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["includeAll",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["openOnly",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["clock",{"t":"obj","n":"PrClock","p":[["iso",{"t":"str"},false],["hhmm",{"t":"str"},false],["dow",{"t":"num"},false],["ms",{"t":"num"},false]]},false],["closureAt",{"t":"fn"},false]]}]},true],["todayIso",{"t":"str"},false]]},"opt":false}],
  inner$groupByCategory$approved: [{"name":"listings","d":{"t":"arr","of":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$dialCodeOf$s: [{"name":"l","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$uniqueGates$map$filter$k: [{"name":"l","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$dialCodeHolders$c: [{"name":"l","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$listingStatus$dd: [{"name":"d","d":{"t":"num"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$listingStatus$dayWins: [{"name":"wins","d":{"t":"arr","of":{"t":"obj","n":"Win","p":[["dow",{"t":"num"},false],["f",{"t":"num"},false],["t",{"t":"num"},false]]}},"opt":false},{"name":"d","d":{"t":"num"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$listingStatus$dayWins$$step: [{"name":"wins","d":{"t":"arr","of":{"t":"obj","n":"Win","p":[["dow",{"t":"num"},false],["f",{"t":"num"},false],["t",{"t":"num"},false]]}},"opt":false},{"name":"dd","d":{"t":"num"},"opt":false}],
  inner$listingStatus$when: [{"name":"d","d":{"t":"num"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false},{"name":"PR_DAY_NAMES","d":{"t":"tup","of":[{"t":"lit","v":["ראשון"]},{"t":"lit","v":["שני"]},{"t":"lit","v":["שלישי"]},{"t":"lit","v":["רביעי"]},{"t":"lit","v":["חמישי"]},{"t":"lit","v":["שישי"]},{"t":"lit","v":["שבת"]}]},"opt":false}],
  inner$listingStatus$when$$step: [{"name":"k","d":{"t":"num"},"opt":false},{"name":"dd","d":{"t":"num"},"opt":false},{"name":"PR_DAY_NAMES","d":{"t":"tup","of":[{"t":"lit","v":["ראשון"]},{"t":"lit","v":["שני"]},{"t":"lit","v":["שלישי"]},{"t":"lit","v":["רביעי"]},{"t":"lit","v":["חמישי"]},{"t":"lit","v":["שישי"]},{"t":"lit","v":["שבת"]}]},"opt":false}],
  inner$hoursText$byDay: [],
  inner$pendingApprovals$listings: [{"name":"db","d":{"t":"obj","n":"Pick","p":[["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["notice","minyan","event","emergency"]},false],["title",{"t":"str"},false],["text",{"t":"str"},false],["place",{"t":"str"},false],["phone",{"t":"str"},false],["noticeKind",{"t":"str"},false],["prayers",{"t":"arr","of":{"t":"obj","n":"PrPrayerTimes","p":[["prayer",{"t":"str"},false],["times",{"t":"arr","of":{"t":"str"}},false]]}},false],["days",{"t":"arr","of":{"t":"num"}},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["until",{"t":"str"},false],["approved",{"t":"bool"},false],["pinned",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$pendingApprovals$posts: [{"name":"db","d":{"t":"obj","n":"Pick","p":[["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["notice","minyan","event","emergency"]},false],["title",{"t":"str"},false],["text",{"t":"str"},false],["place",{"t":"str"},false],["phone",{"t":"str"},false],["noticeKind",{"t":"str"},false],["prayers",{"t":"arr","of":{"t":"obj","n":"PrPrayerTimes","p":[["prayer",{"t":"str"},false],["times",{"t":"arr","of":{"t":"str"}},false]]}},false],["days",{"t":"arr","of":{"t":"num"}},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["until",{"t":"str"},false],["approved",{"t":"bool"},false],["pinned",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},false]]},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$isUrgent$t: [{"name":"r","d":{"t":"obj","n":"PrRequest","p":[["id",{"t":"str"},false],["text",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["urgent",{"t":"bool"},false],["quiet",{"t":"bool"},false],["job",{"t":"bool"},false],["requester",{"t":"obj","n":"PrRequester","p":[["name",{"t":"str"},false],["phone",{"t":"str"},false]]},false],["status",{"t":"lit","v":["open","answered","closed"]},false],["responses",{"t":"arr","of":{"t":"obj","n":"PrResponse","p":[["listingId",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["closedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$phoneKey$d: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$requestRecipients$own: [{"name":"r","d":{"t":"obj","n":"PrRequest","p":[["id",{"t":"str"},false],["text",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["urgent",{"t":"bool"},false],["quiet",{"t":"bool"},false],["job",{"t":"bool"},false],["requester",{"t":"obj","n":"PrRequester","p":[["name",{"t":"str"},false],["phone",{"t":"str"},false]]},false],["status",{"t":"lit","v":["open","answered","closed"]},false],["responses",{"t":"arr","of":{"t":"obj","n":"PrResponse","p":[["listingId",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["closedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$routeRequest$recipients: [{"name":"r","d":{"t":"obj","n":"PrRequest","p":[["id",{"t":"str"},false],["text",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["urgent",{"t":"bool"},false],["quiet",{"t":"bool"},false],["job",{"t":"bool"},false],["requester",{"t":"obj","n":"PrRequester","p":[["name",{"t":"str"},false],["phone",{"t":"str"},false]]},false],["status",{"t":"lit","v":["open","answered","closed"]},false],["responses",{"t":"arr","of":{"t":"obj","n":"PrResponse","p":[["listingId",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["closedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false},{"name":"listings","d":{"t":"arr","of":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$routeRequest$t: [{"name":"r","d":{"t":"obj","n":"PrRequest","p":[["id",{"t":"str"},false],["text",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["urgent",{"t":"bool"},false],["quiet",{"t":"bool"},false],["job",{"t":"bool"},false],["requester",{"t":"obj","n":"PrRequester","p":[["name",{"t":"str"},false],["phone",{"t":"str"},false]]},false],["status",{"t":"lit","v":["open","answered","closed"]},false],["responses",{"t":"arr","of":{"t":"obj","n":"PrResponse","p":[["listingId",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["closedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$routeRequest$esc: [{"name":"r","d":{"t":"obj","n":"PrRequest","p":[["id",{"t":"str"},false],["text",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["urgent",{"t":"bool"},false],["quiet",{"t":"bool"},false],["job",{"t":"bool"},false],["requester",{"t":"obj","n":"PrRequester","p":[["name",{"t":"str"},false],["phone",{"t":"str"},false]]},false],["status",{"t":"lit","v":["open","answered","closed"]},false],["responses",{"t":"arr","of":{"t":"obj","n":"PrResponse","p":[["listingId",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["closedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false},{"name":"nowMs","d":{"t":"num"},"opt":false}],
  inner$routeRequest$esc$$step: [{"name":"r","d":{"t":"obj","n":"PrRequest","p":[["id",{"t":"str"},false],["text",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["urgent",{"t":"bool"},false],["quiet",{"t":"bool"},false],["job",{"t":"bool"},false],["requester",{"t":"obj","n":"PrRequester","p":[["name",{"t":"str"},false],["phone",{"t":"str"},false]]},false],["status",{"t":"lit","v":["open","answered","closed"]},false],["responses",{"t":"arr","of":{"t":"obj","n":"PrResponse","p":[["listingId",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["closedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false},{"name":"nowMs","d":{"t":"num"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false}],
  inner$inMinsText$m: [{"name":"ms","d":{"t":"num"},"opt":false}],
  inner$inMinsText$h: [{"name":"ms","d":{"t":"num"},"opt":false}],
  inner$inMinsText$h$$step: [{"name":"m","d":{"t":"num"},"opt":false}],
  inner$inMinsText$r: [{"name":"ms","d":{"t":"num"},"opt":false}],
  inner$inMinsText$r$$step: [{"name":"m","d":{"t":"num"},"opt":false}],
  inner$inMinsText$H: [{"name":"ms","d":{"t":"num"},"opt":false}],
  inner$inMinsText$H$$step: [{"name":"h","d":{"t":"num"},"opt":false}],
  inner$sensitiveTopic$s: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$businessView$quiet: [{"name":"r","d":{"t":"obj","n":"PrRequest","p":[["id",{"t":"str"},false],["text",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["urgent",{"t":"bool"},false],["quiet",{"t":"bool"},false],["job",{"t":"bool"},false],["requester",{"t":"obj","n":"PrRequester","p":[["name",{"t":"str"},false],["phone",{"t":"str"},false]]},false],["status",{"t":"lit","v":["open","answered","closed"]},false],["responses",{"t":"arr","of":{"t":"obj","n":"PrResponse","p":[["listingId",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["closedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$businessView$name: [{"name":"r","d":{"t":"obj","n":"PrRequest","p":[["id",{"t":"str"},false],["text",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["urgent",{"t":"bool"},false],["quiet",{"t":"bool"},false],["job",{"t":"bool"},false],["requester",{"t":"obj","n":"PrRequester","p":[["name",{"t":"str"},false],["phone",{"t":"str"},false]]},false],["status",{"t":"lit","v":["open","answered","closed"]},false],["responses",{"t":"arr","of":{"t":"obj","n":"PrResponse","p":[["listingId",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["closedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$businessView$phone: [{"name":"r","d":{"t":"obj","n":"PrRequest","p":[["id",{"t":"str"},false],["text",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["urgent",{"t":"bool"},false],["quiet",{"t":"bool"},false],["job",{"t":"bool"},false],["requester",{"t":"obj","n":"PrRequester","p":[["name",{"t":"str"},false],["phone",{"t":"str"},false]]},false],["status",{"t":"lit","v":["open","answered","closed"]},false],["responses",{"t":"arr","of":{"t":"obj","n":"PrResponse","p":[["listingId",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["closedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$snippet$t: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$needsCare$answered: [{"name":"r","d":{"t":"obj","n":"PrRequest","p":[["id",{"t":"str"},false],["text",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["urgent",{"t":"bool"},false],["quiet",{"t":"bool"},false],["job",{"t":"bool"},false],["requester",{"t":"obj","n":"PrRequester","p":[["name",{"t":"str"},false],["phone",{"t":"str"},false]]},false],["status",{"t":"lit","v":["open","answered","closed"]},false],["responses",{"t":"arr","of":{"t":"obj","n":"PrResponse","p":[["listingId",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["closedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$needsCare$t: [{"name":"r","d":{"t":"obj","n":"PrRequest","p":[["id",{"t":"str"},false],["text",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["urgent",{"t":"bool"},false],["quiet",{"t":"bool"},false],["job",{"t":"bool"},false],["requester",{"t":"obj","n":"PrRequester","p":[["name",{"t":"str"},false],["phone",{"t":"str"},false]]},false],["status",{"t":"lit","v":["open","answered","closed"]},false],["responses",{"t":"arr","of":{"t":"obj","n":"PrResponse","p":[["listingId",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false],["closedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$needsCare$started: [{"name":"todayIso","d":{"t":"str"},"opt":false},{"name":"a","d":{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$needsCare$live: [{"name":"todayIso","d":{"t":"str"},"opt":false},{"name":"a","d":{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$needsCare$live$$step: [{"name":"todayIso","d":{"t":"str"},"opt":false},{"name":"a","d":{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false},{"name":"started","d":{"t":"bool"},"opt":false}],
  inner$dayNumber$t: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$adRotation$active: [{"name":"ads","d":{"t":"arr","of":{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"slot","d":{"t":"lit","v":["booklet","category","board"]},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false},{"name":"target","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$adRotation$index: [{"name":"ads","d":{"t":"arr","of":{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"slot","d":{"t":"lit","v":["booklet","category","board"]},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false},{"name":"target","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$adRotation$index$$step: [{"name":"todayIso","d":{"t":"str"},"opt":false},{"name":"active","d":{"t":"arr","of":{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false}],
  inner$adsLedger$price: [{"name":"a","d":{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$dialCodeHolders$out$$after_loop: [{"name":"gates","d":{"t":"arr","of":{"t":"obj","n":"PrGate","p":[["cat",{"t":"obj","n":"PrCategory","p":[["key",{"t":"lit","v":["home","events","health","build","elec","car","fin","tech","edu","stam","fashion","food","realestate","trade","other"]},false],["name",{"t":"str"},false],["short",{"t":"str"},false],["icon",{"t":"str"},false],["color",{"t":"str"},false],["num",{"t":"str"},false]]},false],["items",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]}},"opt":false}],
  inner$adsLedger$out$$after_loop: [{"name":"ads","d":{"t":"arr","of":{"t":"obj","n":"PrAd","p":[["id",{"t":"str"},false],["slot",{"t":"lit","v":["booklet","category","board"]},false],["kind",{"t":"lit","v":["small","full","half","line"]},false],["target",{"t":"str"},false],["advertiser",{"t":"str"},false],["headline",{"t":"str"},false],["body",{"t":"str"},false],["phone",{"t":"str"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["price",{"t":"num"},false],["paid",{"t":"bool"},false],["paidAt",{"t":"str"},false],["active",{"t":"bool"},false],["url",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["coin",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["mono",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
};
