// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/previewZmanim.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const KIT_MAX_LINES = 6;
const CLOSED_WINDOW_DAYS = 30;
const num = (p, k, d) => (typeof p[k] === 'number' && Number.isFinite(p[k]) ? p[k] : d);
const str = (p, k, d) => (typeof p[k] === 'string' ? p[k] : d);
function dm(iso) {
    const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(iso);
    return m ? +m[2] + '/' + +m[1] : iso;
}
function durationText(min) {
    const sec = Math.round(min * 60);
    if (sec <= 0)
        return '0 דקות';
    const s = sec % 60;
    const m = Math.floor(sec / 60);
    const h = Math.floor(m / 60);
    const r = m % 60;
    if (!s) {
        if (m === 15)
            return 'רבע שעה';
        if (m === 30)
            return 'חצי שעה';
        if (m === 60)
            return 'שעה';
        if (m === 120)
            return 'שעתיים';
    }
    const H = h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : h + ' שעות';
    const parts = [];
    if (h)
        parts.push(H);
    if (r)
        parts.push(r + ' דקות');
    if (s)
        parts.push(s + ' שניות');
    if (!parts.length)
        return '0 דקות';
    return parts.length === 1 ? parts[0] : parts.slice(0, -1).join(', ') + ' ו-' + parts[parts.length - 1];
}
export function inner$dm$m(iso) {
    const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(iso);
    return m;
}
export function inner$durationText$sec(min) {
    const sec = Math.round(min * 60);
    return sec;
}
export function inner$durationText$s(min) {
    const sec = Math.round(min * 60);
    const s = sec % 60;
    return s;
}
export function inner$durationText$s$$step(sec) {
    const s = sec % 60;
    return s;
}
export function inner$durationText$m(min) {
    const sec = Math.round(min * 60);
    const m = Math.floor(sec / 60);
    return m;
}
export function inner$durationText$m$$step(sec) {
    const m = Math.floor(sec / 60);
    return m;
}
export function inner$durationText$h(min) {
    const sec = Math.round(min * 60);
    const m = Math.floor(sec / 60);
    const h = Math.floor(m / 60);
    return h;
}
export function inner$durationText$h$$step(m) {
    const h = Math.floor(m / 60);
    return h;
}
export function inner$durationText$r(min) {
    const sec = Math.round(min * 60);
    const m = Math.floor(sec / 60);
    const r = m % 60;
    return r;
}
export function inner$durationText$r$$step(m) {
    const r = m % 60;
    return r;
}
export function inner$durationText$H(min) {
    const sec = Math.round(min * 60);
    const m = Math.floor(sec / 60);
    const h = Math.floor(m / 60);
    const H = h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : h + ' שעות';
    return H;
}
export function inner$durationText$H$$step(h) {
    const H = h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : h + ' שעות';
    return H;
}
export function inner$moneyLine$g(groups) {
    const g = groups[groups.length - 1];
    return g;
}
export function inner$dayWord$d(iso) {
    const d = new Date(iso + 'T12:00:00Z').getUTCDay();
    return d;
}
export function inner$zmanimLoc$ui(ctx) {
    const ui = ctx.db && typeof ctx.db === 'object' ? ctx.db.ui : undefined;
    return ui;
}
export function inner$zmanimLoc$pr(ctx) {
    const ui = ctx.db && typeof ctx.db === 'object' ? ctx.db.ui : undefined;
    const pr = ui && typeof ui === 'object' ? ui.parnasa : undefined;
    return pr;
}
export function inner$zmanimLoc$pr$$step(ui) {
    const pr = ui && typeof ui === 'object' ? ui.parnasa : undefined;
    return pr;
}
export function inner$zmanimLoc$z(ctx) {
    const ui = ctx.db && typeof ctx.db === 'object' ? ctx.db.ui : undefined;
    const pr = ui && typeof ui === 'object' ? ui.parnasa : undefined;
    const z = pr && typeof pr === 'object' && pr.zmanim && typeof pr.zmanim === 'object' ? pr.zmanim : null;
    return z;
}
export function inner$zmanimLoc$z$$step(pr) {
    const z = pr && typeof pr === 'object' && pr.zmanim && typeof pr.zmanim === 'object' ? pr.zmanim : null;
    return z;
}
export function inner$hms$totalSec(min) {
    const totalSec = Math.floor(min * 60 + 1e-6);
    return totalSec;
}
export function inner$hms$x(min) {
    const totalSec = Math.floor(min * 60 + 1e-6);
    const x = ((totalSec % 86_400) + 86_400) % 86_400;
    return x;
}
export function inner$hms$x$$step(totalSec) {
    const x = ((totalSec % 86_400) + 86_400) % 86_400;
    return x;
}
export function inner$zmanLabel$l(label) {
    const l = label.replace('ק״ש', 'קריאת שמע');
    return l;
}
export function inner$dayDivide$twelve(p, pieces) {
    const twelve = str(p, 'by', 'parts') !== 'size' && pieces.length === 12;
    return twelve;
}
export function inner$dayDivide$head(p, pieces) {
    const twelve = str(p, 'by', 'parts') !== 'size' && pieces.length === 12;
    const head = twelve
        ? 'שעה זמנית היום = ' + durationText(pieces[0].length)
        : pieces.length + ' חלקים של ' + durationText(pieces[0].length);
    return head;
}
export function inner$dayDivide$head$$step(pieces, twelve) {
    const head = twelve
        ? 'שעה זמנית היום = ' + durationText(pieces[0].length)
        : pieces.length + ' חלקים של ' + durationText(pieces[0].length);
    return head;
}
export function inner$shabbatDivide$span(candle, end) {
    const span = { from: candle, to: 1440 + end };
    return span;
}
export function inner$shabbatDivide$at$r(m) {
    const r = Math.round(m);
    return r;
}
export function inner$timesNext$count(p) {
    const count = Math.max(1, Math.min(KIT_MAX_LINES, Math.floor(num(p, 'count', 1))));
    return count;
}
export function inner$timesNext$lines(all, next) {
    const lines = next.map((k, i) => (i === 0 ? 'הזמן הבא: ' : '') + all.get(k));
    return lines;
}
export function inner$timesOffset$minutes(p) {
    const minutes = num(p, 'minutes', -10);
    return minutes;
}
export function inner$timesOffset$rel(p) {
    const minutes = num(p, 'minutes', -10);
    const rel = minutes === 0 ? 'בדיוק בזמן' : Math.abs(minutes) + ' דקות ' + (minutes < 0 ? 'לפני' : 'אחרי') + ' כל זמן';
    return rel;
}
export function inner$timesOffset$rel$$step(minutes) {
    const rel = minutes === 0 ? 'בדיוק בזמן' : Math.abs(minutes) + ' דקות ' + (minutes < 0 ? 'לפני' : 'אחרי') + ' כל זמן';
    return rel;
}
export function inner$timesOffset$example(rows) {
    const example = rows.find((r) => r.key === 'shkia');
    return example;
}
export function inner$rawZmanim$gra(sr, ss) {
    const gra = (ss - sr) / 12;
    return gra;
}
export function inner$rawZmanim$dawn(sr, PR_MGA_MIN) {
    const dawn = sr - PR_MGA_MIN;
    return dawn;
}
export function inner$rawZmanim$mga(sr, ss, PR_MGA_MIN) {
    const dawn = sr - PR_MGA_MIN;
    const mga = (ss + PR_MGA_MIN - dawn) / 12;
    return mga;
}
export function inner$rawZmanim$mga$$step(ss, dawn, PR_MGA_MIN) {
    const mga = (ss + PR_MGA_MIN - dawn) / 12;
    return mga;
}
export function inner$timesRound$step(p) {
    const step = num(p, 'step', 1);
    return step;
}
export function inner$timesRound$nearest(p) {
    const nearest = str(p, 'dir', 'down') === 'nearest';
    return nearest;
}
export function inner$timesRound$unit(p) {
    const step = num(p, 'step', 1);
    const unit = step === 1 ? 'לדקה' : 'ל-' + step + ' דקות';
    return unit;
}
export function inner$timesRound$unit$$step(step) {
    const unit = step === 1 ? 'לדקה' : 'ל-' + step + ' דקות';
    return unit;
}
export function inner$timesRound$how(p) {
    const nearest = str(p, 'dir', 'down') === 'nearest';
    const how = nearest ? 'לקרוב' : 'לחומרא: סוף זמן למטה, התחלה למעלה';
    return how;
}
export function inner$timesRound$how$$step(nearest) {
    const how = nearest ? 'לקרוב' : 'לחומרא: סוף זמן למטה, התחלה למעלה';
    return how;
}
export function inner$closedRuns$n(opts) {
    const n = Math.max(1, Math.min(120, Math.floor(opts.days ?? CLOSED_WINDOW_DAYS)));
    return n;
}
export function inner$closedRuns$nowKey(clock) {
    const nowKey = clock.iso + ' ' + clock.hhmm;
    return nowKey;
}
export function inner$closedRuns$span(days, r) {
    const span = days.slice(r.from, r.to + 1);
    return span;
}
export function inner$closedRuns$last(days, r) {
    const span = days.slice(r.from, r.to + 1);
    const last = span[span.length - 1].iso;
    return last;
}
export function inner$closedRuns$last$$step(span) {
    const last = span[span.length - 1].iso;
    return last;
}
export function inner$windowText$b(w) {
    const b = w.endTime ? dm(w.last) + ' ' + w.endTime : dm(w.last) + ' (עד סוף היום — אי אפשר לחשב שעה)';
    return b;
}
export function inner$closedMerge$map$many(r) {
    const many = r.days > 1;
    return many;
}
export function inner$closedMerge$map$head(r) {
    const many = r.days > 1;
    const head = many ? r.name + ' · ' + r.days + ' ימים צמודים' + (r.gapDays ? ' (כולל ' + r.gapDays + ' ימי חול באמצע)' : '') + ' ← חלון סגור אחד' : r.name;
    return head;
}
export function inner$closedMerge$map$head$$step(r, many) {
    const head = many ? r.name + ' · ' + r.days + ' ימים צמודים' + (r.gapDays ? ' (כולל ' + r.gapDays + ' ימי חול באמצע)' : '') + ' ← חלון סגור אחד' : r.name;
    return head;
}
export function inner$closedNext$count(p) {
    const count = Math.max(1, Math.min(KIT_MAX_LINES, Math.floor(num(p, 'count', 1))));
    return count;
}
export function inner$closedNext$min(p) {
    const min = Math.max(1, Math.floor(num(p, 'minLength', 1)));
    return min;
}
export function inner$closedNext$keyed(wins) {
    const keyed = new Map(wins.map((w) => [w.endIso + ' ' + (w.endTime || '23:59') + ' ' + w.startIso, w]));
    return keyed;
}
export function inner$closedNext$nowKey(clock) {
    const nowKey = clock.iso + ' ' + clock.hhmm;
    return nowKey;
}
export function inner$closedNext$map$w(keyed, k) {
    const w = keyed.get(k);
    return w;
}
export function inner$closedNext$map$now(keyed, nowKey, k) {
    const w = keyed.get(k);
    const now = w.startIso + ' ' + (w.startTime || '00:00') <= nowKey ? ' (עכשיו)' : '';
    return now;
}
export function inner$closedNext$map$now$$step(nowKey, w) {
    const now = w.startIso + ' ' + (w.startTime || '00:00') <= nowKey ? ' (עכשיו)' : '';
    return now;
}
export function inner$closedNext$map$blind(keyed, k) {
    const w = keyed.get(k);
    const blind = w.startTime === '00:00' && w.endTime === '23:59';
    return blind;
}
export function inner$closedNext$map$blind$$step(w) {
    const blind = w.startTime === '00:00' && w.endTime === '23:59';
    return blind;
}
export function inner$moneyLine$groups$$after_loop(pieces) {
    const groups = [];
    for (const v of pieces) {
        const g = groups[groups.length - 1];
        if (g && g.v === v)
            g.n++;
        else
            groups.push({ v, n: 1 });
    }
    return groups;
}
export function inner$closedRuns$names$$after_loop(days, r) {
    const span = days.slice(r.from, r.to + 1);
    const names = [];
    for (const d of span) {
        if (!d.closed)
            continue;
        for (const nm of [d.holiday, d.dow === 6 ? 'שבת' : ''])
            if (nm && !names.includes(nm))
                names.push(nm);
    }
    return names;
}

