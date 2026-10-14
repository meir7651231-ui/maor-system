// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/pricing.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const DEFAULT_INTEGRATION_PRICES = {
    receipts: 60, // קבלות §46 אוטומטיות — ערך-ציות גבוה
    payments: 90, // סליקה והוראות-קבע
    whatsapp: 50,
    sms: 40, // דמי-מודול (עלות-הודעה בפועל נגבית בנפרד)
    phone: 90, // טלפוניה/מרכזייה
    gcal: 30,
    drive: 30,
    sheets: 40,
    maps: 40,
    esign: 60, // חתימה דיגיטלית
    ai: 120, // עוזר-חכם — פרימיום
    campaign: 60,
};
const DEFAULT_PRICES = {
    base: 290, // ליבה: בית · משפחות · לוח · הגדרות (CRM בסיסי)
    modules: {
        families: 0, // כלול בבסיס (CRM ליבה)
        calendar: 0, // כלול בבסיס
        courses: 120, // חוגים · שיבוצים · נוכחות — מודול כבד
        diary: 70,
        supporters: 180, // תורמים + קבלות §46 — הערך הגבוה ביותר
        reports: 60,
        tzedaka: 90,
        shop: 90,
        shop7: 80, // חלוקה
    },
    integrations: DEFAULT_INTEGRATION_PRICES,
    sizeMult: { small: 1, medium: 1.6, large: 2.4 },
    setup: 1500, // הקמה/הטמעה חד-פעמית — נורמת-שוק (הבעלים יכול לאפס כמנוף-מכירה)
    enterprise: { oneTime: 55000, annualMaintenance: 9000 },
};
const num = (v, fb) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fb);
export function inner$normalizePrices$base(raw) {
    const base = raw && typeof raw === 'object' ? raw : {};
    return base;
}
export function inner$computeQuote$addonLines(prices, addons) {
    const addonLines = addons.map((a) => ({ key: a.key, label: a.label, price: prices.integrations[a.key] ?? 0, kind: 'integration' }));
    return addonLines;
}
export function inner$computeQuote$lines(prices, addons, all) {
    const addonLines = addons.map((a) => ({ key: a.key, label: a.label, price: prices.integrations[a.key] ?? 0, kind: 'integration' }));
    const lines = [...all.filter((l) => l.price > 0), ...addonLines.filter((l) => l.price > 0)];
    return lines;
}
export function inner$computeQuote$lines$$step(all, addonLines) {
    const lines = [...all.filter((l) => l.price > 0), ...addonLines.filter((l) => l.price > 0)];
    return lines;
}
export function inner$computeQuote$included(all) {
    const included = all.filter((l) => l.price === 0);
    return included;
}
export function inner$computeQuote$modulesSubtotal(prices, addons, all) {
    const addonLines = addons.map((a) => ({ key: a.key, label: a.label, price: prices.integrations[a.key] ?? 0, kind: 'integration' }));
    const lines = [...all.filter((l) => l.price > 0), ...addonLines.filter((l) => l.price > 0)];
    const modulesSubtotal = lines.reduce((s, l) => s + l.price, 0);
    return modulesSubtotal;
}
export function inner$computeQuote$modulesSubtotal$$step(lines) {
    const modulesSubtotal = lines.reduce((s, l) => s + l.price, 0);
    return modulesSubtotal;
}
export function inner$computeQuote$monthly(size, prices, addons, all) {
    const addonLines = addons.map((a) => ({ key: a.key, label: a.label, price: prices.integrations[a.key] ?? 0, kind: 'integration' }));
    const lines = [...all.filter((l) => l.price > 0), ...addonLines.filter((l) => l.price > 0)];
    const modulesSubtotal = lines.reduce((s, l) => s + l.price, 0);
    const sizeMult = prices.sizeMult[size] ?? 1;
    const monthly = Math.round((prices.base + modulesSubtotal) * sizeMult);
    return monthly;
}
export function inner$computeQuote$monthly$$step(prices, modulesSubtotal, sizeMult) {
    const monthly = Math.round((prices.base + modulesSubtotal) * sizeMult);
    return monthly;
}
export function inner$normalizePrices$modules$$after_loop(raw, ALL_MODULES) {
    const base = raw && typeof raw === 'object' ? raw : {};
    const modules = {};
    for (const m of ALL_MODULES)
        modules[m] = num(base.modules?.[m], DEFAULT_PRICES.modules[m] ?? 0);
    return modules;
}
export function inner$normalizePrices$integrations$$after_loop(raw) {
    const base = raw && typeof raw === 'object' ? raw : {};
    const integrations = {};
    for (const k of Object.keys(DEFAULT_INTEGRATION_PRICES)) {
        integrations[k] = num(base.integrations?.[k], DEFAULT_INTEGRATION_PRICES[k]);
    }
    return integrations;
}

