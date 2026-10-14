// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/test/tests/dsync.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$testDsync$expectedCartCount(cart) {
    const expectedCartCount = cart.value.reduce((s, l) => s + l.qty, 0);
    return expectedCartCount;
}
export function inner$testDsync$orphanVariants(productIds, VARIANTS) {
    const orphanVariants = Object.keys(VARIANTS).filter((id) => !productIds.has(id));
    return orphanVariants;
}
export function inner$testDsync$badBundles(TOOL_BUNDLES) {
    const badBundles = Object.entries(TOOL_BUNDLES).filter(([, list]) => list.some((t) => !t.name || !t.emoji));
    return badBundles;
}
export function inner$testDsync$knownSkus$$after_loop(VARIANTS) {
    const knownSkus = new Set();
    for (const v of Object.values(VARIANTS)) {
        for (const opt of v.opts) {
            if (opt.sku)
                knownSkus.add(opt.sku);
        }
    }
    return knownSkus;
}
export function inner$testDsync$orphanSkus$$after_loop(STORE_PRICING, VARIANTS) {
    const knownSkus = new Set();
    for (const v of Object.values(VARIANTS)) {
        for (const opt of v.opts) {
            if (opt.sku)
                knownSkus.add(opt.sku);
        }
    }
    const orphanSkus = [];
    for (const sid of Object.keys(STORE_PRICING)) {
        for (const sku of Object.keys(STORE_PRICING[sid] ?? {})) {
            if (!knownSkus.has(sku))
                orphanSkus.push(`${sid}/${sku}`);
        }
    }
    return orphanSkus;
}

export const SIGS = {
  inner$testDsync$expectedCartCount: [{"name":"cart","d":{"t":"any"},"opt":false}],
  inner$testDsync$orphanVariants: [{"name":"productIds","d":{"t":"set","of":{"t":"str"}},"opt":false},{"name":"VARIANTS","d":{"t":"rec","of":{"t":"obj","n":"VariantDef","p":[["label",{"t":"str"},false],["sku",{"t":"bool"},false],["opts",{"t":"arr","of":{"t":"obj","n":"VariantOption","p":[["name",{"t":"str"},false],["sku",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["unit",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["diameter",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["page",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["delta",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["model",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]}},"opt":false}],
  inner$testDsync$badBundles: [{"name":"TOOL_BUNDLES","d":{"t":"rec","of":{"t":"arr","of":{"t":"obj","n":"ToolItem","p":[["name",{"t":"str"},false],["emoji",{"t":"str"},false],["why",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"num"},false]]}}},"opt":false}],
  inner$testDsync$knownSkus$$after_loop: [{"name":"VARIANTS","d":{"t":"rec","of":{"t":"obj","n":"VariantDef","p":[["label",{"t":"str"},false],["sku",{"t":"bool"},false],["opts",{"t":"arr","of":{"t":"obj","n":"VariantOption","p":[["name",{"t":"str"},false],["sku",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["unit",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["diameter",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["page",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["delta",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["model",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]}},"opt":false}],
  inner$testDsync$orphanSkus$$after_loop: [{"name":"STORE_PRICING","d":{"t":"rec","of":{"t":"rec","of":{"t":"num"}}},"opt":false},{"name":"VARIANTS","d":{"t":"rec","of":{"t":"obj","n":"VariantDef","p":[["label",{"t":"str"},false],["sku",{"t":"bool"},false],["opts",{"t":"arr","of":{"t":"obj","n":"VariantOption","p":[["name",{"t":"str"},false],["sku",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["unit",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["diameter",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["page",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["delta",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["model",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false]]}},"opt":false}],
};
