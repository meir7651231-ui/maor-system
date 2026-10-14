// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/telephony/lib.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const ONRAMP = {
    sim: 'sim-in-gateway',
    virtual: 'customer-forward',
    whatsapp: 'device-link',
};
const CHANNELS = {
    sim: ['voice'],
    virtual: ['voice'],
    whatsapp: ['whatsapp'],
};
function telephonyToTenant(tc, orgName, tenantId) {
    let gw = 0;
    const numbers = (tc.numbers || [])
        .filter((n) => n.e164 && n.e164.trim())
        .map((n) => {
        const base = {
            id: n.id,
            e164: n.e164.trim(),
            label: n.label || n.id,
            type: n.kind,
            onramp: ONRAMP[n.kind],
            channels: CHANNELS[n.kind],
            ...(n.kosher ? { kosher: true } : {}),
        };
        if (n.kind === 'sim') {
            gw += 1;
            base.gatewayChannel = gw;
        }
        return base;
    });
    const firstSim = numbers.find((n) => n.onramp === 'sim-in-gateway');
    const features = {
        'voice.kosher': tc.kosherMode,
        'calendar.hebrew': tc.hebrewCalendar,
        'calendar.shabbat': tc.shabbat,
        'calendar.fasts': tc.fasts,
        'calendar.zmanim': tc.zmanim,
        voicemail: tc.voicemail,
    };
    return {
        tenantId,
        orgName: orgName || 'ארגון',
        timezone: 'Asia/Jerusalem',
        ...(tc.city ? { city: tc.city } : {}),
        officeHours: { days: [...tc.officeDays].sort((a, b) => a - b), start: tc.officeStart, end: tc.officeEnd },
        numbers,
        destinations: {
            office: { ext: [tc.officeExt], ringSeconds: 25 },
            manager: { ext: tc.managerExt, ringSeconds: 30 },
            voicemail: { box: tc.vmBox },
        },
        outbound: { defaultNumberId: firstSim ? firstSim.id : (numbers[0]?.id ?? 'n1') },
        cti: { org: tenantId, mode: 'directory' },
        features,
    };
}
export function inner$toTenantId$base(slug, orgName) {
    const base = (slug && slug !== 'default' ? slug : orgName || 'org')
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 38);
    return base;
}
export function inner$toTenantId$padded(slug, orgName) {
    const base = (slug && slug !== 'default' ? slug : orgName || 'org')
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 38);
    const padded = base.length >= 3 ? base : `${base}-org`;
    return padded;
}
export function inner$toTenantId$padded$$step(base) {
    const padded = base.length >= 3 ? base : `${base}-org`;
    return padded;
}
export function inner$telephonyToTenant$map$base(n) {
    const base = {
        id: n.id,
        e164: n.e164.trim(),
        label: n.label || n.id,
        type: n.kind,
        onramp: ONRAMP[n.kind],
        channels: CHANNELS[n.kind],
        ...(n.kosher ? { kosher: true } : {}),
    };
    return base;
}
export function inner$telephonyToTenant$firstSim(numbers) {
    const firstSim = numbers.find((n) => n.onramp === 'sim-in-gateway');
    return firstSim;
}
export function inner$previewTelephony$raw(tc, orgName, tenantId) {
    const raw = telephonyToTenant(tc, orgName, tenantId);
    return raw;
}
export function inner$previewTelephony$voiceDid(tc) {
    const voiceDid = (tc.numbers.find((n) => n.kind === 'sim' || n.kind === 'virtual') || tc.numbers[0])?.e164 || '';
    return voiceDid;
}
export function inner$nextClosure$cityHe(tel, CITIES) {
    const cityHe = (tel.city && CITIES[tel.city]) ? CITIES[tel.city].he : CITIES.jerusalem.he;
    return cityHe;
}
export function inner$explainOne$raw(tc, orgName, tenantId) {
    const raw = telephonyToTenant(tc, orgName, tenantId);
    return raw;
}

