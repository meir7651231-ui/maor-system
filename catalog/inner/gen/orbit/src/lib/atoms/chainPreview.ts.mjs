// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/chainPreview.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const num = (p, k, d) => (typeof p[k] === 'number' && Number.isFinite(p[k]) ? p[k] : d);
const str = (p, k, d) => (typeof p[k] === 'string' ? p[k] : d);
export function inner$rootStep$label(span) {
    const label = span.fromHm + '–' + span.toHm;
    return label;
}
export function inner$rootStep$gctx(ctx) {
    const gctx = { db: ctx.db, nowMs: ctx.nowMs, privacyMode: ctx.privacyMode === true };
    return gctx;
}
export function inner$momentsStep$keyed(v) {
    const keyed = v.list.map((m, i) => ({ ...m, key: String(m.abs).padStart(12, '0') + '|' + String(i).padStart(4, '0') }));
    return keyed;
}
export function inner$momentsStep$byKey(v) {
    const keyed = v.list.map((m, i) => ({ ...m, key: String(m.abs).padStart(12, '0') + '|' + String(i).padStart(4, '0') }));
    const byKey = new Map(keyed.map((m) => [m.key, m]));
    return byKey;
}
export function inner$momentsStep$byKey$$step(keyed) {
    const byKey = new Map(keyed.map((m) => [m.key, m]));
    return byKey;
}
export function inner$momentsStep$list(next) {
    const list = next.map((m) => ({ abs: m.abs, label: m.label }));
    return list;
}
export function inner$momentsStep$minutes(p) {
    const minutes = num(p, 'minutes', -10);
    return minutes;
}
export function inner$momentsStep$list_L143(v, moved) {
    const list = v.list.map((m, i) => ({ abs: moved[i], label: m.label }));
    return list;
}
export function inner$momentsStep$abs(p) {
    const minutes = num(p, 'minutes', -10);
    const abs = Math.abs(minutes);
    return abs;
}
export function inner$momentsStep$abs$$step(minutes) {
    const abs = Math.abs(minutes);
    return abs;
}
export function inner$momentsStep$amount(p) {
    const minutes = num(p, 'minutes', -10);
    const abs = Math.abs(minutes);
    const amount = abs % 1440 === 0 ? (abs === 1440 ? 'יום' : abs / 1440 + ' ימים') : abs + ' דקות';
    return amount;
}
export function inner$momentsStep$amount$$step(abs) {
    const amount = abs % 1440 === 0 ? (abs === 1440 ? 'יום' : abs / 1440 + ' ימים') : abs + ' דקות';
    return amount;
}
export function inner$momentsStep$rel(p) {
    const minutes = num(p, 'minutes', -10);
    const abs = Math.abs(minutes);
    const amount = abs % 1440 === 0 ? (abs === 1440 ? 'יום' : abs / 1440 + ' ימים') : abs + ' דקות';
    const rel = minutes === 0 ? 'באותו רגע' : amount + ' ' + (minutes < 0 ? 'לפני' : 'אחרי');
    return rel;
}
export function inner$momentsStep$rel$$step(minutes, amount) {
    const rel = minutes === 0 ? 'באותו רגע' : amount + ' ' + (minutes < 0 ? 'לפני' : 'אחרי');
    return rel;
}
export function inner$momentsStep$step(p) {
    const step = num(p, 'step', 1);
    return step;
}
export function inner$momentsStep$dir(p) {
    const dir = str(p, 'dir', 'down');
    return dir;
}
export function inner$momentsStep$map$d(m) {
    const d = Math.floor(m.abs / 1440);
    return d;
}
export function inner$slotsStep$k(p) {
    const k = Math.max(2, num(p, 'minLength', 1));
    return k;
}
export function inner$slotsStep$size(v) {
    const size = Math.round(v.slots[0].to - v.slots[0].from);
    return size;
}
export function inner$slotsStep$g(v, p, i) {
    const k = Math.max(2, num(p, 'minLength', 1));
    const g = v.slots.slice(i, i + k);
    return g;
}
export function inner$slotsStep$g$$step(v, k, i) {
    const g = v.slots.slice(i, i + k);
    return g;
}
export function inner$slotsStep$lines(v) {
    const size = Math.round(v.slots[0].to - v.slots[0].from);
    const lines = [v.slots.length + ' תורים של ' + size + ' דקות בחלון ' + v.span];
    return lines;
}
export function inner$slotsStep$lines$$step(v, size) {
    const lines = [v.slots.length + ' תורים של ' + size + ' דקות בחלון ' + v.span];
    return lines;
}
export function inner$slotsStep$count(p) {
    const count = num(p, 'count', 1);
    return count;
}
export function inner$slotsStep$minLen(p) {
    const minLen = num(p, 'minLength', 1);
    return minLen;
}
export function inner$slotsStep$fit(v, p) {
    const minLen = num(p, 'minLength', 1);
    const fit = v.slots.filter((s) => s.to - s.from >= minLen);
    return fit;
}
export function inner$slotsStep$fit$$step(v, minLen) {
    const fit = v.slots.filter((s) => s.to - s.from >= minLen);
    return fit;
}
export function inner$slotsStep$later(v, p, today) {
    const count = num(p, 'count', 1);
    const minLen = num(p, 'minLength', 1);
    const fit = v.slots.filter((s) => s.to - s.from >= minLen);
    const later = fit.filter((s) => s.from > today.minute).slice(0, count);
    return later;
}
export function inner$slotsStep$later$$step(today, count, fit) {
    const later = fit.filter((s) => s.from > today.minute).slice(0, count);
    return later;
}
export function inner$slotsStep$tomorrow(v, p, today) {
    const count = num(p, 'count', 1);
    const minLen = num(p, 'minLength', 1);
    const fit = v.slots.filter((s) => s.to - s.from >= minLen);
    const later = fit.filter((s) => s.from > today.minute).slice(0, count);
    const tomorrow = later.length < count ? fit.slice(0, count - later.length) : [];
    return tomorrow;
}
export function inner$slotsStep$tomorrow$$step(count, fit, later) {
    const tomorrow = later.length < count ? fit.slice(0, count - later.length) : [];
    return tomorrow;
}
export function inner$windowsStep$n(p) {
    const n = Math.max(1, num(p, 'minLength', 1));
    return n;
}
export function inner$windowsStep$count(p) {
    const count = num(p, 'count', 1);
    return count;
}
export function inner$windowsStep$want(p, people, w) {
    const want = str(p, 'by', 'parts') === 'size' ? Math.ceil(w.run.length / Math.max(1, num(p, 'size', 1))) : people.length >= 2 ? people.length : num(p, 'parts', 2);
    return want;
}
export function inner$windowsStep$parts(p, people, w) {
    const want = str(p, 'by', 'parts') === 'size' ? Math.ceil(w.run.length / Math.max(1, num(p, 'size', 1))) : people.length >= 2 ? people.length : num(p, 'parts', 2);
    const parts = Math.max(2, Math.min(w.run.length, want));
    return parts;
}
export function inner$windowsStep$parts$$step(w, want) {
    const parts = Math.max(2, Math.min(w.run.length, want));
    return parts;
}
export function inner$windowsStep$map$a(w, x) {
    const a = w.nights[Math.round(x.from)].iso;
    return a;
}
export function inner$windowsStep$map$z(w, x) {
    const a = w.nights[Math.round(x.from)].iso;
    const z = w.nights[Math.max(Math.round(x.from), Math.round(x.to) - 1)]?.iso ?? a;
    return z;
}
export function inner$windowsStep$map$z$$step(w, x, a) {
    const z = w.nights[Math.max(Math.round(x.from), Math.round(x.to) - 1)]?.iso ?? a;
    return z;
}
export function inner$chainPreviewStrict$paramsAt$c(cap, caps, ids, i) {
    const c = i === ids.length - 1 ? cap : caps.find((x) => x && x.id === ids[i]);
    return c;
}
export function inner$chainChildParams$m(caps) {
    const m = caps.find((c) => c && c.place === 'bookings.nights' && c.atom === 'merge' && !c.parent);
    return m;
}
export function inner$slotsStep$turns$$after_loop(v, p) {
    const k = Math.max(2, num(p, 'minLength', 1));
    const turns = [];
    for (let i = 0; i < v.slots.length; i += k) {
        const g = v.slots.slice(i, i + k);
        turns.push({ from: g[0].from, to: g[g.length - 1].to });
    }
    return turns;
}

