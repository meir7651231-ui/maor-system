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
