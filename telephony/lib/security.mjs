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
/** אימות-בידוד: אין סוד משותף בין שני לקוחות (כל ערך נושא את ה-tenantId). */
export function secretsIsolated(tenants) {
  const seen = new Map();
  for (const t of tenants) {
    for (const v of Object.values(secretsFor(t))) {
      if (seen.has(v) && seen.get(v) !== t.tenantId) return false;
      seen.set(v, t.tenantId);
    }
  }
  return true;
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
  const checks = [
    { key: 'no-guest', pass: profile.allowGuest !== true, detail: 'guest/anonymous חסום' },
    { key: 'sip-tls', pass: profile.sipTls !== false, detail: 'SIP-over-TLS' },
    { key: 'srtp', pass: profile.srtp !== false, detail: 'SRTP (מדיה מוצפנת)' },
    { key: 'acl-register', pass: profile.registerAcl !== false, detail: 'ACL-רישום' },
    { key: 'fail2ban', pass: profile.fail2ban !== false, detail: 'הגנת-brute-force' },
    { key: 'strong-pw', pass: (profile.minPwLen || 0) >= 12, detail: 'סיסמאות ≥12 תווים' },
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
