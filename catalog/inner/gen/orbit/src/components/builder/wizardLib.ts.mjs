// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/builder/wizardLib.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const SUBGROUP_LABELS = {
    punch: '🎟️ כרטיסיות',
    printout: '🖨 תדפיסים ודוחות',
    enroll: '📝 שיבוץ',
    absence: '🕐 חיסורים והשלמות',
    makeup: '🕐 חיסורים והשלמות',
    attendance: '🕐 חיסורים והשלמות',
    receipt: '🧾 קבלות',
    ayin: '🗂 מעקב-טיפול ופרויקטים',
    cred: '⭐ אמינות',
    hok: '🔁 הוראות-קבע',
};
const labelOf = (f) => {
    const parts = f.key.split('.');
    return parts.length >= 3 ? (SUBGROUP_LABELS[parts[1]] ?? null) : null;
};
export function inner$wizardDiff$optIn(features) {
    const optIn = new Set(features.filter((f) => f.optIn).map((f) => f.key));
    return optIn;
}
export function inner$wizardDiff$termChanged(cfg, terms) {
    const termChanged = terms
        .filter((t) => {
        const ov = (cfg.terms?.[t.key] ?? '').trim();
        return ov !== '' && ov !== t.fallback;
    })
        .map((t) => t.key);
    return termChanged;
}
export function inner$wizardDiff$filter$ov(cfg, t) {
    const ov = (cfg.terms?.[t.key] ?? '').trim();
    return ov;
}
export function inner$wizardDiff$integrationsOn(cfg) {
    const integrationsOn = Object.entries(cfg.integrations ?? {})
        .filter(([, v]) => v?.enabled === true)
        .map(([k]) => k);
    return integrationsOn;
}
export function inner$groupFeatures$labelOf$parts(f) {
    const parts = f.key.split('.');
    return parts;
}
export function inner$groupFeatures$l(f) {
    const l = labelOf(f);
    return l;
}
export function inner$groupFeatures$l_L121(f) {
    const l = labelOf(f);
    return l;
}
export function inner$integrationMatches$nq(q) {
    const nq = q.trim();
    return nq;
}
export function inner$wizardDiff$featChanged$$after_loop(cfg, features) {
    const optIn = new Set(features.filter((f) => f.optIn).map((f) => f.key));
    const featChanged = [];
    for (const [k, v] of Object.entries(cfg.features ?? {})) {
        if (v === false)
            featChanged.push(k);
        else if (v === true && optIn.has(k))
            featChanged.push(k);
    }
    return featChanged;
}
export function inner$groupFeatures$counts$$after_loop(feats) {
    const counts = {};
    for (const f of feats) {
        const l = labelOf(f);
        if (l)
            counts[l] = (counts[l] ?? 0) + 1;
    }
    return counts;
}
export function inner$groupFeatures$groups$$after_loop(feats) {
    const counts = {};
    for (const f of feats) {
        const l = labelOf(f);
        if (l)
            counts[l] = (counts[l] ?? 0) + 1;
    }
    const groups = [];
    const at = {};
    const general = { label: null, items: [] };
    for (const f of feats) {
        const l = labelOf(f);
        if (l && counts[l] >= 2) {
            if (!at[l]) {
                at[l] = { label: l, items: [] };
                groups.push(at[l]);
            }
            at[l].items.push(f);
        }
        else
            general.items.push(f);
    }
    return groups;
}
export function inner$groupFeatures$at$$after_loop(feats) {
    const counts = {};
    for (const f of feats) {
        const l = labelOf(f);
        if (l)
            counts[l] = (counts[l] ?? 0) + 1;
    }
    const groups = [];
    const at = {};
    const general = { label: null, items: [] };
    for (const f of feats) {
        const l = labelOf(f);
        if (l && counts[l] >= 2) {
            if (!at[l]) {
                at[l] = { label: l, items: [] };
                groups.push(at[l]);
            }
            at[l].items.push(f);
        }
        else
            general.items.push(f);
    }
    return at;
}
export function inner$groupFeatures$general$$after_loop(feats) {
    const counts = {};
    for (const f of feats) {
        const l = labelOf(f);
        if (l)
            counts[l] = (counts[l] ?? 0) + 1;
    }
    const groups = [];
    const at = {};
    const general = { label: null, items: [] };
    for (const f of feats) {
        const l = labelOf(f);
        if (l && counts[l] >= 2) {
            if (!at[l]) {
                at[l] = { label: l, items: [] };
                groups.push(at[l]);
            }
            at[l].items.push(f);
        }
        else
            general.items.push(f);
    }
    return general;
}

