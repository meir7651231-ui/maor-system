// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/phoneLine.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const PHONE_PROMPT_MAX = 700;
const PHONE_SAY_MAX = 160;
const PHONE_PAGE = { categories: 8, listings: 4, emergency: 8, notices: 3 };
const CAP = { name: 40, title: 60, area: 30, label: 40, notice: 110, community: 60, echo: 60 };
const UNSPEAKABLE = /[\p{Cc}\p{Cf}\p{Extended_Pictographic}<>{}[\]|\\^`=&#*_~]/gu;
function speakable(s) {
    return String(s ?? '')
        .replace(UNSPEAKABLE, ' ')
        .replace(/\uFE0F|\u20E3/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
function clip(s, n) {
    if (s.length <= n)
        return s;
    const cut = s.slice(0, n - 1);
    const sp = cut.lastIndexOf(' ');
    return (sp >= n / 2 ? cut.slice(0, sp) : cut).replace(/[\s,.;:־–—-]+$/u, '') + '…';
}
const said = (s, n) => clip(speakable(s), n);
function phonePrompt(parts, max = PHONE_PROMPT_MAX) {
    let out = '';
    for (const raw of parts) {
        const p = raw.replace(/\s+/g, ' ').trim();
        if (!p)
            continue;
        const next = out ? out + ' ' + p : p;
        if (next.length > max) {
            if (!out)
                out = clip(p, max);
            break;
        }
        out = next;
    }
    return out;
}
const ABBR = [
    [/מוצ״ש/g, 'מוצאי שבת'],
    [/ק״ש/g, 'קריאת שמע'],
    [/יו״ט/g, 'יום טוב'],
];
const expand = (s) => ABBR.reduce((t, [re, w]) => t.replace(re, w), s);
const opt = (digit, say, to) => ({ digit, say: clip(say, PHONE_SAY_MAX), to });
const DIGIT_WORDS = ['אפס', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע'];
function phoneTel(phone) {
    const raw = String(phone ?? '').trim();
    const d = raw.replace(/\D/g, '');
    if (d.length < 3 || d.length > 15)
        return '';
    return (raw.startsWith('+') ? '+' : '') + d;
}
function telGroups(tel) {
    const d = String(tel ?? '').replace(/\D/g, '');
    if (d.length <= 4)
        return d ? [d] : [];
    if (d.length === 9 && d[0] === '0')
        return [d.slice(0, 2), d.slice(2, 5), d.slice(5)];
    const out = [];
    for (let i = 0; i < d.length; i += 3)
        out.push(d.slice(i, i + 3));
    if (out.length > 1 && out[out.length - 1].length === 1) {
        const last = out.pop() ?? '';
        out[out.length - 1] += last;
    }
    return out;
}
function speakDigits(tel) {
    const groups = telGroups(tel).map((g) => [...g].map((c) => DIGIT_WORDS[Number(c)]).join(' '));
    return (String(tel ?? '').trim().startsWith('+') ? 'פלוס ' : '') + groups.join(', ');
}
const bizId = (id) => 'biz/' + encodeURIComponent(String(id));
const nameOf = (l) => said(l.name, CAP.name) || said(l.title, CAP.name) || 'ללא שם';
const pageSize = (n, dflt) => typeof n === 'number' && Number.isFinite(n) ? Math.min(8, Math.max(1, Math.floor(n))) : dflt;
const NOTICE_LABELS = new Map([
    ['simcha', 'מזל טוב'],
    ['avel', 'אבלות'],
    ['shiur', 'שיעורים'],
    ['refuah', 'לרפואה'],
    ['gemach', 'גמ״חים'],
    ['mosad', 'מוסדות'],
    ['lost', 'אבידות'],
    ['kiddush', 'קידושא'],
    ['sale', 'מכירה'],
]);
function closedResolution(menu) {
    const node = menu.nodes[menu.root] ?? { id: 'closed', kind: 'closed', label: 'הקו סגור', prompt: 'הקו סגור עכשיו.', options: [] };
    return { found: false, target: '', confirm: node };
}
function foundAt(id, text, target, label, retry) {
    return { found: true, target, confirm: { id, kind: 'confirm', label, prompt: phonePrompt([text]), options: [opt('1', 'לאישור הקישו 1', target), retry] } };
}
function missedAt(id, text, retry) {
    return { found: false, target: '', confirm: { id, kind: 'info', label: 'לא נמצא', prompt: phonePrompt([text]), options: [retry, opt('0', 'לתפריט הראשי הקישו 0', 'main')] } };
}
function resolveDialCode(menu, code) {
    if (menu.closed)
        return closedResolution(menu);
    const c = String(code ?? '').replace(/\D/g, '').slice(0, 12);
    const target = /^\d{3}$/.test(c) && Object.hasOwn(menu.codes, c) ? menu.codes[c] : '';
    const node = target && Object.hasOwn(menu.nodes, target) ? menu.nodes[target] : undefined;
    const retry = opt('2', 'להקשת קוד אחר הקישו 2', 'code');
    if (!node)
        return missedAt('confirm/code', c.length === 3 ? `הקוד ${speakDigits(c)} לא נמצא במדריך.` : 'הקוד צריך להיות בן שלוש ספרות.', retry);
    return foundAt('confirm/code/' + c, `הקשתם ${speakDigits(c)}: ${node.label}.`, target, node.label, retry);
}
function phoneStep(menu, at, key) {
    const cur = at.node;
    if (!cur.options.length && !cur.collect)
        return null;
    if (cur.collect && /\d/.test(key)) {
        const buf = at.buf + key;
        if (buf.length < cur.collect)
            return { node: cur, buf, moved: false };
        return { node: resolveDialCode(menu, buf).confirm, buf: '', moved: true };
    }
    const o = cur.options.find((x) => x.digit === key);
    return { node: o && Object.hasOwn(menu.nodes, o.to) ? menu.nodes[o.to] : cur, buf: '', moved: true };
}
const PHONE_KIND_LABELS = {
    menu: 'תפריט',
    list: 'רשימה',
    listing: 'כרטיס עסק',
    info: 'הקראה',
    number: 'הקראת מספר',
    confirm: 'אישור',
    connect: 'חיבור שיחה',
    input: 'הקשת קוד',
    closed: 'הקו סגור',
};
const phoneKeyName = (d) => (d === '*' ? 'כוכבית' : d === '#' ? 'סולמית' : d);
export function inner$clip$cut(s, n) {
    const cut = s.slice(0, n - 1);
    return cut;
}
export function inner$clip$sp(s, n) {
    const cut = s.slice(0, n - 1);
    const sp = cut.lastIndexOf(' ');
    return sp;
}
export function inner$clip$sp$$step(cut) {
    const sp = cut.lastIndexOf(' ');
    return sp;
}
export function inner$phonePrompt$p(raw) {
    const p = raw.replace(/\s+/g, ' ').trim();
    return p;
}
export function inner$phonePrompt$next(out, raw) {
    const p = raw.replace(/\s+/g, ' ').trim();
    const next = out ? out + ' ' + p : p;
    return next;
}
export function inner$phonePrompt$next$$step(out, p) {
    const next = out ? out + ' ' + p : p;
    return next;
}
export function inner$phoneTel$raw(phone) {
    const raw = String(phone ?? '').trim();
    return raw;
}
export function inner$phoneTel$d(phone) {
    const raw = String(phone ?? '').trim();
    const d = raw.replace(/\D/g, '');
    return d;
}
export function inner$phoneTel$d$$step(raw) {
    const d = raw.replace(/\D/g, '');
    return d;
}
export function inner$telGroups$d(tel) {
    const d = String(tel ?? '').replace(/\D/g, '');
    return d;
}
export function inner$speakDigits$groups(tel) {
    const groups = telGroups(tel).map((g) => [...g].map((c) => DIGIT_WORDS[Number(c)]).join(' '));
    return groups;
}
export function inner$addPaged$pages(s) {
    const pages = Math.max(1, Math.ceil(s.items.length / s.per));
    return pages;
}
export function inner$addPaged$slice(s, p) {
    const slice = s.items.slice((p - 1) * s.per, p * s.per);
    return slice;
}
export function inner$zmanLabel$label(z) {
    const label = expand(z.label);
    return label;
}
export function inner$zmanimParts$dayIso(clock, hd, night) {
    const dayIso = night ? hd.anchorIso : clock.iso;
    return dayIso;
}
export function inner$zmanimParts$special(cls) {
    const special = cls.dow === 6 && !cls.yomTov ? '' : cls.name ?? '';
    return special;
}
export function inner$zmanimParts$tonight(board) {
    const tonight = board.zmanim.filter((z) => !z.past && z.time && (z.key === 'tzeis' || z.key === 'end' || z.key === 'rt'));
    return tonight;
}
export function inner$zmanimParts$timed(rows) {
    const timed = rows.filter((r) => r.time);
    return timed;
}
export function inner$zmanimParts$bits(clock, hd, sh, night) {
    const dayIso = night ? hd.anchorIso : clock.iso;
    const bits = [
        sh.candle && dayIso !== sh.friIso ? 'הדלקת נרות בערב שבת ' + sh.candle : '',
        sh.end ? 'צאת השבת ' + sh.end : '',
        sh.rabbeinuTam ? 'רבנו תם ' + sh.rabbeinuTam : '',
    ].filter(Boolean);
    return bits;
}
export function inner$zmanimParts$bits$$step(sh, dayIso) {
    const bits = [
        sh.candle && dayIso !== sh.friIso ? 'הדלקת נרות בערב שבת ' + sh.candle : '',
        sh.end ? 'צאת השבת ' + sh.end : '',
        sh.rabbeinuTam ? 'רבנו תם ' + sh.rabbeinuTam : '',
    ].filter(Boolean);
    return bits;
}
export function inner$zmanimParts$head(sh) {
    const head = (sh.current ? 'השבת' : 'השבת הקרובה, ' + sh.hebDate) + (sh.holiday ? ', ' + sh.holiday : '');
    return head;
}
export function inner$whenOf$days(p) {
    const days = [...new Set(Array.isArray(p.days) ? p.days : [])].filter((x) => Number.isInteger(x) && x >= 0 && x <= 6).sort((a, b) => a - b);
    return days;
}
export function inner$whenOf$s(day, time) {
    const s = [day, time ? 'בשעה ' + time : ''].filter(Boolean).join(' ');
    return s;
}
export function inner$noticeLine$label(p) {
    const label = p.kind === 'event' ? 'אירוע' : NOTICE_LABELS.get(String(p.noticeKind)) ?? 'הודעה';
    return label;
}
export function inner$noticeLine$title(p) {
    const title = said(p.title, CAP.label);
    return title;
}
export function inner$noticeLine$text(p) {
    const text = said(p.text, CAP.notice);
    return text;
}
export function inner$noticeLine$place(p) {
    const place = said(p.place, CAP.area);
    return place;
}
export function inner$buildPhoneMenu$community(input) {
    const prefs = input.prefs ?? {};
    const community = said(prefs.communityName, CAP.community);
    return community;
}
export function inner$buildPhoneMenu$community$$step(prefs) {
    const community = said(prefs.communityName, CAP.community);
    return community;
}
export function inner$buildPhoneMenu$brand(input, brandName) {
    const prefs = input.prefs ?? {};
    const community = said(prefs.communityName, CAP.community);
    const brand = community ? brandName + ' של ' + community : brandName;
    return brand;
}
export function inner$buildPhoneMenu$brand$$step(brandName, community) {
    const brand = community ? brandName + ' של ' + community : brandName;
    return brand;
}
export function inner$buildPhoneMenu$per(input) {
    const per = pageSize(input.listingsPerPage, PHONE_PAGE.listings);
    return per;
}
export function inner$buildPhoneMenu$reason(cl) {
    const reason = said(cl.reason, CAP.label) || 'שבת';
    return reason;
}
export function inner$buildPhoneMenu$motzei(cl) {
    const motzei = cl.motzei === 'מוצ״ש' ? 'במוצאי שבת' : 'במוצאי החג';
    return motzei;
}
export function inner$buildPhoneMenu$total(gates) {
    const total = gates.reduce((n, g) => n + g.items.length, 0);
    return total;
}
export function inner$buildPhoneMenu$hasBiz(gates) {
    const total = gates.reduce((n, g) => n + g.items.length, 0);
    const hasBiz = total > 0;
    return hasBiz;
}
export function inner$buildPhoneMenu$hasBiz$$step(total) {
    const hasBiz = total > 0;
    return hasBiz;
}
export function inner$buildPhoneMenu$statusOf$k(l) {
    const k = String(l.id);
    return k;
}
export function inner$buildPhoneMenu$addListing$id(l) {
    const id = bizId(l.id);
    return id;
}
export function inner$buildPhoneMenu$addListing$name(l) {
    const name = nameOf(l);
    return name;
}
export function inner$buildPhoneMenu$addListing$tel(l) {
    const tel = phoneTel(l.phone) || phoneTel(l.phone2);
    return tel;
}
export function inner$buildPhoneMenu$addListing$title(l) {
    const title = said(l.title, CAP.title);
    return title;
}
export function inner$buildPhoneMenu$addListing$area(l) {
    const area = said(l.area || l.city, CAP.area);
    return area;
}
export function inner$buildPhoneMenu$addListing$kashrut(l) {
    const kashrut = said(l.kashrut, CAP.area);
    return kashrut;
}
export function inner$buildPhoneMenu$addListing$marks(l, PR_AUD_NAMES, PR_MARK_LABELS) {
    const kashrut = said(l.kashrut, CAP.area);
    const marks = [
        l.aud === 'men' || l.aud === 'women' ? PR_AUD_NAMES[l.aud] : '',
        l.disc === true ? PR_MARK_LABELS.disc : '',
        l.free === true ? PR_MARK_LABELS.free : '',
        l.emergency === true ? PR_MARK_LABELS.emergency : '',
        kashrut ? 'השגחה: ' + kashrut : '',
    ].filter(Boolean);
    return marks;
}
export function inner$buildPhoneMenu$addListing$marks$$step(l, kashrut, PR_AUD_NAMES, PR_MARK_LABELS) {
    const marks = [
        l.aud === 'men' || l.aud === 'women' ? PR_AUD_NAMES[l.aud] : '',
        l.disc === true ? PR_MARK_LABELS.disc : '',
        l.free === true ? PR_MARK_LABELS.free : '',
        l.emergency === true ? PR_MARK_LABELS.emergency : '',
        kashrut ? 'השגחה: ' + kashrut : '',
    ].filter(Boolean);
    return marks;
}
export function inner$buildPhoneMenu$addListing$back(backTo) {
    const back = opt('0', 'לחזרה הקישו 0', backTo);
    return back;
}
export function inner$buildPhoneMenu$forEach$base(g) {
    const base = `cat/${g.cat.key}`;
    return base;
}
export function inner$buildPhoneMenu$cur(noticePages) {
    const cur = noticePages[noticePages.length - 1];
    return cur;
}
export function inner$buildPhoneMenu$np(lines) {
    const noticePages = [];
    for (const ln of lines) {
        const cur = noticePages[noticePages.length - 1];
        // 60 תווים שמורים לכותרת-העמוד ("הודעות נוספות — עמוד 4 מתוך 4.") ⇒ phonePrompt לעולם לא משמיט הודעה
        if (cur && cur.length < PHONE_PAGE.notices && [...cur, ln].join(' ').length <= PHONE_PROMPT_MAX - 60)
            cur.push(ln);
        else
            noticePages.push([ln]);
    }
    const np = Math.max(1, noticePages.length);
    return np;
}
export function inner$buildPhoneMenu$np$$step(noticePages) {
    const np = Math.max(1, noticePages.length);
    return np;
}
export function inner$buildPhoneMenu$items(lines, p) {
    const noticePages = [];
    for (const ln of lines) {
        const cur = noticePages[noticePages.length - 1];
        // 60 תווים שמורים לכותרת-העמוד ("הודעות נוספות — עמוד 4 מתוך 4.") ⇒ phonePrompt לעולם לא משמיט הודעה
        if (cur && cur.length < PHONE_PAGE.notices && [...cur, ln].join(' ').length <= PHONE_PROMPT_MAX - 60)
            cur.push(ln);
        else
            noticePages.push([ln]);
    }
    const items = noticePages[p - 1] ?? [];
    return items;
}
export function inner$buildPhoneMenu$items$$step(noticePages, p) {
    const items = noticePages[p - 1] ?? [];
    return items;
}
export function inner$buildPhoneMenu$head(lines, p) {
    const noticePages = [];
    for (const ln of lines) {
        const cur = noticePages[noticePages.length - 1];
        // 60 תווים שמורים לכותרת-העמוד ("הודעות נוספות — עמוד 4 מתוך 4.") ⇒ phonePrompt לעולם לא משמיט הודעה
        if (cur && cur.length < PHONE_PAGE.notices && [...cur, ln].join(' ').length <= PHONE_PROMPT_MAX - 60)
            cur.push(ln);
        else
            noticePages.push([ln]);
    }
    const np = Math.max(1, noticePages.length);
    const head = !lines.length
        ? 'אין כרגע הודעות בלוח הקהילה.'
        : p === 1
            ? `הודעות הקהילה: ${lines.length === 1 ? 'הודעה אחת' : lines.length + ' הודעות'}.`
            : `הודעות נוספות — עמוד ${p} מתוך ${np}.`;
    return head;
}
export function inner$buildPhoneMenu$head$$step(lines, np, p) {
    const head = !lines.length
        ? 'אין כרגע הודעות בלוח הקהילה.'
        : p === 1
            ? `הודעות הקהילה: ${lines.length === 1 ? 'הודעה אחת' : lines.length + ' הודעות'}.`
            : `הודעות נוספות — עמוד ${p} מתוך ${np}.`;
    return head;
}
export function inner$buildPhoneMenu$ems(board) {
    const ems = board.emergency
        .map((e) => ({ label: said(e.label, CAP.label) || said(e.phone, CAP.label), tel: phoneTel(e.phone) }))
        .filter((e) => e.tel)
        .map((e, i) => ({ ...e, n: i + 1, page: Math.floor(i / PHONE_PAGE.emergency) + 1 }));
    return ems;
}
export function inner$hebTodaySentence$date(r) {
    const date = said(r.value.hebDayMonth, CAP.label);
    return date;
}
export function inner$hebTodaySentence$hol(r) {
    const hol = r.value.holiday ? said(expand(r.value.holiday), CAP.label) : '';
    return hol;
}
export function inner$hostBranch$label(tonight) {
    const label = said(tonight.label, CAP.label) || 'בדיקת יחידת אירוח פנויה';
    return label;
}
export function inner$freeUnitsParts$units(v) {
    const units = v.free.map((u) => {
        const name = said(u.name, CAP.name) || 'יחידה ללא שם';
        return u.rooms > 0 ? `${name}, ${u.freeRooms === 1 ? 'חדר אחד פנוי' : u.freeRooms + ' חדרים פנויים'}, ${u.freeBeds} מיטות` : `${name}, עד ${u.cap} אורחים`;
    });
    return units;
}
export function inner$freeUnitsParts$map$name(u) {
    const name = said(u.name, CAP.name) || 'יחידה ללא שם';
    return name;
}
export function inner$freeUnitsParts$head(when, v) {
    const units = v.free.map((u) => {
        const name = said(u.name, CAP.name) || 'יחידה ללא שם';
        return u.rooms > 0 ? `${name}, ${u.freeRooms === 1 ? 'חדר אחד פנוי' : u.freeRooms + ' חדרים פנויים'}, ${u.freeBeds} מיטות` : `${name}, עד ${u.cap} אורחים`;
    });
    const head = units.length === 1 ? `${when} פנויה יחידת אירוח אחת:` : `${when} פנויות ${units.length} יחידות אירוח:`;
    return head;
}
export function inner$freeUnitsParts$head$$step(when, units) {
    const head = units.length === 1 ? `${when} פנויה יחידת אירוח אחת:` : `${when} פנויות ${units.length} יחידות אירוח:`;
    return head;
}
export function inner$freeUnitsParts$more(v) {
    const units = v.free.map((u) => {
        const name = said(u.name, CAP.name) || 'יחידה ללא שם';
        return u.rooms > 0 ? `${name}, ${u.freeRooms === 1 ? 'חדר אחד פנוי' : u.freeRooms + ' חדרים פנויים'}, ${u.freeBeds} מיטות` : `${name}, עד ${u.cap} אורחים`;
    });
    const more = units.length > 4 ? `, ועוד ${units.length - 4}` : '';
    return more;
}
export function inner$freeUnitsParts$more$$step(units) {
    const more = units.length > 4 ? `, ועוד ${units.length - 4}` : '';
    return more;
}
export function inner$resolveDialCode$c(code) {
    const c = String(code ?? '').replace(/\D/g, '').slice(0, 12);
    return c;
}
export function inner$resolveDialCode$target(menu, code) {
    const c = String(code ?? '').replace(/\D/g, '').slice(0, 12);
    const target = /^\d{3}$/.test(c) && Object.hasOwn(menu.codes, c) ? menu.codes[c] : '';
    return target;
}
export function inner$resolveDialCode$target$$step(menu, c) {
    const target = /^\d{3}$/.test(c) && Object.hasOwn(menu.codes, c) ? menu.codes[c] : '';
    return target;
}
export function inner$resolveDialCode$node(menu, code) {
    const c = String(code ?? '').replace(/\D/g, '').slice(0, 12);
    const target = /^\d{3}$/.test(c) && Object.hasOwn(menu.codes, c) ? menu.codes[c] : '';
    const node = target && Object.hasOwn(menu.nodes, target) ? menu.nodes[target] : undefined;
    return node;
}
export function inner$resolveDialCode$node$$step(menu, target) {
    const node = target && Object.hasOwn(menu.nodes, target) ? menu.nodes[target] : undefined;
    return node;
}
export function inner$resolveDialCode$retry() {
    const retry = opt('2', 'להקשת קוד אחר הקישו 2', 'code');
    return retry;
}
export function inner$resolveSpeech$here(menu, nodeId) {
    const here = Object.hasOwn(menu.nodes, nodeId) ? menu.nodes[nodeId] : undefined;
    return here;
}
export function inner$resolveSpeech$retry(menu, nodeId) {
    const here = Object.hasOwn(menu.nodes, nodeId) ? menu.nodes[nodeId] : undefined;
    const retry = opt('2', 'לניסיון נוסף הקישו 2', here ? here.id : menu.root);
    return retry;
}
export function inner$resolveSpeech$retry$$step(menu, here) {
    const retry = opt('2', 'לניסיון נוסף הקישו 2', here ? here.id : menu.root);
    return retry;
}
export function inner$resolveSpeech$raw(utterance) {
    const raw = String(utterance ?? '');
    return raw;
}
export function inner$resolveSpeech$heard(echo) {
    const heard = 'שמעתי: ' + echo;
    return heard;
}
export function inner$resolveSpeech$id(menu, nodeId) {
    const here = Object.hasOwn(menu.nodes, nodeId) ? menu.nodes[nodeId] : undefined;
    const id = 'confirm/speech/' + here.id;
    return id;
}
export function inner$resolveSpeech$id$$step(here) {
    const id = 'confirm/speech/' + here.id;
    return id;
}
export function inner$resolveSpeech$node(menu, t) {
    const node = Object.hasOwn(menu.nodes, t) ? menu.nodes[t] : undefined;
    return node;
}
export function inner$resolveSpeech$q(utterance) {
    const raw = String(utterance ?? '');
    const q = raw.replace(/(\d)[\s\-–.]+(?=\d)/g, '$1').replace(/\d+/g, (d) => (d.length >= 7 ? d : ' '));
    return q;
}
export function inner$resolveSpeech$q$$step(raw) {
    const q = raw.replace(/(\d)[\s\-–.]+(?=\d)/g, '$1').replace(/\d+/g, (d) => (d.length >= 7 ? d : ' '));
    return q;
}
export function inner$resolveSpeech$target(hit) {
    const target = bizId(hit.listing.id);
    return target;
}
export function inner$phoneStep$buf(at, key) {
    const buf = at.buf + key;
    return buf;
}
export function inner$phoneStep$o(key, cur) {
    const o = cur.options.find((x) => x.digit === key);
    return o;
}
export function inner$walkPhone$seq(keys) {
    const seq = (typeof keys === 'string' ? keys : keys.join('')).replace(/[^0-9*#]/g, '');
    return seq;
}
export function inner$walkPhone$root(menu) {
    const root = Object.hasOwn(menu.nodes, menu.root) ? menu.nodes[menu.root] : undefined;
    return root;
}
export function inner$walkPhone$r(menu, at, k) {
    const r = phoneStep(menu, at, k);
    return r;
}
export function inner$phoneScriptText$ids(menu) {
    const ids = Object.keys(menu.nodes);
    return ids;
}
export function inner$phoneScriptText$out(menu) {
    const ids = Object.keys(menu.nodes);
    const out = [
        `הקו של ${menu.brand} — תסריט הקריינות`,
        `נכון לרגע ${menu.asOf} (שעון הקהילה) · ${ids.length} צמתים` + (menu.closed ? ' · הקו סגור ברגע הזה (שבת/חג) — השורש הוא הודעת הסגירה' : ''),
        'מקרא: [מזהה] סוג · הנוסח · "מקש — מה נאמר ← יעד" · [פעולה] מה שהמתאם מבצע (חיבור רק אחרי אישור).',
    ];
    return out;
}
export function inner$phoneScriptText$out$$step(menu, ids) {
    const out = [
        `הקו של ${menu.brand} — תסריט הקריינות`,
        `נכון לרגע ${menu.asOf} (שעון הקהילה) · ${ids.length} צמתים` + (menu.closed ? ' · הקו סגור ברגע הזה (שבת/חג) — השורש הוא הודעת הסגירה' : ''),
        'מקרא: [מזהה] סוג · הנוסח · "מקש — מה נאמר ← יעד" · [פעולה] מה שהמתאם מבצע (חיבור רק אחרי אישור).',
    ];
    return out;
}
export function inner$phoneScriptText$tags(menu, n) {
    const tags = [PHONE_KIND_LABELS[n.kind], n.id === menu.root ? 'שורש' : '', n.speech ? 'דיבור או מקשים' : '', n.collect ? `איסוף ${n.collect} ספרות` : '']
        .filter(Boolean)
        .join(' · ');
    return tags;
}
export function inner$phonePrompt$out$$after_loop(parts, max) {
    let out = '';
    for (const raw of parts) {
        const p = raw.replace(/\s+/g, ' ').trim();
        if (!p)
            continue;
        const next = out ? out + ' ' + p : p;
        if (next.length > max) {
            if (!out)
                out = clip(p, max);
            break;
        }
        out = next;
    }
    return out;
}
export function inner$buildPhoneMenu$noticePages$$after_loop(lines) {
    const noticePages = [];
    for (const ln of lines) {
        const cur = noticePages[noticePages.length - 1];
        // 60 תווים שמורים לכותרת-העמוד ("הודעות נוספות — עמוד 4 מתוך 4.") ⇒ phonePrompt לעולם לא משמיט הודעה
        if (cur && cur.length < PHONE_PAGE.notices && [...cur, ln].join(' ').length <= PHONE_PROMPT_MAX - 60)
            cur.push(ln);
        else
            noticePages.push([ln]);
    }
    return noticePages;
}
export function inner$walkPhone$out$$after_loop(menu, keys) {
    const seq = (typeof keys === 'string' ? keys : keys.join('')).replace(/[^0-9*#]/g, '');
    const root = Object.hasOwn(menu.nodes, menu.root) ? menu.nodes[menu.root] : undefined;
    const out = [root];
    let at = { node: root, buf: '' };
    for (const k of seq) {
        const r = phoneStep(menu, at, k);
        if (!r)
            break;
        at = { node: r.node, buf: r.buf };
        if (r.moved)
            out.push(r.node);
    }
    return out;
}
export function inner$walkPhone$at$$after_loop(menu, keys) {
    const seq = (typeof keys === 'string' ? keys : keys.join('')).replace(/[^0-9*#]/g, '');
    const root = Object.hasOwn(menu.nodes, menu.root) ? menu.nodes[menu.root] : undefined;
    const out = [root];
    let at = { node: root, buf: '' };
    for (const k of seq) {
        const r = phoneStep(menu, at, k);
        if (!r)
            break;
        at = { node: r.node, buf: r.buf };
        if (r.moved)
            out.push(r.node);
    }
    return at;
}
export function inner$phoneScriptText$out$$after_loop(menu) {
    const ids = Object.keys(menu.nodes);
    const out = [
        `הקו של ${menu.brand} — תסריט הקריינות`,
        `נכון לרגע ${menu.asOf} (שעון הקהילה) · ${ids.length} צמתים` + (menu.closed ? ' · הקו סגור ברגע הזה (שבת/חג) — השורש הוא הודעת הסגירה' : ''),
        'מקרא: [מזהה] סוג · הנוסח · "מקש — מה נאמר ← יעד" · [פעולה] מה שהמתאם מבצע (חיבור רק אחרי אישור).',
    ];
    for (const id of ids) {
        const n = menu.nodes[id];
        const tags = [PHONE_KIND_LABELS[n.kind], n.id === menu.root ? 'שורש' : '', n.speech ? 'דיבור או מקשים' : '', n.collect ? `איסוף ${n.collect} ספרות` : '']
            .filter(Boolean)
            .join(' · ');
        out.push('', `[${n.id}] ${tags}`, n.prompt);
        for (const o of n.options)
            out.push(`  ${phoneKeyName(o.digit)} — ${o.say} ← ${o.to}`);
        if (n.action?.kind === 'connect')
            out.push(`  [פעולה] חיבור שיחה אל ${n.action.label}: ${n.action.tel}`);
        else if (n.action?.kind === 'readNumber')
            out.push(`  [פעולה] הקראת המספר ספרה-ספרה: ${n.action.groups.join('-')}`);
    }
    return out;
}

export const SIGS = {
  inner$clip$cut: [{"name":"s","d":{"t":"str"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$clip$sp: [{"name":"s","d":{"t":"str"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$clip$sp$$step: [{"name":"cut","d":{"t":"str"},"opt":false}],
  inner$phonePrompt$p: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$phonePrompt$next: [{"name":"out","d":{"t":"str"},"opt":false},{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$phonePrompt$next$$step: [{"name":"out","d":{"t":"str"},"opt":false},{"name":"p","d":{"t":"str"},"opt":false}],
  inner$phoneTel$raw: [{"name":"phone","d":{"t":"any"},"opt":false}],
  inner$phoneTel$d: [{"name":"phone","d":{"t":"any"},"opt":false}],
  inner$phoneTel$d$$step: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$telGroups$d: [{"name":"tel","d":{"t":"str"},"opt":false}],
  inner$speakDigits$groups: [{"name":"tel","d":{"t":"str"},"opt":false}],
  inner$addPaged$pages: [{"name":"s","d":{"t":"obj","n":"PageSpec","p":[["base",{"t":"str"},false],["per",{"t":"num"},false],["items",{"t":"arr","of":{"t":"tp","id":"T","of":{"t":"any"}}},false],["label",{"t":"str"},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["head",{"t":"fn"},false],["empty",{"t":"arr","of":{"t":"str"}},false],["item",{"t":"fn"},false],["back",{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]},false]]},"opt":false}],
  inner$addPaged$slice: [{"name":"s","d":{"t":"obj","n":"PageSpec","p":[["base",{"t":"str"},false],["per",{"t":"num"},false],["items",{"t":"arr","of":{"t":"tp","id":"T","of":{"t":"any"}}},false],["label",{"t":"str"},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["head",{"t":"fn"},false],["empty",{"t":"arr","of":{"t":"str"}},false],["item",{"t":"fn"},false],["back",{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]},false]]},"opt":false},{"name":"p","d":{"t":"num"},"opt":false}],
  inner$zmanLabel$label: [{"name":"z","d":{"t":"obj","n":"PrZman","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["sub",{"t":"str"},false],["time",{"t":"str"},false]]},"opt":false}],
  inner$zmanimParts$dayIso: [{"name":"clock","d":{"t":"obj","n":"PrClock","p":[["iso",{"t":"str"},false],["hhmm",{"t":"str"},false],["dow",{"t":"num"},false],["ms",{"t":"num"},false]]},"opt":false},{"name":"hd","d":{"t":"obj","n":"PrHebDate","p":[["anchorIso",{"t":"str"},false],["day",{"t":"num"},false],["monthHe",{"t":"str"},false],["year",{"t":"num"},false],["text",{"t":"str"},false],["night",{"t":"bool"},false]]},"opt":false},{"name":"night","d":{"t":"bool"},"opt":false}],
  inner$zmanimParts$special: [{"name":"cls","d":{"t":"obj","n":"DayClass","p":[["iso",{"t":"str"},false],["monthHe",{"t":"str"},false],["day",{"t":"num"},false],["dow",{"t":"num"},false],["shabbat",{"t":"bool"},false],["yomTov",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["erevChag",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["cholHamoed",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["fast",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["roshChodesh",{"t":"bool"},false],["name",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["closedReason",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false}],
  inner$zmanimParts$tonight: [{"name":"board","d":{"t":"obj","n":"PrZmanimBoard","p":[["clock",{"t":"obj","n":"PrClock","p":[["iso",{"t":"str"},false],["hhmm",{"t":"str"},false],["dow",{"t":"num"},false],["ms",{"t":"num"},false]]},false],["loc",{"t":"obj","n":"PrZmanimLoc","p":[["lat",{"t":"num"},false],["lon",{"t":"num"},false],["tz",{"t":"str"},false],["candleMin",{"t":"num"},false],["tzeisMin",{"t":"num"},false],["label",{"t":"str"},false],["elevation",{"t":"num"},false],["cityKey",{"t":"str"},false],["diaspora",{"t":"bool"},false]]},false],["note",{"t":"str"},false],["hebDate",{"t":"obj","n":"PrHebDate","p":[["anchorIso",{"t":"str"},false],["day",{"t":"num"},false],["monthHe",{"t":"str"},false],["year",{"t":"num"},false],["text",{"t":"str"},false],["night",{"t":"bool"},false]]},false],["dayName",{"t":"str"},false],["zmanim",{"t":"arr","of":{"t":"obj","n":"PrBoardZman","p":[["past",{"t":"bool"},false],["next",{"t":"bool"},false],["key",{"t":"str"},false],["label",{"t":"str"},false],["sub",{"t":"str"},false],["time",{"t":"str"},false]]}},false],["nextZman",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"PrBoardZman","p":[["past",{"t":"bool"},false],["next",{"t":"bool"},false],["key",{"t":"str"},false],["label",{"t":"str"},false],["sub",{"t":"str"},false],["time",{"t":"str"},false]]}]},false],["minyanim",{"t":"arr","of":{"t":"obj","n":"PrMinyanTime","p":[["postId",{"t":"str"},false],["shul",{"t":"str"},false],["place",{"t":"str"},false],["prayer",{"t":"str"},false],["time",{"t":"str"},false],["token",{"t":"str"},false]]}},false],["nextMinyan",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"PrMinyanTime","p":[["postId",{"t":"str"},false],["shul",{"t":"str"},false],["place",{"t":"str"},false],["prayer",{"t":"str"},false],["time",{"t":"str"},false],["token",{"t":"str"},false]]}]},false],["shabbat",{"t":"obj","n":"PrShabbat","p":[["friIso",{"t":"str"},false],["satIso",{"t":"str"},false],["candle",{"t":"str"},false],["end",{"t":"str"},false],["rabbeinuTam",{"t":"str"},false],["current",{"t":"bool"},false],["hebDate",{"t":"str"},false],["mevarchim",{"t":"str"},false],["holiday",{"t":"str"},false]]},false],["closure",{"t":"obj","n":"PrClosure","p":[["closed",{"t":"bool"},false],["reason",{"t":"str"},false],["kind",{"t":"lit","v":["","shabbat","yomtov"]},false],["endIso",{"t":"str"},false],["endTime",{"t":"str"},false],["motzei",{"t":"str"},false]]},false],["closures",{"t":"arr","of":{"t":"obj","n":"ClosedWindow","p":[["startIso",{"t":"str"},false],["startTime",{"t":"str"},false],["endIso",{"t":"str"},false],["endTime",{"t":"str"},false],["reason",{"t":"str"},false],["kind",{"t":"str"},false],["days",{"t":"num"},false]]}},false],["emergency",{"t":"arr","of":{"t":"obj","n":"PrEmergency","p":[["label",{"t":"str"},false],["phone",{"t":"str"},false],["note",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$zmanimParts$timed: [{"name":"rows","d":{"t":"arr","of":{"t":"obj","n":"PrZman","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["sub",{"t":"str"},false],["time",{"t":"str"},false]]}},"opt":false}],
  inner$zmanimParts$bits: [{"name":"clock","d":{"t":"obj","n":"PrClock","p":[["iso",{"t":"str"},false],["hhmm",{"t":"str"},false],["dow",{"t":"num"},false],["ms",{"t":"num"},false]]},"opt":false},{"name":"hd","d":{"t":"obj","n":"PrHebDate","p":[["anchorIso",{"t":"str"},false],["day",{"t":"num"},false],["monthHe",{"t":"str"},false],["year",{"t":"num"},false],["text",{"t":"str"},false],["night",{"t":"bool"},false]]},"opt":false},{"name":"sh","d":{"t":"obj","n":"PrShabbat","p":[["friIso",{"t":"str"},false],["satIso",{"t":"str"},false],["candle",{"t":"str"},false],["end",{"t":"str"},false],["rabbeinuTam",{"t":"str"},false],["current",{"t":"bool"},false],["hebDate",{"t":"str"},false],["mevarchim",{"t":"str"},false],["holiday",{"t":"str"},false]]},"opt":false},{"name":"night","d":{"t":"bool"},"opt":false}],
  inner$zmanimParts$bits$$step: [{"name":"sh","d":{"t":"obj","n":"PrShabbat","p":[["friIso",{"t":"str"},false],["satIso",{"t":"str"},false],["candle",{"t":"str"},false],["end",{"t":"str"},false],["rabbeinuTam",{"t":"str"},false],["current",{"t":"bool"},false],["hebDate",{"t":"str"},false],["mevarchim",{"t":"str"},false],["holiday",{"t":"str"},false]]},"opt":false},{"name":"dayIso","d":{"t":"str"},"opt":false}],
  inner$zmanimParts$head: [{"name":"sh","d":{"t":"obj","n":"PrShabbat","p":[["friIso",{"t":"str"},false],["satIso",{"t":"str"},false],["candle",{"t":"str"},false],["end",{"t":"str"},false],["rabbeinuTam",{"t":"str"},false],["current",{"t":"bool"},false],["hebDate",{"t":"str"},false],["mevarchim",{"t":"str"},false],["holiday",{"t":"str"},false]]},"opt":false}],
  inner$whenOf$days: [{"name":"p","d":{"t":"obj","n":"PrPost","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["notice","minyan","event","emergency"]},false],["title",{"t":"str"},false],["text",{"t":"str"},false],["place",{"t":"str"},false],["phone",{"t":"str"},false],["noticeKind",{"t":"str"},false],["prayers",{"t":"arr","of":{"t":"obj","n":"PrPrayerTimes","p":[["prayer",{"t":"str"},false],["times",{"t":"arr","of":{"t":"str"}},false]]}},false],["days",{"t":"arr","of":{"t":"num"}},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["until",{"t":"str"},false],["approved",{"t":"bool"},false],["pinned",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$whenOf$s: [{"name":"day","d":{"t":"str"},"opt":false},{"name":"time","d":{"t":"str"},"opt":false}],
  inner$noticeLine$label: [{"name":"p","d":{"t":"obj","n":"PrPost","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["notice","minyan","event","emergency"]},false],["title",{"t":"str"},false],["text",{"t":"str"},false],["place",{"t":"str"},false],["phone",{"t":"str"},false],["noticeKind",{"t":"str"},false],["prayers",{"t":"arr","of":{"t":"obj","n":"PrPrayerTimes","p":[["prayer",{"t":"str"},false],["times",{"t":"arr","of":{"t":"str"}},false]]}},false],["days",{"t":"arr","of":{"t":"num"}},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["until",{"t":"str"},false],["approved",{"t":"bool"},false],["pinned",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$noticeLine$title: [{"name":"p","d":{"t":"obj","n":"PrPost","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["notice","minyan","event","emergency"]},false],["title",{"t":"str"},false],["text",{"t":"str"},false],["place",{"t":"str"},false],["phone",{"t":"str"},false],["noticeKind",{"t":"str"},false],["prayers",{"t":"arr","of":{"t":"obj","n":"PrPrayerTimes","p":[["prayer",{"t":"str"},false],["times",{"t":"arr","of":{"t":"str"}},false]]}},false],["days",{"t":"arr","of":{"t":"num"}},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["until",{"t":"str"},false],["approved",{"t":"bool"},false],["pinned",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$noticeLine$text: [{"name":"p","d":{"t":"obj","n":"PrPost","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["notice","minyan","event","emergency"]},false],["title",{"t":"str"},false],["text",{"t":"str"},false],["place",{"t":"str"},false],["phone",{"t":"str"},false],["noticeKind",{"t":"str"},false],["prayers",{"t":"arr","of":{"t":"obj","n":"PrPrayerTimes","p":[["prayer",{"t":"str"},false],["times",{"t":"arr","of":{"t":"str"}},false]]}},false],["days",{"t":"arr","of":{"t":"num"}},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["until",{"t":"str"},false],["approved",{"t":"bool"},false],["pinned",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$noticeLine$place: [{"name":"p","d":{"t":"obj","n":"PrPost","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["notice","minyan","event","emergency"]},false],["title",{"t":"str"},false],["text",{"t":"str"},false],["place",{"t":"str"},false],["phone",{"t":"str"},false],["noticeKind",{"t":"str"},false],["prayers",{"t":"arr","of":{"t":"obj","n":"PrPrayerTimes","p":[["prayer",{"t":"str"},false],["times",{"t":"arr","of":{"t":"str"}},false]]}},false],["days",{"t":"arr","of":{"t":"num"}},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["until",{"t":"str"},false],["approved",{"t":"bool"},false],["pinned",{"t":"bool"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$buildPhoneMenu$community: [{"name":"input","d":{"t":"obj","n":"PhoneMenuInput","p":[["listings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["posts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prefs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"ParnasaPrefs","p":[["communityName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["requireApproval",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["contactPhone",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dedication",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["bookletDedication",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[]}]},true],["zmanim",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ParnasaZmanimPrefs","p":[]}]},true]]}]},true],["nowMs",{"t":"num"},false],["loc",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PrZmanimLoc","p":[["lat",{"t":"num"},false],["lon",{"t":"num"},false],["tz",{"t":"str"},false],["candleMin",{"t":"num"},false],["tzeisMin",{"t":"num"},false],["label",{"t":"str"},false],["elevation",{"t":"num"},false],["cityKey",{"t":"str"},false],["diaspora",{"t":"bool"},false]]}]},true],["config",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]}]},true],["listingsPerPage",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["switchboard",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PhoneSwitchboard","p":[["ask",{"t":"fn"},false],["ctx",{"t":"obj","n":"SwitchCtx","p":[]},false]]}]},true],["hebDateGreeting",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["engineLinks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]},"opt":false}],
  inner$buildPhoneMenu$community$$step: [{"name":"prefs","d":{"t":"obj","n":"ParnasaPrefs","p":[["communityName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["requireApproval",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["contactPhone",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dedication",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["bookletDedication",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["small",{"t":"any"},true],["board",{"t":"any"},true],["full",{"t":"any"},true],["half",{"t":"any"},true],["featured",{"t":"any"},true],["sponsor",{"t":"any"},true],["dedication",{"t":"any"},true],["job",{"t":"any"},true]]}]},true],["zmanim",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ParnasaZmanimPrefs","p":[["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lat",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lon",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["elevation",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tz",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["candleMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tzeisMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},true]]},"opt":false}],
  inner$buildPhoneMenu$brand: [{"name":"input","d":{"t":"obj","n":"PhoneMenuInput","p":[["listings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["posts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prefs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"ParnasaPrefs","p":[["communityName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["requireApproval",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["contactPhone",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dedication",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["bookletDedication",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[]}]},true],["zmanim",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ParnasaZmanimPrefs","p":[]}]},true]]}]},true],["nowMs",{"t":"num"},false],["loc",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PrZmanimLoc","p":[["lat",{"t":"num"},false],["lon",{"t":"num"},false],["tz",{"t":"str"},false],["candleMin",{"t":"num"},false],["tzeisMin",{"t":"num"},false],["label",{"t":"str"},false],["elevation",{"t":"num"},false],["cityKey",{"t":"str"},false],["diaspora",{"t":"bool"},false]]}]},true],["config",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]}]},true],["listingsPerPage",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["switchboard",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PhoneSwitchboard","p":[["ask",{"t":"fn"},false],["ctx",{"t":"obj","n":"SwitchCtx","p":[]},false]]}]},true],["hebDateGreeting",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["engineLinks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]},"opt":false},{"name":"brandName","d":{"t":"str"},"opt":false}],
  inner$buildPhoneMenu$brand$$step: [{"name":"brandName","d":{"t":"str"},"opt":false},{"name":"community","d":{"t":"str"},"opt":false}],
  inner$buildPhoneMenu$per: [{"name":"input","d":{"t":"obj","n":"PhoneMenuInput","p":[["listings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["posts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prefs",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"ParnasaPrefs","p":[["communityName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["requireApproval",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["contactPhone",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dedication",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["bookletDedication",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[]}]},true],["zmanim",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ParnasaZmanimPrefs","p":[]}]},true]]}]},true],["nowMs",{"t":"num"},false],["loc",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PrZmanimLoc","p":[["lat",{"t":"num"},false],["lon",{"t":"num"},false],["tz",{"t":"str"},false],["candleMin",{"t":"num"},false],["tzeisMin",{"t":"num"},false],["label",{"t":"str"},false],["elevation",{"t":"num"},false],["cityKey",{"t":"str"},false],["diaspora",{"t":"bool"},false]]}]},true],["config",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]}]},true],["listingsPerPage",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["switchboard",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PhoneSwitchboard","p":[["ask",{"t":"fn"},false],["ctx",{"t":"obj","n":"SwitchCtx","p":[]},false]]}]},true],["hebDateGreeting",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["engineLinks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]},"opt":false}],
  inner$buildPhoneMenu$reason: [{"name":"cl","d":{"t":"obj","n":"PrClosure","p":[["closed",{"t":"bool"},false],["reason",{"t":"str"},false],["kind",{"t":"lit","v":["","shabbat","yomtov"]},false],["endIso",{"t":"str"},false],["endTime",{"t":"str"},false],["motzei",{"t":"str"},false]]},"opt":false}],
  inner$buildPhoneMenu$motzei: [{"name":"cl","d":{"t":"obj","n":"PrClosure","p":[["closed",{"t":"bool"},false],["reason",{"t":"str"},false],["kind",{"t":"lit","v":["","shabbat","yomtov"]},false],["endIso",{"t":"str"},false],["endTime",{"t":"str"},false],["motzei",{"t":"str"},false]]},"opt":false}],
  inner$buildPhoneMenu$total: [{"name":"gates","d":{"t":"arr","of":{"t":"obj","n":"PrGate","p":[["cat",{"t":"obj","n":"PrCategory","p":[["key",{"t":"lit","v":["home","events","health","build","elec","car","fin","tech","edu","stam","fashion","food","realestate","trade","other"]},false],["name",{"t":"str"},false],["short",{"t":"str"},false],["icon",{"t":"str"},false],["color",{"t":"str"},false],["num",{"t":"str"},false]]},false],["items",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]}},"opt":false}],
  inner$buildPhoneMenu$hasBiz: [{"name":"gates","d":{"t":"arr","of":{"t":"obj","n":"PrGate","p":[["cat",{"t":"obj","n":"PrCategory","p":[["key",{"t":"lit","v":["home","events","health","build","elec","car","fin","tech","edu","stam","fashion","food","realestate","trade","other"]},false],["name",{"t":"str"},false],["short",{"t":"str"},false],["icon",{"t":"str"},false],["color",{"t":"str"},false],["num",{"t":"str"},false]]},false],["items",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]}},"opt":false}],
  inner$buildPhoneMenu$hasBiz$$step: [{"name":"total","d":{"t":"num"},"opt":false}],
  inner$buildPhoneMenu$statusOf$k: [{"name":"l","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$buildPhoneMenu$addListing$id: [{"name":"l","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$buildPhoneMenu$addListing$name: [{"name":"l","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$buildPhoneMenu$addListing$tel: [{"name":"l","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$buildPhoneMenu$addListing$title: [{"name":"l","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$buildPhoneMenu$addListing$area: [{"name":"l","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$buildPhoneMenu$addListing$kashrut: [{"name":"l","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$buildPhoneMenu$addListing$marks: [{"name":"l","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false},{"name":"PR_AUD_NAMES","d":{"t":"rec","of":{"t":"str"}},"opt":false},{"name":"PR_MARK_LABELS","d":{"t":"obj","p":[["disc",{"t":"lit","v":["הנחה לקהילה"]},false],["free",{"t":"lit","v":["גמ״ח"]},false],["emergency",{"t":"lit","v":["זמינים לקריאות חירום"]},false]]},"opt":false}],
  inner$buildPhoneMenu$addListing$marks$$step: [{"name":"l","d":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false},{"name":"kashrut","d":{"t":"str"},"opt":false},{"name":"PR_AUD_NAMES","d":{"t":"rec","of":{"t":"str"}},"opt":false},{"name":"PR_MARK_LABELS","d":{"t":"obj","p":[["disc",{"t":"lit","v":["הנחה לקהילה"]},false],["free",{"t":"lit","v":["גמ״ח"]},false],["emergency",{"t":"lit","v":["זמינים לקריאות חירום"]},false]]},"opt":false}],
  inner$buildPhoneMenu$addListing$back: [{"name":"backTo","d":{"t":"str"},"opt":false}],
  inner$buildPhoneMenu$forEach$base: [{"name":"g","d":{"t":"obj","n":"PrGate","p":[["cat",{"t":"obj","n":"PrCategory","p":[["key",{"t":"lit","v":["home","events","health","build","elec","car","fin","tech","edu","stam","fashion","food","realestate","trade","other"]},false],["name",{"t":"str"},false],["short",{"t":"str"},false],["icon",{"t":"str"},false],["color",{"t":"str"},false],["num",{"t":"str"},false]]},false],["items",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]},"opt":false}],
  inner$buildPhoneMenu$cur: [{"name":"noticePages","d":{"t":"arr","of":{"t":"arr","of":{"t":"str"}}},"opt":false}],
  inner$buildPhoneMenu$np: [{"name":"lines","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$buildPhoneMenu$np$$step: [{"name":"noticePages","d":{"t":"arr","of":{"t":"arr","of":{"t":"str"}}},"opt":false}],
  inner$buildPhoneMenu$items: [{"name":"lines","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"p","d":{"t":"num"},"opt":false}],
  inner$buildPhoneMenu$items$$step: [{"name":"noticePages","d":{"t":"arr","of":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"p","d":{"t":"num"},"opt":false}],
  inner$buildPhoneMenu$head: [{"name":"lines","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"p","d":{"t":"num"},"opt":false}],
  inner$buildPhoneMenu$head$$step: [{"name":"lines","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"np","d":{"t":"num"},"opt":false},{"name":"p","d":{"t":"num"},"opt":false}],
  inner$buildPhoneMenu$ems: [{"name":"board","d":{"t":"obj","n":"PrZmanimBoard","p":[["clock",{"t":"obj","n":"PrClock","p":[["iso",{"t":"str"},false],["hhmm",{"t":"str"},false],["dow",{"t":"num"},false],["ms",{"t":"num"},false]]},false],["loc",{"t":"obj","n":"PrZmanimLoc","p":[["lat",{"t":"num"},false],["lon",{"t":"num"},false],["tz",{"t":"str"},false],["candleMin",{"t":"num"},false],["tzeisMin",{"t":"num"},false],["label",{"t":"str"},false],["elevation",{"t":"num"},false],["cityKey",{"t":"str"},false],["diaspora",{"t":"bool"},false]]},false],["note",{"t":"str"},false],["hebDate",{"t":"obj","n":"PrHebDate","p":[["anchorIso",{"t":"str"},false],["day",{"t":"num"},false],["monthHe",{"t":"str"},false],["year",{"t":"num"},false],["text",{"t":"str"},false],["night",{"t":"bool"},false]]},false],["dayName",{"t":"str"},false],["zmanim",{"t":"arr","of":{"t":"obj","n":"PrBoardZman","p":[["past",{"t":"bool"},false],["next",{"t":"bool"},false],["key",{"t":"str"},false],["label",{"t":"str"},false],["sub",{"t":"str"},false],["time",{"t":"str"},false]]}},false],["nextZman",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"PrBoardZman","p":[["past",{"t":"bool"},false],["next",{"t":"bool"},false],["key",{"t":"str"},false],["label",{"t":"str"},false],["sub",{"t":"str"},false],["time",{"t":"str"},false]]}]},false],["minyanim",{"t":"arr","of":{"t":"obj","n":"PrMinyanTime","p":[["postId",{"t":"str"},false],["shul",{"t":"str"},false],["place",{"t":"str"},false],["prayer",{"t":"str"},false],["time",{"t":"str"},false],["token",{"t":"str"},false]]}},false],["nextMinyan",{"t":"or","of":[{"t":"null"},{"t":"obj","n":"PrMinyanTime","p":[["postId",{"t":"str"},false],["shul",{"t":"str"},false],["place",{"t":"str"},false],["prayer",{"t":"str"},false],["time",{"t":"str"},false],["token",{"t":"str"},false]]}]},false],["shabbat",{"t":"obj","n":"PrShabbat","p":[["friIso",{"t":"str"},false],["satIso",{"t":"str"},false],["candle",{"t":"str"},false],["end",{"t":"str"},false],["rabbeinuTam",{"t":"str"},false],["current",{"t":"bool"},false],["hebDate",{"t":"str"},false],["mevarchim",{"t":"str"},false],["holiday",{"t":"str"},false]]},false],["closure",{"t":"obj","n":"PrClosure","p":[["closed",{"t":"bool"},false],["reason",{"t":"str"},false],["kind",{"t":"lit","v":["","shabbat","yomtov"]},false],["endIso",{"t":"str"},false],["endTime",{"t":"str"},false],["motzei",{"t":"str"},false]]},false],["closures",{"t":"arr","of":{"t":"obj","n":"ClosedWindow","p":[["startIso",{"t":"str"},false],["startTime",{"t":"str"},false],["endIso",{"t":"str"},false],["endTime",{"t":"str"},false],["reason",{"t":"str"},false],["kind",{"t":"str"},false],["days",{"t":"num"},false]]}},false],["emergency",{"t":"arr","of":{"t":"obj","n":"PrEmergency","p":[["label",{"t":"str"},false],["phone",{"t":"str"},false],["note",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$hebTodaySentence$date: [{"name":"r","d":{"t":"or","of":[{"t":"obj","n":"Unavailable","p":[["ok",{"t":"lit","v":[false]},false],["unavailable",{"t":"lit","v":[true]},false],["id",{"t":"str"},false],["reason",{"t":"lit","v":["error","off","unknown","loading"]},false],["message",{"t":"str"},false]]},{"t":"obj","n":"Answer","p":[["ok",{"t":"lit","v":[true]},false],["id",{"t":"str"},false],["module",{"t":"str"},false],["label",{"t":"str"},false],["value",{"t":"obj","n":"DayInfoOutput","p":[["iso",{"t":"str"},false],["valid",{"t":"bool"},false],["hebDate",{"t":"str"},false],["hebDayMonth",{"t":"str"},false],["hebDay",{"t":"str"},false],["hebMonth",{"t":"str"},false],["hebYear",{"t":"str"},false],["holiday",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["dayName",{"t":"str"},false],["isShabbat",{"t":"bool"},false],["isYomTov",{"t":"bool"},false],["closed",{"t":"bool"},false]]},false]]}]},"opt":false}],
  inner$hebTodaySentence$hol: [{"name":"r","d":{"t":"or","of":[{"t":"obj","n":"Unavailable","p":[["ok",{"t":"lit","v":[false]},false],["unavailable",{"t":"lit","v":[true]},false],["id",{"t":"str"},false],["reason",{"t":"lit","v":["error","off","unknown","loading"]},false],["message",{"t":"str"},false]]},{"t":"obj","n":"Answer","p":[["ok",{"t":"lit","v":[true]},false],["id",{"t":"str"},false],["module",{"t":"str"},false],["label",{"t":"str"},false],["value",{"t":"obj","n":"DayInfoOutput","p":[["iso",{"t":"str"},false],["valid",{"t":"bool"},false],["hebDate",{"t":"str"},false],["hebDayMonth",{"t":"str"},false],["hebDay",{"t":"str"},false],["hebMonth",{"t":"str"},false],["hebYear",{"t":"str"},false],["holiday",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["dayName",{"t":"str"},false],["isShabbat",{"t":"bool"},false],["isYomTov",{"t":"bool"},false],["closed",{"t":"bool"},false]]},false]]}]},"opt":false}],
  inner$hostBranch$label: [{"name":"tonight","d":{"t":"or","of":[{"t":"obj","n":"Unavailable","p":[["ok",{"t":"lit","v":[false]},false],["unavailable",{"t":"lit","v":[true]},false],["id",{"t":"str"},false],["reason",{"t":"lit","v":["error","off","unknown","loading"]},false],["message",{"t":"str"},false]]},{"t":"obj","n":"Answer","p":[["ok",{"t":"lit","v":[true]},false],["id",{"t":"str"},false],["module",{"t":"str"},false],["label",{"t":"str"},false],["value",{"t":"obj","n":"AvailabilityOutput","p":[["fromIso",{"t":"str"},false],["toIso",{"t":"str"},false],["nights",{"t":"num"},false],["units",{"t":"num"},false],["free",{"t":"arr","of":{"t":"obj","n":"FreeUnit","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["cap",{"t":"num"},false],["rooms",{"t":"num"},false],["freeRooms",{"t":"num"},false],["freeBeds",{"t":"num"},false]]}},false],["bizName",{"t":"str"},false]]},false]]}]},"opt":false}],
  inner$freeUnitsParts$units: [{"name":"v","d":{"t":"obj","n":"AvailabilityOutput","p":[["fromIso",{"t":"str"},false],["toIso",{"t":"str"},false],["nights",{"t":"num"},false],["units",{"t":"num"},false],["free",{"t":"arr","of":{"t":"obj","n":"FreeUnit","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["cap",{"t":"num"},false],["rooms",{"t":"num"},false],["freeRooms",{"t":"num"},false],["freeBeds",{"t":"num"},false]]}},false],["bizName",{"t":"str"},false]]},"opt":false}],
  inner$freeUnitsParts$map$name: [{"name":"u","d":{"t":"obj","n":"FreeUnit","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["cap",{"t":"num"},false],["rooms",{"t":"num"},false],["freeRooms",{"t":"num"},false],["freeBeds",{"t":"num"},false]]},"opt":false}],
  inner$freeUnitsParts$head: [{"name":"when","d":{"t":"str"},"opt":false},{"name":"v","d":{"t":"obj","n":"AvailabilityOutput","p":[["fromIso",{"t":"str"},false],["toIso",{"t":"str"},false],["nights",{"t":"num"},false],["units",{"t":"num"},false],["free",{"t":"arr","of":{"t":"obj","n":"FreeUnit","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["cap",{"t":"num"},false],["rooms",{"t":"num"},false],["freeRooms",{"t":"num"},false],["freeBeds",{"t":"num"},false]]}},false],["bizName",{"t":"str"},false]]},"opt":false}],
  inner$freeUnitsParts$head$$step: [{"name":"when","d":{"t":"str"},"opt":false},{"name":"units","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$freeUnitsParts$more: [{"name":"v","d":{"t":"obj","n":"AvailabilityOutput","p":[["fromIso",{"t":"str"},false],["toIso",{"t":"str"},false],["nights",{"t":"num"},false],["units",{"t":"num"},false],["free",{"t":"arr","of":{"t":"obj","n":"FreeUnit","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["cap",{"t":"num"},false],["rooms",{"t":"num"},false],["freeRooms",{"t":"num"},false],["freeBeds",{"t":"num"},false]]}},false],["bizName",{"t":"str"},false]]},"opt":false}],
  inner$freeUnitsParts$more$$step: [{"name":"units","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$resolveDialCode$c: [{"name":"code","d":{"t":"str"},"opt":false}],
  inner$resolveDialCode$target: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false},{"name":"code","d":{"t":"str"},"opt":false}],
  inner$resolveDialCode$target$$step: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false},{"name":"c","d":{"t":"str"},"opt":false}],
  inner$resolveDialCode$node: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false},{"name":"code","d":{"t":"str"},"opt":false}],
  inner$resolveDialCode$node$$step: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false},{"name":"target","d":{"t":"str"},"opt":false}],
  inner$resolveDialCode$retry: [],
  inner$resolveSpeech$here: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false},{"name":"nodeId","d":{"t":"str"},"opt":false}],
  inner$resolveSpeech$retry: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false},{"name":"nodeId","d":{"t":"str"},"opt":false}],
  inner$resolveSpeech$retry$$step: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false},{"name":"here","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}]},"opt":false}],
  inner$resolveSpeech$raw: [{"name":"utterance","d":{"t":"str"},"opt":false}],
  inner$resolveSpeech$heard: [{"name":"echo","d":{"t":"str"},"opt":false}],
  inner$resolveSpeech$id: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false},{"name":"nodeId","d":{"t":"str"},"opt":false}],
  inner$resolveSpeech$id$$step: [{"name":"here","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}]},"opt":false}],
  inner$resolveSpeech$node: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false},{"name":"t","d":{"t":"str"},"opt":false}],
  inner$resolveSpeech$q: [{"name":"utterance","d":{"t":"str"},"opt":false}],
  inner$resolveSpeech$q$$step: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$resolveSpeech$target: [{"name":"hit","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PrSearchHit","p":[["listing",{"t":"obj","n":"PrListing","p":[["id",{"t":"str"},false],["source",{"t":"lit","v":["owner","gabbai"]},false],["name",{"t":"str"},false],["title",{"t":"str"},false],["category",{"t":"str"},false],["area",{"t":"str"},false],["city",{"t":"str"},false],["phone",{"t":"str"},false],["phone2",{"t":"str"},false],["whatsapp",{"t":"str"},false],["hours",{"t":"arr","of":{"t":"obj","n":"PrHours","p":[["dow",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["always",{"t":"bool"},false],["hoursNote",{"t":"str"},false],["services",{"t":"arr","of":{"t":"obj","n":"PrService","p":[["name",{"t":"str"},false],["price",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["languages",{"t":"arr","of":{"t":"str"}},false],["kashrut",{"t":"str"},false],["emergency",{"t":"bool"},false],["desc",{"t":"str"},false],["notes",{"t":"str"},false],["status",{"t":"lit","v":["pending","approved","rejected"]},false],["dialCode",{"t":"str"},false],["featuredUntil",{"t":"str"},false],["recs",{"t":"arr","of":{"t":"obj","n":"PrRec","p":[["by",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},false],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["aud",{"t":"or","of":[{"t":"lit","v":["all","men","women"]},{"t":"undef"}]},true],["disc",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["free",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["palette",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["logo",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["offer",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["text",{"t":"str"},false],["until",{"t":"str"},false]]}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["q",{"t":"str"},false],["a",{"t":"str"},false]]}}]},true],["pay",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["years",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cert",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seek",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["promoLine",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["promoPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["promoNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},false],["rel",{"t":"num"},false],["strong",{"t":"bool"},false],["loc",{"t":"bool"},false],["cov",{"t":"num"},false],["feat",{"t":"lit","v":[0,1]},false],["open",{"t":"lit","v":[0,1]},false],["recs",{"t":"num"},false],["via",{"t":"str"},false]]}]},"opt":false}],
  inner$phoneStep$buf: [{"name":"at","d":{"t":"obj","p":[["node",{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]},false],["buf",{"t":"str"},false]]},"opt":false},{"name":"key","d":{"t":"str"},"opt":false}],
  inner$phoneStep$o: [{"name":"key","d":{"t":"str"},"opt":false},{"name":"cur","d":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]},"opt":false}],
  inner$walkPhone$seq: [{"name":"keys","d":{"t":"or","of":[{"t":"str"},{"t":"arr","of":{"t":"str"}}]},"opt":false}],
  inner$walkPhone$root: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false}],
  inner$walkPhone$r: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false},{"name":"at","d":{"t":"obj","p":[["node",{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]},false],["buf",{"t":"str"},false]]},"opt":false},{"name":"k","d":{"t":"str"},"opt":false}],
  inner$phoneScriptText$ids: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false}],
  inner$phoneScriptText$out: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false}],
  inner$phoneScriptText$out$$step: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false},{"name":"ids","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$phoneScriptText$tags: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false},{"name":"n","d":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]},"opt":false}],
  inner$phonePrompt$out$$after_loop: [{"name":"parts","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"max","d":{"t":"num"},"opt":false}],
  inner$buildPhoneMenu$noticePages$$after_loop: [{"name":"lines","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$walkPhone$out$$after_loop: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false},{"name":"keys","d":{"t":"or","of":[{"t":"str"},{"t":"arr","of":{"t":"str"}}]},"opt":false}],
  inner$walkPhone$at$$after_loop: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false},{"name":"keys","d":{"t":"or","of":[{"t":"str"},{"t":"arr","of":{"t":"str"}}]},"opt":false}],
  inner$phoneScriptText$out$$after_loop: [{"name":"menu","d":{"t":"obj","n":"PhoneMenu","p":[["root",{"t":"str"},false],["nodes",{"t":"rec","of":{"t":"obj","n":"PhoneNode","p":[["id",{"t":"str"},false],["kind",{"t":"lit","v":["number","list","listing","closed","input","menu","info","confirm","connect"]},false],["label",{"t":"str"},false],["prompt",{"t":"str"},false],["options",{"t":"arr","of":{"t":"obj","n":"PhoneOption","p":[["digit",{"t":"str"},false],["say",{"t":"str"},false],["to",{"t":"str"},false]]}},false],["speech",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["collect",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["action",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["kind",{"t":"lit","v":["connect"]},false],["tel",{"t":"str"},false],["label",{"t":"str"},false],["listingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialCode",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},{"t":"obj","p":[["kind",{"t":"lit","v":["readNumber"]},false],["tel",{"t":"str"},false],["groups",{"t":"arr","of":{"t":"str"}},false]]}]},true]]}},false],["codes",{"t":"rec","of":{"t":"str"}},false],["closed",{"t":"bool"},false],["asOf",{"t":"str"},false],["brand",{"t":"str"},false]]},"opt":false}],
};
