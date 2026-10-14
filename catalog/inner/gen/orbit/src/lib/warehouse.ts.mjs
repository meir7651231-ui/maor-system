// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/warehouse.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function norm(s) {
    return (s || '').trim().replace(/\s+/g, ' ').toLowerCase();
}
export function inner$warehouseOverview$k(m) {
    const k = norm(m.name);
    return k;
}
export function inner$warehouseOverview$map$rows(used, item) {
    const rows = used.get(norm(item.name)) || [];
    return rows;
}
export function inner$warehouseOverview$map$allocated(used, item) {
    const rows = used.get(norm(item.name)) || [];
    const allocated = rows.reduce((a, r) => a + r.qty, 0);
    return allocated;
}
export function inner$warehouseOverview$map$allocated$$step(rows) {
    const allocated = rows.reduce((a, r) => a + r.qty, 0);
    return allocated;
}
export function inner$warehouseOverview$map$remaining(used, item) {
    const rows = used.get(norm(item.name)) || [];
    const allocated = rows.reduce((a, r) => a + r.qty, 0);
    const remaining = (+item.qty || 0) - allocated;
    return remaining;
}
export function inner$warehouseOverview$map$remaining$$step(item, allocated) {
    const remaining = (+item.qty || 0) - allocated;
    return remaining;
}
export function inner$warehouseOverview$used$$after_loop(supporters) {
    const used = new Map();
    for (const sp of supporters) {
        const mat = sp.ayin?.mat;
        if (!mat || !mat.length)
            continue;
        // צבירה פר-פרויקט-ושם (כמה מאותו-חומר בפרויקט אחד).
        const perName = new Map();
        for (const m of mat) {
            const k = norm(m.name);
            if (!k)
                continue;
            perName.set(k, (perName.get(k) || 0) + (+m.qty || 0));
        }
        for (const [k, qty] of perName) {
            if (qty <= 0)
                continue;
            used.set(k, [...(used.get(k) || []), { id: sp.id, name: sp.name, qty }]);
        }
    }
    return used;
}
export function inner$warehouseOverview$perName$$after_loop(mat) {
    const perName = new Map();
    for (const m of mat) {
        const k = norm(m.name);
        if (!k)
            continue;
        perName.set(k, (perName.get(k) || 0) + (+m.qty || 0));
    }
    return perName;
}

export const SIGS = {
  inner$warehouseOverview$k: [{"name":"m","d":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]},"opt":false}],
  inner$warehouseOverview$map$rows: [{"name":"used","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["qty",{"t":"num"},false]]}}},"opt":false},{"name":"item","d":{"t":"obj","n":"WarehouseItem","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["unit",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]},"opt":false}],
  inner$warehouseOverview$map$allocated: [{"name":"used","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["qty",{"t":"num"},false]]}}},"opt":false},{"name":"item","d":{"t":"obj","n":"WarehouseItem","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["unit",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]},"opt":false}],
  inner$warehouseOverview$map$allocated$$step: [{"name":"rows","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["qty",{"t":"num"},false]]}},"opt":false}],
  inner$warehouseOverview$map$remaining: [{"name":"used","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["qty",{"t":"num"},false]]}}},"opt":false},{"name":"item","d":{"t":"obj","n":"WarehouseItem","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["unit",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]},"opt":false}],
  inner$warehouseOverview$map$remaining$$step: [{"name":"item","d":{"t":"obj","n":"WarehouseItem","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["unit",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]},"opt":false},{"name":"allocated","d":{"t":"num"},"opt":false}],
  inner$warehouseOverview$used$$after_loop: [{"name":"supporters","d":{"t":"arr","of":{"t":"obj","n":"Supporter","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["phones",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"SupPhone","p":[["id",{"t":"str"},false],["num",{"t":"str"},false],["label",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["wa",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}}]},true],["email",{"t":"str"},false],["address",{"t":"str"},false],["city",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["idNum",{"t":"str"},false],["extId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cat",{"t":"str"},false],["forWho",{"t":"str"},false],["notes",{"t":"str"},false],["count",{"t":"num"},false],["ils",{"t":"num"},false],["usd",{"t":"num"},false],["first",{"t":"str"},false],["last",{"t":"str"},false],["nextDate",{"t":"str"},false],["nextNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["photos",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["prayerNames",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PrayerName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["note",{"t":"str"},false],["addedAt",{"t":"str"},false],["done",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}}]},true],["nextEventId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["donations",{"t":"arr","of":{"t":"obj","n":"Donation","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["cat",{"t":"str"},false],["designation",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["purpose",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["hist",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["d",{"t":"str"},false],["a",{"t":"num"},false],["c",{"t":"or","of":[{"t":"lit","v":["₪","$"]},{"t":"undef"}]},true],["ref",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["txn",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["receipt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["brand",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["last4",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["clearer",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["pays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["status",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["hok",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Hok","p":[["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["day",{"t":"num"},false],["method",{"t":"str"},false],["note",{"t":"str"},false],["active",{"t":"bool"},false],["startedAt",{"t":"str"},false],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true],["plannedCharges",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["ayin",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"AyinCase","p":[["stage",{"t":"lit","v":["done","new","lead","eyes","answer"]},false],["note",{"t":"str"},false],["answeredNote",{"t":"str"},false],["paid",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["answerPushed",{"t":"bool"},false],["nextTalk",{"t":"str"},false],["nextTalkTime",{"t":"str"},false],["lastTouch",{"t":"str"},false],["names",{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},false],["answers",{"t":"arr","of":{"t":"obj","n":"AyinAnswer","p":[["date",{"t":"str"},false],["note",{"t":"str"},false]]}},false],["log",{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["time",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TimeEntry","p":[["date",{"t":"str"},false],["hours",{"t":"num"},false],["note",{"t":"str"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["mat",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},true],["kit",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"KitItem","p":[["label",{"t":"str"},false],["done",{"t":"bool"},false]]}}]},true],["boardEventIds",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}}]},true]]}]},true],["calls",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CallEntry","p":[["at",{"t":"str"},false],["outcome",{"t":"lit","v":["done","donated","noanswer","refused","callback","skip"]},false]]}}]},true]]}},"opt":false}],
  inner$warehouseOverview$perName$$after_loop: [{"name":"mat","d":{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},"opt":false}],
};
