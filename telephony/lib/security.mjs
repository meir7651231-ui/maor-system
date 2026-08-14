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
const reEscape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/**
 * טביעת-הזהות הייחודית של דייר: הקשר-הניתוב + הדומיין + השער + כל מפני-הסוד.
 *
 * שני סוגי-חתם:
 *  · **מסתיימי-סלאג** (`__<id>`, `tenant_<id>`, `@<id>`, secretsFor, keyRef) — נבדקים
 *    עם גבול (‏`(?![a-z0-9-])`) שמונע false-hit כשסלאג הוא תחילית של אחר
 *    (‏chesed⊂chesed-north). **נחיל-5 F2 (רגרסיית-C4):** הוסר `_` מהמחלקה — tenantId
 *    לעולם לא מכיל `_` (SLUG_RE) ⇒ ה-`_` לא מנע אף false-positive, אבל *עיוור* חתמים
 *    שהגנרטור ממשיך ב-`_`: ‏`PROVISION_PW__<id>__<ext>`, `VM_PW__<id>__<ext>`,
 *    `tenant_<id>_gw/_q`. עכשיו דליפת-סוד פר-שלוחה נתפסת שוב.
 *  · **חתם-שער** (`<id>-gw`) — הגנרטור ממשיך אותו בספרת-ערוץ (‏`<id>-gw1`), לכן בלי
 *    גבול-סיום (substring); הוא ייחודי-דיו (‏`chesed-gw`∉`chesed-north-gw1`). **נחיל-5 F3.**
 */
function tenantFingerprint(tenant) {
  const id = tenant.tenantId;
  // מסתיימי-סלאג: הקשר-ניתוב + כל מפני-הסוד. גבול-ימני (?![a-z0-9-]).
  const slugMarks = new Set([`__${id}`, `tenant_${id}`]);
  for (const v of Object.values(secretsFor(tenant))) slugMarks.add(v);
  const rec = recordingEncryption(tenant);
  if (rec.keyRef) slugMarks.add(rec.keyRef);
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
/**
 * מוודא שסוד/זהות של דייר-אחד לא מופיע בקבצים של דייר-אחר. מעבר לבדיקת-הנתיבים
 * (planTenants) — זו הוכחה סמנטית שהגנרטור לא זלג מזהה בין-לקוחות (copy-paste).
 * גבול-מילה (C4) ⇒ אין false-positive כשסלאג הוא תחילית של אחר.
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
      for (const { mark, re } of other.marks) {
        for (const [file, content] of Object.entries(b.files || {})) {
          if (re.test(String(content))) {
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
  // **נחיל-7 R7-4:** הצפנת-הקלטות-במנוחה **דורמנטית** (REC_KEY לא-מחווט; record_session כותב
  // .wav גולמי) — מיושר ל-trustReport (R5-F4). אסור להצהיר compliant על-סמך דגל-הקונפיג בלבד;
  // הקלטות-פעילות = ממצא בכל מקרה (מוצפן-מוגדר-אך-דורמנטי, או לא-מוצפן).
  if (tenantHasRecording(tenant)) {
    findings.push(rec.enabled
      ? 'הקלטות פעילות; הצפנת-מנוחה מוגדרת אך דורמנטית (REC_KEY טרם מחווט).'
      : 'הקלטות פעילות בלי הצפנה.');
  }
  return {
    tenantId: tenant.tenantId,
    recordingEncryption: false, // דורמנטי — לעולם לא פעיל-בפועל (R7-4, מיושר ל-trustReport)
    recordingEncryptionConfigured: rec.enabled, // מצב-הדגל (להבחנה מהמצב-בפועל)
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
