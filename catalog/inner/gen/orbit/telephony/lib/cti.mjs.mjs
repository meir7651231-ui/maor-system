// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:telephony/lib/cti.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function enrichContact(rec, kind) {
    // רק שדות שקיימים באמת ב-domain.ts (Supporter: cat/city/last/ils/usd). אין balance/tags.
    const e = {};
    if (rec.cat)
        e.category = rec.cat;
    if (rec.city)
        e.city = rec.city;
    if (rec.last)
        e.lastDonation = rec.last;
    if (typeof rec.ils === 'number' && rec.ils)
        e.totalIls = rec.ils;
    if (typeof rec.usd === 'number' && rec.usd)
        e.totalUsd = rec.usd;
    return e;
}
function stripMoney(enr) {
    const { totalIls, totalUsd, lastDonation, ...rest } = enr || {};
    return rest;
}
function careSignals(db, target) {
    if (!db || !target)
        return {};
    const care = {};
    // זיהוי המשפחה: family ⇒ ה-id עצמו; member ⇒ המשפחה שמכילה אותו.
    let famId = null;
    if (target.kind === 'family')
        famId = String(target.id);
    else if (target.kind === 'member') {
        for (const fam of Array.isArray(db.families) ? db.families : []) {
            if ((fam.members || []).some((m) => String(m.id) === String(target.id))) {
                famId = String(fam.id);
                break;
            }
        }
    }
    if (famId) {
        // מסירות-פתוחות (SHOP7): status !== 'delivered' ⇒ עדיין בדרך/ממתינה.
        const open = (Array.isArray(db.deliveries) ? db.deliveries : []).filter((d) => String(d.familyId) === famId && d.status !== 'delivered');
        if (open.length) {
            care.openDeliveries = open.length;
            // האות ה"קדימה-ביותר" לתצוגה מהירה (enroute > pickup).
            care.deliveryStatus = open.some((d) => d.status === 'enroute') ? 'enroute' : 'pickup';
        }
        // שיוכי-חנות פעילים (SHOP6): מזון/שירות שוטף.
        const active = (Array.isArray(db.shopAssignments) ? db.shopAssignments : []).filter((a) => String(a.famId) === famId && a.status === 'active');
        if (active.length)
            care.activeAssignments = active.length;
        // סטטוס-משפחה — 'pending' חשוב (טרם-אושרה) / 'inactive'.
        const fam = (Array.isArray(db.families) ? db.families : []).find((f) => String(f.id) === famId);
        if (fam && fam.status && fam.status !== 'active')
            care.familyStatus = fam.status;
    }
    // תומך: הוראת-קבע פעילה (תזכורת-גבייה).
    if (target.kind === 'supporter') {
        const sup = (Array.isArray(db.supporters) ? db.supporters : []).find((s) => String(s.id) === String(target.id));
        if (sup && sup.hok && sup.hok.active && typeof sup.hok.amount === 'number' && sup.hok.amount > 0) {
            care.hok = { amount: sup.hok.amount, cur: sup.hok.cur || '₪', day: sup.hok.day };
        }
    }
    return care;
}
const POP_PRIORITY = { supporter: 0, family: 1, teacher: 2, member: 3, volunteer: 4, coordinator: 5 };
const VERTICAL_PRIORITY = {
    chesed: { family: 0, member: 1, supporter: 2, teacher: 3 },
    gemach: { family: 0, member: 1, supporter: 2, teacher: 3 },
    talmudtorah: { teacher: 0, member: 1, family: 2, supporter: 3 },
    shul: { supporter: 0, family: 1, member: 2, teacher: 3 },
    kollel: { supporter: 0, teacher: 1, member: 2, family: 3 },
};
function popPriorityFor(vertical) {
    return VERTICAL_PRIORITY[vertical] || POP_PRIORITY;
}
function maskNumber(e164) {
    if (typeof e164 !== 'string' || e164.length < 4)
        return e164;
    const tail = e164.slice(-4);
    return '•'.repeat(Math.max(0, e164.length - 4)) + tail;
}
const normTs = (s) => { const v = String(s || ''); return v.length === 10 ? v + 'T00:00:00' : v; };
export function inner$iterContacts$arr(db, coll) {
    const arr = Array.isArray(db?.[coll]) ? db[coll] : [];
    return arr;
}
export function inner$careSignals$open(db, famId) {
    const open = (Array.isArray(db.deliveries) ? db.deliveries : []).filter((d) => String(d.familyId) === famId && d.status !== 'delivered');
    return open;
}
export function inner$careSignals$active(db, famId) {
    const active = (Array.isArray(db.shopAssignments) ? db.shopAssignments : []).filter((a) => String(a.famId) === famId && a.status === 'active');
    return active;
}
export function inner$careSignals$fam(db, famId) {
    const fam = (Array.isArray(db.families) ? db.families : []).find((f) => String(f.id) === famId);
    return fam;
}
export function inner$careSignals$sup(db, target) {
    const sup = (Array.isArray(db.supporters) ? db.supporters : []).find((s) => String(s.id) === String(target.id));
    return sup;
}
export function inner$lookupCaller$sorted(e164, dir) {
    const matches = dir[e164] || [];
    const sorted = [...matches].sort((a, b) => (POP_PRIORITY[a.kind] ?? 9) - (POP_PRIORITY[b.kind] ?? 9) || (a.id + '').localeCompare(b.id + ''));
    return sorted;
}
export function inner$lookupCaller$sorted$$step(matches) {
    const sorted = [...matches].sort((a, b) => (POP_PRIORITY[a.kind] ?? 9) - (POP_PRIORITY[b.kind] ?? 9) || (a.id + '').localeCompare(b.id + ''));
    return sorted;
}
export function inner$lookupInDirectory$sorted(directory, e164) {
    const matches = (directory && directory[e164]) || [];
    const sorted = [...matches].sort((a, b) => (POP_PRIORITY[a.kind] ?? 9) - (POP_PRIORITY[b.kind] ?? 9) || (a.id + '').localeCompare(b.id + ''));
    return sorted;
}
export function inner$lookupInDirectory$sorted$$step(matches) {
    const sorted = [...matches].sort((a, b) => (POP_PRIORITY[a.kind] ?? 9) - (POP_PRIORITY[b.kind] ?? 9) || (a.id + '').localeCompare(b.id + ''));
    return sorted;
}
export function inner$maskNumber$tail(e164) {
    const tail = e164.slice(-4);
    return tail;
}
export function inner$screenPop$direction(opt) {
    const direction = opt.direction === 'outbound' ? 'outbound' : 'inbound';
    return direction;
}
export function inner$screenPop$prio(opt) {
    const prio = popPriorityFor(opt.vertical);
    return prio;
}
export function inner$screenPop$matches(db, opt, e164, recIndex, dir) {
    const prio = popPriorityFor(opt.vertical);
    const raw = dir[e164] || [];
    const matches = [...raw]
        .sort((a, b) => (prio[a.kind] ?? 9) - (prio[b.kind] ?? 9) || (a.id + '').localeCompare(b.id + ''))
        .map((m) => {
        const rec = recIndex[`${m.kind}:${m.id}`];
        const base = { ...m, enrichment: rec ? enrichContact(rec, m.kind) : {} };
        // כרטיס-חסד (opt-in opt.care): אותות-פעולה חיים. בצנעה — לא נכלל (עלול לחשוף מקבל-צדקה).
        if (opt.care && !opt.privacy) {
            const care = careSignals(db, m);
            if (Object.keys(care).length)
                base.care = care;
        }
        return base;
    });
    return matches;
}
export function inner$screenPop$matches$$step(db, opt, prio, recIndex, raw) {
    const matches = [...raw]
        .sort((a, b) => (prio[a.kind] ?? 9) - (prio[b.kind] ?? 9) || (a.id + '').localeCompare(b.id + ''))
        .map((m) => {
        const rec = recIndex[`${m.kind}:${m.id}`];
        const base = { ...m, enrichment: rec ? enrichContact(rec, m.kind) : {} };
        // כרטיס-חסד (opt-in opt.care): אותות-פעולה חיים. בצנעה — לא נכלל (עלול לחשוף מקבל-צדקה).
        if (opt.care && !opt.privacy) {
            const care = careSignals(db, m);
            if (Object.keys(care).length)
                base.care = care;
        }
        return base;
    });
    return matches;
}
export function inner$screenPop$map$rec(recIndex, m) {
    const rec = recIndex[`${m.kind}:${m.id}`];
    return rec;
}
export function inner$screenPop$map$base(recIndex, m) {
    const rec = recIndex[`${m.kind}:${m.id}`];
    const base = { ...m, enrichment: rec ? enrichContact(rec, m.kind) : {} };
    return base;
}
export function inner$screenPop$map$base$$step(m, rec) {
    const base = { ...m, enrichment: rec ? enrichContact(rec, m.kind) : {} };
    return base;
}
export function inner$screenPop$map$care(db, m) {
    const care = careSignals(db, m);
    return care;
}
export function inner$screenPop$number(opt, e164) {
    const number = opt.privacy ? maskNumber(e164) : e164;
    return number;
}
export function inner$screenPop$shownMatches(db, opt, e164, recIndex, dir) {
    const prio = popPriorityFor(opt.vertical);
    const raw = dir[e164] || [];
    const matches = [...raw]
        .sort((a, b) => (prio[a.kind] ?? 9) - (prio[b.kind] ?? 9) || (a.id + '').localeCompare(b.id + ''))
        .map((m) => {
        const rec = recIndex[`${m.kind}:${m.id}`];
        const base = { ...m, enrichment: rec ? enrichContact(rec, m.kind) : {} };
        // כרטיס-חסד (opt-in opt.care): אותות-פעולה חיים. בצנעה — לא נכלל (עלול לחשוף מקבל-צדקה).
        if (opt.care && !opt.privacy) {
            const care = careSignals(db, m);
            if (Object.keys(care).length)
                base.care = care;
        }
        return base;
    });
    const shownMatches = opt.privacy ? matches.map((m) => ({ ...m, enrichment: stripMoney(m.enrichment) })) : matches;
    return shownMatches;
}
export function inner$screenPop$shownMatches$$step(opt, matches) {
    const shownMatches = opt.privacy ? matches.map((m) => ({ ...m, enrichment: stripMoney(m.enrichment) })) : matches;
    return shownMatches;
}
export function inner$screenPop$suggestion(db, opt, e164, recIndex, dir) {
    const direction = opt.direction === 'outbound' ? 'outbound' : 'inbound';
    const prio = popPriorityFor(opt.vertical);
    const raw = dir[e164] || [];
    const matches = [...raw]
        .sort((a, b) => (prio[a.kind] ?? 9) - (prio[b.kind] ?? 9) || (a.id + '').localeCompare(b.id + ''))
        .map((m) => {
        const rec = recIndex[`${m.kind}:${m.id}`];
        const base = { ...m, enrichment: rec ? enrichContact(rec, m.kind) : {} };
        // כרטיס-חסד (opt-in opt.care): אותות-פעולה חיים. בצנעה — לא נכלל (עלול לחשוף מקבל-צדקה).
        if (opt.care && !opt.privacy) {
            const care = careSignals(db, m);
            if (Object.keys(care).length)
                base.care = care;
        }
        return base;
    });
    const suggestion = matches.length
        ? null
        : { action: 'add', number: opt.privacy ? maskNumber(e164) : e164, kinds: direction === 'inbound' ? ['family', 'supporter'] : ['supporter'] };
    return suggestion;
}
export function inner$screenPop$suggestion$$step(opt, direction, e164, matches) {
    const suggestion = matches.length
        ? null
        : { action: 'add', number: opt.privacy ? maskNumber(e164) : e164, kinds: direction === 'inbound' ? ['family', 'supporter'] : ['supporter'] };
    return suggestion;
}
export function inner$callEvent$dir(p) {
    const dir = p.direction === 'outbound' ? 'יוצאת' : 'נכנסת';
    return dir;
}
export function inner$callEvent$who(p) {
    const who = p.primary ? p.primary.name : 'לא מזוהה';
    return who;
}
export function inner$donationIntent$amount(p) {
    const amount = Number(p && p.amount);
    return amount;
}
export function inner$dialString$sims(tenant) {
    const sims = (tenant.numbers || []).filter((n) => n.onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel));
    return sims;
}
export function inner$dialString$via(tenant, opt) {
    const sims = (tenant.numbers || []).filter((n) => n.onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel));
    const via = opt.viaNumberId && sims.find((n) => n.id === opt.viaNumberId);
    return via;
}
export function inner$dialString$via$$step(opt, sims) {
    const via = opt.viaNumberId && sims.find((n) => n.id === opt.viaNumberId);
    return via;
}
export function inner$callHeatmap$frequentThreshold(opt) {
    const frequentThreshold = Number.isInteger(opt.frequentThreshold) && opt.frequentThreshold > 0 ? opt.frequentThreshold : 3;
    return frequentThreshold;
}
export function inner$callHeatmap$normTs$v(s) {
    const v = String(s || '');
    return v;
}
export function inner$callHeatmap$events(logs, opt) {
    const since = opt.since || null;
    const events = (Array.isArray(logs) ? logs : []).filter((l) => l && l.number && (!since || normTs(l.startedAt) >= normTs(since)));
    return events;
}
export function inner$callHeatmap$events$$step(logs, since) {
    const events = (Array.isArray(logs) ? logs : []).filter((l) => l && l.number && (!since || normTs(l.startedAt) >= normTs(since)));
    return events;
}
export function inner$callHeatmap$b(byNum, num) {
    const b = byNum.get(num) || { number: num, count: 0, inbound: 0, outbound: 0, lastCall: '', contactKind: null, contactId: null, contactName: '' };
    return b;
}
export function inner$callHeatmap$contacts(byNum) {
    const contacts = [...byNum.values()].sort((a, b) => b.count - a.count || String(b.lastCall).localeCompare(String(a.lastCall)));
    return contacts;
}
export function inner$callHeatmap$frequent(opt, byNum) {
    const frequentThreshold = Number.isInteger(opt.frequentThreshold) && opt.frequentThreshold > 0 ? opt.frequentThreshold : 3;
    const contacts = [...byNum.values()].sort((a, b) => b.count - a.count || String(b.lastCall).localeCompare(String(a.lastCall)));
    const frequent = contacts.filter((c) => c.count >= frequentThreshold);
    return frequent;
}
export function inner$callHeatmap$frequent$$step(frequentThreshold, contacts) {
    const frequent = contacts.filter((c) => c.count >= frequentThreshold);
    return frequent;
}
export function inner$callHeatmap$care(opt, c) {
    const care = careSignals(opt.db, { kind: c.contactKind, id: c.contactId });
    return care;
}

