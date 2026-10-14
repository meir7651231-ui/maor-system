// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/make-normalize-config.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$makeNormalizeConfig$normalizeConfig$cfg(T, DEFAULT_CONFIG, c) {
    const cfg = {
        ...DEFAULT_CONFIG,
        ...c,
        slug: typeof c.slug === T.k3 && c.slug ? c.slug : DEFAULT_CONFIG.slug,
        orgName: typeof c.orgName === T.k3 ? c.orgName : DEFAULT_CONFIG.orgName,
        theme: typeof c.theme === T.k3 && c.theme ? c.theme : DEFAULT_CONFIG.theme,
        modules: c.modules && typeof c.modules === T.k2 && !Array.isArray(c.modules) ? { ...c.modules } : {},
        features: c.features && typeof c.features === T.k2 && !Array.isArray(c.features)
            ? { ...c.features }
            : {},
        terms: c.terms && typeof c.terms === T.k2 && !Array.isArray(c.terms) ? { ...c.terms } : {},
    };
    return cfg;
}
export function inner$makeNormalizeConfig$normalizeConfig$admins(T, c) {
    const admins = Array.isArray(c.adminEmails)
        ? c.adminEmails.filter((e) => typeof e === T.k3 && e.trim() !== '')
        : [];
    return admins;
}
export function inner$makeNormalizeConfig$normalizeConfig$teachersRaw(T, rolesRaw) {
    const teachersRaw = rolesRaw && typeof rolesRaw === T.k2 && rolesRaw.teachers && typeof rolesRaw.teachers === T.k2
        ? rolesRaw.teachers
        : null;
    return teachersRaw;
}
export function inner$makeNormalizeConfig$normalizeConfig$hosts(T, c) {
    const hosts = c.allowedHosts.filter((h) => typeof h === T.k3 && !!h.trim()).map((h) => h.trim().slice(0, T.k7)).slice(0, T.k6);
    return hosts;
}
export function inner$makeNormalizeConfig$normalizeConfig$ints$$after_loop(T, INTEGRATION_KEYS, INTEGRATION_SETTING_KEYS, intsRaw) {
    const ints = {};
    for (const [k, v] of Object.entries(intsRaw)) {
        if (!INTEGRATION_KEYS.includes(k))
            continue;
        if (v && typeof v === T.k2 && !Array.isArray(v) && typeof v.enabled === T.k4) {
            const entry = { enabled: v.enabled };
            // גל ג׳: הגדרות-מחרוזת מה-allowlist בלבד (payUrl וכו') — השאר נזרק
            for (const s of INTEGRATION_SETTING_KEYS[k] ?? []) {
                const sv = v[s];
                if (typeof sv === T.k3 && sv.trim())
                    entry[s] = sv.trim();
            }
            ints[k] = entry;
        }
    }
    return ints;
}
export function inner$makeNormalizeConfig$normalizeConfig$entry$$after_loop(T, INTEGRATION_SETTING_KEYS, k, v) {
    const entry = { enabled: v.enabled };
    for (const s of INTEGRATION_SETTING_KEYS[k] ?? []) {
        const sv = v[s];
        if (typeof sv === T.k3 && sv.trim())
            entry[s] = sv.trim();
    }
    return entry;
}
export function inner$makeNormalizeConfig$normalizeConfig$tpl$$after_loop(T, TEMPLATE_KEYS, tplRaw) {
    const tpl = {};
    for (const [k, v] of Object.entries(tplRaw)) {
        if (!TEMPLATE_KEYS.includes(k))
            continue;
        if (typeof v === T.k3 && v.trim())
            tpl[k] = v.trim().slice(0, T.k5);
    }
    return tpl;
}
export function inner$makeNormalizeConfig$normalizeConfig$teachers$$after_loop(T, rolesRaw) {
    const teachersRaw = rolesRaw && typeof rolesRaw === T.k2 && rolesRaw.teachers && typeof rolesRaw.teachers === T.k2
        ? rolesRaw.teachers
        : null;
    const teachers = {};
    for (const [k, v] of Object.entries(teachersRaw))
        if (k.trim() && typeof v === T.k3 && v.trim())
            teachers[k.trim()] = v.trim();
    return teachers;
}

export const SIGS = {
  inner$makeNormalizeConfig$normalizeConfig$cfg: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"DEFAULT_CONFIG","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$makeNormalizeConfig$normalizeConfig$admins: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$makeNormalizeConfig$normalizeConfig$teachersRaw: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"rolesRaw","d":{"t":"any"},"opt":false}],
  inner$makeNormalizeConfig$normalizeConfig$hosts: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$makeNormalizeConfig$normalizeConfig$ints$$after_loop: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"INTEGRATION_KEYS","d":{"t":"any"},"opt":false},{"name":"INTEGRATION_SETTING_KEYS","d":{"t":"any"},"opt":false},{"name":"intsRaw","d":{"t":"any"},"opt":false}],
  inner$makeNormalizeConfig$normalizeConfig$entry$$after_loop: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"INTEGRATION_SETTING_KEYS","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"str"},"opt":false},{"name":"v","d":{"t":"any"},"opt":false}],
  inner$makeNormalizeConfig$normalizeConfig$tpl$$after_loop: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"TEMPLATE_KEYS","d":{"t":"any"},"opt":false},{"name":"tplRaw","d":{"t":"any"},"opt":false}],
  inner$makeNormalizeConfig$normalizeConfig$teachers$$after_loop: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"rolesRaw","d":{"t":"any"},"opt":false}],
};