export const SIGS = {
  inner$toTenantId$base: [{"name":"slug","d":{"t":"str"},"opt":false},{"name":"orgName","d":{"t":"str"},"opt":false}],
  inner$toTenantId$padded: [{"name":"slug","d":{"t":"str"},"opt":false},{"name":"orgName","d":{"t":"str"},"opt":false}],
  inner$toTenantId$padded$$step: [{"name":"base","d":{"t":"str"},"opt":false}],
  inner$telephonyToTenant$map$base: [{"name":"n","d":{"t":"obj","n":"TelNumber","p":[["id",{"t":"str"},false],["e164",{"t":"str"},false],["label",{"t":"str"},false],["kind",{"t":"lit","v":["sim","virtual","whatsapp"]},false],["kosher",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$telephonyToTenant$firstSim: [{"name":"numbers","d":{"t":"arr","of":{"t":"rec","of":{"t":"any"}}},"opt":false}],
  inner$previewTelephony$raw: [{"name":"tc","d":{"t":"obj","n":"TelephonyConfig","p":[["enabled",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["numbers",{"t":"arr","of":{"t":"obj","n":"TelNumber","p":[["id",{"t":"str"},false],["e164",{"t":"str"},false],["label",{"t":"str"},false],["kind",{"t":"lit","v":["sim","virtual","whatsapp"]},false],["kosher",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["officeDays",{"t":"arr","of":{"t":"num"}},false],["officeStart",{"t":"str"},false],["officeEnd",{"t":"str"},false],["officeExt",{"t":"str"},false],["managerExt",{"t":"str"},false],["vmBox",{"t":"str"},false],["city",{"t":"str"},false],["kosherMode",{"t":"bool"},false],["hebrewCalendar",{"t":"bool"},false],["zmanim",{"t":"bool"},false],["shabbat",{"t":"bool"},false],["fasts",{"t":"bool"},false],["voicemail",{"t":"bool"},false]]},"opt":false},{"name":"orgName","d":{"t":"str"},"opt":false},{"name":"tenantId","d":{"t":"str"},"opt":false}],
  inner$previewTelephony$voiceDid: [{"name":"tc","d":{"t":"obj","n":"TelephonyConfig","p":[["enabled",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["numbers",{"t":"arr","of":{"t":"obj","n":"TelNumber","p":[["id",{"t":"str"},false],["e164",{"t":"str"},false],["label",{"t":"str"},false],["kind",{"t":"lit","v":["sim","virtual","whatsapp"]},false],["kosher",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["officeDays",{"t":"arr","of":{"t":"num"}},false],["officeStart",{"t":"str"},false],["officeEnd",{"t":"str"},false],["officeExt",{"t":"str"},false],["managerExt",{"t":"str"},false],["vmBox",{"t":"str"},false],["city",{"t":"str"},false],["kosherMode",{"t":"bool"},false],["hebrewCalendar",{"t":"bool"},false],["zmanim",{"t":"bool"},false],["shabbat",{"t":"bool"},false],["fasts",{"t":"bool"},false],["voicemail",{"t":"bool"},false]]},"opt":false}],
  inner$nextClosure$cityHe: [{"name":"tel","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"TelephonyConfig","p":[["enabled",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["numbers",{"t":"arr","of":{"t":"obj","n":"TelNumber","p":[["id",{"t":"str"},false],["e164",{"t":"str"},false],["label",{"t":"str"},false],["kind",{"t":"lit","v":["sim","virtual","whatsapp"]},false],["kosher",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["officeDays",{"t":"arr","of":{"t":"num"}},false],["officeStart",{"t":"str"},false],["officeEnd",{"t":"str"},false],["officeExt",{"t":"str"},false],["managerExt",{"t":"str"},false],["vmBox",{"t":"str"},false],["city",{"t":"str"},false],["kosherMode",{"t":"bool"},false],["hebrewCalendar",{"t":"bool"},false],["zmanim",{"t":"bool"},false],["shabbat",{"t":"bool"},false],["fasts",{"t":"bool"},false],["voicemail",{"t":"bool"},false]]}]},"opt":false},{"name":"CITIES","d":{"t":"rec","of":{"t":"obj","n":"CityGeo","p":[["he",{"t":"str"},false],["lat",{"t":"num"},false],["lon",{"t":"num"},false],["candle",{"t":"num"},false]]}},"opt":false}],
  inner$explainOne$raw: [{"name":"tc","d":{"t":"obj","n":"TelephonyConfig","p":[["enabled",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["numbers",{"t":"arr","of":{"t":"obj","n":"TelNumber","p":[["id",{"t":"str"},false],["e164",{"t":"str"},false],["label",{"t":"str"},false],["kind",{"t":"lit","v":["sim","virtual","whatsapp"]},false],["kosher",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["officeDays",{"t":"arr","of":{"t":"num"}},false],["officeStart",{"t":"str"},false],["officeEnd",{"t":"str"},false],["officeExt",{"t":"str"},false],["managerExt",{"t":"str"},false],["vmBox",{"t":"str"},false],["city",{"t":"str"},false],["kosherMode",{"t":"bool"},false],["hebrewCalendar",{"t":"bool"},false],["zmanim",{"t":"bool"},false],["shabbat",{"t":"bool"},false],["fasts",{"t":"bool"},false],["voicemail",{"t":"bool"},false]]},"opt":false},{"name":"orgName","d":{"t":"str"},"opt":false},{"name":"tenantId","d":{"t":"str"},"opt":false}],
};