export const SIGS = {
  inner$iterContacts$arr: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"coll","d":{"t":"str"},"opt":false}],
  inner$careSignals$open: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"famId","d":{"t":"any"},"opt":false}],
  inner$careSignals$active: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"famId","d":{"t":"any"},"opt":false}],
  inner$careSignals$fam: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"famId","d":{"t":"any"},"opt":false}],
  inner$careSignals$sup: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"target","d":{"t":"obj","p":[["kind",{"t":"str"},false],["id",{"t":"str"},false]]},"opt":false}],
  inner$lookupCaller$sorted: [{"name":"e164","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"dir","d":{"t":"rec","of":{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["id",{"t":"str"},false],["name",{"t":"str"},false],["field",{"t":"str"},false]]}}},"opt":false}],
  inner$lookupCaller$sorted$$step: [{"name":"matches","d":{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["id",{"t":"str"},false],["name",{"t":"str"},false],["field",{"t":"str"},false]]}},"opt":false}],
  inner$lookupInDirectory$sorted: [{"name":"directory","d":{"t":"rec","of":{"t":"arr","of":{"t":"any"}}},"opt":false},{"name":"e164","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$lookupInDirectory$sorted$$step: [{"name":"matches","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$maskNumber$tail: [{"name":"e164","d":{"t":"any"},"opt":false}],
  inner$screenPop$direction: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["direction",{"t":"or","of":[{"t":"lit","v":["outbound","inbound"]},{"t":"undef"}]},true],["vertical",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["privacy",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["line",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false}],
  inner$screenPop$prio: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["direction",{"t":"or","of":[{"t":"lit","v":["outbound","inbound"]},{"t":"undef"}]},true],["vertical",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["privacy",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["line",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false}],
  inner$screenPop$matches: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["direction",{"t":"or","of":[{"t":"lit","v":["outbound","inbound"]},{"t":"undef"}]},true],["vertical",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["privacy",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["line",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false},{"name":"e164","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"recIndex","d":{"t":"obj","n":"recIndex","p":[]},"opt":false},{"name":"dir","d":{"t":"rec","of":{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["id",{"t":"str"},false],["name",{"t":"str"},false],["field",{"t":"str"},false]]}}},"opt":false}],
  inner$screenPop$matches$$step: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["direction",{"t":"or","of":[{"t":"lit","v":["outbound","inbound"]},{"t":"undef"}]},true],["vertical",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["privacy",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["line",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false},{"name":"prio","d":{"t":"any"},"opt":false},{"name":"recIndex","d":{"t":"obj","n":"recIndex","p":[]},"opt":false},{"name":"raw","d":{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["id",{"t":"str"},false],["name",{"t":"str"},false],["field",{"t":"str"},false]]}},"opt":false}],
  inner$screenPop$map$rec: [{"name":"recIndex","d":{"t":"obj","n":"recIndex","p":[]},"opt":false},{"name":"m","d":{"t":"obj","p":[["kind",{"t":"str"},false],["id",{"t":"str"},false],["name",{"t":"str"},false],["field",{"t":"str"},false]]},"opt":false}],
  inner$screenPop$map$base: [{"name":"recIndex","d":{"t":"obj","n":"recIndex","p":[]},"opt":false},{"name":"m","d":{"t":"obj","p":[["kind",{"t":"str"},false],["id",{"t":"str"},false],["name",{"t":"str"},false],["field",{"t":"str"},false]]},"opt":false}],
  inner$screenPop$map$base$$step: [{"name":"m","d":{"t":"obj","p":[["kind",{"t":"str"},false],["id",{"t":"str"},false],["name",{"t":"str"},false],["field",{"t":"str"},false]]},"opt":false},{"name":"rec","d":{"t":"any"},"opt":false}],
  inner$screenPop$map$care: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"obj","p":[["kind",{"t":"str"},false],["id",{"t":"str"},false],["name",{"t":"str"},false],["field",{"t":"str"},false]]},"opt":false}],
  inner$screenPop$number: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["direction",{"t":"or","of":[{"t":"lit","v":["outbound","inbound"]},{"t":"undef"}]},true],["vertical",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["privacy",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["line",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false},{"name":"e164","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$screenPop$shownMatches: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["direction",{"t":"or","of":[{"t":"lit","v":["outbound","inbound"]},{"t":"undef"}]},true],["vertical",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["privacy",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["line",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false},{"name":"e164","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"recIndex","d":{"t":"obj","n":"recIndex","p":[]},"opt":false},{"name":"dir","d":{"t":"rec","of":{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["id",{"t":"str"},false],["name",{"t":"str"},false],["field",{"t":"str"},false]]}}},"opt":false}],
  inner$screenPop$shownMatches$$step: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["direction",{"t":"or","of":[{"t":"lit","v":["outbound","inbound"]},{"t":"undef"}]},true],["vertical",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["privacy",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["line",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false},{"name":"matches","d":{"t":"arr","of":{"t":"obj","p":[["enrichment",{"t":"obj","p":[]},false],["kind",{"t":"str"},false],["id",{"t":"str"},false],["name",{"t":"str"},false],["field",{"t":"str"},false]]}},"opt":false}],
  inner$screenPop$suggestion: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["direction",{"t":"or","of":[{"t":"lit","v":["outbound","inbound"]},{"t":"undef"}]},true],["vertical",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["privacy",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["line",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false},{"name":"e164","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"recIndex","d":{"t":"obj","n":"recIndex","p":[]},"opt":false},{"name":"dir","d":{"t":"rec","of":{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["id",{"t":"str"},false],["name",{"t":"str"},false],["field",{"t":"str"},false]]}}},"opt":false}],
  inner$screenPop$suggestion$$step: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["direction",{"t":"or","of":[{"t":"lit","v":["outbound","inbound"]},{"t":"undef"}]},true],["vertical",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["privacy",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["line",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false},{"name":"direction","d":{"t":"lit","v":["outbound","inbound"]},"opt":false},{"name":"e164","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"matches","d":{"t":"arr","of":{"t":"obj","p":[["enrichment",{"t":"obj","p":[]},false],["kind",{"t":"str"},false],["id",{"t":"str"},false],["name",{"t":"str"},false],["field",{"t":"str"},false]]}},"opt":false}],
  inner$callEvent$dir: [{"name":"p","d":{"t":"obj","p":[["number",{"t":"str"},false],["direction",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["startedAt",{"t":"str"},false],["durationSec",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["line",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["primary",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"any"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$callEvent$who: [{"name":"p","d":{"t":"obj","p":[["number",{"t":"str"},false],["direction",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["startedAt",{"t":"str"},false],["durationSec",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["line",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["primary",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"any"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$donationIntent$amount: [{"name":"p","d":{"t":"obj","p":[["number",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["designation",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["startedAt",{"t":"str"},false],["primary",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"any"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$dialString$sims: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$dialString$via: [{"name":"tenant","d":{"t":"any"},"opt":false},{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["viaNumberId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false}],
  inner$dialString$via$$step: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["viaNumberId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false},{"name":"sims","d":{"t":"any"},"opt":false}],
  inner$callHeatmap$frequentThreshold: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["db",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true],["frequentThreshold",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["since",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false}],
  inner$callHeatmap$normTs$v: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$callHeatmap$events: [{"name":"logs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["db",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true],["frequentThreshold",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["since",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false}],
  inner$callHeatmap$events$$step: [{"name":"logs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"since","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$callHeatmap$b: [{"name":"byNum","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"num","d":{"t":"any"},"opt":false}],
  inner$callHeatmap$contacts: [{"name":"byNum","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$callHeatmap$frequent: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["db",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true],["frequentThreshold",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["since",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false},{"name":"byNum","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$callHeatmap$frequent$$step: [{"name":"frequentThreshold","d":{"t":"or","of":[{"t":"undef"},{"t":"num"}]},"opt":false},{"name":"contacts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$callHeatmap$care: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["db",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true],["frequentThreshold",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["since",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
};
