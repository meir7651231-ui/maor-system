// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/settings/ThemeSection.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const THEMES = [
    {
        key: 'or-rishon',
        name: 'אור ראשון',
        desc: 'שמנת וזהב — המראה הקלאסי',
        bg: '#f6f3ec',
        panel: '#fffdf8',
        accent: '#f3c76b',
        nav: '#211d17',
        ink: '#2e2c26',
    },
    {
        key: 'heichal',
        name: 'היכל',
        desc: 'כהה ויוקרתי, זהב על שחור',
        bg: '#12100c',
        panel: '#1b1812',
        accent: '#e9bd63',
        nav: '#0b0906',
        ink: '#f2ead8',
    },
    {
        key: 'tsohar',
        name: 'צֹהַר',
        desc: 'בהיר ונקי, טורקיז עסקי',
        bg: '#faf9f7',
        panel: '#ffffff',
        accent: '#0e7a6c',
        nav: '#ffffff',
        ink: '#1c1a17',
    },
    {
        key: 'kehila',
        name: 'קהילה',
        desc: 'חם ומשחקי, פינות מעוגלות',
        bg: '#fdf8ef',
        panel: '#ffffff',
        accent: '#178f80',
        nav: 'linear-gradient(180deg, #1a9c8b 0%, #0e6f63 100%)',
        ink: '#26221c',
    },
];
export function inner$ThemeSection$activeDef(uiTheme, config) {
    const activeKey = uiTheme ?? config.theme;
    const activeDef = THEMES.find((t) => t.key === activeKey) ?? THEMES[0];
    return activeDef;
}
export function inner$ThemeSection$activeDef$$step(activeKey) {
    const activeDef = THEMES.find((t) => t.key === activeKey) ?? THEMES[0];
    return activeDef;
}

export const SIGS = {
  inner$ThemeSection$activeDef: [{"name":"uiTheme","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false},{"name":"config","d":{"t":"obj","n":"OrgConfig","p":[["slug",{"t":"str"},false],["orgName",{"t":"str"},false],["logoDataUri",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["theme",{"t":"str"},false],["accent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["accentCustom",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["emoji",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["motion",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgSignatory",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["modules",{"t":"obj","n":"Partial","p":[]},false],["features",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"bool"}}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["templates",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["integrations",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"obj","p":[]}}]},true],["adminEmails",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["roles",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["firebase",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[]}]},true],["allowedHosts",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["cloudRoot",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["telephony",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[]}]},true],["donationSplit",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["supporterEnforce",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["site",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"PublicSiteContent","p":[]}]},true]]},"opt":false}],
  inner$ThemeSection$activeDef$$step: [{"name":"activeKey","d":{"t":"str"},"opt":false}],
};
