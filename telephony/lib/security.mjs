// ─────────────────────────────────────────────────────────────────────────────
// telephony · security — בידוד · הרשאות · הקשחה · הצפנה · fail-safe · תאימות.
// טהור, דטרמיניסטי. downstream: אין-ספק. הסודות מוזרקים בהתקנה, לא נשמרים בפלט.
// ─────────────────────────────────────────────────────────────────────────────

// ── 81. בידוד-סודות פר-לקוח ──────────────────────────────────────────────────
/** שמות משתני-הסביבה (סודות) שהתקנת-הלקוח חייבת להזריק — ייחודיים פר-לקוח. */
export function secretsFor(tenant) {
  const id = tenant.tenantId;
  return {
    default_provision_password: `PROVISION_PW__${id}`,
    gsm_gateway_password: `GSM_PW__${id}`,
    gsm_gateway_ip: `GSM_IP__${id}`,
  };
}
/** סוד-סיסמה פר-שלוחה (אישור נפרד לכל שלוחה — עובדת לא תתחזה למנהל). */
export function extSecret(tenantId, ext) {
  return `PROVISION_PW__${tenantId}__${ext}`;
}
/** סוד-PIN לתא-קולי פר-שלוחה (לא נגזר ממספר-התיבה). */
export function vmSecret(tenantId, ext) {
  return `VM_PW__${tenantId}__${ext}`;
}
/** אימות-בידוד: tenantId-ים ייחודיים ואף ערך-סוד לא חוזר בין לקוחות. */
export function secretsIsolated(tenants) {
  const ids = new Set();
  const owner = new Map(); // secretValue → tenantId
  for (const t of tenants) {
    if (ids.has(t.tenantId)) return false; // אותו tenantId פעמיים ⇒ סודות משותפים
    ids.add(t.tenantId);
    for (const v of Object.values(secretsFor(t))) {
      if (owner.has(v) && owner.get(v) !== t.tenantId) return false; // התנגשות-ערך
      owner.set(v, t.tenantId);
    }
  }
  return true;
}

// ── 81ב. סריקת-דליפה חוצת-דיירים (הוכחת-בידוד סמנטית) ────────────────────────
/** טביעת-הזהות הייחודית של דייר: ה-slug + כל מפני-הסוד שלו. */
function tenantFingerprint(tenant) {
  const id = tenant.tenantId;
  const marks = new Set([`__${id}`]); // כל סוד/הקשר נושא __<id> — זה החתם הייחודי
  for (const v of Object.values(secretsFor(tenant))) marks.add(v);
  const rec = recordingEncryption(tenant);
  if (rec.keyRef) marks.add(rec.keyRef);
  return marks;
}
/**
 * מוודא שסוד/זהות של דייר-אחד לא מופיע בקבצים של דייר-אחר. מעבר לבדיקת-הנתיבים
 * (planTenants) — זו הוכחה סמנטית שהגנרטור לא זלג מזהה בין-לקוחות (copy-paste).
 * @param {Array<{tenant:object, files:Record<string,string>}>} bundles
 * @returns {{clean:boolean, violations:Array<{owner:string,leakedInto:string,mark:string,file:string}>}}
 */
export function crossTenantLeakScan(bundles) {
  const fps = bundles.map((b) => ({ id: b.tenant.tenantId, marks: tenantFingerprint(b.tenant) }));
  const violations = [];
  for (const b of bundles) {
    const me = b.tenant.tenantId;
    for (const other of fps) {
      if (other.id === me) continue;
      for (const mark of other.marks) {
        // חתם-הדייר-האחר שאינו חתם-שלי (מונע חיתוך-slug אקראי — משווים לפי בעלות).
        for (const [file, content] of Object.entries(b.files || {})) {
          if (String(content).includes(mark)) {
            violations.push({ owner: other.id, leakedInto: me, mark, file });
          }
        }
      }
    }
  }
  return { clean: violations.length === 0, violations };
}

// ── 82. ACL — מי-רואה-מה פר-תפקיד ────────────────────────────────────────────
export const ROLES = ['operator', 'manager', 'agent'];
// מה כל תפקיד רשאי. operator=מפעיל-על · manager=מנהל-ארגון · agent=עובד.
const ACL = {
  operator: new Set(['*']),
  manager: new Set(['config.read', 'config.write', 'numbers.write', 'members.write', 'reports.read', 'recordings.read', 'cdr.read']),
  agent: new Set(['config.read', 'inbox.read', 'inbox.write', 'call.place', 'cdr.read.own']),
};
/** האם תפקיד רשאי לפעולה. operator = הכל. */
export function can(role, action) {
  const set = ACL[role];
  if (!set) return false;
  return set.has('*') || set.has(action);
}

// ── 86. הקשחת-קונפיג — checklist נאכף ────────────────────────────────────────
/** בודק הקשחות-חובה (בלי guest/anonymous, TLS, ACL, סיסמאות-חזקות). */
export function hardeningChecklist(profile = {}) {
  // fail-closed: בקרת-אבטחה נחשבת עוברת רק כשהוצהרה במפורש true (שדה-חסר=נכשל).
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
  return { pass: checks.every((c) => c.pass), checks };
}

// ── 87. הצפנת-הקלטות פר-לקוח (מודל, dormant כמו maor) ────────────────────────
/** פרמטרי-הצפנת-הקלטות. dormant עד שהבעלים מפעיל (אין key ⇒ null-safe, לא-מוצפן). */
export function recordingEncryption(tenant) {
  const on = !!(tenant.security && tenant.security.recordingEncryption);
  return on
    ? { enabled: true, algo: 'AES-256-GCM', keyRef: `REC_KEY__${tenant.tenantId}`, kdf: 'PBKDF2-600k' }
    : { enabled: false, algo: null, keyRef: null };
}

// ── 89. מסלול-חירום (fail-safe) ──────────────────────────────────────────────
/**
 * יעד-הנפילה-המובטח: אם הכל-נופל (שער/רשת/משרד), תמיד יש מספר-מנהל לחזור אליו.
 * מחזיר {ok, fallback} — ok=false אם אין מנהל (חייב-תיקון לפני חי).
 */
export function failsafeRoute(tenant) {
  const mgr = tenant.destinations && tenant.destinations.manager && tenant.destinations.manager.ext;
  return { ok: !!mgr, fallback: mgr || null, vmBox: (tenant.destinations && tenant.destinations.voicemail && tenant.destinations.voicemail.box) || '100' };
}

// ── 90. ביקורת-תאימות (מה-נגיש-לחוץ) ─────────────────────────────────────────
/** דוח-תאימות פר-לקוח: הצפנה/פרטיות/מסלול-חירום/בידוד — למבט-על. */
export function complianceReport(tenant) {
  const rec = recordingEncryption(tenant);
  const fs = failsafeRoute(tenant);
  const privacy = !!(tenant.features && tenant.features['shell.privacy']);
  const findings = [];
  if (!fs.ok) findings.push('אין מסלול-חירום (מנהל חסר).');
  if (!rec.enabled && tenantHasRecording(tenant)) findings.push('הקלטות פעילות בלי הצפנה.');
  return {
    tenantId: tenant.tenantId,
    recordingEncryption: rec.enabled,
    failsafe: fs.ok,
    privacyMode: privacy,
    ctiReadOnly: true, // אינווריאנט: CTI קריאה-בלבד
    downstreamOnly: true, // אינווריאנט: אין-ספק
    findings,
    compliant: findings.length === 0,
  };
}
function tenantHasRecording(tenant) {
  return !!(tenant.features && tenant.features.recording === true);
}
