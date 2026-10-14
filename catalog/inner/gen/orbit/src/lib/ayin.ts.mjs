// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/ayin.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const AYIN_STAGES = ['new', 'lead', 'eyes', 'answer', 'done'];
function stageIndex(stage) {
    const i = AYIN_STAGES.indexOf(stage);
    return i < 0 ? 0 : i;
}
function stageOf(a) {
    return AYIN_STAGES.includes(a.stage) ? a.stage : 'new';
}
function eyesTotal(a) {
    return (a.names ?? []).reduce((t, x) => t + (+x.eyes || 0), 0);
}
const clean = (x) => (x ?? '').replace(/\s+/g, ' ').trim();
export function inner$stageIndex$i(stage) {
    const i = AYIN_STAGES.indexOf(stage);
    return i;
}
export function inner$nextStage$i(stage) {
    const i = stageIndex(stage);
    return i;
}
export function inner$ayinActionVisible$st(a) {
    const st = stageOf(a);
    return st;
}
export function inner$ayinAdvanceLabel$st(a) {
    const st = stageOf(a);
    return st;
}
export function inner$planAyinAdvance$eyes(a) {
    const eyes = eyesTotal(a);
    return eyes;
}
export function inner$planAddName$nm(rawName) {
    const nm = rawName.trim();
    return nm;
}
export function inner$ayinDailyRows$rows(unit, item) {
    const rows = [
        ['שם', 'טלפון', `${unit} היום`, 'שלב', item, 'מתי לדבר שוב', 'הערה'],
    ];
    return rows;
}
export function inner$ayinDailyRows$touched(supporters, todayIso) {
    const touched = supporters.filter((sp) => sp.ayin && (sp.ayin.lastTouch === todayIso || sp.ayin.log?.some((l) => l.date === todayIso)));
    return touched;
}
export function inner$ayinDailyRows$logToday(todayIso, a) {
    const logToday = a.log.filter((l) => l.date === todayIso);
    return logToday;
}
export function inner$ayinDailyRows$eyesToday(todayIso, a) {
    const logToday = a.log.filter((l) => l.date === todayIso);
    const eyesToday = logToday.length ? logToday.reduce((t, l) => t + (+l.eyes || 0), 0) : '';
    return eyesToday;
}
export function inner$ayinDailyRows$eyesToday$$step(logToday) {
    const eyesToday = logToday.length ? logToday.reduce((t, l) => t + (+l.eyes || 0), 0) : '';
    return eyesToday;
}
export function inner$ayinDailyRows$namesLine(a) {
    const namesLine = a.names
        .map((n) => n.name + (n.eyes !== '' && n.eyes != null ? ' ·' + n.eyes : '') + (n.done ? ' ✓' : ''))
        .join(' · ');
    return namesLine;
}
export function inner$ayinDailyRows$noteLine(a) {
    const noteLine = a.answers.map((x) => x.note).join(' | ') || a.note || '';
    return noteLine;
}
export function inner$fmtD$y(iso) {
    const [y, m, d] = iso.split('-');
    return y;
}
export function inner$fmtD$m(iso) {
    const [y, m, d] = iso.split('-');
    return m;
}
export function inner$fmtD$d(iso) {
    const [y, m, d] = iso.split('-');
    return d;
}
export function inner$filterAyinBoard$filter$qd(q) {
    const qd = q.replace(/\D/g, '');
    return qd;
}
export function inner$ayinSheetRows$leadDone(a) {
    const leadDone = ['eyes', 'answer', 'done'].includes(a.stage) ? 'כן' : 'לא';
    return leadDone;
}
export function inner$parseAyinSheet$header(rows) {
    const header = (rows[0] ?? []).map((h) => clean(h));
    return header;
}
export function inner$parseAyinSheet$supN(rows, iSup, r) {
    const row = rows[r] ?? [];
    const supN = clean(iSup >= 0 ? row[iSup] : '');
    return supN;
}
export function inner$parseAyinSheet$supN$$step(iSup, row) {
    const supN = clean(iSup >= 0 ? row[iSup] : '');
    return supN;
}
export function inner$parseAyinSheet$nm(rows, iNm, r) {
    const row = rows[r] ?? [];
    const nm = clean(row[iNm]);
    return nm;
}
export function inner$parseAyinSheet$nm$$step(iNm, row) {
    const nm = clean(row[iNm]);
    return nm;
}
export function inner$parseAyinSheet$raw(rows, iEyes, r) {
    const row = rows[r] ?? [];
    const raw = clean(row[iEyes]);
    return raw;
}
export function inner$parseAyinSheet$raw$$step(iEyes, row) {
    const raw = clean(row[iEyes]);
    return raw;
}
export function inner$parseAyinSheet$eyes(rows, iEyes, r) {
    const row = rows[r] ?? [];
    const raw = clean(row[iEyes]);
    const eyes = /^\d+$/.test(raw) ? +raw : null;
    return eyes;
}
export function inner$parseAyinSheet$eyes$$step(raw) {
    const eyes = /^\d+$/.test(raw) ? +raw : null;
    return eyes;
}
export function inner$parseAyinSheet$doneRaw(rows, iDone, r) {
    const row = rows[r] ?? [];
    const doneRaw = clean(iDone >= 0 ? row[iDone] : '');
    return doneRaw;
}
export function inner$parseAyinSheet$doneRaw$$step(iDone, row) {
    const doneRaw = clean(iDone >= 0 ? row[iDone] : '');
    return doneRaw;
}
export function inner$parseAyinSheet$paidRaw(rows, iPaid, r) {
    const row = rows[r] ?? [];
    const paidRaw = iPaid >= 0 ? clean(row[iPaid]) : '';
    return paidRaw;
}
export function inner$parseAyinSheet$paidRaw$$step(iPaid, row) {
    const paidRaw = iPaid >= 0 ? clean(row[iPaid]) : '';
    return paidRaw;
}
export function inner$parseAyinSheet$ansRaw(rows, iAns, r) {
    const row = rows[r] ?? [];
    const ansRaw = iAns >= 0 ? clean(row[iAns]) : '';
    return ansRaw;
}
export function inner$parseAyinSheet$ansRaw$$step(iAns, row) {
    const ansRaw = iAns >= 0 ? clean(row[iAns]) : '';
    return ansRaw;
}
export function inner$parseAyinSheet$leadRaw(rows, iLead, r) {
    const row = rows[r] ?? [];
    const leadRaw = iLead >= 0 ? clean(row[iLead]) : '';
    return leadRaw;
}
export function inner$parseAyinSheet$leadRaw$$step(iLead, row) {
    const leadRaw = iLead >= 0 ? clean(row[iLead]) : '';
    return leadRaw;
}
export function inner$applyAyinSheet$arr(byId, u) {
    const arr = byId.get(u.supporterId) ?? [];
    return arr;
}
export function inner$applyAyinSheet$map$mine(byId, sp) {
    const mine = byId.get(sp.id);
    return mine;
}
export function inner$applyAyinSheet$map$rec(a, u) {
    const rec = a.names.find((n) => n.id === u.nameId);
    return rec;
}
export function inner$applyAyinSheet$byId$$after_loop(upds) {
    const byId = new Map();
    for (const u of upds) {
        const arr = byId.get(u.supporterId) ?? [];
        arr.push(u);
        byId.set(u.supporterId, arr);
    }
    return byId;
}

