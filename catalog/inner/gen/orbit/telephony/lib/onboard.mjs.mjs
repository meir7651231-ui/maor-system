// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:telephony/lib/onboard.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const TYPE_DEFAULTS = {
    sim: { onramp: 'sim-in-gateway', channels: ['voice'] },
    virtual: { onramp: 'customer-forward', channels: ['voice'] },
    whatsapp: { onramp: 'device-link', channels: ['whatsapp'] },
};
function pick(obj, path, dflt) {
    const v = path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
    return v === undefined || v === null ? dflt : v;
}
const parseRow = (line) => {
    const out = [];
    let cur = '', q = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (q) {
            if (c === '"' && line[i + 1] === '"') {
                cur += '"';
                i++;
            }
            else if (c === '"')
                q = false;
            else
                cur += c;
        }
        else if (c === '"')
            q = true;
        else if (c === ',') {
            out.push(cur);
            cur = '';
        }
        else
            cur += c;
    }
    out.push(cur);
    return out.map((s) => s.trim());
};
function detectNumberType(raw) {
    const d = String(raw || '').replace(/[^\d]/g, '').replace(/^972/, '0');
    if (/^05[0-9]/.test(d))
        return { type: 'sim', onramp: 'sim-in-gateway', confidence: 'high', reason: 'סלולרי (05x)' };
    if (/^07[2-9]/.test(d))
        return { type: 'virtual', onramp: 'customer-forward', confidence: 'high', reason: 'וירטואלי/VoIP (07x)' };
    if (/^0(2|3|4|8|9)/.test(d))
        return { type: 'sim', onramp: 'sim-in-gateway', confidence: 'medium', reason: 'קו-נייח (אזורי)' };
    if (/^1(700|800|599)/.test(d))
        return { type: 'virtual', onramp: 'customer-forward', confidence: 'high', reason: 'קו-שירות (1-700/800/599)' };
    return { type: 'sim', onramp: 'sim-in-gateway', confidence: 'low', reason: 'לא-מזוהה — ברירת-מחדל SIM' };
}
function provisioningQr(tenant, ext, opt = {}) {
    const domain = tenant.tenantId;
    const server = opt.server || `pbx.${domain}`;
    return {
        ext: String(ext),
        username: String(ext),
        domain,
        server,
        transport: opt.transport || 'tls',
        sipUri: `sip:${ext}@${domain}`,
        // תוכן-QR (Linphone config-uri style). הסיסמה נמסרת בנפרד/בהתקנה.
        qrPayload: `sip:${ext}@${server};transport=${opt.transport || 'tls'}`,
    };
}
function preflight(tenant) {
    const blockers = [];
    const warnings = [];
    const vnums = tenant.numbers.filter((n) => (n.channels || []).includes('voice') && n.onramp !== 'device-link');
    if (!vnums.length)
        blockers.push('אין אף מספר נושא-קול.');
    const sims = tenant.numbers.filter((n) => n.onramp === 'sim-in-gateway');
    const noChannel = sims.filter((n) => !Number.isInteger(n.gatewayChannel));
    if (noChannel.length)
        warnings.push(`${noChannel.length} SIM ללא ערוץ-שער — יציאה דרכם לא-תעבוד.`);
    // קו-מופנה בלי SIM-נחיתה נושא-קול = לא יכול לקבל שיחה (חוסם מוכנות אמיתית).
    const simVoice = sims.some((n) => (n.channels || []).includes('voice'));
    const fwdVoice = tenant.numbers.some((n) => n.onramp === 'customer-forward' && (n.channels || []).includes('voice'));
    if (fwdVoice && !simVoice)
        blockers.push('קווים-מופנים בלי SIM-בשער נושא-קול לנחיתה — לא יתקבלו שיחות.');
    if (!tenant.destinations.office.ext.length)
        blockers.push('אין שלוחת-משרד.');
    if (!tenant.destinations.manager.ext)
        blockers.push('אין שלוחת-מנהל.');
    if (!tenant.outbound.defaultNumberId)
        warnings.push('אין מספר יציאת-ברירת-מחדל.');
    if (tenant.cti && tenant.cti.mode !== 'off' && !tenant.cti.org)
        warnings.push('CTI פעיל בלי ארגון-מאור.');
    return { ready: blockers.length === 0, blockers, warnings };
}
export function inner$pick$v(obj, path) {
    const v = path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
    return v;
}
export function inner$tenantFromIntake$inNums(a) {
    const inNums = Array.isArray(a.numbers) ? a.numbers : [];
    return inNums;
}
export function inner$tenantFromIntake$type(n) {
    const type = TYPE_DEFAULTS[n.type] ? n.type : 'sim';
    return type;
}
export function inner$tenantFromIntake$map$type(n) {
    const type = TYPE_DEFAULTS[n.type] ? n.type : 'sim';
    return type;
}
export function inner$tenantFromIntake$map$out(n, i, def) {
    const type = TYPE_DEFAULTS[n.type] ? n.type : 'sim';
    const out = {
        id: n.id || `n${i + 1}`,
        e164: n.number ?? n.e164 ?? '',
        label: n.label || `קו ${i + 1}`,
        type,
        onramp: def.onramp,
        channels: Array.isArray(n.channels) && n.channels.length ? n.channels : [...def.channels],
        kosher: !!n.kosher,
    };
    return out;
}
export function inner$tenantFromIntake$map$out$$step(n, i, type, def) {
    const out = {
        id: n.id || `n${i + 1}`,
        e164: n.number ?? n.e164 ?? '',
        label: n.label || `קו ${i + 1}`,
        type,
        onramp: def.onramp,
        channels: Array.isArray(n.channels) && n.channels.length ? n.channels : [...def.channels],
        kosher: !!n.kosher,
    };
    return out;
}
export function inner$tenantFromIntake$officeExt(a) {
    const officeExt = pick(a, 'office', '101');
    return officeExt;
}
export function inner$tenantFromIntake$managerExt(a) {
    const managerExt = pick(a, 'manager', '201');
    return managerExt;
}
export function inner$tenantFromIntake$firstSim(numbers) {
    const firstSim = numbers.find((n) => n.onramp === 'sim-in-gateway');
    return firstSim;
}
export function inner$numbersFromCsv$lines(csv) {
    const lines = String(csv || '').split(/\r?\n/).filter((l) => l.trim());
    return lines;
}
export function inner$numbersFromCsv$header(csv) {
    const lines = String(csv || '').split(/\r?\n/).filter((l) => l.trim());
    const header = parseRow(lines[0]).map((h) => h.toLowerCase());
    return header;
}
export function inner$numbersFromCsv$header$$step(lines) {
    const header = parseRow(lines[0]).map((h) => h.toLowerCase());
    return header;
}
export function inner$numbersFromCsv$cols(csv, r) {
    const lines = String(csv || '').split(/\r?\n/).filter((l) => l.trim());
    const cols = parseRow(lines[r]);
    return cols;
}
export function inner$numbersFromCsv$cols$$step(lines, r) {
    const cols = parseRow(lines[r]);
    return cols;
}
export function inner$numbersFromCsv$detected(number) {
    const detected = detectNumberType(number);
    return detected;
}
export function inner$numbersFromCsv$n(number, label, typeCol) {
    const detected = detectNumberType(number);
    const n = { number, label, type: ['sim', 'virtual', 'whatsapp'].includes(typeCol) ? typeCol : detected.type };
    return n;
}
export function inner$numbersFromCsv$n$$step(number, label, typeCol, detected) {
    const n = { number, label, type: ['sim', 'virtual', 'whatsapp'].includes(typeCol) ? typeCol : detected.type };
    return n;
}
export function inner$detectNumberType$d(raw) {
    const d = String(raw || '').replace(/[^\d]/g, '').replace(/^972/, '0');
    return d;
}
export function inner$stepsFor$nums(answers) {
    const nums = Array.isArray(answers.numbers) ? answers.numbers : [];
    return nums;
}
export function inner$stepsFor$onlyWhatsapp(answers) {
    const nums = Array.isArray(answers.numbers) ? answers.numbers : [];
    const onlyWhatsapp = nums.length > 0 && nums.every((n) => n.type === 'whatsapp');
    return onlyWhatsapp;
}
export function inner$stepsFor$onlyWhatsapp$$step(nums) {
    const onlyWhatsapp = nums.length > 0 && nums.every((n) => n.type === 'whatsapp');
    return onlyWhatsapp;
}
export function inner$provisioningQr$server(opt, domain) {
    const server = opt.server || `pbx.${domain}`;
    return server;
}
export function inner$routingPreview$vnums(tenant) {
    const vnums = tenant.numbers.filter((n) => (n.channels || []).includes('voice') && n.onramp !== 'device-link');
    return vnums;
}
export function inner$routingPreview$sims(tenant) {
    const sims = tenant.numbers.filter((n) => n.onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel));
    return sims;
}
export function inner$preflight$vnums(tenant) {
    const vnums = tenant.numbers.filter((n) => (n.channels || []).includes('voice') && n.onramp !== 'device-link');
    return vnums;
}
export function inner$preflight$sims(tenant) {
    const sims = tenant.numbers.filter((n) => n.onramp === 'sim-in-gateway');
    return sims;
}
export function inner$preflight$noChannel(tenant) {
    const sims = tenant.numbers.filter((n) => n.onramp === 'sim-in-gateway');
    const noChannel = sims.filter((n) => !Number.isInteger(n.gatewayChannel));
    return noChannel;
}
export function inner$preflight$noChannel$$step(sims) {
    const noChannel = sims.filter((n) => !Number.isInteger(n.gatewayChannel));
    return noChannel;
}
export function inner$preflight$simVoice(tenant) {
    const sims = tenant.numbers.filter((n) => n.onramp === 'sim-in-gateway');
    const simVoice = sims.some((n) => (n.channels || []).includes('voice'));
    return simVoice;
}
export function inner$preflight$simVoice$$step(sims) {
    const simVoice = sims.some((n) => (n.channels || []).includes('voice'));
    return simVoice;
}
export function inner$preflight$fwdVoice(tenant) {
    const fwdVoice = tenant.numbers.some((n) => n.onramp === 'customer-forward' && (n.channels || []).includes('voice'));
    return fwdVoice;
}
export function inner$cloneTenant$c(config) {
    const c = JSON.parse(JSON.stringify(config));
    return c;
}
export function inner$provision$pf(v) {
    const pf = preflight(v.tenant);
    return pf;
}
export function inner$provision$exts(v) {
    const exts = [...new Set([...(v.tenant.destinations.office.ext || []), v.tenant.destinations.manager.ext])].filter(Boolean);
    return exts;
}
export function inner$provision$provisioning(opt, v) {
    const exts = [...new Set([...(v.tenant.destinations.office.ext || []), v.tenant.destinations.manager.ext])].filter(Boolean);
    const provisioning = exts.map((e) => provisioningQr(v.tenant, e, { server: opt.server }));
    return provisioning;
}
export function inner$provision$provisioning$$step(opt, v, exts) {
    const provisioning = exts.map((e) => provisioningQr(v.tenant, e, { server: opt.server }));
    return provisioning;
}
export function inner$provision$blockers(v, trust) {
    const pf = preflight(v.tenant);
    const blockers = [
        ...pf.blockers,
        ...trust.failing.filter((c) => c.severity === 'critical').map((c) => c.detail),
    ];
    return blockers;
}
export function inner$provision$blockers$$step(trust, pf) {
    const blockers = [
        ...pf.blockers,
        ...trust.failing.filter((c) => c.severity === 'critical').map((c) => c.detail),
    ];
    return blockers;
}
export function inner$provision$nextSteps(opt, v, trust) {
    const pf = preflight(v.tenant);
    const exts = [...new Set([...(v.tenant.destinations.office.ext || []), v.tenant.destinations.manager.ext])].filter(Boolean);
    const provisioning = exts.map((e) => provisioningQr(v.tenant, e, { server: opt.server }));
    const ready = pf.ready && trust.ready;
    const nextSteps = ready
        ? [
            `הזרק את סודות-הסביבה (${opt.env ? 'הוזרקו' : `${trust.checks.find((c) => c.key === 'secrets') ? 'ראה דוח' : 'GSM_PW/PROVISION_PW/VM_PW פר-לקוח'}`}).`,
            `סרוק QR לכל ${provisioning.length} השלוחות (חיבור softphone).`,
            'חבר את שער-ה-GSM עם ה-SIM של הלקוח.',
            'הרץ apply --write (יעבור שערי-סגירה/בידוד/סודות).',
        ]
        : ['פתור את החוסמים למטה לפני פריסה.'];
    return nextSteps;
}
export function inner$provision$nextSteps$$step(opt, trust, provisioning, ready) {
    const nextSteps = ready
        ? [
            `הזרק את סודות-הסביבה (${opt.env ? 'הוזרקו' : `${trust.checks.find((c) => c.key === 'secrets') ? 'ראה דוח' : 'GSM_PW/PROVISION_PW/VM_PW פר-לקוח'}`}).`,
            `סרוק QR לכל ${provisioning.length} השלוחות (חיבור softphone).`,
            'חבר את שער-ה-GSM עם ה-SIM של הלקוח.',
            'הרץ apply --write (יעבור שערי-סגירה/בידוד/סודות).',
        ]
        : ['פתור את החוסמים למטה לפני פריסה.'];
    return nextSteps;
}
export function inner$tenantFromIntake$reservedCh$$after_loop(a) {
    const inNums = Array.isArray(a.numbers) ? a.numbers : [];
    const reservedCh = new Set();
    for (const n of inNums) {
        const type = TYPE_DEFAULTS[n.type] ? n.type : 'sim';
        if (TYPE_DEFAULTS[type].onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel) && n.gatewayChannel > 0)
            reservedCh.add(n.gatewayChannel);
    }
    return reservedCh;
}

