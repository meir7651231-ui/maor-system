/**
 * 💳 ratchet — שער-תשלום במעקב-הטיפול (בקשת-בעלים 25.8, opt-in supporters.ayin.paygate).
 * אי-אפשר להשלים תיק (מעבר ל-'done'/הושלם) בלי שסומן paid. חסר-הדגל ⇒ ביט-זהה.
 * רישום-תרומה מסמן את התיק-הפעיל כ"שולם" (נבדק ב-store).
 */
import { describe, expect, it } from 'vitest';
import { planAyinAdvance } from '../ayin';
import type { AyinCase } from '../../types/domain';
import { emptyAyin } from '../../types/domain';
import type { OrgConfig } from '../../types/config';
import ayinCardSrc from '../../components/supporters/AyinCard.tsx?raw';

const base = (over: Partial<AyinCase>): AyinCase => ({ ...emptyAyin(), stage: 'answer', answerPushed: true, names: [{ id: 'n', name: 'א', eyes: 1, done: true }], ...over });
const cfg = (paygate: boolean): OrgConfig => ({ slug: 'default', modules: {}, features: paygate ? { 'supporters.ayin.paygate': true } : {} } as unknown as OrgConfig);

describe('💳 ayin-paygate — תשלום לפני הושלם', () => {
  it('דגל דלוק + לא-שולם ⇒ המעבר ל-done נחסם (patch ריק + טוסט-תשלום)', () => {
    const plan = planAyinAdvance(cfg(true), 'ישראל', base({ paid: false }));
    expect(plan).not.toBeNull();
    expect(plan!.patch).toEqual({});
    expect(plan!.toast).toContain('תשלום');
  });
  it('דגל דלוק + שולם ⇒ המעבר ל-done עובר', () => {
    const plan = planAyinAdvance(cfg(true), 'ישראל', base({ paid: true }));
    expect(plan!.patch).toEqual({ stage: 'done' });
  });
  it('דגל כבוי ⇒ ביט-זהה: המעבר ל-done עובר בלי תשלום', () => {
    const plan = planAyinAdvance(cfg(false), 'ישראל', base({ paid: false }));
    expect(plan!.patch).toEqual({ stage: 'done' });
  });
});

// 💳 בקשת-בעלים 31.8: "בתשלום לפני הושלם תתן כרטיס לתשלום קישור לנדרים".
describe('💳 ayin-paygate — קישור-תשלום לנדרים בשער (הגנת-מקור)', () => {
  it('הקישור בנוי מ-payLink+integrationSetting(payUrl), מגודר-שער ומוצג רק כשטרם-שולם', () => {
    // אותה בניית-קישור כמו בכרטיס-התומך — הרחבת-תשלומים + עמוד-התרומה של הארגון
    expect(ayinCardSrc).toContain('ayinPayHref');
    expect(ayinCardSrc).toContain("integrationOn(cfg, 'payments')");
    expect(ayinCardSrc).toContain("integrationSetting(cfg, 'payments', 'payUrl')");
    // מגודר בשער התשלום עצמו (חסר-דגל ⇒ null ⇒ אין קישור)
    expect(ayinCardSrc).toMatch(/payGateOn && integrationOn\(cfg, 'payments'\)/);
    // הכרטיס מוצג רק כשטרם-שולם ויש href, נפתח בלשונית חדשה מוקשחת
    expect(ayinCardSrc).toContain('!a.paid && ayinPayHref');
    expect(ayinCardSrc).toContain('💳 תשלום בנדרים');
    expect(ayinCardSrc).toContain("rel=\"noopener noreferrer\"");
  });
});
