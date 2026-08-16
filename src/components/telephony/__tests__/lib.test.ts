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
  nextClosure,
  type TelephonyConfig,
} from '../lib';
import type { OrgConfig } from '../../../types/config';
import widgetsSrc from '../../home/widgets.tsx?raw';

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

describe('nextClosure — זמני שבת/חג לווידג׳ט-הבית (מנוע-הזמנים, downstream)', () => {
  const cfgFor = (city: string): OrgConfig =>
    ({ telephony: { ...emptyTelephonyConfig(), city } }) as unknown as OrgConfig;

  it('שבת הקרובה — הדלקת-נרות/צאת מדויקים לירושלים', () => {
    const nc = nextClosure(cfgFor('jerusalem'), '2026-08-19');
    expect(nc).not.toBeNull();
    expect(nc!.reason).toBe('שבת');
    expect(nc!.kind).toBe('shabbat');
    expect(nc!.startIso).toBe('2026-08-21'); // ערב שבת
    expect(nc!.endIso).toBe('2026-08-22'); // מוצ״ש
    expect(nc!.candle).toBe('18:37');
    expect(nc!.tzeis).toBe('19:56');
    expect(nc!.cityHe).toBe('ירושלים');
  });

  it('חג קרוב מזוהה בסיבה ובסוג (יום כיפור תשפ״ז)', () => {
    const nc = nextClosure(cfgFor('jerusalem'), '2026-09-20');
    expect(nc!.reason).toBe('יום כיפור');
    expect(nc!.kind).toBe('yomtov');
    expect(nc!.candle).toBe('18:00');
    expect(nc!.tzeis).toBe('19:18');
  });

  it('עיר-עוגן אחרת ⇒ זמן וכיתוב שונים (תל אביב)', () => {
    const nc = nextClosure(cfgFor('telaviv'), '2026-08-19');
    expect(nc!.cityHe).toBe('תל אביב');
    expect(nc!.candle).not.toBe('18:37'); // מנהג/נ״צ שונה מירושלים
  });

  it('בלי telephony בקונפיג ⇒ null (אין נ״צ, אין שורות בבית)', () => {
    expect(nextClosure({} as unknown as OrgConfig, '2026-08-19')).toBeNull();
  });

  it('הווידג׳ט מגדר את השורות ב-telephonyOn ורץ על nextClosure', () => {
    expect(widgetsSrc).toContain('telephonyOn(config) ? nextClosure(config, todayIso)');
    expect(widgetsSrc).toContain('הדלקת נרות');
  });
});
