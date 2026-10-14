// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/askMaor.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$askMaor$t(q) {
    const t = q.trim();
    return t;
}
export function inner$askMaor$year(todayIso) {
    const year = todayIso.slice(0, 4);
    return year;
}
export function inner$askMaor$month(q, todayIso) {
    const t = q.trim();
    const month = /החודש/.test(t) ? todayIso.slice(0, 7) : null;
    return month;
}
export function inner$askMaor$month$$step(todayIso, t) {
    const month = /החודש/.test(t) ? todayIso.slice(0, 7) : null;
    return month;
}
export function inner$askMaor$total$$after_loop(q, todayIso, usdRate, sups) {
    const t = q.trim();
    const year = todayIso.slice(0, 4);
    const rate = usdRate || 3.7;
    const month = /החודש/.test(t) ? todayIso.slice(0, 7) : null;
    const pref = month ?? year;
    let total = 0;
    let gifts = 0;
    for (const sp of sups) {
        for (const d of sp.donations)
            if (d.amount > 0 && d.date.startsWith(pref)) {
                total += d.cur === '$' ? d.amount * rate : d.amount;
                gifts++;
            }
        for (const h of sp.hist ?? [])
            if (h.a > 0 && h.d.startsWith(pref) && !/נדח|decline|error/i.test(h.status ?? '')) {
                total += h.c === '$' ? h.a * rate : h.a;
                gifts++;
            }
    }
    return total;
}
export function inner$askMaor$gifts$$after_loop(q, todayIso, usdRate, sups) {
    const t = q.trim();
    const year = todayIso.slice(0, 4);
    const rate = usdRate || 3.7;
    const month = /החודש/.test(t) ? todayIso.slice(0, 7) : null;
    const pref = month ?? year;
    let total = 0;
    let gifts = 0;
    for (const sp of sups) {
        for (const d of sp.donations)
            if (d.amount > 0 && d.date.startsWith(pref)) {
                total += d.cur === '$' ? d.amount * rate : d.amount;
                gifts++;
            }
        for (const h of sp.hist ?? [])
            if (h.a > 0 && h.d.startsWith(pref) && !/נדח|decline|error/i.test(h.status ?? '')) {
                total += h.c === '$' ? h.a * rate : h.a;
                gifts++;
            }
    }
    return gifts;
}