export const SIGS = {
  inner$normalizePrices$base: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$computeQuote$addonLines: [{"name":"prices","d":{"t":"obj","n":"PriceTable","p":[["base",{"t":"num"},false],["modules",{"t":"obj","n":"Partial","p":[["families",{"t":"any"},true],["supporters",{"t":"any"},true],["courses",{"t":"any"},true],["calendar",{"t":"any"},true],["diary",{"t":"any"},true],["tzedaka",{"t":"any"},true],["shop",{"t":"any"},true],["shop7",{"t":"any"},true],["parnasa",{"t":"any"},true],["hosting",{"t":"any"},true],["reports",{"t":"any"},true]]},false],["integrations",{"t":"rec","of":{"t":"num"}},false],["sizeMult",{"t":"obj","n":"Record","p":[["small",{"t":"any"},false],["large",{"t":"any"},false],["medium",{"t":"any"},false]]},false],["setup",{"t":"num"},false],["enterprise",{"t":"obj","p":[["oneTime",{"t":"num"},false],["annualMaintenance",{"t":"num"},false]]},false]]},"opt":false},{"name":"addons","d":{"t":"arr","of":{"t":"obj","n":"AddonInput","p":[["key",{"t":"str"},false],["label",{"t":"str"},false]]}},"opt":false}],
  inner$computeQuote$lines: [{"name":"prices","d":{"t":"obj","n":"PriceTable","p":[["base",{"t":"num"},false],["modules",{"t":"obj","n":"Partial","p":[["families",{"t":"any"},true],["supporters",{"t":"any"},true],["courses",{"t":"any"},true],["calendar",{"t":"any"},true],["diary",{"t":"any"},true],["tzedaka",{"t":"any"},true],["shop",{"t":"any"},true],["shop7",{"t":"any"},true],["parnasa",{"t":"any"},true],["hosting",{"t":"any"},true],["reports",{"t":"any"},true]]},false],["integrations",{"t":"rec","of":{"t":"num"}},false],["sizeMult",{"t":"obj","n":"Record","p":[["small",{"t":"any"},false],["large",{"t":"any"},false],["medium",{"t":"any"},false]]},false],["setup",{"t":"num"},false],["enterprise",{"t":"obj","p":[["oneTime",{"t":"num"},false],["annualMaintenance",{"t":"num"},false]]},false]]},"opt":false},{"name":"addons","d":{"t":"arr","of":{"t":"obj","n":"AddonInput","p":[["key",{"t":"str"},false],["label",{"t":"str"},false]]}},"opt":false},{"name":"all","d":{"t":"arr","of":{"t":"obj","n":"QuoteLine","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["price",{"t":"num"},false],["kind",{"t":"lit","v":["module","integration"]},false]]}},"opt":false}],
  inner$computeQuote$lines$$step: [{"name":"all","d":{"t":"arr","of":{"t":"obj","n":"QuoteLine","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["price",{"t":"num"},false],["kind",{"t":"lit","v":["module","integration"]},false]]}},"opt":false},{"name":"addonLines","d":{"t":"arr","of":{"t":"obj","n":"QuoteLine","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["price",{"t":"num"},false],["kind",{"t":"lit","v":["module","integration"]},false]]}},"opt":false}],
  inner$computeQuote$included: [{"name":"all","d":{"t":"arr","of":{"t":"obj","n":"QuoteLine","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["price",{"t":"num"},false],["kind",{"t":"lit","v":["module","integration"]},false]]}},"opt":false}],
  inner$computeQuote$modulesSubtotal: [{"name":"prices","d":{"t":"obj","n":"PriceTable","p":[["base",{"t":"num"},false],["modules",{"t":"obj","n":"Partial","p":[["families",{"t":"any"},true],["supporters",{"t":"any"},true],["courses",{"t":"any"},true],["calendar",{"t":"any"},true],["diary",{"t":"any"},true],["tzedaka",{"t":"any"},true],["shop",{"t":"any"},true],["shop7",{"t":"any"},true],["parnasa",{"t":"any"},true],["hosting",{"t":"any"},true],["reports",{"t":"any"},true]]},false],["integrations",{"t":"rec","of":{"t":"num"}},false],["sizeMult",{"t":"obj","n":"Record","p":[["small",{"t":"any"},false],["large",{"t":"any"},false],["medium",{"t":"any"},false]]},false],["setup",{"t":"num"},false],["enterprise",{"t":"obj","p":[["oneTime",{"t":"num"},false],["annualMaintenance",{"t":"num"},false]]},false]]},"opt":false},{"name":"addons","d":{"t":"arr","of":{"t":"obj","n":"AddonInput","p":[["key",{"t":"str"},false],["label",{"t":"str"},false]]}},"opt":false},{"name":"all","d":{"t":"arr","of":{"t":"obj","n":"QuoteLine","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["price",{"t":"num"},false],["kind",{"t":"lit","v":["module","integration"]},false]]}},"opt":false}],
  inner$computeQuote$modulesSubtotal$$step: [{"name":"lines","d":{"t":"arr","of":{"t":"obj","n":"QuoteLine","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["price",{"t":"num"},false],["kind",{"t":"lit","v":["module","integration"]},false]]}},"opt":false}],
  inner$computeQuote$monthly: [{"name":"size","d":{"t":"lit","v":["small","large","medium"]},"opt":false},{"name":"prices","d":{"t":"obj","n":"PriceTable","p":[["base",{"t":"num"},false],["modules",{"t":"obj","n":"Partial","p":[["families",{"t":"any"},true],["supporters",{"t":"any"},true],["courses",{"t":"any"},true],["calendar",{"t":"any"},true],["diary",{"t":"any"},true],["tzedaka",{"t":"any"},true],["shop",{"t":"any"},true],["shop7",{"t":"any"},true],["parnasa",{"t":"any"},true],["hosting",{"t":"any"},true],["reports",{"t":"any"},true]]},false],["integrations",{"t":"rec","of":{"t":"num"}},false],["sizeMult",{"t":"obj","n":"Record","p":[["small",{"t":"any"},false],["large",{"t":"any"},false],["medium",{"t":"any"},false]]},false],["setup",{"t":"num"},false],["enterprise",{"t":"obj","p":[["oneTime",{"t":"num"},false],["annualMaintenance",{"t":"num"},false]]},false]]},"opt":false},{"name":"addons","d":{"t":"arr","of":{"t":"obj","n":"AddonInput","p":[["key",{"t":"str"},false],["label",{"t":"str"},false]]}},"opt":false},{"name":"all","d":{"t":"arr","of":{"t":"obj","n":"QuoteLine","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["price",{"t":"num"},false],["kind",{"t":"lit","v":["module","integration"]},false]]}},"opt":false}],
  inner$computeQuote$monthly$$step: [{"name":"prices","d":{"t":"obj","n":"PriceTable","p":[["base",{"t":"num"},false],["modules",{"t":"obj","n":"Partial","p":[["families",{"t":"any"},true],["supporters",{"t":"any"},true],["courses",{"t":"any"},true],["calendar",{"t":"any"},true],["diary",{"t":"any"},true],["tzedaka",{"t":"any"},true],["shop",{"t":"any"},true],["shop7",{"t":"any"},true],["parnasa",{"t":"any"},true],["hosting",{"t":"any"},true],["reports",{"t":"any"},true]]},false],["integrations",{"t":"rec","of":{"t":"num"}},false],["sizeMult",{"t":"obj","n":"Record","p":[["small",{"t":"any"},false],["large",{"t":"any"},false],["medium",{"t":"any"},false]]},false],["setup",{"t":"num"},false],["enterprise",{"t":"obj","p":[["oneTime",{"t":"num"},false],["annualMaintenance",{"t":"num"},false]]},false]]},"opt":false},{"name":"modulesSubtotal","d":{"t":"num"},"opt":false},{"name":"sizeMult","d":{"t":"num"},"opt":false}],
  inner$normalizePrices$modules$$after_loop: [{"name":"raw","d":{"t":"any"},"opt":false},{"name":"ALL_MODULES","d":{"t":"arr","of":{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]}},"opt":false}],
  inner$normalizePrices$integrations$$after_loop: [{"name":"raw","d":{"t":"any"},"opt":false}],
};
