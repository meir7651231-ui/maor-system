// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/pwa.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$applyOrgManifest$name(config) {
    const name = (config.orgName || '').trim();
    return name;
}
export function inner$applyOrgManifest$manifest(config, base) {
    const slug = config.slug || 'default';
    const name = (config.orgName || '').trim();
    const manifest = {
        name,
        short_name: name.length > 12 ? name.slice(0, 12) : name,
        lang: 'he',
        dir: 'rtl',
        start_url: base + '?org=' + encodeURIComponent(slug),
        scope: base,
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#211d17',
        background_color: '#faf7f2',
        icons: [
            { src: base + 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: base + 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: base + 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    };
    return manifest;
}
export function inner$applyOrgManifest$manifest$$step(slug, name, base) {
    const manifest = {
        name,
        short_name: name.length > 12 ? name.slice(0, 12) : name,
        lang: 'he',
        dir: 'rtl',
        start_url: base + '?org=' + encodeURIComponent(slug),
        scope: base,
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#211d17',
        background_color: '#faf7f2',
        icons: [
            { src: base + 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: base + 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: base + 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    };
    return manifest;
}

export const SIGS = {
  inner$applyOrgManifest$name: [{"name":"config","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$applyOrgManifest$manifest: [{"name":"config","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false},{"name":"base","d":{"t":"str"},"opt":false}],
  inner$applyOrgManifest$manifest$$step: [{"name":"slug","d":{"t":"str"},"opt":false},{"name":"name","d":{"t":"str"},"opt":false},{"name":"base","d":{"t":"str"},"opt":false}],
};