export const SIGS = {
  inner$stageIndex$i: [{"name":"stage","d":{"t":"lit","v":["done","new","lead","eyes","answer"]},"opt":false}],
  inner$nextStage$i: [{"name":"stage","d":{"t":"lit","v":["done","new","lead","eyes","answer"]},"opt":false}],
  inner$ayinActionVisible$st: [{"name":"a","d":{"t":"obj","n":"AyinCase","p":[["stage",{"t":"lit","v":["done","new","lead","eyes","answer"]},false],["note",{"t":"str"},false],["answeredNote",{"t":"str"},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["answerPushed",{"t":"bool"},false],["nextTalk",{"t":"str"},false],["nextTalkTime",{"t":"str"},false],["lastTouch",{"t":"str"},false],["names",{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},false],["answers",{"t":"arr","of":{"t":"obj","n":"AyinAnswer","p":[["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["log",{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["time",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TimeEntry","p":[["date",{"t":"str"},false],["hours",{"t":"num"},false],["note",{"t":"str"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["mat",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},true],["kit",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"KitItem","p":[["label",{"t":"str"},false],["done",{"t":"bool"},false]]}}]},true],["boardEventIds",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}}]},true]]},"opt":false}],
  inner$ayinAdvanceLabel$st: [{"name":"a","d":{"t":"obj","n":"AyinCase","p":[["stage",{"t":"lit","v":["done","new","lead","eyes","answer"]},false],["note",{"t":"str"},false],["answeredNote",{"t":"str"},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["answerPushed",{"t":"bool"},false],["nextTalk",{"t":"str"},false],["nextTalkTime",{"t":"str"},false],["lastTouch",{"t":"str"},false],["names",{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},false],["answers",{"t":"arr","of":{"t":"obj","n":"AyinAnswer","p":[["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["log",{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["time",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TimeEntry","p":[["date",{"t":"str"},false],["hours",{"t":"num"},false],["note",{"t":"str"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["mat",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},true],["kit",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"KitItem","p":[["label",{"t":"str"},false],["done",{"t":"bool"},false]]}}]},true],["boardEventIds",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}}]},true]]},"opt":false}],
  inner$planAyinAdvance$eyes: [{"name":"a","d":{"t":"obj","n":"AyinCase","p":[["stage",{"t":"lit","v":["done","new","lead","eyes","answer"]},false],["note",{"t":"str"},false],["answeredNote",{"t":"str"},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["answerPushed",{"t":"bool"},false],["nextTalk",{"t":"str"},false],["nextTalkTime",{"t":"str"},false],["lastTouch",{"t":"str"},false],["names",{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},false],["answers",{"t":"arr","of":{"t":"obj","n":"AyinAnswer","p":[["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["log",{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["time",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TimeEntry","p":[["date",{"t":"str"},false],["hours",{"t":"num"},false],["note",{"t":"str"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["mat",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},true],["kit",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"KitItem","p":[["label",{"t":"str"},false],["done",{"t":"bool"},false]]}}]},true],["boardEventIds",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}}]},true]]},"opt":false}],
  inner$planAddName$nm: [{"name":"rawName","d":{"t":"str"},"opt":false}],
  inner$ayinDailyRows$rows: [{"name":"unit","d":{"t":"str"},"opt":false},{"name":"item","d":{"t":"str"},"opt":false}],
  inner$ayinDailyRows$touched: [{"name":"supporters","d":{"t":"arr","of":{"t":"obj","n":"Supporter","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["phones",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"SupPhone","p":[["id",{"t":"str"},false],["num",{"t":"str"},false],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["wa",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}}]},true],["email",{"t":"str"},false],["address",{"t":"str"},false],["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["idNum",{"t":"str"},false],["extId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cat",{"t":"str"},false],["forWho",{"t":"str"},false],["notes",{"t":"str"},false],["count",{"t":"num"},false],["ils",{"t":"num"},false],["usd",{"t":"num"},false],["first",{"t":"str"},false],["last",{"t":"str"},false],["nextDate",{"t":"str"},false],["nextNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["prayerNames",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrayerName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["note",{"t":"str"},false],["addedAt",{"t":"str"},false],["done",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}}]},true],["nextEventId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["donations",{"t":"arr","of":{"t":"obj","n":"Donation","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["cat",{"t":"str"},false],["designation",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["purpose",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["hist",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["d",{"t":"str"},false],["a",{"t":"num"},false],["c",{"t":"or","of":[{"t":"lit","v":["₪","$"]},{"t":"undef"}]},true],["ref",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["txn",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["receipt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["brand",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["last4",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["clearer",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["pays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["status",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["hok",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Hok","p":[["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["day",{"t":"num"},false],["method",{"t":"str"},false],["note",{"t":"str"},false],["active",{"t":"bool"},false],["startedAt",{"t":"str"},false],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true],["plannedCharges",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["ayin",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"AyinCase","p":[["stage",{"t":"lit","v":["done","new","lead","eyes","answer"]},false],["note",{"t":"str"},false],["answeredNote",{"t":"str"},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["answerPushed",{"t":"bool"},false],["nextTalk",{"t":"str"},false],["nextTalkTime",{"t":"str"},false],["lastTouch",{"t":"str"},false],["names",{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},false],["answers",{"t":"arr","of":{"t":"obj","n":"AyinAnswer","p":[["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["log",{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["time",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TimeEntry","p":[["date",{"t":"str"},false],["hours",{"t":"num"},false],["note",{"t":"str"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["mat",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},true],["kit",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"KitItem","p":[["label",{"t":"str"},false],["done",{"t":"bool"},false]]}}]},true],["boardEventIds",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}}]},true]]}]},true],["calls",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CallEntry","p":[["at",{"t":"str"},false],["outcome",{"t":"lit","v":["done","donated","noanswer","refused","callback","skip"]},false]]}}]},true]]}},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$ayinDailyRows$logToday: [{"name":"todayIso","d":{"t":"str"},"opt":false},{"name":"a","d":{"t":"obj","p":[["stage",{"t":"lit","v":["done","new","lead","eyes","answer"]},false],["note",{"t":"str"},false],["answeredNote",{"t":"str"},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["answerPushed",{"t":"bool"},false],["nextTalk",{"t":"str"},false],["nextTalkTime",{"t":"str"},false],["lastTouch",{"t":"str"},false],["names",{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},false],["answers",{"t":"arr","of":{"t":"obj","n":"AyinAnswer","p":[["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["log",{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["time",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TimeEntry","p":[["date",{"t":"str"},false],["hours",{"t":"num"},false],["note",{"t":"str"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["mat",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},true],["kit",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"KitItem","p":[["label",{"t":"str"},false],["done",{"t":"bool"},false]]}}]},true],["boardEventIds",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}}]},true]]},"opt":false}],
  inner$ayinDailyRows$eyesToday: [{"name":"todayIso","d":{"t":"str"},"opt":false},{"name":"a","d":{"t":"obj","p":[["stage",{"t":"lit","v":["done","new","lead","eyes","answer"]},false],["note",{"t":"str"},false],["answeredNote",{"t":"str"},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["answerPushed",{"t":"bool"},false],["nextTalk",{"t":"str"},false],["nextTalkTime",{"t":"str"},false],["lastTouch",{"t":"str"},false],["names",{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},false],["answers",{"t":"arr","of":{"t":"obj","n":"AyinAnswer","p":[["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["log",{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["time",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TimeEntry","p":[["date",{"t":"str"},false],["hours",{"t":"num"},false],["note",{"t":"str"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["mat",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},true],["kit",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"KitItem","p":[["label",{"t":"str"},false],["done",{"t":"bool"},false]]}}]},true],["boardEventIds",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}}]},true]]},"opt":false}],
  inner$ayinDailyRows$eyesToday$$step: [{"name":"logToday","d":{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$ayinDailyRows$namesLine: [{"name":"a","d":{"t":"obj","p":[["stage",{"t":"lit","v":["done","new","lead","eyes","answer"]},false],["note",{"t":"str"},false],["answeredNote",{"t":"str"},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["answerPushed",{"t":"bool"},false],["nextTalk",{"t":"str"},false],["nextTalkTime",{"t":"str"},false],["lastTouch",{"t":"str"},false],["names",{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},false],["answers",{"t":"arr","of":{"t":"obj","n":"AyinAnswer","p":[["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["log",{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["time",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TimeEntry","p":[["date",{"t":"str"},false],["hours",{"t":"num"},false],["note",{"t":"str"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["mat",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},true],["kit",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"KitItem","p":[["label",{"t":"str"},false],["done",{"t":"bool"},false]]}}]},true],["boardEventIds",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}}]},true]]},"opt":false}],
  inner$ayinDailyRows$noteLine: [{"name":"a","d":{"t":"obj","p":[["stage",{"t":"lit","v":["done","new","lead","eyes","answer"]},false],["note",{"t":"str"},false],["answeredNote",{"t":"str"},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["answerPushed",{"t":"bool"},false],["nextTalk",{"t":"str"},false],["nextTalkTime",{"t":"str"},false],["lastTouch",{"t":"str"},false],["names",{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},false],["answers",{"t":"arr","of":{"t":"obj","n":"AyinAnswer","p":[["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["log",{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["time",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TimeEntry","p":[["date",{"t":"str"},false],["hours",{"t":"num"},false],["note",{"t":"str"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["mat",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},true],["kit",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"KitItem","p":[["label",{"t":"str"},false],["done",{"t":"bool"},false]]}}]},true],["boardEventIds",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}}]},true]]},"opt":false}],
  inner$fmtD$y: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$fmtD$m: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$fmtD$d: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$filterAyinBoard$filter$qd: [{"name":"q","d":{"t":"str"},"opt":false}],
  inner$ayinSheetRows$leadDone: [{"name":"a","d":{"t":"obj","n":"AyinCase","p":[["stage",{"t":"lit","v":["done","new","lead","eyes","answer"]},false],["note",{"t":"str"},false],["answeredNote",{"t":"str"},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["answerPushed",{"t":"bool"},false],["nextTalk",{"t":"str"},false],["nextTalkTime",{"t":"str"},false],["lastTouch",{"t":"str"},false],["names",{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},false],["answers",{"t":"arr","of":{"t":"obj","n":"AyinAnswer","p":[["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["log",{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["time",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TimeEntry","p":[["date",{"t":"str"},false],["hours",{"t":"num"},false],["note",{"t":"str"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["mat",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},true],["kit",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"KitItem","p":[["label",{"t":"str"},false],["done",{"t":"bool"},false]]}}]},true],["boardEventIds",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}}]},true]]},"opt":false}],
  inner$parseAyinSheet$header: [{"name":"rows","d":{"t":"arr","of":{"t":"arr","of":{"t":"str"}}},"opt":false}],
  inner$parseAyinSheet$supN: [{"name":"rows","d":{"t":"arr","of":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"iSup","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$parseAyinSheet$supN$$step: [{"name":"iSup","d":{"t":"num"},"opt":false},{"name":"row","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$parseAyinSheet$nm: [{"name":"rows","d":{"t":"arr","of":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"iNm","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$parseAyinSheet$nm$$step: [{"name":"iNm","d":{"t":"num"},"opt":false},{"name":"row","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$parseAyinSheet$raw: [{"name":"rows","d":{"t":"arr","of":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"iEyes","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$parseAyinSheet$raw$$step: [{"name":"iEyes","d":{"t":"num"},"opt":false},{"name":"row","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$parseAyinSheet$eyes: [{"name":"rows","d":{"t":"arr","of":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"iEyes","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$parseAyinSheet$eyes$$step: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$parseAyinSheet$doneRaw: [{"name":"rows","d":{"t":"arr","of":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"iDone","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$parseAyinSheet$doneRaw$$step: [{"name":"iDone","d":{"t":"num"},"opt":false},{"name":"row","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$parseAyinSheet$paidRaw: [{"name":"rows","d":{"t":"arr","of":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"iPaid","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$parseAyinSheet$paidRaw$$step: [{"name":"iPaid","d":{"t":"num"},"opt":false},{"name":"row","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$parseAyinSheet$ansRaw: [{"name":"rows","d":{"t":"arr","of":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"iAns","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$parseAyinSheet$ansRaw$$step: [{"name":"iAns","d":{"t":"num"},"opt":false},{"name":"row","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$parseAyinSheet$leadRaw: [{"name":"rows","d":{"t":"arr","of":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"iLead","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$parseAyinSheet$leadRaw$$step: [{"name":"iLead","d":{"t":"num"},"opt":false},{"name":"row","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$applyAyinSheet$arr: [{"name":"byId","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"obj","n":"AyinSheetUpd","p":[["supporterId",{"t":"str"},false],["nameId",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["done",{"t":"or","of":[{"t":"bool"},{"t":"null"}]},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"null"}]},false],["answer",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["lead",{"t":"or","of":[{"t":"bool"},{"t":"null"}]},false]]}}},"opt":false},{"name":"u","d":{"t":"obj","n":"AyinSheetUpd","p":[["supporterId",{"t":"str"},false],["nameId",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["done",{"t":"or","of":[{"t":"bool"},{"t":"null"}]},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"null"}]},false],["answer",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["lead",{"t":"or","of":[{"t":"bool"},{"t":"null"}]},false]]},"opt":false}],
  inner$applyAyinSheet$map$mine: [{"name":"byId","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"obj","n":"AyinSheetUpd","p":[["supporterId",{"t":"str"},false],["nameId",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["done",{"t":"or","of":[{"t":"bool"},{"t":"null"}]},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"null"}]},false],["answer",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["lead",{"t":"or","of":[{"t":"bool"},{"t":"null"}]},false]]}}},"opt":false},{"name":"sp","d":{"t":"obj","n":"Supporter","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["phones",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"SupPhone","p":[["id",{"t":"str"},false],["num",{"t":"str"},false],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["wa",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}}]},true],["email",{"t":"str"},false],["address",{"t":"str"},false],["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["idNum",{"t":"str"},false],["extId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cat",{"t":"str"},false],["forWho",{"t":"str"},false],["notes",{"t":"str"},false],["count",{"t":"num"},false],["ils",{"t":"num"},false],["usd",{"t":"num"},false],["first",{"t":"str"},false],["last",{"t":"str"},false],["nextDate",{"t":"str"},false],["nextNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["prayerNames",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrayerName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["note",{"t":"str"},false],["addedAt",{"t":"str"},false],["done",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}}]},true],["nextEventId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["donations",{"t":"arr","of":{"t":"obj","n":"Donation","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["cat",{"t":"str"},false],["designation",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["purpose",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["hist",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["d",{"t":"str"},false],["a",{"t":"num"},false],["c",{"t":"or","of":[{"t":"lit","v":["₪","$"]},{"t":"undef"}]},true],["ref",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["txn",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["receipt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["brand",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["last4",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["clearer",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["pays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["status",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["hok",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Hok","p":[["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["day",{"t":"num"},false],["method",{"t":"str"},false],["note",{"t":"str"},false],["active",{"t":"bool"},false],["startedAt",{"t":"str"},false],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true],["plannedCharges",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["ayin",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"AyinCase","p":[["stage",{"t":"lit","v":["done","new","lead","eyes","answer"]},false],["note",{"t":"str"},false],["answeredNote",{"t":"str"},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["answerPushed",{"t":"bool"},false],["nextTalk",{"t":"str"},false],["nextTalkTime",{"t":"str"},false],["lastTouch",{"t":"str"},false],["names",{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},false],["answers",{"t":"arr","of":{"t":"obj","n":"AyinAnswer","p":[["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["log",{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["time",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TimeEntry","p":[["date",{"t":"str"},false],["hours",{"t":"num"},false],["note",{"t":"str"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["mat",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},true],["kit",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"KitItem","p":[["label",{"t":"str"},false],["done",{"t":"bool"},false]]}}]},true],["boardEventIds",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}}]},true]]}]},true],["calls",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CallEntry","p":[["at",{"t":"str"},false],["outcome",{"t":"lit","v":["done","donated","noanswer","refused","callback","skip"]},false]]}}]},true]]},"opt":false}],
  inner$applyAyinSheet$map$rec: [{"name":"a","d":{"t":"obj","n":"AyinCase","p":[["stage",{"t":"lit","v":["done","new","lead","eyes","answer"]},false],["note",{"t":"str"},false],["answeredNote",{"t":"str"},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["answerPushed",{"t":"bool"},false],["nextTalk",{"t":"str"},false],["nextTalkTime",{"t":"str"},false],["lastTouch",{"t":"str"},false],["names",{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},false],["answers",{"t":"arr","of":{"t":"obj","n":"AyinAnswer","p":[["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["log",{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["time",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TimeEntry","p":[["date",{"t":"str"},false],["hours",{"t":"num"},false],["note",{"t":"str"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["mat",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},true],["kit",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"KitItem","p":[["label",{"t":"str"},false],["done",{"t":"bool"},false]]}}]},true],["boardEventIds",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}}]},true]]},"opt":false},{"name":"u","d":{"t":"obj","n":"AyinSheetUpd","p":[["supporterId",{"t":"str"},false],["nameId",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["done",{"t":"or","of":[{"t":"bool"},{"t":"null"}]},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"null"}]},false],["answer",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["lead",{"t":"or","of":[{"t":"bool"},{"t":"null"}]},false]]},"opt":false}],
  inner$applyAyinSheet$byId$$after_loop: [{"name":"upds","d":{"t":"arr","of":{"t":"obj","n":"AyinSheetUpd","p":[["supporterId",{"t":"str"},false],["nameId",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["done",{"t":"or","of":[{"t":"bool"},{"t":"null"}]},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"null"}]},false],["answer",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["lead",{"t":"or","of":[{"t":"bool"},{"t":"null"}]},false]]}},"opt":false}],
};
