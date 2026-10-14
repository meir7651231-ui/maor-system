// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/hosting/kitchen.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function toMin(t) {
    if (!t || t.indexOf(':') < 0)
        return null;
    const [hh, mm] = t.split(':').map(Number);
    return Number.isFinite(hh) && Number.isFinite(mm) ? hh * 60 + mm : null;
}
function parseIng(str) {
    const i = str.indexOf('·');
    if (i < 0)
        return { name: str.trim(), qty: '' };
    return { name: str.slice(0, i).trim(), qty: str.slice(i + 1).trim() };
}
function mealFactor(m, dish, item) {
    const base = dish?.baseServings || 4;
    const portions = item?.qty ? item.qty : m.dinerCount || base;
    return portions / base;
}
const TS_PRESETS = {
    basic: [
        ['צלחת', 1],
        ['כוס', 1],
        ['מפית', 1],
        ['סכו״ם', 1],
    ],
    feast: [
        ['צלחת', 2],
        ['כוס', 2],
        ['מפית', 2],
        ['סכו״ם', 1],
        ['קערית', 1],
    ],
};
export function inner$toMin$hh(t) {
    const [hh, mm] = t.split(':').map(Number);
    return hh;
}
export function inner$toMin$mm(t) {
    const [hh, mm] = t.split(':').map(Number);
    return mm;
}
export function inner$minTo$v(x) {
    const v = ((x % 1440) + 1440) % 1440;
    return v;
}
export function inner$mealLeadMinutes$p(d) {
    const p = (parseInt(d?.prepTime ?? '', 10) || 0) + (parseInt(d?.cookTime ?? '', 10) || 0);
    return p;
}
export function inner$mealStartTime$tm(m) {
    const tm = toMin(m.time);
    return tm;
}
export function inner$mealDueNow$tm(m) {
    const tm = toMin(m.time);
    return tm;
}
export function inner$countdown$s(ms) {
    const s = Math.floor(-ms / 1000);
    return s;
}
export function inner$countdown$h(ms) {
    const s = Math.floor(-ms / 1000);
    const h = Math.floor(s / 3600);
    return h;
}
export function inner$countdown$h$$step(s) {
    const h = Math.floor(s / 3600);
    return h;
}
export function inner$countdown$m(ms) {
    const s = Math.floor(-ms / 1000);
    const m = Math.floor((s % 3600) / 60);
    return m;
}
export function inner$countdown$m$$step(s) {
    const m = Math.floor((s % 3600) / 60);
    return m;
}
export function inner$countdown$s_L93(ms) {
    const s = Math.floor(ms / 1000);
    return s;
}
export function inner$countdown$h_L94(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    return h;
}
export function inner$countdown$h_L94$$step(s) {
    const h = Math.floor(s / 3600);
    return h;
}
export function inner$countdown$m_L95(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor((s % 3600) / 60);
    return m;
}
export function inner$countdown$m_L95$$step(s) {
    const m = Math.floor((s % 3600) / 60);
    return m;
}
export function inner$parseIng$i(str) {
    const i = str.indexOf('·');
    return i;
}
export function inner$mealFactor$portions(m, dish, item) {
    const base = dish?.baseServings || 4;
    const portions = item?.qty ? item.qty : m.dinerCount || base;
    return portions;
}
export function inner$mealFactor$portions$$step(m, item, base) {
    const portions = item?.qty ? item.qty : m.dinerCount || base;
    return portions;
}
export function inner$staffRoleIn$dishes(m, staffId) {
    const dishes = m.items.filter((i) => i.by === staffId).map((i) => i.name);
    return dishes;
}
export function inner$shopIcon$n(name) {
    const n = (name || '').trim();
    return n;
}
export function inner$aggregateIngredients$f(m, it, d) {
    const f = mealFactor(m, d, it);
    return f;
}
export function inner$aggregateIngredients$p(g) {
    const p = parseIng(g);
    return p;
}
export function inner$aggregateIngredients$list(agg, g) {
    const p = parseIng(g);
    const list = agg.get(p.name) ?? [];
    return list;
}
export function inner$aggregateIngredients$list$$step(agg, p) {
    const list = agg.get(p.name) ?? [];
    return list;
}
export function inner$shoppingList$key(name) {
    const key = 'ing:' + name;
    return key;
}
export function inner$shoppingList$key_L341(t) {
    const key = 'tbl:' + t.id;
    return key;
}
export function inner$shoppingList$key_L345(s) {
    const key = 'sup:' + s.id;
    return key;
}
export function inner$shoppingList$gotN(products) {
    const gotN = products.filter((p) => p.got).length;
    return gotN;
}
export function inner$shoppingList$pct(products, total) {
    const gotN = products.filter((p) => p.got).length;
    const pct = total ? Math.round((gotN / total) * 100) : 0;
    return pct;
}
export function inner$shoppingList$pct$$step(total, gotN) {
    const pct = total ? Math.round((gotN / total) * 100) : 0;
    return pct;
}
export function inner$tablesetPresetPlan$ex(items, name) {
    const ex = items.find((t) => t.name === name);
    return ex;
}
export function inner$tablesetPresetPlan$set$$after_loop(items, preset) {
    const set = [];
    const add = [];
    for (const [name, per] of TS_PRESETS[preset]) {
        const ex = items.find((t) => t.name === name);
        if (ex)
            set.push({ id: ex.id, perGuest: per });
        else
            add.push({ name, perGuest: per });
    }
    return set;
}
export function inner$tablesetPresetPlan$add$$after_loop(items, preset) {
    const set = [];
    const add = [];
    for (const [name, per] of TS_PRESETS[preset]) {
        const ex = items.find((t) => t.name === name);
        if (ex)
            set.push({ id: ex.id, perGuest: per });
        else
            add.push({ name, perGuest: per });
    }
    return add;
}

