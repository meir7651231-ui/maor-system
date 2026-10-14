// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/builder/BuilderWizard.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$parseFirebaseSnippet$pick$m(text, key) {
    const m = text.match(new RegExp(`["']?${key}["']?\\s*[:=]\\s*["']([^"']+)["']`));
    return m;
}
export function inner$TermRow$effective(props) {
    const effective = props.value.trim() || props.t.fallback;
    return effective;
}
export function inner$TermRow$overridden(props) {
    const overridden = props.value.trim() !== '' && props.value.trim() !== props.t.fallback;
    return overridden;
}
export function inner$PriceInput$fn$n(e) {
    const n = Number(e.target.value);
    return n;
}
export function inner$ListEditor$move$j(i, dir) {
    const j = i + dir;
    return j;
}
export function inner$ListEditor$move$next(items) {
    const next = items.slice();
    return next;
}
export function inner$BuilderWizard$undo$prev(hist) {
    const prev = hist[hist.length - 1];
    return prev;
}
export function inner$BuilderWizard$q(query) {
    const q = query.trim();
    return q;
}
export function inner$BuilderWizard$searching(query) {
    const q = query.trim();
    const searching = q.length > 0;
    return searching;
}
export function inner$BuilderWizard$searching$$step(q) {
    const searching = q.length > 0;
    return searching;
}
export function inner$BuilderWizard$filtering(rowFilter) {
    const filtering = rowFilter !== 'all';
    return filtering;
}
export function inner$BuilderWizard$renderModuleSection$searched(q, searching, feats) {
    const searched = searching ? feats.filter((f) => f.label.includes(q) || f.desc.includes(q) || f.key.includes(q)) : feats;
    return searched;
}
export function inner$BuilderWizard$renderModuleSection$visTerms(rowFilter, diff, q, searching, terms) {
    const visTerms = rowFilter === 'optin'
        ? []
        : searching
            ? terms.filter((t) => t.label.includes(q) || t.fallback.includes(q))
            : rowFilter === 'changed'
                ? terms.filter((t) => diff.terms.includes(t.key))
                : rowFilter === 'off'
                    ? []
                    : terms;
    return visTerms;
}
export function inner$BuilderWizard$renderModuleSection$showSplit(rowFilter, q, searching, sec) {
    const showSplit = sec.id === 'supporters' &&
        rowFilter === 'all' &&
        (!searching || 'פיצול תרומות פר-ייעוד אכיפת הרשאה לעובדות ייעוד'.includes(q));
    return showSplit;
}
export function inner$BuilderWizard$renderModuleSection$secChanged(diff, feats, terms) {
    const secChanged = feats.filter((f) => diff.features.includes(f.key)).length +
        terms.filter((t) => diff.terms.includes(t.key)).length;
    return secChanged;
}
export function inner$BuilderWizard$fn$siteShown(config) {
    const siteShown = !!config.site && config.site.enabled !== false;
    return siteShown;
}
export function inner$BuilderWizard$fn$phonesText(wsite) {
    const phonesText = (wsite.contact?.phones ?? []).join(', ');
    return phonesText;
}
export function inner$BuilderWizard$fn$telOn(config) {
    const telOn = config.telephony?.enabled === true;
    return telOn;
}
export function inner$BuilderWizard$map$on(config, d) {
    const on = config.orgName === d.org && config.accent === d.accent;
    return on;
}
export function inner$BuilderWizard$setFeatures$features$$after_loop(config, keys, on, optIn) {
    const features = { ...config.features };
    for (const k of keys) {
        if (on) {
            if (optIn.has(k))
                features[k] = true;
            else
                delete features[k];
        }
        else
            features[k] = false;
    }
    return features;
}

