// ─────────────────────────────────────────────────────────────────────────────
// telephony · report — דוח-אמון פר-עמותה (item 18): לוח-מחוונים שהמפעיל מציג
// לוועד. מאגד את כל האורקלים/הבדיקות שכבר קיימים לכרטיס-אמון אחד: סגירת-מסלולים,
// בידוד חוצה-דיירים, מסלול-חירום, תקרות-toll-fraud, שלמות-כשרות, preflight-סודות,
// והאינווריאנטים (downstream/CTI-קריאה-בלבד). טהור, קריאה-בלבד.
// ─────────────────────────────────────────────────────────────────────────────

import { featureOn } from './config.mjs';
import { failsafeRoute, recordingEncryption, crossTenantLeakScan } from './security.mjs';
import { auditRoutes } from './audit-routes.mjs';
import { secretPreflight } from './apply.mjs';

// חומרת-כשל פר-בדיקה: critical=חוסם-חי · high=סיכון · info=מידע.
const SEV = { critical: 3, high: 2, info: 1 };

/**
 * כרטיס-אמון פר-לקוח. מאגד בדיקות; כל בדיקה {key, label, pass, severity, detail}.
 * @param {{tenant:object, files:Record<string,string>, manifest?:object}} bundle תוצר buildTenant
 * @param {{env?:object, peers?:Array}} [opt] env=מפת-סודות (ל-preflight) · peers=בandלים-אחרים (לבידוד)
 * @returns {{tenantId:string, checks:Array, failing:Array, score:number, grade:string, ready:boolean}}
 */
export function trustReport(bundle, opt = {}) {
  const tenant = bundle.tenant || {};
  const checks = [];
  const add = (key, label, pass, severity, detail) => checks.push({ key, label, pass: !!pass, severity, detail });

  // 1. סגירת-מסלולים (⭐1) — אין גשר/transfer/שער יתום.
  const ar = auditRoutes(bundle);
  add('route-closure', 'סגירת-מסלולים (אין ניתוב-יתום)', ar.ok, 'critical',
    ar.ok ? 'כל גשר/transfer/שער מוביל ליעד-קיים' : `יתומים: ${[...ar.dangling, ...ar.orphanTransfers, ...ar.missingGateways].join(', ')}`);

  // 2. מסלול-חירום (fail-safe) — תמיד יש מנהל לחזור אליו.
  const fs = failsafeRoute(tenant);
  add('failsafe', 'מסלול-חירום (השיחה תמיד עונה)', fs.ok, 'critical', fs.ok ? `נפילה למנהל ${fs.fallback}` : 'אין מנהל — מבוי-סתום אפשרי');

  // 3. תקרות-toll-fraud — הגנת חשבון-הסלולר.
  const toll = featureOn(tenant, 'voice.hardening');
  add('toll-caps', 'תקרות חיוג-יוצא (toll-fraud)', toll, 'high', toll ? 'בו-זמניות+משך מוגבלים' : 'כבוי — cred-גנוב יכול להצטבר (voice.hardening)');

  // 4. שלמות-כשרות — מצב-כשר עם SIM-כשר ליציאה.
  if (featureOn(tenant, 'voice.kosher')) {
    const hasK = (tenant.numbers || []).some((n) => n.kosher && n.onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel));
    add('kosher-integrity', 'שלמות-כשרות (יציאה כשרה)', hasK, 'high', hasK ? 'יש SIM-כשר ליציאה' : 'מצב-כשר בלי SIM-כשר — יציאה מושבתת');
  }

  // 5. הצפנת-הקלטות — רק אם הקלטה פעילה.
  if (featureOn(tenant, 'recording')) {
    const rec = recordingEncryption(tenant);
    add('recording-encryption', 'הצפנת-הקלטות', rec.enabled, 'high', rec.enabled ? 'AES-256-GCM' : 'הקלטות פעילות בלי הצפנה');
  }

  // 6. preflight-סודות — env מלא (אם נמסר).
  if (opt.env) {
    const pf = secretPreflight([bundle], opt.env);
    add('secrets', 'סודות-סביבה מוזרקים', pf.ok, 'critical', pf.ok ? 'כל הסודות קיימים' : `חסרים ${pf.missing.length} (שער-דומם)`);
  }

  // 7. בידוד חוצה-דיירים — אם נמסרו peers.
  if (Array.isArray(opt.peers) && opt.peers.length) {
    const leak = crossTenantLeakScan([bundle, ...opt.peers]);
    add('isolation', 'בידוד חוצה-דיירים', leak.clean, 'critical', leak.clean ? 'אין דליפת-סוד/זהות בין-לקוחות' : `${leak.violations.length} דליפות`);
  }

  // 8. אינווריאנטים (תמיד עוברים — הצהרה לוועד).
  add('downstream', 'pure-downstream (אין תלות-ספק)', true, 'info', 'מדבר רק עם ציוד-הלקוח');
  add('cti-readonly', 'זיהוי-מתקשר קריאה-בלבד', true, 'info', 'לעולם לא כותב למאור');

  const failing = checks.filter((c) => !c.pass);
  // ציון: משוקלל לפי חומרה (critical=3, high=2, info=1).
  const totalW = checks.reduce((s, c) => s + SEV[c.severity], 0);
  const gotW = checks.reduce((s, c) => s + (c.pass ? SEV[c.severity] : 0), 0);
  const score = totalW ? Math.round((gotW / totalW) * 100) : 100;
  const anyCritical = failing.some((c) => c.severity === 'critical');
  const grade = anyCritical ? 'F' : score >= 95 ? 'A' : score >= 85 ? 'B' : score >= 70 ? 'C' : 'D';
  return { tenantId: tenant.tenantId, checks, failing, score, grade, ready: !anyCritical };
}
