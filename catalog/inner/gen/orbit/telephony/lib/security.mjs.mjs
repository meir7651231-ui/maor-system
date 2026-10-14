// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:telephony/lib/security.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function secretsFor(tenant) {
    const id = tenant.tenantId;
    return {
        default_provision_password: `PROVISION_PW__${id}`,
        gsm_gateway_password: `GSM_PW__${id}`,
        gsm_gateway_ip: `GSM_IP__${id}`,
    };
}
const reEscape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function tenantFingerprint(tenant) {
    const id = tenant.tenantId;
    // מסתיימי-סלאג: הקשר-ניתוב + כל מפני-הסוד. גבול-ימני (?![a-z0-9-]).
    const slugMarks = new Set([`__${id}`, `tenant_${id}`]);
    for (const v of Object.values(secretsFor(tenant)))
        slugMarks.add(v);
    const rec = recordingEncryption(tenant);
    if (rec.keyRef)
        slugMarks.add(rec.keyRef);
    const out = [...slugMarks].map((m) => ({ mark: m, re: new RegExp(reEscape(m) + '(?![a-z0-9-])') }));
    // חתם-דומיין @id (הפניית-ניתוב user/ext@id). **נחיל-6 R6-1:** גבול כולל '.' — אחרת מתאים
    // לכתובת-מייל לגיטימית `x@<id>.tld` (דומיין-מייל של דייר-אחר שסלאגו זהה לשלנו) ⇒ false-positive
    // שחוסם deploy. דומיין-FreeSWITCH אמיתי נגמר ב-"/,/}/רווח — לעולם לא ב-'.'.
    out.push({ mark: `@${id}`, re: new RegExp(reEscape(`@${id}`) + '(?![a-z0-9.-])') });
    // חתם-השער (‏sofia/gateway/<id>-gw<n>). **נחיל-6 R6-1 (רגרסיית-F3):** substring-חשוף גרם
    // false-positive — סלאג שהוא סיומת-של-אחר לפני '-gw' (‏hesed⊂chesed-gw1) או תחילית-של-אחר
    // (‏kupa⊂kupa-gwia-gw1) התאים-שווא ⇒ crossTenantLeakScan (שער-קשיח ב-apply) הפיל את כל
    // האצווה. עיגון דו-צדדי: גבול-שמאל (‏lookbehind) + ספרת-ערוץ מימין (הגנרטור תמיד '<id>-gw\d').
    out.push({ mark: `${id}-gw`, re: new RegExp('(?<![a-z0-9-])' + reEscape(`${id}-gw`) + '(?=\\d)') });
    return out;
}
function recordingEncryption(tenant) {
    const on = !!(tenant.security && tenant.security.recordingEncryption);
    return on
        ? { enabled: true, algo: 'AES-256-GCM', keyRef: `REC_KEY__${tenant.tenantId}`, kdf: 'PBKDF2-600k' }
        : { enabled: false, algo: null, keyRef: null };
}
function failsafeRoute(tenant) {
    const mgr = tenant.destinations && tenant.destinations.manager && tenant.destinations.manager.ext;
    return { ok: !!mgr, fallback: mgr || null, vmBox: (tenant.destinations && tenant.destinations.voicemail && tenant.destinations.voicemail.box) || '100' };
}
export function inner$tenantFingerprint$slugMarks(id) {
    const slugMarks = new Set([`__${id}`, `tenant_${id}`]);
    return slugMarks;
}
export function inner$tenantFingerprint$rec(tenant) {
    const rec = recordingEncryption(tenant);
    return rec;
}
export function inner$tenantFingerprint$out(slugMarks) {
    const out = [...slugMarks].map((m) => ({ mark: m, re: new RegExp(reEscape(m) + '(?![a-z0-9-])') }));
    return out;
}
export function inner$crossTenantLeakScan$fps(bundles) {
    const fps = bundles.map((b) => ({ id: b.tenant.tenantId, marks: tenantFingerprint(b.tenant) }));
    return fps;
}
export function inner$hardeningChecklist$checks(profile) {
    const checks = [
        { key: 'no-guest', pass: profile.allowGuest !== true, detail: 'guest/anonymous חסום' },
        { key: 'sip-tls', pass: profile.sipTls === true, detail: 'SIP-over-TLS' },
        { key: 'srtp', pass: profile.srtp === true, detail: 'SRTP (מדיה מוצפנת)' },
        { key: 'acl-register', pass: profile.registerAcl === true, detail: 'ACL-רישום' },
        { key: 'fail2ban', pass: profile.fail2ban === true, detail: 'הגנת-brute-force' },
        { key: 'strong-pw', pass: (profile.minPwLen || 0) >= 12, detail: 'סיסמאות ≥12 תווים' },
        { key: 'outbound-limit', pass: profile.outboundRestriction === true, detail: 'הגבלת-חיוג-יוצא (toll-fraud)' },
        { key: 'esl-acl', pass: profile.eslAcl === true, detail: 'Event-Socket מוגן (סיסמה+ACL)' },
    ];
    return checks;
}
export function inner$complianceReport$rec(tenant) {
    const rec = recordingEncryption(tenant);
    return rec;
}
export function inner$complianceReport$fs(tenant) {
    const fs = failsafeRoute(tenant);
    return fs;
}
export function inner$crossTenantLeakScan$violations$$after_loop(bundles) {
    const fps = bundles.map((b) => ({ id: b.tenant.tenantId, marks: tenantFingerprint(b.tenant) }));
    const violations = [];
    for (const b of bundles) {
        const me = b.tenant.tenantId;
        for (const other of fps) {
            if (other.id === me)
                continue;
            for (const { mark, re } of other.marks) {
                for (const [file, content] of Object.entries(b.files || {})) {
                    if (re.test(String(content))) {
                        violations.push({ owner: other.id, leakedInto: me, mark, file });
                    }
                }
            }
        }
    }
    return violations;
}

export const SIGS = {
  inner$tenantFingerprint$slugMarks: [{"name":"id","d":{"t":"any"},"opt":false}],
  inner$tenantFingerprint$rec: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$tenantFingerprint$out: [{"name":"slugMarks","d":{"t":"set","of":{"t":"str"}},"opt":false}],
  inner$crossTenantLeakScan$fps: [{"name":"bundles","d":{"t":"arr","of":{"t":"obj","p":[["tenant",{"t":"any"},false],["files",{"t":"rec","of":{"t":"str"}},false]]}},"opt":false}],
  inner$hardeningChecklist$checks: [{"name":"profile","d":{"t":"obj","p":[]},"opt":false}],
  inner$complianceReport$rec: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$complianceReport$fs: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$crossTenantLeakScan$violations$$after_loop: [{"name":"bundles","d":{"t":"arr","of":{"t":"obj","p":[["tenant",{"t":"any"},false],["files",{"t":"rec","of":{"t":"str"}},false]]}},"opt":false}],
};