export const SIGS = {
  inner$parseFirebaseSnippet$pick$m: [{"name":"text","d":{"t":"str"},"opt":false},{"name":"key","d":{"t":"str"},"opt":false}],
  inner$TermRow$effective: [{"name":"props","d":{"t":"obj","p":[["t",{"t":"obj","n":"TermDef","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["fallback",{"t":"str"},false]]},false],["value",{"t":"str"},false],["onChange",{"t":"fn"},false]]},"opt":false}],
  inner$TermRow$overridden: [{"name":"props","d":{"t":"obj","p":[["t",{"t":"obj","n":"TermDef","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["fallback",{"t":"str"},false]]},false],["value",{"t":"str"},false],["onChange",{"t":"fn"},false]]},"opt":false}],
  inner$PriceInput$fn$n: [{"name":"e","d":{"t":"obj","n":"ChangeEvent","p":[["target",{"t":"obj","p":[]},false],["nativeEvent",{"t":"any"},false],["currentTarget",{"t":"obj","p":[]},false],["bubbles",{"t":"bool"},false],["cancelable",{"t":"bool"},false],["defaultPrevented",{"t":"bool"},false],["eventPhase",{"t":"num"},false],["isTrusted",{"t":"bool"},false],["preventDefault",{"t":"fn"},false],["isDefaultPrevented",{"t":"fn"},false],["stopPropagation",{"t":"fn"},false],["isPropagationStopped",{"t":"fn"},false],["persist",{"t":"fn"},false],["timeStamp",{"t":"num"},false],["type",{"t":"str"},false]]},"opt":false}],
  inner$ListEditor$move$j: [{"name":"i","d":{"t":"num"},"opt":false},{"name":"dir","d":{"t":"num"},"opt":false}],
  inner$ListEditor$move$next: [{"name":"items","d":{"t":"arr","of":{"t":"tp","id":"T","of":{"t":"any"}}},"opt":false}],
  inner$BuilderWizard$undo$prev: [{"name":"hist","d":{"t":"arr","of":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]}},"opt":false}],
  inner$BuilderWizard$q: [{"name":"query","d":{"t":"str"},"opt":false}],
  inner$BuilderWizard$searching: [{"name":"query","d":{"t":"str"},"opt":false}],
  inner$BuilderWizard$searching$$step: [{"name":"q","d":{"t":"str"},"opt":false}],
  inner$BuilderWizard$filtering: [{"name":"rowFilter","d":{"t":"lit","v":["all","off","on","optin","changed"]},"opt":false}],
  inner$BuilderWizard$renderModuleSection$searched: [{"name":"q","d":{"t":"str"},"opt":false},{"name":"searching","d":{"t":"bool"},"opt":false},{"name":"feats","d":{"t":"arr","of":{"t":"obj","n":"FeatureDef","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["desc",{"t":"str"},false],["optIn",{"t":"or","of":[{"t":"lit","v":[true]},{"t":"undef"}]},true],["module",{"t":"lit","v":["families","supporters","home","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports","settings","core","shell","signup"]},false]]}},"opt":false}],
  inner$BuilderWizard$renderModuleSection$visTerms: [{"name":"rowFilter","d":{"t":"lit","v":["all","off","on","optin","changed"]},"opt":false},{"name":"diff","d":{"t":"obj","n":"WizardDiff","p":[["features",{"t":"arr","of":{"t":"str"}},false],["terms",{"t":"arr","of":{"t":"str"}},false],["modulesOff",{"t":"arr","of":{"t":"str"}},false],["modulesOn",{"t":"arr","of":{"t":"str"}},false],["integrationsOn",{"t":"arr","of":{"t":"str"}},false]]},"opt":false},{"name":"q","d":{"t":"str"},"opt":false},{"name":"searching","d":{"t":"bool"},"opt":false},{"name":"terms","d":{"t":"arr","of":{"t":"obj","n":"TermDef","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["fallback",{"t":"str"},false]]}},"opt":false}],
  inner$BuilderWizard$renderModuleSection$showSplit: [{"name":"rowFilter","d":{"t":"lit","v":["all","off","on","optin","changed"]},"opt":false},{"name":"q","d":{"t":"str"},"opt":false},{"name":"searching","d":{"t":"bool"},"opt":false},{"name":"sec","d":{"t":"obj","n":"WizardSectionDef","p":[["id",{"t":"lit","v":["families","supporters","home","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports","settings","core","shell","signup"]},false],["title",{"t":"str"},false],["emoji",{"t":"str"},false],["module",{"t":"or","of":[{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports"]},{"t":"undef"}]},true],["termKeys",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$BuilderWizard$renderModuleSection$secChanged: [{"name":"diff","d":{"t":"obj","n":"WizardDiff","p":[["features",{"t":"arr","of":{"t":"str"}},false],["terms",{"t":"arr","of":{"t":"str"}},false],["modulesOff",{"t":"arr","of":{"t":"str"}},false],["modulesOn",{"t":"arr","of":{"t":"str"}},false],["integrationsOn",{"t":"arr","of":{"t":"str"}},false]]},"opt":false},{"name":"feats","d":{"t":"arr","of":{"t":"obj","n":"FeatureDef","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["desc",{"t":"str"},false],["optIn",{"t":"or","of":[{"t":"lit","v":[true]},{"t":"undef"}]},true],["module",{"t":"lit","v":["families","supporters","home","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports","settings","core","shell","signup"]},false]]}},"opt":false},{"name":"terms","d":{"t":"arr","of":{"t":"obj","n":"TermDef","p":[["key",{"t":"str"},false],["label",{"t":"str"},false],["fallback",{"t":"str"},false]]}},"opt":false}],
  inner$BuilderWizard$fn$siteShown: [{"name":"config","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$BuilderWizard$fn$phonesText: [{"name":"wsite","d":{"t":"obj","n":"PublicSiteContent","p":[["enabled",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["langs",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"lit","v":["he","en","yi"]}}]},true],["icon",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["tagline",{"t":"or","of":[{"t":"undef"},{"t":"str"},{"t":"obj","n":"Partial","p":[]}]},true],["brandLine",{"t":"or","of":[{"t":"undef"},{"t":"str"},{"t":"obj","n":"Partial","p":[]}]},true],["heroWords",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"or","of":[{"t":"str"},{"t":"obj","n":"Partial","p":[]}]}}]},true],["stats",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PublicSiteStat","p":[]}}]},true],["liveFamilies",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["liveFamiliesLabel",{"t":"or","of":[{"t":"undef"},{"t":"str"},{"t":"obj","n":"Partial","p":[]}]},true],["campaign",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteCampaign","p":[]}]},true],["services",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PublicSiteService","p":[]}}]},true],["news",{"t":"or","of":[{"t":"undef"},{"t":"str"},{"t":"obj","n":"Partial","p":[]}]},true],["story",{"t":"or","of":[{"t":"undef"},{"t":"str"},{"t":"obj","n":"Partial","p":[]}]},true],["storyTitle",{"t":"or","of":[{"t":"undef"},{"t":"str"},{"t":"obj","n":"Partial","p":[]}]},true],["storyTitleAccent",{"t":"or","of":[{"t":"undef"},{"t":"str"},{"t":"obj","n":"Partial","p":[]}]},true],["storyBadge",{"t":"or","of":[{"t":"undef"},{"t":"str"},{"t":"obj","n":"Partial","p":[]}]},true],["founder",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteFounder","p":[]}]},true],["timeline",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PublicSiteMilestone","p":[]}}]},true],["growth",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteGrowth","p":[]}]},true],["paymentMethods",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PublicSitePayMethod","p":[]}}]},true],["donateNote",{"t":"or","of":[{"t":"undef"},{"t":"str"},{"t":"obj","n":"Partial","p":[]}]},true],["gallery",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["contact",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContact","p":[]}]},true],["donateUrl",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["heroImage",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["heroTitle",{"t":"or","of":[{"t":"undef"},{"t":"str"},{"t":"obj","n":"Partial","p":[]}]},true],["heroBadge",{"t":"or","of":[{"t":"undef"},{"t":"str"},{"t":"obj","n":"Partial","p":[]}]},true],["titleAccent",{"t":"or","of":[{"t":"undef"},{"t":"str"},{"t":"obj","n":"Partial","p":[]}]},true],["servicesHeading",{"t":"or","of":[{"t":"undef"},{"t":"str"},{"t":"obj","n":"Partial","p":[]}]},true],["microCopy",{"t":"or","of":[{"t":"undef"},{"t":"str"},{"t":"obj","n":"Partial","p":[]}]},true],["ticker",{"t":"or","of":[{"t":"undef"},{"t":"str"},{"t":"obj","n":"Partial","p":[]}]},true],["marquee",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"or","of":[{"t":"str"},{"t":"obj","n":"Partial","p":[]}]}}]},true],["calc",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteCalc","p":[]}]},true],["tiers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PublicSiteTier","p":[]}}]},true],["testimonials",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PublicSiteTestimonial","p":[]}}]},true],["faq",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PublicSiteFaq","p":[]}}]},true],["events",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PublicSiteEvent","p":[]}}]},true],["partners",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PublicSitePartner","p":[]}}]},true],["transparency",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["contactForm",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true]]},"opt":false}],
  inner$BuilderWizard$fn$telOn: [{"name":"config","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$BuilderWizard$map$on: [{"name":"config","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false},{"name":"d","d":{"t":"obj","p":[["org",{"t":"str"},false],["colorName",{"t":"str"},false],["desc",{"t":"str"},false],["accent",{"t":"str"},false],["theme",{"t":"str"},false]]},"opt":false}],
  inner$BuilderWizard$setFeatures$features$$after_loop: [{"name":"config","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false},{"name":"keys","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"on","d":{"t":"bool"},"opt":false},{"name":"optIn","d":{"t":"set","of":{"t":"str"}},"opt":false}],
};
