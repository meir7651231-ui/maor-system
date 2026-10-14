// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/test/tests/products.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$testProducts$map$optsWithSku(variant) {
    const optsWithSku = variant.opts.filter((o) => !!o.sku);
    return optsWithSku;
}
export function inner$testProducts$map$totalPrices(STORE_IDS, variant) {
    const optsWithSku = variant.opts.filter((o) => !!o.sku);
    const totalPrices = optsWithSku.length * STORE_IDS.length;
    return totalPrices;
}
export function inner$testProducts$map$totalPrices$$step(STORE_IDS, optsWithSku) {
    const totalPrices = optsWithSku.length * STORE_IDS.length;
    return totalPrices;
}
export function inner$testProducts$map$bad(p) {
    const bad = p.accessories.filter((a) => !a.name || a.name.length === 0 || typeof a.must !== 'boolean');
    return bad;
}
export function inner$testProducts$map$missing$$after_loop(STORE_IDS, variant, STORE_PRICING) {
    const optsWithSku = variant.opts.filter((o) => !!o.sku);
    let missing = 0;
    for (const opt of optsWithSku) {
        for (const sid of STORE_IDS) {
            const price = STORE_PRICING[sid]?.[opt.sku];
            if (typeof price !== 'number')
                missing++;
        }
    }
    return missing;
}

export const SIGS = {
  inner$testProducts$map$optsWithSku: [{"name":"variant","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"VariantDef","p":[["label",{"t":"str"},false],["sku",{"t":"bool"},false],["opts",{"t":"arr","of":{"t":"obj","n":"VariantOption","p":[["name",{"t":"str"},false],["sku",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["unit",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["diameter",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["page",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["delta",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["model",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]}]},"opt":false}],
  inner$testProducts$map$totalPrices: [{"name":"STORE_IDS","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"variant","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"VariantDef","p":[["label",{"t":"str"},false],["sku",{"t":"bool"},false],["opts",{"t":"arr","of":{"t":"obj","n":"VariantOption","p":[["name",{"t":"str"},false],["sku",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["unit",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["diameter",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["page",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["delta",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["model",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]}]},"opt":false}],
  inner$testProducts$map$totalPrices$$step: [{"name":"STORE_IDS","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"optsWithSku","d":{"t":"arr","of":{"t":"obj","n":"VariantOption","p":[["name",{"t":"str"},false],["sku",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["unit",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["diameter",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["page",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["delta",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["model",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$testProducts$map$bad: [{"name":"p","d":{"t":"obj","n":"CatalogProduct","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["categoryTopId",{"t":"str"},false],["categoryLeafId",{"t":"str"},false],["productType",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["series",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["material",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["image",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["catalogProduct",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["accessoryProduct",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["accessories",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Accessory","p":[["name",{"t":"str"},false],["emoji",{"t":"str"},false],["price",{"t":"num"},false],["qty",{"t":"num"},false],["why",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["must",{"t":"bool"},false],["sizes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true]]}}]},true]]},"opt":false}],
  inner$testProducts$map$missing$$after_loop: [{"name":"STORE_IDS","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"variant","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"VariantDef","p":[["label",{"t":"str"},false],["sku",{"t":"bool"},false],["opts",{"t":"arr","of":{"t":"obj","n":"VariantOption","p":[["name",{"t":"str"},false],["sku",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["unit",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["diameter",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["page",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["delta",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["model",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]}]},"opt":false},{"name":"STORE_PRICING","d":{"t":"rec","of":{"t":"rec","of":{"t":"num"}}},"opt":false}],
};
