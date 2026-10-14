// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:telephony/lib/validate.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const CHANNELS = ['voice', 'sms', 'whatsapp'];
const noVars = (s) => (typeof s === 'string' ? s.replace(/\$/g, '') : s);
export function inner$hhmmToMinutes$h(s) {
    const [h, m] = s.split(':').map(Number);
    return h;
}
export function inner$hhmmToMinutes$m(s) {
    const [h, m] = s.split(':').map(Number);
    return m;
}
export function inner$validateTenant$timezone(raw) {
    const timezone = typeof raw.timezone === 'string' && raw.timezone ? raw.timezone : 'Asia/Jerusalem';
    return timezone;
}
export function inner$validateTenant$days(oh) {
    const days = Array.isArray(oh.days) ? oh.days : [];
    return days;
}
export function inner$validateTenant$daysOk(oh) {
    const days = Array.isArray(oh.days) ? oh.days : [];
    const daysOk = days.length > 0 && days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6);
    return daysOk;
}
export function inner$validateTenant$daysOk$$step(days) {
    const daysOk = days.length > 0 && days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6);
    return daysOk;
}
export function inner$validateTenant$tag(raw, i) {
    const n = raw.numbers[i] || {};
    const tag = n.id ? `numbers[${n.id}]` : `numbers[#${i}]`;
    return tag;
}
export function inner$validateTenant$tag$$step(i, n) {
    const tag = n.id ? `numbers[${n.id}]` : `numbers[#${i}]`;
    return tag;
}
export function inner$validateTenant$channels(raw, i) {
    const n = raw.numbers[i] || {};
    let channels = Array.isArray(n.channels) ? [...new Set(n.channels)] : ['voice'];
    return channels;
}
export function inner$validateTenant$channels$$step(n) {
    let channels = Array.isArray(n.channels) ? [...new Set(n.channels)] : ['voice'];
    return channels;
}
export function inner$validateTenant$badCh(channels) {
    const badCh = channels.filter((c) => !CHANNELS.includes(c));
    return badCh;
}
export function inner$validateTenant$carriesVoice(channels) {
    const carriesVoice = channels.includes('voice');
    return carriesVoice;
}
export function inner$validateTenant$chOk(raw, i) {
    const n = raw.numbers[i] || {};
    const chOk = Number.isInteger(n.gatewayChannel) && n.gatewayChannel > 0;
    return chOk;
}
export function inner$validateTenant$chOk$$step(n) {
    const chOk = Number.isInteger(n.gatewayChannel) && n.gatewayChannel > 0;
    return chOk;
}
export function inner$validateTenant$hd(raw, i) {
    const n = raw.numbers[i] || {};
    const hd = Array.isArray(n.hours.days) ? n.hours.days.filter((x) => Number.isInteger(x) && x >= 0 && x <= 6) : [];
    return hd;
}
export function inner$validateTenant$hd$$step(n) {
    const hd = Array.isArray(n.hours.days) ? n.hours.days.filter((x) => Number.isInteger(x) && x >= 0 && x <= 6) : [];
    return hd;
}
export function inner$validateTenant$kosherOut(numbers) {
    const kosherOut = numbers.some((n) => n.kosher && n.onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel) && n.channels.includes('voice'));
    return kosherOut;
}
export function inner$validateTenant$hasSimVoice(numbers) {
    const hasSimVoice = numbers.some((n) => n.onramp === 'sim-in-gateway' && n.channels.includes('voice'));
    return hasSimVoice;
}
export function inner$validateTenant$hasForwardVoice(numbers) {
    const hasForwardVoice = numbers.some((n) => n.onramp === 'customer-forward' && n.channels.includes('voice'));
    return hasForwardVoice;
}
export function inner$validateTenant$target(numbers, n) {
    const target = numbers.find((x) => x.id === n.forwardTo);
    return target;
}
export function inner$validateTenant$officeOk(dst) {
    const officeExt = dst.office && dst.office.ext;
    const officeOk = typeof officeExt === 'string'
        ? !!officeExt
        : Array.isArray(officeExt) && officeExt.length > 0 && officeExt.every((e) => typeof e === 'string' && e);
    return officeOk;
}
export function inner$validateTenant$officeOk$$step(officeExt) {
    const officeOk = typeof officeExt === 'string'
        ? !!officeExt
        : Array.isArray(officeExt) && officeExt.length > 0 && officeExt.every((e) => typeof e === 'string' && e);
    return officeOk;
}
export function inner$validateTenant$allExtVals(dst) {
    const officeExt = dst.office && dst.office.ext;
    const managerExt = dst.manager && dst.manager.ext;
    const allExtVals = [...(Array.isArray(officeExt) ? officeExt : [officeExt]), managerExt, dst.voicemail?.box].filter(Boolean);
    return allExtVals;
}
export function inner$validateTenant$allExtVals$$step(dst, officeExt, managerExt) {
    const allExtVals = [...(Array.isArray(officeExt) ? officeExt : [officeExt]), managerExt, dst.voicemail?.box].filter(Boolean);
    return allExtVals;
}
export function inner$validateTenant$cleanEmail$v(val) {
    const v = val.trim();
    return v;
}
export function inner$validateTenant$target_L303(numbers, defId) {
    const target = numbers.find((n) => n.id === defId);
    return target;
}
export function inner$validateTenant$t(numbers, id) {
    const t = numbers.find((n) => n.id === id);
    return t;
}
export function inner$validateTenant$firstSim(numbers) {
    const firstSim = numbers.find((n) => n.onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel));
    return firstSim;
}
export function inner$validateTenant$mode(raw) {
    const mode = ['off', 'directory', 'api'].includes(raw.cti.mode) ? raw.cti.mode : 'off';
    return mode;
}
export function inner$validateTenant$ok(errors) {
    const ok = errors.length === 0;
    return ok;
}
export function inner$validateTenant$tenant(raw, errors, features, terms, city, geo, officeHours, numbers, destinations, outbound, cti, routing, emergency, mourning, security, SCHEMA_VERSION, VERTICAL_PACKS) {
    const timezone = typeof raw.timezone === 'string' && raw.timezone ? raw.timezone : 'Asia/Jerusalem';
    const ok = errors.length === 0;
    const tenant = ok
        ? {
            schemaVersion: SCHEMA_VERSION,
            tenantId: raw.tenantId,
            orgName: noVars(raw.orgName),
            timezone,
            ...(city ? { city } : {}),
            ...(geo ? { geo } : {}),
            ...(raw.vertical && VERTICAL_PACKS[raw.vertical] ? { vertical: raw.vertical } : {}),
            officeHours,
            numbers,
            destinations,
            outbound,
            cti,
            features,
            terms,
            routing,
            ...(emergency ? { emergency } : {}),
            ...(mourning ? { mourning } : {}),
            ...(security ? { security } : {}),
        }
        : null;
    return tenant;
}
export function inner$validateTenant$tenant$$step(raw, features, terms, timezone, city, geo, officeHours, numbers, destinations, outbound, cti, routing, emergency, mourning, ok, security, SCHEMA_VERSION, VERTICAL_PACKS) {
    const tenant = ok
        ? {
            schemaVersion: SCHEMA_VERSION,
            tenantId: raw.tenantId,
            orgName: noVars(raw.orgName),
            timezone,
            ...(city ? { city } : {}),
            ...(geo ? { geo } : {}),
            ...(raw.vertical && VERTICAL_PACKS[raw.vertical] ? { vertical: raw.vertical } : {}),
            officeHours,
            numbers,
            destinations,
            outbound,
            cti,
            features,
            terms,
            routing,
            ...(emergency ? { emergency } : {}),
            ...(mourning ? { mourning } : {}),
            ...(security ? { security } : {}),
        }
        : null;
    return tenant;
}