export const SIGS = {
  inner$toMin$hh: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$toMin$mm: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$minTo$v: [{"name":"x","d":{"t":"num"},"opt":false}],
  inner$mealLeadMinutes$p: [{"name":"d","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"HostDish","p":[["kind",{"t":"lit","v":["dish"]},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["price",{"t":"num"},false],["allergens",{"t":"str"},false],["prepTime",{"t":"str"},false],["cookTime",{"t":"str"},false],["cookTemp",{"t":"str"},false],["baseServings",{"t":"num"},false],["ingredients",{"t":"arr","of":{"t":"str"}},false],["steps",{"t":"arr","of":{"t":"str"}},false],["notes",{"t":"str"},false],["defBy",{"t":"str"},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}]},"opt":false}],
  inner$mealStartTime$tm: [{"name":"m","d":{"t":"obj","n":"Pick","p":[["time",{"t":"str"},false],["items",{"t":"arr","of":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$mealDueNow$tm: [{"name":"m","d":{"t":"obj","n":"Pick","p":[["status",{"t":"lit","v":["ready","new","cancelled","prep","qc","served"]},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["items",{"t":"arr","of":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$countdown$s: [{"name":"ms","d":{"t":"num"},"opt":false}],
  inner$countdown$h: [{"name":"ms","d":{"t":"num"},"opt":false}],
  inner$countdown$h$$step: [{"name":"s","d":{"t":"num"},"opt":false}],
  inner$countdown$m: [{"name":"ms","d":{"t":"num"},"opt":false}],
  inner$countdown$m$$step: [{"name":"s","d":{"t":"num"},"opt":false}],
  inner$countdown$s_L93: [{"name":"ms","d":{"t":"num"},"opt":false}],
  inner$countdown$h_L94: [{"name":"ms","d":{"t":"num"},"opt":false}],
  inner$countdown$h_L94$$step: [{"name":"s","d":{"t":"num"},"opt":false}],
  inner$countdown$m_L95: [{"name":"ms","d":{"t":"num"},"opt":false}],
  inner$countdown$m_L95$$step: [{"name":"s","d":{"t":"num"},"opt":false}],
  inner$parseIng$i: [{"name":"str","d":{"t":"str"},"opt":false}],
  inner$mealFactor$portions: [{"name":"m","d":{"t":"obj","n":"Pick","p":[["dinerCount",{"t":"num"},false]]},"opt":false},{"name":"dish","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Pick","p":[["baseServings",{"t":"num"},false]]}]},"opt":false},{"name":"item","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Pick","p":[["qty",{"t":"num"},false]]}]},"opt":false}],
  inner$mealFactor$portions$$step: [{"name":"m","d":{"t":"obj","n":"Pick","p":[["dinerCount",{"t":"num"},false]]},"opt":false},{"name":"item","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Pick","p":[["qty",{"t":"num"},false]]}]},"opt":false},{"name":"base","d":{"t":"num"},"opt":false}],
  inner$staffRoleIn$dishes: [{"name":"m","d":{"t":"obj","n":"HostMeal","p":[["kind",{"t":"lit","v":["meal"]},false],["mealName",{"t":"str"},false],["bookingId",{"t":"str"},false],["unitId",{"t":"str"},false],["guestId",{"t":"str"},false],["diners",{"t":"arr","of":{"t":"obj","n":"HostDiner","p":[["guestId",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false]]}},false],["dinerCount",{"t":"num"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["cook",{"t":"str"},false],["server",{"t":"str"},false],["clearer",{"t":"str"},false],["tableSetter",{"t":"str"},false],["items",{"t":"arr","of":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]}},false],["status",{"t":"lit","v":["ready","new","cancelled","prep","qc","served"]},false],["allergens",{"t":"str"},false],["notes",{"t":"str"},false],["seatPlan",{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false},{"name":"staffId","d":{"t":"str"},"opt":false}],
  inner$shopIcon$n: [{"name":"name","d":{"t":"str"},"opt":false}],
  inner$aggregateIngredients$f: [{"name":"m","d":{"t":"obj","n":"HostMeal","p":[["kind",{"t":"lit","v":["meal"]},false],["mealName",{"t":"str"},false],["bookingId",{"t":"str"},false],["unitId",{"t":"str"},false],["guestId",{"t":"str"},false],["diners",{"t":"arr","of":{"t":"obj","n":"HostDiner","p":[["guestId",{"t":"str"},false],["adults",{"t":"num"},false],["kids",{"t":"num"},false]]}},false],["dinerCount",{"t":"num"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["cook",{"t":"str"},false],["server",{"t":"str"},false],["clearer",{"t":"str"},false],["tableSetter",{"t":"str"},false],["items",{"t":"arr","of":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]}},false],["status",{"t":"lit","v":["ready","new","cancelled","prep","qc","served"]},false],["allergens",{"t":"str"},false],["notes",{"t":"str"},false],["seatPlan",{"t":"obj","n":"HostSeatPlan","p":[["people",{"t":"arr","of":{"t":"obj","n":"HostSeatPerson","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"or","of":[{"t":"lit","v":["adult","kid"]},{"t":"undef"}]},true],["guestId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["tables",{"t":"arr","of":{"t":"obj","n":"HostSeatTable","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["cap",{"t":"num"},false],["shape",{"t":"lit","v":["round","rect","square"]},false],["chair",{"t":"str"},false],["seated",{"t":"arr","of":{"t":"str"}},false],["head",{"t":"bool"},false],["note",{"t":"str"},false]]}},false]]},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false},{"name":"it","d":{"t":"obj","n":"HostMealItem","p":[["name",{"t":"str"},false],["dishId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false],["qty",{"t":"num"},false],["alg",{"t":"str"},false],["by",{"t":"str"},false]]},"opt":false},{"name":"d","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"HostDish","p":[["kind",{"t":"lit","v":["dish"]},false],["name",{"t":"str"},false],["type",{"t":"str"},false],["price",{"t":"num"},false],["allergens",{"t":"str"},false],["prepTime",{"t":"str"},false],["cookTime",{"t":"str"},false],["cookTemp",{"t":"str"},false],["baseServings",{"t":"num"},false],["ingredients",{"t":"arr","of":{"t":"str"}},false],["steps",{"t":"arr","of":{"t":"str"}},false],["notes",{"t":"str"},false],["defBy",{"t":"str"},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}]},"opt":false}],
  inner$aggregateIngredients$p: [{"name":"g","d":{"t":"str"},"opt":false}],
  inner$aggregateIngredients$list: [{"name":"agg","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"g","d":{"t":"str"},"opt":false}],
  inner$aggregateIngredients$list$$step: [{"name":"agg","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"p","d":{"t":"obj","p":[["name",{"t":"str"},false],["qty",{"t":"str"},false]]},"opt":false}],
  inner$shoppingList$key: [{"name":"name","d":{"t":"str"},"opt":false}],
  inner$shoppingList$key_L341: [{"name":"t","d":{"t":"obj","n":"HostTableItem","p":[["kind",{"t":"lit","v":["tableItem"]},false],["name",{"t":"str"},false],["perGuest",{"t":"num"},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$shoppingList$key_L345: [{"name":"s","d":{"t":"obj","n":"HostSupply","p":[["kind",{"t":"lit","v":["supply"]},false],["name",{"t":"str"},false],["cat",{"t":"str"},false],["qty",{"t":"str"},false],["bought",{"t":"bool"},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$shoppingList$gotN: [{"name":"products","d":{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[["key",{"t":"str"},false],["icon",{"t":"str"},false],["name",{"t":"str"},false],["qty",{"t":"str"},false],["sec",{"t":"lit","v":["sup","ing","tbl"]},false],["supplyId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["got",{"t":"bool"},false]]}},"opt":false}],
  inner$shoppingList$pct: [{"name":"products","d":{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[["key",{"t":"str"},false],["icon",{"t":"str"},false],["name",{"t":"str"},false],["qty",{"t":"str"},false],["sec",{"t":"lit","v":["sup","ing","tbl"]},false],["supplyId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["got",{"t":"bool"},false]]}},"opt":false},{"name":"total","d":{"t":"num"},"opt":false}],
  inner$shoppingList$pct$$step: [{"name":"total","d":{"t":"num"},"opt":false},{"name":"gotN","d":{"t":"num"},"opt":false}],
  inner$tablesetPresetPlan$ex: [{"name":"items","d":{"t":"arr","of":{"t":"obj","n":"HostTableItem","p":[["kind",{"t":"lit","v":["tableItem"]},false],["name",{"t":"str"},false],["perGuest",{"t":"num"},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"name","d":{"t":"str"},"opt":false}],
  inner$tablesetPresetPlan$set$$after_loop: [{"name":"items","d":{"t":"arr","of":{"t":"obj","n":"HostTableItem","p":[["kind",{"t":"lit","v":["tableItem"]},false],["name",{"t":"str"},false],["perGuest",{"t":"num"},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"preset","d":{"t":"lit","v":["basic","feast"]},"opt":false}],
  inner$tablesetPresetPlan$add$$after_loop: [{"name":"items","d":{"t":"arr","of":{"t":"obj","n":"HostTableItem","p":[["kind",{"t":"lit","v":["tableItem"]},false],["name",{"t":"str"},false],["perGuest",{"t":"num"},false],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"preset","d":{"t":"lit","v":["basic","feast"]},"opt":false}],
};