export const SIGS = {
  inner$dm$m: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$durationText$sec: [{"name":"min","d":{"t":"num"},"opt":false}],
  inner$durationText$s: [{"name":"min","d":{"t":"num"},"opt":false}],
  inner$durationText$s$$step: [{"name":"sec","d":{"t":"num"},"opt":false}],
  inner$durationText$m: [{"name":"min","d":{"t":"num"},"opt":false}],
  inner$durationText$m$$step: [{"name":"sec","d":{"t":"num"},"opt":false}],
  inner$durationText$h: [{"name":"min","d":{"t":"num"},"opt":false}],
  inner$durationText$h$$step: [{"name":"m","d":{"t":"num"},"opt":false}],
  inner$durationText$r: [{"name":"min","d":{"t":"num"},"opt":false}],
  inner$durationText$r$$step: [{"name":"m","d":{"t":"num"},"opt":false}],
  inner$durationText$H: [{"name":"min","d":{"t":"num"},"opt":false}],
  inner$durationText$H$$step: [{"name":"h","d":{"t":"num"},"opt":false}],
  inner$moneyLine$g: [{"name":"groups","d":{"t":"arr","of":{"t":"obj","p":[["v",{"t":"num"},false],["n",{"t":"num"},false]]}},"opt":false}],
  inner$dayWord$d: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$zmanimLoc$ui: [{"name":"ctx","d":{"t":"obj","n":"PreviewCtx","p":[["db",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"Partial","p":[["v",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["savedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["receiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["donationSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopReceiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["families",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Family","p":[]}}]},true],["enrollments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}}]},true],["courses",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Course","p":[]}}]},true],["events",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}}]},true],["rooms",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Room","p":[]}}]},true],["teachers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}}]},true],["tzCoordinators",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}}]},true],["tzBoxes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}}]},true],["tzCampaigns",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}}]},true],["tzEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}}]},true],["shopItems",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}}]},true],["shopProducts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}}]},true],["shopStores",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}}]},true],["shopCriteria",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}}]},true],["shopAssignments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}}]},true],["shopEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}}]},true],["shopIntakes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}}]},true],["volunteers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}}]},true],["distributionDays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}}]},true],["deliveries",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}}]},true],["tasks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}}]},true],["warehouse",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}}]},true],["prListings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}}]},true],["prRequests",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}}]},true],["prPosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}}]},true],["prAds",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}}]},true],["hostUnits",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}}]},true],["hostBookings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}}]},true],["hostRecords",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSite",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgDonate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},false],["config",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]}]},true],["nowMs",{"t":"num"},false],["caps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Capability","p":[]}}]},true],["privacyMode",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$zmanimLoc$pr: [{"name":"ctx","d":{"t":"obj","n":"PreviewCtx","p":[["db",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"Partial","p":[["v",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["savedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["receiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["donationSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopReceiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["families",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Family","p":[]}}]},true],["enrollments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}}]},true],["courses",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Course","p":[]}}]},true],["events",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}}]},true],["rooms",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Room","p":[]}}]},true],["teachers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}}]},true],["tzCoordinators",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}}]},true],["tzBoxes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}}]},true],["tzCampaigns",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}}]},true],["tzEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}}]},true],["shopItems",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}}]},true],["shopProducts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}}]},true],["shopStores",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}}]},true],["shopCriteria",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}}]},true],["shopAssignments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}}]},true],["shopEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}}]},true],["shopIntakes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}}]},true],["volunteers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}}]},true],["distributionDays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}}]},true],["deliveries",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}}]},true],["tasks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}}]},true],["warehouse",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}}]},true],["prListings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}}]},true],["prRequests",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}}]},true],["prPosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}}]},true],["prAds",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}}]},true],["hostUnits",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}}]},true],["hostBookings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}}]},true],["hostRecords",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSite",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgDonate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},false],["config",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]}]},true],["nowMs",{"t":"num"},false],["caps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Capability","p":[]}}]},true],["privacyMode",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$zmanimLoc$pr$$step: [{"name":"ui","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"UiPrefs","p":[["famView",{"t":"lit","v":["list","grid"]},false],["crsView",{"t":"lit","v":["list","grid"]},false],["quoteTemplates",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"QuoteTemplate","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["lines",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["rate",{"t":"num"},false]]}},false]]}}]},true],["supView",{"t":"or","of":[{"t":"lit","v":["list","grid"]},{"t":"undef"}]},true],["receiptFmt",{"t":"or","of":[{"t":"lit","v":["txt","pdf"]},{"t":"undef"}]},true],["homeLayout",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["supCardLayout",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["theme",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dialer",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"DialerCampaign","p":[["name",{"t":"str"},false],["startedAt",{"t":"str"},false],["queue",{"t":"arr","of":{"t":"str"}},false],["total",{"t":"num"},false],["log",{"t":"arr","of":{"t":"obj","n":"DialLogEntry","p":[["id",{"t":"str"},false],["outcome",{"t":"lit","v":["done","donated","noanswer","refused","callback","skip"]},false],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["at",{"t":"str"},false]]}},false]]}]},true],["cashSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["cashReceipts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CashReceiptRec","p":[["num",{"t":"num"},false],["at",{"t":"str"},false],["client",{"t":"str"},false],["due",{"t":"num"},false],["received",{"t":"num"},false],["change",{"t":"num"},false],["items",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["amount",{"t":"num"},false]]}}]},true]]}}]},true],["cashShift",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"CashShiftRec","p":[["openedAt",{"t":"str"},false],["float",{"t":"num"},false],["checks",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["other",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},true],["cashShifts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CashShiftCloseRec","p":[["closedAt",{"t":"str"},false],["openedAt",{"t":"str"},false],["float",{"t":"num"},false],["sales",{"t":"num"},false],["count",{"t":"num"},false],["counted",{"t":"num"},false],["diff",{"t":"num"},false],["openChecks",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["closeChecks",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["openOther",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["closeOther",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["parnasa",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ParnasaPrefs","p":[["communityName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["requireApproval",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["contactPhone",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dedication",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["bookletDedication",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["small",{"t":"any"},true],["board",{"t":"any"},true],["full",{"t":"any"},true],["half",{"t":"any"},true],["featured",{"t":"any"},true],["sponsor",{"t":"any"},true],["dedication",{"t":"any"},true],["job",{"t":"any"},true]]}]},true],["zmanim",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ParnasaZmanimPrefs","p":[["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lat",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lon",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["elevation",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tz",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["candleMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tzeisMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},true]]}]},true],["hosting",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"HostingPrefs","p":[["businessName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["checkout",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cleaningFee",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["taxPct",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["orderLeadDays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["familyTerm",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["shabbat",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"HostShabbatPrefs","p":[["mode",{"t":"or","of":[{"t":"lit","v":["shabbat","prep","off","motzash"]},{"t":"undef"}]},true],["candle",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["havdalah",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["level",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["mashgiach",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true],["shopGot",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"lit","v":[true]}}]},true],["shopEmoji",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true]]}]},true],["engineLinks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["capabilities",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true]]}]},"opt":false}],
  inner$zmanimLoc$z: [{"name":"ctx","d":{"t":"obj","n":"PreviewCtx","p":[["db",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"Partial","p":[["v",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["savedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["receiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["donationSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopReceiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["families",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Family","p":[]}}]},true],["enrollments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}}]},true],["courses",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Course","p":[]}}]},true],["events",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}}]},true],["rooms",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Room","p":[]}}]},true],["teachers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}}]},true],["tzCoordinators",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}}]},true],["tzBoxes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}}]},true],["tzCampaigns",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}}]},true],["tzEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}}]},true],["shopItems",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}}]},true],["shopProducts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}}]},true],["shopStores",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}}]},true],["shopCriteria",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}}]},true],["shopAssignments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}}]},true],["shopEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}}]},true],["shopIntakes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}}]},true],["volunteers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}}]},true],["distributionDays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}}]},true],["deliveries",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}}]},true],["tasks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}}]},true],["warehouse",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}}]},true],["prListings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}}]},true],["prRequests",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}}]},true],["prPosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}}]},true],["prAds",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}}]},true],["hostUnits",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}}]},true],["hostBookings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}}]},true],["hostRecords",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSite",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgDonate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},false],["config",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]}]},true],["nowMs",{"t":"num"},false],["caps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Capability","p":[]}}]},true],["privacyMode",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$zmanimLoc$z$$step: [{"name":"pr","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ParnasaPrefs","p":[["communityName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["requireApproval",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["contactPhone",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["dedication",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["bookletDedication",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Partial","p":[["small",{"t":"any"},true],["board",{"t":"any"},true],["full",{"t":"any"},true],["half",{"t":"any"},true],["featured",{"t":"any"},true],["sponsor",{"t":"any"},true],["dedication",{"t":"any"},true],["job",{"t":"any"},true]]}]},true],["zmanim",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"ParnasaZmanimPrefs","p":[["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lat",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lon",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["elevation",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tz",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["candleMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tzeisMin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},true]]}]},"opt":false}],
  inner$hms$totalSec: [{"name":"min","d":{"t":"num"},"opt":false}],
  inner$hms$x: [{"name":"min","d":{"t":"num"},"opt":false}],
  inner$hms$x$$step: [{"name":"totalSec","d":{"t":"num"},"opt":false}],
  inner$zmanLabel$l: [{"name":"label","d":{"t":"str"},"opt":false}],
  inner$dayDivide$twelve: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"pieces","d":{"t":"arr","of":{"t":"obj","n":"Piece","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]}},"opt":false}],
  inner$dayDivide$head: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"pieces","d":{"t":"arr","of":{"t":"obj","n":"Piece","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]}},"opt":false}],
  inner$dayDivide$head$$step: [{"name":"pieces","d":{"t":"arr","of":{"t":"obj","n":"Piece","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]}},"opt":false},{"name":"twelve","d":{"t":"bool"},"opt":false}],
  inner$shabbatDivide$span: [{"name":"candle","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"end","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false}],
  inner$shabbatDivide$at$r: [{"name":"m","d":{"t":"num"},"opt":false}],
  inner$timesNext$count: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$timesNext$lines: [{"name":"all","d":{"t":"map","k":{"t":"str"},"v":{"t":"str"}},"opt":false},{"name":"next","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$timesOffset$minutes: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$timesOffset$rel: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$timesOffset$rel$$step: [{"name":"minutes","d":{"t":"num"},"opt":false}],
  inner$timesOffset$example: [{"name":"rows","d":{"t":"arr","of":{"t":"obj","p":[["key",{"t":"str"},false],["name",{"t":"str"},false],["time",{"t":"str"},false]]}},"opt":false}],
  inner$rawZmanim$gra: [{"name":"sr","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"ss","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false}],
  inner$rawZmanim$dawn: [{"name":"sr","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"PR_MGA_MIN","d":{"t":"lit","v":[72]},"opt":false}],
  inner$rawZmanim$mga: [{"name":"sr","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"ss","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"PR_MGA_MIN","d":{"t":"lit","v":[72]},"opt":false}],
  inner$rawZmanim$mga$$step: [{"name":"ss","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"dawn","d":{"t":"num"},"opt":false},{"name":"PR_MGA_MIN","d":{"t":"lit","v":[72]},"opt":false}],
  inner$timesRound$step: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$timesRound$nearest: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$timesRound$unit: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$timesRound$unit$$step: [{"name":"step","d":{"t":"num"},"opt":false}],
  inner$timesRound$how: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$timesRound$how$$step: [{"name":"nearest","d":{"t":"bool"},"opt":false}],
  inner$closedRuns$n: [{"name":"opts","d":{"t":"obj","p":[["maxGap",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["minLength",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$closedRuns$nowKey: [{"name":"clock","d":{"t":"obj","n":"PrClock","p":[["iso",{"t":"str"},false],["hhmm",{"t":"str"},false],["dow",{"t":"num"},false],["ms",{"t":"num"},false]]},"opt":false}],
  inner$closedRuns$span: [{"name":"days","d":{"t":"arr","of":{"t":"obj","p":[["iso",{"t":"str"},false],["closed",{"t":"bool"},false],["holiday",{"t":"str"},false],["dow",{"t":"num"},false]]}},"opt":false},{"name":"r","d":{"t":"obj","n":"Run","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]},"opt":false}],
  inner$closedRuns$last: [{"name":"days","d":{"t":"arr","of":{"t":"obj","p":[["iso",{"t":"str"},false],["closed",{"t":"bool"},false],["holiday",{"t":"str"},false],["dow",{"t":"num"},false]]}},"opt":false},{"name":"r","d":{"t":"obj","n":"Run","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]},"opt":false}],
  inner$closedRuns$last$$step: [{"name":"span","d":{"t":"arr","of":{"t":"obj","p":[["iso",{"t":"str"},false],["closed",{"t":"bool"},false],["holiday",{"t":"str"},false],["dow",{"t":"num"},false]]}},"opt":false}],
  inner$windowText$b: [{"name":"w","d":{"t":"obj","p":[["startIso",{"t":"str"},false],["startTime",{"t":"str"},false],["last",{"t":"str"},false],["endTime",{"t":"str"},false]]},"opt":false}],
  inner$closedMerge$map$many: [{"name":"r","d":{"t":"obj","n":"ClosedRun","p":[["first",{"t":"str"},false],["last",{"t":"str"},false],["days",{"t":"num"},false],["gapDays",{"t":"num"},false],["name",{"t":"str"},false],["startIso",{"t":"str"},false],["startTime",{"t":"str"},false],["endTime",{"t":"str"},false]]},"opt":false}],
  inner$closedMerge$map$head: [{"name":"r","d":{"t":"obj","n":"ClosedRun","p":[["first",{"t":"str"},false],["last",{"t":"str"},false],["days",{"t":"num"},false],["gapDays",{"t":"num"},false],["name",{"t":"str"},false],["startIso",{"t":"str"},false],["startTime",{"t":"str"},false],["endTime",{"t":"str"},false]]},"opt":false}],
  inner$closedMerge$map$head$$step: [{"name":"r","d":{"t":"obj","n":"ClosedRun","p":[["first",{"t":"str"},false],["last",{"t":"str"},false],["days",{"t":"num"},false],["gapDays",{"t":"num"},false],["name",{"t":"str"},false],["startIso",{"t":"str"},false],["startTime",{"t":"str"},false],["endTime",{"t":"str"},false]]},"opt":false},{"name":"many","d":{"t":"bool"},"opt":false}],
  inner$closedNext$count: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$closedNext$min: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$closedNext$keyed: [{"name":"wins","d":{"t":"arr","of":{"t":"obj","n":"ClosedWindow","p":[["startIso",{"t":"str"},false],["startTime",{"t":"str"},false],["endIso",{"t":"str"},false],["endTime",{"t":"str"},false],["reason",{"t":"str"},false],["kind",{"t":"str"},false],["days",{"t":"num"},false]]}},"opt":false}],
  inner$closedNext$nowKey: [{"name":"clock","d":{"t":"obj","n":"PrClock","p":[["iso",{"t":"str"},false],["hhmm",{"t":"str"},false],["dow",{"t":"num"},false],["ms",{"t":"num"},false]]},"opt":false}],
  inner$closedNext$map$w: [{"name":"keyed","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"ClosedWindow","p":[["startIso",{"t":"str"},false],["startTime",{"t":"str"},false],["endIso",{"t":"str"},false],["endTime",{"t":"str"},false],["reason",{"t":"str"},false],["kind",{"t":"str"},false],["days",{"t":"num"},false]]}},"opt":false},{"name":"k","d":{"t":"str"},"opt":false}],
  inner$closedNext$map$now: [{"name":"keyed","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"ClosedWindow","p":[["startIso",{"t":"str"},false],["startTime",{"t":"str"},false],["endIso",{"t":"str"},false],["endTime",{"t":"str"},false],["reason",{"t":"str"},false],["kind",{"t":"str"},false],["days",{"t":"num"},false]]}},"opt":false},{"name":"nowKey","d":{"t":"str"},"opt":false},{"name":"k","d":{"t":"str"},"opt":false}],
  inner$closedNext$map$now$$step: [{"name":"nowKey","d":{"t":"str"},"opt":false},{"name":"w","d":{"t":"obj","n":"ClosedWindow","p":[["startIso",{"t":"str"},false],["startTime",{"t":"str"},false],["endIso",{"t":"str"},false],["endTime",{"t":"str"},false],["reason",{"t":"str"},false],["kind",{"t":"str"},false],["days",{"t":"num"},false]]},"opt":false}],
  inner$closedNext$map$blind: [{"name":"keyed","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"ClosedWindow","p":[["startIso",{"t":"str"},false],["startTime",{"t":"str"},false],["endIso",{"t":"str"},false],["endTime",{"t":"str"},false],["reason",{"t":"str"},false],["kind",{"t":"str"},false],["days",{"t":"num"},false]]}},"opt":false},{"name":"k","d":{"t":"str"},"opt":false}],
  inner$closedNext$map$blind$$step: [{"name":"w","d":{"t":"obj","n":"ClosedWindow","p":[["startIso",{"t":"str"},false],["startTime",{"t":"str"},false],["endIso",{"t":"str"},false],["endTime",{"t":"str"},false],["reason",{"t":"str"},false],["kind",{"t":"str"},false],["days",{"t":"num"},false]]},"opt":false}],
  inner$moneyLine$groups$$after_loop: [{"name":"pieces","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$closedRuns$names$$after_loop: [{"name":"days","d":{"t":"arr","of":{"t":"obj","p":[["iso",{"t":"str"},false],["closed",{"t":"bool"},false],["holiday",{"t":"str"},false],["dow",{"t":"num"},false]]}},"opt":false},{"name":"r","d":{"t":"obj","n":"Run","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]},"opt":false}],
};