export const SIGS = {
  inner$hhmmToMinutes$h: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$hhmmToMinutes$m: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$validateTenant$timezone: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$validateTenant$days: [{"name":"oh","d":{"t":"any"},"opt":false}],
  inner$validateTenant$daysOk: [{"name":"oh","d":{"t":"any"},"opt":false}],
  inner$validateTenant$daysOk$$step: [{"name":"days","d":{"t":"any"},"opt":false}],
  inner$validateTenant$tag: [{"name":"raw","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$validateTenant$tag$$step: [{"name":"i","d":{"t":"num"},"opt":false},{"name":"n","d":{"t":"any"},"opt":false}],
  inner$validateTenant$channels: [{"name":"raw","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$validateTenant$channels$$step: [{"name":"n","d":{"t":"any"},"opt":false}],
  inner$validateTenant$badCh: [{"name":"channels","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$validateTenant$carriesVoice: [{"name":"channels","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$validateTenant$chOk: [{"name":"raw","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$validateTenant$chOk$$step: [{"name":"n","d":{"t":"any"},"opt":false}],
  inner$validateTenant$hd: [{"name":"raw","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$validateTenant$hd$$step: [{"name":"n","d":{"t":"any"},"opt":false}],
  inner$validateTenant$kosherOut: [{"name":"numbers","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$validateTenant$hasSimVoice: [{"name":"numbers","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$validateTenant$hasForwardVoice: [{"name":"numbers","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$validateTenant$target: [{"name":"numbers","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"n","d":{"t":"obj","p":[["forwardTo",{"t":"any"},true],["role",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["announcementText",{"t":"any"},true],["hours",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["days",{"t":"arr","of":{"t":"any"}},false],["start",{"t":"any"},false],["end",{"t":"any"},false]]}]},true],["gatewayChannel",{"t":"any"},true],["id",{"t":"any"},false],["e164",{"t":"any"},false],["label",{"t":"any"},false],["type",{"t":"any"},false],["onramp",{"t":"any"},false],["channels",{"t":"arr","of":{"t":"any"}},false],["kosher",{"t":"bool"},false]]},"opt":false}],
  inner$validateTenant$officeOk: [{"name":"dst","d":{"t":"any"},"opt":false}],
  inner$validateTenant$officeOk$$step: [{"name":"officeExt","d":{"t":"any"},"opt":false}],
  inner$validateTenant$allExtVals: [{"name":"dst","d":{"t":"any"},"opt":false}],
  inner$validateTenant$allExtVals$$step: [{"name":"dst","d":{"t":"any"},"opt":false},{"name":"officeExt","d":{"t":"any"},"opt":false},{"name":"managerExt","d":{"t":"any"},"opt":false}],
  inner$validateTenant$cleanEmail$v: [{"name":"val","d":{"t":"any"},"opt":false}],
  inner$validateTenant$target_L303: [{"name":"numbers","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"defId","d":{"t":"any"},"opt":false}],
  inner$validateTenant$t: [{"name":"numbers","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"id","d":{"t":"any"},"opt":false}],
  inner$validateTenant$firstSim: [{"name":"numbers","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$validateTenant$mode: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$validateTenant$ok: [{"name":"errors","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$validateTenant$tenant: [{"name":"raw","d":{"t":"any"},"opt":false},{"name":"errors","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"features","d":{"t":"obj","n":"features","p":[]},"opt":false},{"name":"terms","d":{"t":"obj","n":"terms","p":[]},"opt":false},{"name":"city","d":{"t":"any"},"opt":false},{"name":"geo","d":{"t":"any"},"opt":false},{"name":"officeHours","d":{"t":"any"},"opt":false},{"name":"numbers","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"destinations","d":{"t":"any"},"opt":false},{"name":"outbound","d":{"t":"any"},"opt":false},{"name":"cti","d":{"t":"obj","p":[["org",{"t":"null"},false],["mode",{"t":"str"},false]]},"opt":false},{"name":"routing","d":{"t":"any"},"opt":false},{"name":"emergency","d":{"t":"any"},"opt":false},{"name":"mourning","d":{"t":"any"},"opt":false},{"name":"security","d":{"t":"any"},"opt":false},{"name":"SCHEMA_VERSION","d":{"t":"lit","v":[2]},"opt":false},{"name":"VERTICAL_PACKS","d":{"t":"obj","p":[["chesed",{"t":"obj","p":[["terms",{"t":"obj","p":[["org",{"t":"str"},false]]},false],["features",{"t":"obj","p":[["calendar.hebrew",{"t":"bool"},false],["calendar.shabbat",{"t":"bool"},false]]},false],["officeHours",{"t":"obj","p":[["days",{"t":"arr","of":{"t":"num"}},false],["start",{"t":"str"},false],["end",{"t":"str"},false]]},false]]},false],["kollel",{"t":"obj","p":[["terms",{"t":"obj","p":[["org",{"t":"str"},false],["office",{"t":"str"},false]]},false],["features",{"t":"obj","p":[["calendar.hebrew",{"t":"bool"},false],["calendar.shabbat",{"t":"bool"},false],["calendar.fasts",{"t":"bool"},false]]},false],["officeHours",{"t":"obj","p":[["days",{"t":"arr","of":{"t":"num"}},false],["start",{"t":"str"},false],["end",{"t":"str"},false]]},false]]},false],["gemach",{"t":"obj","p":[["terms",{"t":"obj","p":[["org",{"t":"str"},false]]},false],["features",{"t":"obj","p":[["calendar.hebrew",{"t":"bool"},false],["calendar.shabbat",{"t":"bool"},false]]},false],["officeHours",{"t":"obj","p":[["days",{"t":"arr","of":{"t":"num"}},false],["start",{"t":"str"},false],["end",{"t":"str"},false]]},false]]},false],["talmudtorah",{"t":"obj","p":[["terms",{"t":"obj","p":[["org",{"t":"str"},false],["office",{"t":"str"},false]]},false],["features",{"t":"obj","p":[["calendar.hebrew",{"t":"bool"},false],["calendar.shabbat",{"t":"bool"},false]]},false],["officeHours",{"t":"obj","p":[["days",{"t":"arr","of":{"t":"num"}},false],["start",{"t":"str"},false],["end",{"t":"str"},false]]},false]]},false],["shul",{"t":"obj","p":[["terms",{"t":"obj","p":[["org",{"t":"str"},false],["office",{"t":"str"},false]]},false],["features",{"t":"obj","p":[["calendar.hebrew",{"t":"bool"},false],["calendar.shabbat",{"t":"bool"},false],["calendar.fasts",{"t":"bool"},false]]},false],["officeHours",{"t":"obj","p":[["days",{"t":"arr","of":{"t":"num"}},false],["start",{"t":"str"},false],["end",{"t":"str"},false]]},false]]},false]]},"opt":false}],
  inner$validateTenant$tenant$$step: [{"name":"raw","d":{"t":"any"},"opt":false},{"name":"features","d":{"t":"obj","n":"features","p":[]},"opt":false},{"name":"terms","d":{"t":"obj","n":"terms","p":[]},"opt":false},{"name":"timezone","d":{"t":"any"},"opt":false},{"name":"city","d":{"t":"any"},"opt":false},{"name":"geo","d":{"t":"any"},"opt":false},{"name":"officeHours","d":{"t":"any"},"opt":false},{"name":"numbers","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"destinations","d":{"t":"any"},"opt":false},{"name":"outbound","d":{"t":"any"},"opt":false},{"name":"cti","d":{"t":"obj","p":[["org",{"t":"null"},false],["mode",{"t":"str"},false]]},"opt":false},{"name":"routing","d":{"t":"any"},"opt":false},{"name":"emergency","d":{"t":"any"},"opt":false},{"name":"mourning","d":{"t":"any"},"opt":false},{"name":"ok","d":{"t":"bool"},"opt":false},{"name":"security","d":{"t":"any"},"opt":false},{"name":"SCHEMA_VERSION","d":{"t":"lit","v":[2]},"opt":false},{"name":"VERTICAL_PACKS","d":{"t":"obj","p":[["chesed",{"t":"obj","p":[["terms",{"t":"obj","p":[["org",{"t":"str"},false]]},false],["features",{"t":"obj","p":[["calendar.hebrew",{"t":"bool"},false],["calendar.shabbat",{"t":"bool"},false]]},false],["officeHours",{"t":"obj","p":[["days",{"t":"arr","of":{"t":"num"}},false],["start",{"t":"str"},false],["end",{"t":"str"},false]]},false]]},false],["kollel",{"t":"obj","p":[["terms",{"t":"obj","p":[["org",{"t":"str"},false],["office",{"t":"str"},false]]},false],["features",{"t":"obj","p":[["calendar.hebrew",{"t":"bool"},false],["calendar.shabbat",{"t":"bool"},false],["calendar.fasts",{"t":"bool"},false]]},false],["officeHours",{"t":"obj","p":[["days",{"t":"arr","of":{"t":"num"}},false],["start",{"t":"str"},false],["end",{"t":"str"},false]]},false]]},false],["gemach",{"t":"obj","p":[["terms",{"t":"obj","p":[["org",{"t":"str"},false]]},false],["features",{"t":"obj","p":[["calendar.hebrew",{"t":"bool"},false],["calendar.shabbat",{"t":"bool"},false]]},false],["officeHours",{"t":"obj","p":[["days",{"t":"arr","of":{"t":"num"}},false],["start",{"t":"str"},false],["end",{"t":"str"},false]]},false]]},false],["talmudtorah",{"t":"obj","p":[["terms",{"t":"obj","p":[["org",{"t":"str"},false],["office",{"t":"str"},false]]},false],["features",{"t":"obj","p":[["calendar.hebrew",{"t":"bool"},false],["calendar.shabbat",{"t":"bool"},false]]},false],["officeHours",{"t":"obj","p":[["days",{"t":"arr","of":{"t":"num"}},false],["start",{"t":"str"},false],["end",{"t":"str"},false]]},false]]},false],["shul",{"t":"obj","p":[["terms",{"t":"obj","p":[["org",{"t":"str"},false],["office",{"t":"str"},false]]},false],["features",{"t":"obj","p":[["calendar.hebrew",{"t":"bool"},false],["calendar.shabbat",{"t":"bool"},false],["calendar.fasts",{"t":"bool"},false]]},false],["officeHours",{"t":"obj","p":[["days",{"t":"arr","of":{"t":"num"}},false],["start",{"t":"str"},false],["end",{"t":"str"},false]]},false]]},false]]},"opt":false}],
};
