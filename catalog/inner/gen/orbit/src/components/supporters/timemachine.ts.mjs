// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/timemachine.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function hokAccrual(sp, offsetDays, rate) {
    const hok = sp.hok;
    if (!hok || !hok.active || !hok.amount)
        return 0;
    const months = Math.floor(offsetDays / 30);
    if (months <= 0)
        return 0;
    const v = hok.cur === '$' ? hok.amount * rate : hok.amount;
    return v * months;
}
export function inner$churnAtOffset$cadence(scan, span) {
    const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : 365;
    return cadence;
}
export function inner$churnAtOffset$expected(scan, span) {
    const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : 365;
    const expected = Math.max(30, cadence * 1.5);
    return expected;
}
export function inner$churnAtOffset$expected$$step(cadence) {
    const expected = Math.max(30, cadence * 1.5);
    return expected;
}
export function inner$hokAccrual$months(offsetDays) {
    const months = Math.floor(offsetDays / 30);
    return months;
}
export function inner$hokAccrual$v(rate, hok) {
    const v = hok.cur === '$' ? hok.amount * rate : hok.amount;
    return v;
}
export function inner$timeMachine$offs(horizons) {
    const offs = Array.from(new Set(horizons.map((h) => Math.max(0, Math.round(h))))).sort((a, b) => a - b);
    return offs;
}
export function inner$timeMachine$inc(rate, sp, h) {
    let inc = hokAccrual(sp, h.offsetDays, rate);
    return inc;
}
export function inner$timeMachine$last(H) {
    const last = H[H.length - 1];
    return last;
}

export const SIGS = {
  inner$churnAtOffset$cadence: [{"name":"scan","d":{"t":"obj","n":"DonorScan","p":[["count",{"t":"num"},false],["ils",{"t":"num"},false],["first",{"t":"str"},false],["last",{"t":"str"},false],["monthly",{"t":"arr","of":{"t":"num"}},false]]},"opt":false},{"name":"span","d":{"t":"num"},"opt":false}],
  inner$churnAtOffset$expected: [{"name":"scan","d":{"t":"obj","n":"DonorScan","p":[["count",{"t":"num"},false],["ils",{"t":"num"},false],["first",{"t":"str"},false],["last",{"t":"str"},false],["monthly",{"t":"arr","of":{"t":"num"}},false]]},"opt":false},{"name":"span","d":{"t":"num"},"opt":false}],
  inner$churnAtOffset$expected$$step: [{"name":"cadence","d":{"t":"num"},"opt":false}],
  inner$hokAccrual$months: [{"name":"offsetDays","d":{"t":"num"},"opt":false}],
  inner$hokAccrual$v: [{"name":"rate","d":{"t":"num"},"opt":false},{"name":"hok","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Hok","p":[["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["day",{"t":"num"},false],["method",{"t":"str"},false],["note",{"t":"str"},false],["active",{"t":"bool"},false],["startedAt",{"t":"str"},false],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false}],
  inner$timeMachine$offs: [{"name":"horizons","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$timeMachine$inc: [{"name":"rate","d":{"t":"num"},"opt":false},{"name":"sp","d":{"t":"obj","n":"Supporter","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["phones",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"SupPhone","p":[["id",{"t":"str"},false],["num",{"t":"str"},false],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["wa",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}}]},true],["email",{"t":"str"},false],["address",{"t":"str"},false],["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["idNum",{"t":"str"},false],["extId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cat",{"t":"str"},false],["forWho",{"t":"str"},false],["notes",{"t":"str"},false],["count",{"t":"num"},false],["ils",{"t":"num"},false],["usd",{"t":"num"},false],["first",{"t":"str"},false],["last",{"t":"str"},false],["nextDate",{"t":"str"},false],["nextNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["prayerNames",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrayerName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["note",{"t":"str"},false],["addedAt",{"t":"str"},false],["done",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}}]},true],["nextEventId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["donations",{"t":"arr","of":{"t":"obj","n":"Donation","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["cat",{"t":"str"},false],["designation",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["purpose",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["hist",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["d",{"t":"str"},false],["a",{"t":"num"},false],["c",{"t":"or","of":[{"t":"lit","v":["₪","$"]},{"t":"undef"}]},true],["ref",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["txn",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["receipt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["brand",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["last4",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["clearer",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["pays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["status",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["hok",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Hok","p":[["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["day",{"t":"num"},false],["method",{"t":"str"},false],["note",{"t":"str"},false],["active",{"t":"bool"},false],["startedAt",{"t":"str"},false],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true],["plannedCharges",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["ayin",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"AyinCase","p":[["stage",{"t":"lit","v":["done","new","lead","eyes","answer"]},false],["note",{"t":"str"},false],["answeredNote",{"t":"str"},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["answerPushed",{"t":"bool"},false],["nextTalk",{"t":"str"},false],["nextTalkTime",{"t":"str"},false],["lastTouch",{"t":"str"},false],["names",{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},false],["answers",{"t":"arr","of":{"t":"obj","n":"AyinAnswer","p":[["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["log",{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["time",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TimeEntry","p":[["date",{"t":"str"},false],["hours",{"t":"num"},false],["note",{"t":"str"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["mat",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},true],["kit",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"KitItem","p":[["label",{"t":"str"},false],["done",{"t":"bool"},false]]}}]},true],["boardEventIds",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}}]},true]]}]},true],["calls",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CallEntry","p":[["at",{"t":"str"},false],["outcome",{"t":"lit","v":["done","donated","noanswer","refused","callback","skip"]},false]]}}]},true]]},"opt":false},{"name":"h","d":{"t":"obj","n":"HorizonState","p":[["offsetDays",{"t":"num"},false],["dateIso",{"t":"str"},false],["atRiskCount",{"t":"num"},false],["atRiskMoney",{"t":"num"},false],["newlyAtRisk",{"t":"num"},false],["expectedIncoming",{"t":"num"},false],["activeCount",{"t":"num"},false]]},"opt":false}],
  inner$timeMachine$last: [{"name":"H","d":{"t":"arr","of":{"t":"obj","n":"HorizonState","p":[["offsetDays",{"t":"num"},false],["dateIso",{"t":"str"},false],["atRiskCount",{"t":"num"},false],["atRiskMoney",{"t":"num"},false],["newlyAtRisk",{"t":"num"},false],["expectedIncoming",{"t":"num"},false],["activeCount",{"t":"num"},false]]}},"opt":false}],
};
