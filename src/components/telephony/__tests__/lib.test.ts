/**
 * ratchet — גשר-הטלפוניה: אשף-מאור → מנוע-הטלפוניה הטהור (telephony/lib).
 *
 * מאמת שלושה דברים: (1) הגשר טוען את המנוע בפועל בזמן-ריצה (ESM .mjs מיובא בדפדפן/vitest);
 * (2) המיפוי תצורת-אשף → tenant מייצר tenant תקין שהמנוע מקבל; (3) התצוגה-המקדימה
 * החיה (סימולטור-שיחה + דוח-אמון) רצה ומחזירה תוצאות. אינווריאנט: pure-downstream נשמר.
 */
import { describe, expect, it } from 'vitest';
import {
  emptyTelephonyConfig,
  telephonyToTenant,
  toTenantId,
  previewTelephony,
  explainOne,
  type TelephonyConfig,
} from '../lib';

function sampleCfg(): TelephonyConfig {
  return {
    ...emptyTelephonyConfig(),
    numbers: [
      { id: 'n1', e164: '02-5551234', label: 'קו ראשי', kind: 'sim' },
      { id: 'n2', e164: '053-9998877', label: 'קו כשר', kind: 'sim', kosher: true },
      { id: 'n3', e164: '054-7654321', label: 'ווצאפ', kind: 'whatsapp' },
    ],
  };
}

describe('telephony wizard bridge', () => {
  it('toTenantId מפיק slug תקין (3–40, אותיות-קטנות/ספרות/מקף)', () => {
    expect(toTenantId('chesed-demo', 'מאור החסד')).toBe('chesed-demo');
    expect(toTenantId('default', 'Maor Org 5')).toMatch(/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/);
    expect(toTenantId('', 'עמותה').length).toBeGreaterThanOrEqual(3);
  });

  it('telephonyToTenant מקצה ערוצי-שער אוטומטית ל-SIM ומדלג על ווצאפ', () => {
    const t = telephonyToTenant(sampleCfg(), 'מאור', 'chesed-demo') as {
      numbers: Array<{ id: string; onramp: string; gatewayChannel?: number; channels: string[] }>;
      outbound: { defaultNumberId: string };
      features: Record<string, boolean>;
    };
    const sims = t.numbers.filter((n) => n.onramp === 'sim-in-gateway');
    expect(sims.map((n) => n.gatewayChannel)).toEqual([1, 2]); // רץ, ווצאפ לא נספר
    const wa = t.numbers.find((n) => n.channels.includes('whatsapp'));
    expect(wa && wa.gatewayChannel).toBeUndefined(); // device-link בלי ערוץ
    expect(t.outbound.defaultNumberId).toBe('n1'); // ה-SIM הראשון
  });

  it('previewTelephony רץ בפועל — טוען את המנוע, מדמה שיחות ומחשב דוח-אמון', () => {
    const p = previewTelephony(sampleCfg(), 'מאור החסד', 'chesed-demo');
    expect(p.ok).toBe(true);
    expect(p.rows.length).toBe(3); // בשעות/אחרי-שעות/שבת
    // בשעות ⇒ מצלצל במשרד; אחרי-שעות ⇒ מנהל/תא-קולי.
    expect(p.rows[0].outcome).toBe('office');
    expect(['voicemail', 'manager', 'afterhours']).toContain(p.rows[1].outcome);
    // דוח-אמון קיים עם ציון-אות תקין וקבצים-שחוללו.
    expect(p.trust).not.toBeNull();
    expect(p.trust!.grade).toMatch(/^[A-F]$/);
    expect(p.files && Object.keys(p.files).some((f) => f.startsWith('dialplan/'))).toBe(true);
  });

  it('מצב-כשר: תצוגה-מקדימה מדווחת חסימת-יציאה לא-כשרה', () => {
    const cfg = { ...sampleCfg(), kosherMode: true };
    const r = explainOne(cfg, 'מאור', 'chesed-demo', { direction: 'outbound', did: '1#0501234567' });
    // ערוץ 1 (n1, לא-כשר) במצב-כשר ⇒ נחסם.
    expect(r.outcome).toBe('non-kosher-blocked');
  });

  it('תצורה לא-תקינה (בלי מספר תקין) ⇒ ok:false עם שגיאות', () => {
    const cfg = { ...emptyTelephonyConfig(), numbers: [{ id: 'n1', e164: '', label: 'ריק', kind: 'sim' as const }] };
    const p = previewTelephony(cfg, 'מאור', 'chesed-demo');
    expect(p.ok).toBe(false);
    expect(p.errors.length).toBeGreaterThan(0);
  });
});