export const SIGS = {
  inner$wizardDiff$optIn: [{"name":"features","d":{"t":"arr","of":{"t":"obj","n":"FeatureDef","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["desc",{"t":"str"},false],["optIn",{"t":"or","of":[{"t":"lit","v":[true]},{"t":"undef"}]},true],["module",{"t":"lit","v":["families","supporters","home","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports","settings","core","shell","signup"]},false]]}},"opt":false}],
  inner$wizardDiff$termChanged: [{"name":"cfg","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false},{"name":"terms","d":{"t":"arr","of":{"t":"obj","n":"TermDef","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["fallback",{"t":"str"},false]]}},"opt":false}],
  inner$wizardDiff$filter$ov: [{"name":"cfg","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false},{"name":"t","d":{"t":"obj","n":"TermDef","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["fallback",{"t":"str"},false]]},"opt":false}],
  inner$wizardDiff$integrationsOn: [{"name":"cfg","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$groupFeatures$labelOf$parts: [{"name":"f","d":{"t":"obj","n":"FeatureDef","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["desc",{"t":"str"},false],["optIn",{"t":"or","of":[{"t":"lit","v":[true]},{"t":"undef"}]},true],["module",{"t":"lit","v":["families","supporters","home","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports","settings","core","shell","signup"]},false]]},"opt":false}],
  inner$groupFeatures$l: [{"name":"f","d":{"t":"obj","n":"FeatureDef","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["desc",{"t":"str"},false],["optIn",{"t":"or","of":[{"t":"lit","v":[true]},{"t":"undef"}]},true],["module",{"t":"lit","v":["families","supporters","home","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports","settings","core","shell","signup"]},false]]},"opt":false}],
  inner$groupFeatures$l_L121: [{"name":"f","d":{"t":"obj","n":"FeatureDef","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["desc",{"t":"str"},false],["optIn",{"t":"or","of":[{"t":"lit","v":[true]},{"t":"undef"}]},true],["module",{"t":"lit","v":["families","supporters","home","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports","settings","core","shell","signup"]},false]]},"opt":false}],
  inner$integrationMatches$nq: [{"name":"q","d":{"t":"str"},"opt":false}],
  inner$wizardDiff$featChanged$$after_loop: [{"name":"cfg","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false},{"name":"features","d":{"t":"arr","of":{"t":"obj","n":"FeatureDef","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["desc",{"t":"str"},false],["optIn",{"t":"or","of":[{"t":"lit","v":[true]},{"t":"undef"}]},true],["module",{"t":"lit","v":["families","supporters","home","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports","settings","core","shell","signup"]},false]]}},"opt":false}],
  inner$groupFeatures$counts$$after_loop: [{"name":"feats","d":{"t":"arr","of":{"t":"obj","n":"FeatureDef","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["desc",{"t":"str"},false],["optIn",{"t":"or","of":[{"t":"lit","v":[true]},{"t":"undef"}]},true],["module",{"t":"lit","v":["families","supporters","home","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports","settings","core","shell","signup"]},false]]}},"opt":false}],
  inner$groupFeatures$groups$$after_loop: [{"name":"feats","d":{"t":"arr","of":{"t":"obj","n":"FeatureDef","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["desc",{"t":"str"},false],["optIn",{"t":"or","of":[{"t":"lit","v":[true]},{"t":"undef"}]},true],["module",{"t":"lit","v":["families","supporters","home","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports","settings","core","shell","signup"]},false]]}},"opt":false}],
  inner$groupFeatures$at$$after_loop: [{"name":"feats","d":{"t":"arr","of":{"t":"obj","n":"FeatureDef","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["desc",{"t":"str"},false],["optIn",{"t":"or","of":[{"t":"lit","v":[true]},{"t":"undef"}]},true],["module",{"t":"lit","v":["families","supporters","home","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports","settings","core","shell","signup"]},false]]}},"opt":false}],
  inner$groupFeatures$general$$after_loop: [{"name":"feats","d":{"t":"arr","of":{"t":"obj","n":"FeatureDef","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["desc",{"t":"str"},false],["optIn",{"t":"or","of":[{"t":"lit","v":[true]},{"t":"undef"}]},true],["module",{"t":"lit","v":["families","supporters","home","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports","settings","core","shell","signup"]},false]]}},"opt":false}],
};
