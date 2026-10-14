// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/App.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$App$useEffect$then$watchIncomingPayments$nedRows(rows) {
    const nedRows = rows.filter((r) => r.provider !== 'sola');
    return nedRows;
}
export function inner$App$useEffect$then$watchIncomingPayments$stillPending(rows, handled) {
    const nedRows = rows.filter((r) => r.provider !== 'sola');
    const stillPending = nedRows.filter((r) => !handled.includes(r.id));
    return stillPending;
}
export function inner$App$useEffect$then$watchIncomingPayments$stillPending$$step(nedRows, handled) {
    const stillPending = nedRows.filter((r) => !handled.includes(r.id));
    return stillPending;
}
export function inner$App$plannedRemindersOn(config) {
    const plannedRemindersOn = (config.features?.['supporters.plannedcharges'] === true) ||
        (config.features?.['courses.plannedcharges'] === true) ||
        (config.features?.['shop.plannedcharges'] === true);
    return plannedRemindersOn;
}
export function inner$App$askMaorOn(config) {
    const askMaorOn = config.features?.['shell.askmaor'] === true;
    return askMaorOn;
}
export function inner$App$engineBoxOn(config) {
    const engineBoxOn = config.features?.['shell.enginebox'] === true;
    return engineBoxOn;
}
export function inner$App$useEffect$warm$modKey(k) {
    const modKey = k === 'reenroll' ? 'courses' : k;
    return modKey;
}
export function inner$App$useEffect$hasIdle(w) {
    const hasIdle = typeof w.requestIdleCallback === 'function';
    return hasIdle;
}
export function inner$App$useEffect$setInterval$endMin(eh, em) {
    const endMin = (Number.isFinite(eh) ? eh : 17) * 60 + (Number.isFinite(em) ? em : 0);
    return endMin;
}
export function inner$App$navPrimary(nav) {
    const NAV_PRIMARY_MAX = 6;
    const navPrimary = nav.length > NAV_PRIMARY_MAX + 1 ? nav.slice(0, NAV_PRIMARY_MAX) : nav;
    return navPrimary;
}
export function inner$App$navMore(nav) {
    const NAV_PRIMARY_MAX = 6;
    const navMore = nav.length > NAV_PRIMARY_MAX + 1 ? nav.slice(NAV_PRIMARY_MAX) : [];
    return navMore;
}
export function inner$App$shell(config, uiTheme, narrow) {
    const theme = uiTheme ?? config.theme;
    const shell = narrow
        ? 'top'
        : theme === 'tsohar'
            ? 'side'
            : theme === 'or-rishon'
                ? 'side-wide'
                : 'top';
    return shell;
}
export function inner$App$shell$$step(narrow, theme) {
    const shell = narrow
        ? 'top'
        : theme === 'tsohar'
            ? 'side'
            : theme === 'or-rishon'
                ? 'side-wide'
                : 'top';
    return shell;
}
export function inner$App$helpTitle(teamUnread) {
    const helpTitle = teamUnread > 0 ? `עזרה · ${teamUnread} הודעות-צוות חדשות 💬` : 'עזרה — מדריך וסיור';
    return helpTitle;
}
export function inner$App$helpAria(teamUnread) {
    const helpAria = teamUnread > 0 ? `עזרה, ${teamUnread} הודעות-צוות שלא נקראו` : 'עזרה';
    return helpAria;
}