export const SIGS = {
  inner$askMaor$t: [{"name":"q","d":{"t":"str"},"opt":false}],
  inner$askMaor$year: [{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$askMaor$month: [{"name":"q","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$askMaor$month$$step: [{"name":"todayIso","d":{"t":"str"},"opt":false},{"name":"t","d":{"t":"str"},"opt":false}],
  inner$askMaor$total$$after_loop: [{"name":"q","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false},{"name":"usdRate","d":{"t":"num"},"opt":false},{"name":"sups","d":{"t":"arr","of":{"t":"obj","n":"Supporter","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["phones",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"SupPhone","p":[["id",{"t":"str"},false],["num",{"t":"str"},false],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["wa",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}}]},true],["email",{"t":"str"},false],["address",{"t":"str"},false],["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["idNum",{"t":"str"},false],["extId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cat",{"t":"str"},false],["forWho",{"t":"str"},false],["notes",{"t":"str"},false],["count",{"t":"num"},false],["ils",{"t":"num"},false],["usd",{"t":"num"},false],["first",{"t":"str"},false],["last",{"t":"str"},false],["nextDate",{"t":"str"},false],["nextNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["prayerNames",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrayerName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["note",{"t":"str"},false],["addedAt",{"t":"str"},false],["done",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}}]},true],["nextEventId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["donations",{"t":"arr","of":{"t":"obj","n":"Donation","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["cat",{"t":"str"},false],["designation",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["purpose",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["hist",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["d",{"t":"str"},false],["a",{"t":"num"},false],["c",{"t":"or","of":[{"t":"lit","v":["₪","$"]},{"t":"undef"}]},true],["ref",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["txn",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["receipt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["brand",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["last4",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["clearer",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["pays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["status",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["hok",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Hok","p":[["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["day",{"t":"num"},false],["method",{"t":"str"},false],["note",{"t":"str"},false],["active",{"t":"bool"},false],["startedAt",{"t":"str"},false],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true],["plannedCharges",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["ayin",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"AyinCase","p":[["stage",{"t":"lit","v":["done","new","lead","eyes","answer"]},false],["note",{"t":"str"},false],["answeredNote",{"t":"str"},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["answerPushed",{"t":"bool"},false],["nextTalk",{"t":"str"},false],["nextTalkTime",{"t":"str"},false],["lastTouch",{"t":"str"},false],["names",{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},false],["answers",{"t":"arr","of":{"t":"obj","n":"AyinAnswer","p":[["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["log",{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["time",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TimeEntry","p":[["date",{"t":"str"},false],["hours",{"t":"num"},false],["note",{"t":"str"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["mat",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},true],["kit",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"KitItem","p":[["label",{"t":"str"},false],["done",{"t":"bool"},false]]}}]},true],["boardEventIds",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}}]},true]]}]},true],["calls",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CallEntry","p":[["at",{"t":"str"},false],["outcome",{"t":"lit","v":["done","donated","noanswer","refused","callback","skip"]},false]]}}]},true]]}},"opt":false}],
  inner$askMaor$gifts$$after_loop: [{"name":"q","d":{"t":"str"},"opt":false},{"name":"todayIso","d":{"t":"str"},"opt":false},{"name":"usdRate","d":{"t":"num"},"opt":false},{"name":"sups","d":{"t":"arr","of":{"t":"obj","n":"Supporter","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["phones",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"SupPhone","p":[["id",{"t":"str"},false],["num",{"t":"str"},false],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["wa",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}}]},true],["email",{"t":"str"},false],["address",{"t":"str"},false],["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["idNum",{"t":"str"},false],["extId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cat",{"t":"str"},false],["forWho",{"t":"str"},false],["notes",{"t":"str"},false],["count",{"t":"num"},false],["ils",{"t":"num"},false],["usd",{"t":"num"},false],["first",{"t":"str"},false],["last",{"t":"str"},false],["nextDate",{"t":"str"},false],["nextNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["prayerNames",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrayerName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["note",{"t":"str"},false],["addedAt",{"t":"str"},false],["done",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}}]},true],["nextEventId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["donations",{"t":"arr","of":{"t":"obj","n":"Donation","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["cat",{"t":"str"},false],["designation",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["purpose",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["hist",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["d",{"t":"str"},false],["a",{"t":"num"},false],["c",{"t":"or","of":[{"t":"lit","v":["₪","$"]},{"t":"undef"}]},true],["ref",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["txn",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["receipt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["brand",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["last4",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["clearer",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["pays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["status",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["hok",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Hok","p":[["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["day",{"t":"num"},false],["method",{"t":"str"},false],["note",{"t":"str"},false],["active",{"t":"bool"},false],["startedAt",{"t":"str"},false],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true],["plannedCharges",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["ayin",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"AyinCase","p":[["stage",{"t":"lit","v":["done","new","lead","eyes","answer"]},false],["note",{"t":"str"},false],["answeredNote",{"t":"str"},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["answerPushed",{"t":"bool"},false],["nextTalk",{"t":"str"},false],["nextTalkTime",{"t":"str"},false],["lastTouch",{"t":"str"},false],["names",{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},false],["answers",{"t":"arr","of":{"t":"obj","n":"AyinAnswer","p":[["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["log",{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["time",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TimeEntry","p":[["date",{"t":"str"},false],["hours",{"t":"num"},false],["note",{"t":"str"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["mat",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},true],["kit",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"KitItem","p":[["label",{"t":"str"},false],["done",{"t":"bool"},false]]}}]},true],["boardEventIds",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}}]},true]]}]},true],["calls",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CallEntry","p":[["at",{"t":"str"},false],["outcome",{"t":"lit","v":["done","donated","noanswer","refused","callback","skip"]},false]]}}]},true]]}},"opt":false}],
};