export const SIGS = {
  inner$rootStep$label: [{"name":"span","d":{"t":"obj","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["fromHm",{"t":"str"},false],["toHm",{"t":"str"},false]]},"opt":false}],
  inner$rootStep$gctx: [{"name":"ctx","d":{"t":"obj","n":"PreviewCtx","p":[["db",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"Partial","p":[["v",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["savedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["seq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["receiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["donationSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopReceiptSeq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["families",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Family","p":[]}}]},true],["enrollments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}}]},true],["courses",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Course","p":[]}}]},true],["events",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}}]},true],["rooms",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Room","p":[]}}]},true],["teachers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}}]},true],["tzCoordinators",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}}]},true],["tzBoxes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}}]},true],["tzCampaigns",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}}]},true],["tzEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}}]},true],["shopItems",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}}]},true],["shopProducts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}}]},true],["shopStores",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}}]},true],["shopCriteria",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}}]},true],["shopAssignments",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}}]},true],["shopEvents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}}]},true],["shopIntakes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}}]},true],["volunteers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}}]},true],["distributionDays",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}}]},true],["deliveries",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}}]},true],["tasks",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}}]},true],["warehouse",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}}]},true],["prListings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}}]},true],["prRequests",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}}]},true],["prPosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}}]},true],["prAds",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}}]},true],["hostUnits",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}}]},true],["hostBookings",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}}]},true],["hostRecords",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSite",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgDonate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgGoal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},false],["config",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]}]},true],["nowMs",{"t":"num"},false],["caps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Capability","p":[]}}]},true],["privacyMode",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$momentsStep$keyed: [{"name":"v","d":{"t":"obj","p":[["t",{"t":"lit","v":["moments"]},false],["list",{"t":"arr","of":{"t":"obj","n":"Moment","p":[["abs",{"t":"num"},false],["label",{"t":"str"},false]]}},false],["what",{"t":"str"},false]]},"opt":false}],
  inner$momentsStep$byKey: [{"name":"v","d":{"t":"obj","p":[["t",{"t":"lit","v":["moments"]},false],["list",{"t":"arr","of":{"t":"obj","n":"Moment","p":[["abs",{"t":"num"},false],["label",{"t":"str"},false]]}},false],["what",{"t":"str"},false]]},"opt":false}],
  inner$momentsStep$byKey$$step: [{"name":"keyed","d":{"t":"arr","of":{"t":"obj","p":[["key",{"t":"str"},false],["abs",{"t":"num"},false],["label",{"t":"str"},false]]}},"opt":false}],
  inner$momentsStep$list: [{"name":"next","d":{"t":"arr","of":{"t":"obj","p":[["key",{"t":"str"},false],["abs",{"t":"num"},false],["label",{"t":"str"},false]]}},"opt":false}],
  inner$momentsStep$minutes: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$momentsStep$list_L143: [{"name":"v","d":{"t":"obj","p":[["t",{"t":"lit","v":["moments"]},false],["list",{"t":"arr","of":{"t":"obj","n":"Moment","p":[["abs",{"t":"num"},false],["label",{"t":"str"},false]]}},false],["what",{"t":"str"},false]]},"opt":false},{"name":"moved","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$momentsStep$abs: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$momentsStep$abs$$step: [{"name":"minutes","d":{"t":"num"},"opt":false}],
  inner$momentsStep$amount: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$momentsStep$amount$$step: [{"name":"abs","d":{"t":"num"},"opt":false}],
  inner$momentsStep$rel: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$momentsStep$rel$$step: [{"name":"minutes","d":{"t":"num"},"opt":false},{"name":"amount","d":{"t":"str"},"opt":false}],
  inner$momentsStep$step: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$momentsStep$dir: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$momentsStep$map$d: [{"name":"m","d":{"t":"obj","n":"Moment","p":[["abs",{"t":"num"},false],["label",{"t":"str"},false]]},"opt":false}],
  inner$slotsStep$k: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$slotsStep$size: [{"name":"v","d":{"t":"obj","p":[["t",{"t":"lit","v":["slots"]},false],["slots",{"t":"arr","of":{"t":"obj","n":"Slot","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]}},false],["span",{"t":"str"},false]]},"opt":false}],
  inner$slotsStep$g: [{"name":"v","d":{"t":"obj","p":[["t",{"t":"lit","v":["slots"]},false],["slots",{"t":"arr","of":{"t":"obj","n":"Slot","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]}},false],["span",{"t":"str"},false]]},"opt":false},{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$slotsStep$g$$step: [{"name":"v","d":{"t":"obj","p":[["t",{"t":"lit","v":["slots"]},false],["slots",{"t":"arr","of":{"t":"obj","n":"Slot","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]}},false],["span",{"t":"str"},false]]},"opt":false},{"name":"k","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$slotsStep$lines: [{"name":"v","d":{"t":"obj","p":[["t",{"t":"lit","v":["slots"]},false],["slots",{"t":"arr","of":{"t":"obj","n":"Slot","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]}},false],["span",{"t":"str"},false]]},"opt":false}],
  inner$slotsStep$lines$$step: [{"name":"v","d":{"t":"obj","p":[["t",{"t":"lit","v":["slots"]},false],["slots",{"t":"arr","of":{"t":"obj","n":"Slot","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]}},false],["span",{"t":"str"},false]]},"opt":false},{"name":"size","d":{"t":"num"},"opt":false}],
  inner$slotsStep$count: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$slotsStep$minLen: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$slotsStep$fit: [{"name":"v","d":{"t":"obj","p":[["t",{"t":"lit","v":["slots"]},false],["slots",{"t":"arr","of":{"t":"obj","n":"Slot","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]}},false],["span",{"t":"str"},false]]},"opt":false},{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$slotsStep$fit$$step: [{"name":"v","d":{"t":"obj","p":[["t",{"t":"lit","v":["slots"]},false],["slots",{"t":"arr","of":{"t":"obj","n":"Slot","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]}},false],["span",{"t":"str"},false]]},"opt":false},{"name":"minLen","d":{"t":"num"},"opt":false}],
  inner$slotsStep$later: [{"name":"v","d":{"t":"obj","p":[["t",{"t":"lit","v":["slots"]},false],["slots",{"t":"arr","of":{"t":"obj","n":"Slot","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]}},false],["span",{"t":"str"},false]]},"opt":false},{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"today","d":{"t":"obj","p":[["iso",{"t":"str"},false],["minute",{"t":"num"},false]]},"opt":false}],
  inner$slotsStep$later$$step: [{"name":"today","d":{"t":"obj","p":[["iso",{"t":"str"},false],["minute",{"t":"num"},false]]},"opt":false},{"name":"count","d":{"t":"num"},"opt":false},{"name":"fit","d":{"t":"arr","of":{"t":"obj","n":"Slot","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]}},"opt":false}],
  inner$slotsStep$tomorrow: [{"name":"v","d":{"t":"obj","p":[["t",{"t":"lit","v":["slots"]},false],["slots",{"t":"arr","of":{"t":"obj","n":"Slot","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]}},false],["span",{"t":"str"},false]]},"opt":false},{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"today","d":{"t":"obj","p":[["iso",{"t":"str"},false],["minute",{"t":"num"},false]]},"opt":false}],
  inner$slotsStep$tomorrow$$step: [{"name":"count","d":{"t":"num"},"opt":false},{"name":"fit","d":{"t":"arr","of":{"t":"obj","n":"Slot","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]}},"opt":false},{"name":"later","d":{"t":"arr","of":{"t":"obj","n":"Slot","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]}},"opt":false}],
  inner$windowsStep$n: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$windowsStep$count: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$windowsStep$want: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"people","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"w","d":{"t":"any"},"opt":false}],
  inner$windowsStep$parts: [{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"people","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"w","d":{"t":"any"},"opt":false}],
  inner$windowsStep$parts$$step: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"want","d":{"t":"num"},"opt":false}],
  inner$windowsStep$map$a: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"x","d":{"t":"obj","n":"Piece","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]},"opt":false}],
  inner$windowsStep$map$z: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"x","d":{"t":"obj","n":"Piece","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]},"opt":false}],
  inner$windowsStep$map$z$$step: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"x","d":{"t":"obj","n":"Piece","p":[["from",{"t":"num"},false],["to",{"t":"num"},false],["length",{"t":"num"},false]]},"opt":false},{"name":"a","d":{"t":"str"},"opt":false}],
  inner$chainPreviewStrict$paramsAt$c: [{"name":"cap","d":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false},{"name":"caps","d":{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"ids","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$chainChildParams$m: [{"name":"caps","d":{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$slotsStep$turns$$after_loop: [{"name":"v","d":{"t":"obj","p":[["t",{"t":"lit","v":["slots"]},false],["slots",{"t":"arr","of":{"t":"obj","n":"Slot","p":[["from",{"t":"num"},false],["to",{"t":"num"},false]]}},false],["span",{"t":"str"},false]]},"opt":false},{"name":"p","d":{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
};
