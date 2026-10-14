// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/templates.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const TEMPLATE_DEFS = [
    {
        key: 'wa.delivery',
        label: '🚚 הודעת-מסירה (חלוקה)',
        vars: ['name', 'org'],
        def: 'שלום {name}, משלוח מ{org} בדרך אליכם היום 🚚',
    },
    {
        key: 'wa.payment',
        label: '💳 תזכורת-תשלום (חוגים)',
        vars: ['org', 'what', 'amount'],
        def: 'שלום, תזכורת ידידותית מ{org}: יתרה לתשלום עבור {what} — ₪{amount}. תודה רבה!',
    },
    {
        key: 'wa.birthday',
        label: '🎂 ברכת יום-הולדת',
        vars: ['first', 'org'],
        def: 'מזל טוב ל{first} ליום ההולדת! 🎂 באהבה, {org}',
    },
    {
        // חייגן-מונחה (20.8) — "לא ענה? שלח וואטסאפ" בקמפיין-שיחות; עריך באשף כמו השאר
        key: 'wa.dialer',
        label: '📞 הודעת-חייגן (לא ענה)',
        vars: ['name', 'org'],
        def: 'שלום {name}, ניסינו להשיג אתכם מ{org} ולא הצלחנו — נשמח שתחזרו אלינו 🙏',
    },
    {
        // קישור-תשלום מהחייגן (20.8) — שליחת עמוד-התרומה בוואטסאפ תוך-שיחה (payments)
        key: 'wa.paylink',
        label: '💳 שליחת קישור-תשלום',
        vars: ['name', 'org', 'link'],
        def: 'שלום {name}, תודה על השיחה! לתרומה מקוונת ל{org}: {link} 🙏',
    },
];
export function inner$renderTemplate$def(key) {
    const def = TEMPLATE_DEFS.find((d) => d.key === key)?.def ?? '';
    return def;
}
export function inner$renderTemplate$t(cfg, key) {
    const def = TEMPLATE_DEFS.find((d) => d.key === key)?.def ?? '';
    let t = (cfg?.templates?.[key] ?? '').trim() || def;
    return t;
}
export function inner$renderTemplate$t$$step(cfg, key, def) {
    let t = (cfg?.templates?.[key] ?? '').trim() || def;
    return t;
}
export function inner$renderTemplate$t$$after_loop(cfg, key, vars) {
    const def = TEMPLATE_DEFS.find((d) => d.key === key)?.def ?? '';
    let t = (cfg?.templates?.[key] ?? '').trim() || def;
    for (const [k, v] of Object.entries(vars))
        t = t.split('{' + k + '}').join(v);
    return t;
}

export const SIGS = {
  inner$renderTemplate$def: [{"name":"key","d":{"t":"str"},"opt":false}],
  inner$renderTemplate$t: [{"name":"cfg","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Pick","p":[["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true]]}]},"opt":false},{"name":"key","d":{"t":"str"},"opt":false}],
  inner$renderTemplate$t$$step: [{"name":"cfg","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Pick","p":[["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true]]}]},"opt":false},{"name":"key","d":{"t":"str"},"opt":false},{"name":"def","d":{"t":"str"},"opt":false}],
  inner$renderTemplate$t$$after_loop: [{"name":"cfg","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"Pick","p":[["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true]]}]},"opt":false},{"name":"key","d":{"t":"str"},"opt":false},{"name":"vars","d":{"t":"rec","of":{"t":"str"}},"opt":false}],
};
