// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/test/tests/dupes.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const catKey = (c) => `${c.parentId ?? '~root'}::${c.name}`;
export function inner$testDupes$existing(byName, p) {
    const existing = byName.get(p.name) ?? [];
    return existing;
}
export function inner$testDupes$nameClashes(PRODUCTS) {
    const byName = new Map();
    for (const p of PRODUCTS) {
        const existing = byName.get(p.name) ?? [];
        existing.push(p.id);
        byName.set(p.name, existing);
    }
    const nameClashes = [...byName.entries()].filter(([, ids]) => ids.length > 1);
    return nameClashes;
}
export function inner$testDupes$nameClashes$$step(byName) {
    const nameClashes = [...byName.entries()].filter(([, ids]) => ids.length > 1);
    return nameClashes;
}
export function inner$testDupes$k(c) {
    const k = catKey(c);
    return k;
}
export function inner$testDupes$existing_L38(catByKey, c) {
    const k = catKey(c);
    const existing = catByKey.get(k) ?? [];
    return existing;
}
export function inner$testDupes$existing_L38$$step(catByKey, k) {
    const existing = catByKey.get(k) ?? [];
    return existing;
}
export function inner$testDupes$catClashes(CATEGORIES) {
    const catByKey = new Map();
    for (const c of CATEGORIES) {
        const k = catKey(c);
        const existing = catByKey.get(k) ?? [];
        existing.push(c.id);
        catByKey.set(k, existing);
    }
    const catClashes = [...catByKey.entries()].filter(([, ids]) => ids.length > 1);
    return catClashes;
}
export function inner$testDupes$catClashes$$step(catByKey) {
    const catClashes = [...catByKey.entries()].filter(([, ids]) => ids.length > 1);
    return catClashes;
}
export function inner$testDupes$byName$$after_loop(PRODUCTS) {
    const byName = new Map();
    for (const p of PRODUCTS) {
        const existing = byName.get(p.name) ?? [];
        existing.push(p.id);
        byName.set(p.name, existing);
    }
    return byName;
}
export function inner$testDupes$catByKey$$after_loop(CATEGORIES) {
    const catByKey = new Map();
    for (const c of CATEGORIES) {
        const k = catKey(c);
        const existing = catByKey.get(k) ?? [];
        existing.push(c.id);
        catByKey.set(k, existing);
    }
    return catByKey;
}

export const SIGS = {
  inner$testDupes$existing: [{"name":"byName","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"p","d":{"t":"obj","n":"CatalogProduct","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["categoryTopId",{"t":"str"},false],["categoryLeafId",{"t":"str"},false],["productType",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["series",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["material",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["image",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["catalogProduct",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["accessoryProduct",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["accessories",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Accessory","p":[["name",{"t":"str"},false],["emoji",{"t":"str"},false],["price",{"t":"num"},false],["qty",{"t":"num"},false],["why",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["must",{"t":"bool"},false],["sizes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true]]}}]},true]]},"opt":false}],
  inner$testDupes$nameClashes: [{"name":"PRODUCTS","d":{"t":"arr","of":{"t":"obj","n":"CatalogProduct","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["categoryTopId",{"t":"str"},false],["categoryLeafId",{"t":"str"},false],["productType",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["series",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["material",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["image",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["catalogProduct",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["accessoryProduct",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["accessories",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Accessory","p":[["name",{"t":"str"},false],["emoji",{"t":"str"},false],["price",{"t":"num"},false],["qty",{"t":"num"},false],["why",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["must",{"t":"bool"},false],["sizes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true]]}}]},true]]}},"opt":false}],
  inner$testDupes$nameClashes$$step: [{"name":"byName","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"str"}}},"opt":false}],
  inner$testDupes$k: [{"name":"c","d":{"t":"obj","n":"CatalogCategory","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["parentId",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false}],
  inner$testDupes$existing_L38: [{"name":"catByKey","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"c","d":{"t":"obj","n":"CatalogCategory","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["parentId",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false}],
  inner$testDupes$existing_L38$$step: [{"name":"catByKey","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"k","d":{"t":"str"},"opt":false}],
  inner$testDupes$catClashes: [{"name":"CATEGORIES","d":{"t":"arr","of":{"t":"obj","n":"CatalogCategory","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["parentId",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},"opt":false}],
  inner$testDupes$catClashes$$step: [{"name":"catByKey","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"str"}}},"opt":false}],
  inner$testDupes$byName$$after_loop: [{"name":"PRODUCTS","d":{"t":"arr","of":{"t":"obj","n":"CatalogProduct","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["categoryTopId",{"t":"str"},false],["categoryLeafId",{"t":"str"},false],["productType",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["series",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["material",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["image",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["catalogProduct",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["accessoryProduct",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["accessories",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Accessory","p":[["name",{"t":"str"},false],["emoji",{"t":"str"},false],["price",{"t":"num"},false],["qty",{"t":"num"},false],["why",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["must",{"t":"bool"},false],["sizes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true]]}}]},true]]}},"opt":false}],
  inner$testDupes$catByKey$$after_loop: [{"name":"CATEGORIES","d":{"t":"arr","of":{"t":"obj","n":"CatalogCategory","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["parentId",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},"opt":false}],
};