export const SIGS = {
  inner$pick$v: [{"name":"obj","d":{"t":"any"},"opt":false},{"name":"path","d":{"t":"any"},"opt":false}],
  inner$tenantFromIntake$inNums: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$tenantFromIntake$type: [{"name":"n","d":{"t":"any"},"opt":false}],
  inner$tenantFromIntake$map$type: [{"name":"n","d":{"t":"any"},"opt":false}],
  inner$tenantFromIntake$map$out: [{"name":"n","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"def","d":{"t":"any"},"opt":false}],
  inner$tenantFromIntake$map$out$$step: [{"name":"n","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"type","d":{"t":"any"},"opt":false},{"name":"def","d":{"t":"any"},"opt":false}],
  inner$tenantFromIntake$officeExt: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$tenantFromIntake$managerExt: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$tenantFromIntake$firstSim: [{"name":"numbers","d":{"t":"any"},"opt":false}],
  inner$numbersFromCsv$lines: [{"name":"csv","d":{"t":"any"},"opt":false}],
  inner$numbersFromCsv$header: [{"name":"csv","d":{"t":"any"},"opt":false}],
  inner$numbersFromCsv$header$$step: [{"name":"lines","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$numbersFromCsv$cols: [{"name":"csv","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$numbersFromCsv$cols$$step: [{"name":"lines","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$numbersFromCsv$detected: [{"name":"number","d":{"t":"str"},"opt":false}],
  inner$numbersFromCsv$n: [{"name":"number","d":{"t":"str"},"opt":false},{"name":"label","d":{"t":"str"},"opt":false},{"name":"typeCol","d":{"t":"str"},"opt":false}],
  inner$numbersFromCsv$n$$step: [{"name":"number","d":{"t":"str"},"opt":false},{"name":"label","d":{"t":"str"},"opt":false},{"name":"typeCol","d":{"t":"str"},"opt":false},{"name":"detected","d":{"t":"obj","p":[["type",{"t":"str"},false],["onramp",{"t":"str"},false],["confidence",{"t":"str"},false],["reason",{"t":"str"},false]]},"opt":false}],
  inner$detectNumberType$d: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$stepsFor$nums: [{"name":"answers","d":{"t":"obj","p":[]},"opt":false}],
  inner$stepsFor$onlyWhatsapp: [{"name":"answers","d":{"t":"obj","p":[]},"opt":false}],
  inner$stepsFor$onlyWhatsapp$$step: [{"name":"nums","d":{"t":"any"},"opt":false}],
  inner$provisioningQr$server: [{"name":"opt","d":{"t":"obj","p":[]},"opt":false},{"name":"domain","d":{"t":"any"},"opt":false}],
  inner$routingPreview$vnums: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$routingPreview$sims: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$preflight$vnums: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$preflight$sims: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$preflight$noChannel: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$preflight$noChannel$$step: [{"name":"sims","d":{"t":"any"},"opt":false}],
  inner$preflight$simVoice: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$preflight$simVoice$$step: [{"name":"sims","d":{"t":"any"},"opt":false}],
  inner$preflight$fwdVoice: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$cloneTenant$c: [{"name":"config","d":{"t":"any"},"opt":false}],
  inner$provision$pf: [{"name":"v","d":{"t":"obj","p":[["ok",{"t":"bool"},false],["errors",{"t":"arr","of":{"t":"str"}},false],["warnings",{"t":"arr","of":{"t":"str"}},false],["tenant",{"t":"or","of":[{"t":"null"},{"t":"any"}]},false]]},"opt":false}],
  inner$provision$exts: [{"name":"v","d":{"t":"obj","p":[["ok",{"t":"bool"},false],["errors",{"t":"arr","of":{"t":"str"}},false],["warnings",{"t":"arr","of":{"t":"str"}},false],["tenant",{"t":"or","of":[{"t":"null"},{"t":"any"}]},false]]},"opt":false}],
  inner$provision$provisioning: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["anchorDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["calendarWindow",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["env",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true],["peers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["server",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false},{"name":"v","d":{"t":"obj","p":[["ok",{"t":"bool"},false],["errors",{"t":"arr","of":{"t":"str"}},false],["warnings",{"t":"arr","of":{"t":"str"}},false],["tenant",{"t":"or","of":[{"t":"null"},{"t":"any"}]},false]]},"opt":false}],
  inner$provision$provisioning$$step: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["anchorDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["calendarWindow",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["env",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true],["peers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["server",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false},{"name":"v","d":{"t":"obj","p":[["ok",{"t":"bool"},false],["errors",{"t":"arr","of":{"t":"str"}},false],["warnings",{"t":"arr","of":{"t":"str"}},false],["tenant",{"t":"or","of":[{"t":"null"},{"t":"any"}]},false]]},"opt":false},{"name":"exts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$provision$blockers: [{"name":"v","d":{"t":"obj","p":[["ok",{"t":"bool"},false],["errors",{"t":"arr","of":{"t":"str"}},false],["warnings",{"t":"arr","of":{"t":"str"}},false],["tenant",{"t":"or","of":[{"t":"null"},{"t":"any"}]},false]]},"opt":false},{"name":"trust","d":{"t":"obj","p":[["tenantId",{"t":"str"},false],["checks",{"t":"arr","of":{"t":"any"}},false],["failing",{"t":"arr","of":{"t":"any"}},false],["score",{"t":"num"},false],["grade",{"t":"str"},false],["ready",{"t":"bool"},false]]},"opt":false}],
  inner$provision$blockers$$step: [{"name":"trust","d":{"t":"obj","p":[["tenantId",{"t":"str"},false],["checks",{"t":"arr","of":{"t":"any"}},false],["failing",{"t":"arr","of":{"t":"any"}},false],["score",{"t":"num"},false],["grade",{"t":"str"},false],["ready",{"t":"bool"},false]]},"opt":false},{"name":"pf","d":{"t":"obj","p":[["ready",{"t":"bool"},false],["blockers",{"t":"arr","of":{"t":"str"}},false],["warnings",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$provision$nextSteps: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["anchorDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["calendarWindow",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["env",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true],["peers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["server",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false},{"name":"v","d":{"t":"obj","p":[["ok",{"t":"bool"},false],["errors",{"t":"arr","of":{"t":"str"}},false],["warnings",{"t":"arr","of":{"t":"str"}},false],["tenant",{"t":"or","of":[{"t":"null"},{"t":"any"}]},false]]},"opt":false},{"name":"trust","d":{"t":"obj","p":[["tenantId",{"t":"str"},false],["checks",{"t":"arr","of":{"t":"any"}},false],["failing",{"t":"arr","of":{"t":"any"}},false],["score",{"t":"num"},false],["grade",{"t":"str"},false],["ready",{"t":"bool"},false]]},"opt":false}],
  inner$provision$nextSteps$$step: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["anchorDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["calendarWindow",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["env",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true],["peers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true],["server",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false},{"name":"trust","d":{"t":"obj","p":[["tenantId",{"t":"str"},false],["checks",{"t":"arr","of":{"t":"any"}},false],["failing",{"t":"arr","of":{"t":"any"}},false],["score",{"t":"num"},false],["grade",{"t":"str"},false],["ready",{"t":"bool"},false]]},"opt":false},{"name":"provisioning","d":{"t":"arr","of":{"t":"obj","p":[["ext",{"t":"str"},false],["username",{"t":"str"},false],["domain",{"t":"any"},false],["server",{"t":"any"},false],["transport",{"t":"any"},false],["sipUri",{"t":"str"},false],["qrPayload",{"t":"str"},false]]}},"opt":false},{"name":"ready","d":{"t":"bool"},"opt":false}],
  inner$tenantFromIntake$reservedCh$$after_loop: [{"name":"a","d":{"t":"any"},"opt":false}],
};
