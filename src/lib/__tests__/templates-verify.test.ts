/**
 * ratchet — צרור ‏#12+#11 (5.8.2026): תבניות-הודעה עריכות + קוד-אימות על קבלה.
 */
import { describe, expect, it } from 'vitest';
import { renderTemplate, TEMPLATE_DEFS, TEMPLATE_KEYS } from '../templates';
import { waBirthdayText, waDeliveryText, waPaymentText } from '../wa';
import { receiptLines, receiptVerifyCode } from '../receipt';
import { normalizeConfig } from '../config';
import donationModalSrc from '../../components/supporters/DonationModal.tsx?raw';
import settingsSrc from '../../components/settings/SettingsView.tsx?raw';
import wizardSrc from '../../components/builder/BuilderWizard.tsx?raw';

describe('📝 ratchet — תבניות-הודעה עריכות (#12)', () => {
  it('בלי דריסה — הנוסחים זהים ביט-אחר-ביט לנוסחים ההיסטוריים הקבועים', () => {
    // הנוסח ההיסטורי המדויק (לפני מנגנון-התבניות) — אסור שישתנה בלי הכרעה
    expect(waDeliveryText('אור', 'כהן')).toBe('שלום משפחת כהן, משלוח מאור בדרך אליכם היום 🚚');
    expect(waDeliveryText('', 'כהן')).toBe('שלום משפחת כהן, משלוח מהעמותה בדרך אליכם היום 🚚');
    expect(waPaymentText('אור', 'ציור', 250)).toBe('שלום, תזכורת ידידותית מאור: יתרה לתשלום עבור ציור — ₪250. תודה רבה!');
    expect(waBirthdayText('אור', 'רות')).toBe('מזל טוב לרות ליום ההולדת! 🎂 באהבה, אור');
  });

  it('דריסת-ארגון גוברת; משתנה לא-מוכר נשאר גלוי; ריק ⇒ ברירת-מחדל', () => {
    const cfg = { templates: { 'wa.delivery': 'היי {name}! חבילה מ{org} 🎁 {oops}' } };
    expect(renderTemplate(cfg, 'wa.delivery', { name: 'משפחת לוי', org: 'אור' })).toBe('היי משפחת לוי! חבילה מאור 🎁 {oops}');
    expect(renderTemplate({ templates: {} }, 'wa.birthday', { first: 'רות', org: 'אור' })).toBe(TEMPLATE_DEFS.find((d) => d.key === 'wa.birthday')!.def.replace('{first}', 'רות').replace('{org}', 'אור'));
  });

  it('normalizeConfig מחטא: רק TEMPLATE_KEYS, מחרוזות, תקרת-500', () => {
    const raw = {
      slug: 'x', orgName: 'א', theme: 'or-rishon', modules: {},
      templates: { 'wa.delivery': ' היי ', 'evil.key': 'x', 'wa.payment': 7, 'wa.birthday': 'א'.repeat(600) },
    };
    const norm = normalizeConfig(raw)!;
    expect(norm.templates?.['wa.delivery']).toBe('היי');
    expect(norm.templates?.['evil.key' as never]).toBeUndefined();
    expect(norm.templates?.['wa.payment']).toBeUndefined();
    expect(norm.templates?.['wa.birthday']?.length).toBe(500);
    expect(TEMPLATE_KEYS).toEqual(['wa.delivery', 'wa.payment', 'wa.birthday']);
  });

  it('🛡 האשף עורך תבניות תחת וואטסאפ-דלוק', () => {
    expect(wizardSrc).toContain('נוסחי ההודעות');
    expect(wizardSrc).toMatch(/whatsapp\?\.enabled[\s\S]{0,600}TEMPLATE_DEFS\.map/);
  });
});

describe('🔍 ratchet — קוד-אימות על קבלה (#11)', () => {
  it('הקוד דטרמיניסטי, רגיש לכל שדה, בתבנית XXX-XXX', () => {
    const c = receiptVerifyCode('D-7', 180, '₪', '2026-08-05');
    expect(c).toMatch(/^[0-9A-Z]{3}-[0-9A-Z]{3}$/);
    expect(receiptVerifyCode('D-7', 180, '₪', '2026-08-05')).toBe(c); // דטרמיניסטי
    expect(receiptVerifyCode('D-7', 181, '₪', '2026-08-05')).not.toBe(c); // סכום שונה
    expect(receiptVerifyCode('D-8', 180, '₪', '2026-08-05')).not.toBe(c); // rid שונה
    expect(receiptVerifyCode('D-7', 180, '$', '2026-08-05')).not.toBe(c); // מטבע שונה
    expect(receiptVerifyCode('D-7', 180, '₪', '2026-08-06')).not.toBe(c); // תאריך שונה
  });

  it('שורת הקוד מופיעה רק עם verify:true — קבלות קיימות לא משתנות', () => {
    const base = { rid: 'D-7', orgName: 'אור', payer: 'כהן', amount: 180, date: '2026-08-05', forWhat: 'תרומה' };
    expect(receiptLines(base).join('\n')).not.toContain('קוד-אימות');
    expect(receiptLines({ ...base, verify: true }).join('\n')).toContain('קוד-אימות: ' + receiptVerifyCode('D-7', 180, '₪', '2026-08-05'));
    expect(receiptLines({ ...base, taxReceipt: true, verify: true }).join('\n')).toContain('קוד-אימות: ');
  });

  it('🛡 חיווט: רישום-תרומה מעביר את הדגל; כלי-האימות בהגדרות מחפש D- ו-R-', () => {
    expect(donationModalSrc).toContain("verify: featureOn(cfg, 'core.receipt.verifycode')");
    expect(settingsSrc).toContain('VerifyReceiptSection');
    expect(settingsSrc).toMatch(/sp\.donations\.find[\s\S]{0,300}en\.payments\.find/);
  });
});