export const SIGS = {
  inner$App$useEffect$then$watchIncomingPayments$nedRows: [{"name":"rows","d":{"t":"arr","of":{"t":"obj","n":"IncomingPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["reference",{"t":"str"},false],["at",{"t":"str"},false],["status",{"t":"str"},false],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["email",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["zeout",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["category",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["toremId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["txnId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["d",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["receipt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["last4",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kind",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provider",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$App$useEffect$then$watchIncomingPayments$stillPending: [{"name":"rows","d":{"t":"arr","of":{"t":"obj","n":"IncomingPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["reference",{"t":"str"},false],["at",{"t":"str"},false],["status",{"t":"str"},false],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["email",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["zeout",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["category",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["toremId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["txnId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["d",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["receipt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["last4",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kind",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provider",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"handled","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$App$useEffect$then$watchIncomingPayments$stillPending$$step: [{"name":"nedRows","d":{"t":"arr","of":{"t":"obj","n":"IncomingPayment","p":[["id",{"t":"str"},false],["amount",{"t":"num"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["reference",{"t":"str"},false],["at",{"t":"str"},false],["status",{"t":"str"},false],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["email",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["zeout",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["category",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kevaId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["toremId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["txnId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["d",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["receipt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["last4",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["kind",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["provider",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"handled","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$App$plannedRemindersOn: [{"name":"config","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$App$askMaorOn: [{"name":"config","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$App$engineBoxOn: [{"name":"config","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$App$useEffect$warm$modKey: [{"name":"k","d":{"t":"lit","v":["families","supporters","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports","reenroll","settings"]},"opt":false}],
  inner$App$useEffect$hasIdle: [{"name":"w","d":{"t":"obj","p":[["clientInformation",{"t":"obj","n":"Navigator","p":[]},false],["closed",{"t":"bool"},false],["cookieStore",{"t":"obj","n":"CookieStore","p":[]},false],["customElements",{"t":"obj","n":"CustomElementRegistry","p":[]},false],["devicePixelRatio",{"t":"num"},false],["document",{"t":"any"},false],["event",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},false],["external",{"t":"obj","n":"External","p":[]},false],["frameElement",{"t":"or","of":[{"t":"null"},{"t":"any"}]},false],["frames",{"t":"any"},false],["history",{"t":"obj","n":"History","p":[]},false],["innerHeight",{"t":"num"},false],["innerWidth",{"t":"num"},false],["length",{"t":"num"},false],["location",{"t":"obj","n":"Location","p":[]},false],["locationbar",{"t":"obj","n":"BarProp","p":[]},false],["menubar",{"t":"obj","n":"BarProp","p":[]},false],["name",{"t":"str"},false],["navigation",{"t":"obj","n":"Navigation","p":[]},false],["navigator",{"t":"obj","n":"Navigator","p":[]},false],["ondevicemotion",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["ondeviceorientation",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["ondeviceorientationabsolute",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["onorientationchange",{"t":"or","of":[{"t":"null"},{"t":"fn"}]},false],["opener",{"t":"any"},false],["orientation",{"t":"num"},false],["originAgentCluster",{"t":"bool"},false],["outerHeight",{"t":"num"},false],["outerWidth",{"t":"num"},false],["pageXOffset",{"t":"num"},false],["pageYOffset",{"t":"num"},false],["parent",{"t":"any"},false],["personalbar",{"t":"obj","n":"BarProp","p":[]},false],["screen",{"t":"obj","n":"Screen","p":[]},false],["screenLeft",{"t":"num"},false],["screenTop",{"t":"num"},false],["screenX",{"t":"num"},false],["screenY",{"t":"num"},false],["scrollX",{"t":"num"},false],["scrollY",{"t":"num"},false]]},"opt":false}],
  inner$App$useEffect$setInterval$endMin: [{"name":"eh","d":{"t":"num"},"opt":false},{"name":"em","d":{"t":"num"},"opt":false}],
  inner$App$navPrimary: [{"name":"nav","d":{"t":"arr","of":{"t":"obj","p":[["view",{"t":"lit","v":["families","supporters","home","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports","reenroll","settings"]},false],["icon",{"t":"str"},false],["label",{"t":"str"},false]]}},"opt":false}],
  inner$App$navMore: [{"name":"nav","d":{"t":"arr","of":{"t":"obj","p":[["view",{"t":"lit","v":["families","supporters","home","courses","calendar","diary","tzedaka","shop","shop7","parnasa","hosting","reports","reenroll","settings"]},false],["icon",{"t":"str"},false],["label",{"t":"str"},false]]}},"opt":false}],
  inner$App$shell: [{"name":"config","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false},{"name":"uiTheme","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false},{"name":"narrow","d":{"t":"bool"},"opt":false}],
  inner$App$shell$$step: [{"name":"narrow","d":{"t":"bool"},"opt":false},{"name":"theme","d":{"t":"str"},"opt":false}],
  inner$App$helpTitle: [{"name":"teamUnread","d":{"t":"num"},"opt":false}],
  inner$App$helpAria: [{"name":"teamUnread","d":{"t":"num"},"opt":false}],
};
