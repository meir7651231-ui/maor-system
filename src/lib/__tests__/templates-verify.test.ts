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

describe('🔗 ratchet — מיזוג כפולי-תורמים (#13)', () => {
  const mk = (over: Partial<import('../../types/domain').Supporter>): import('../../types/domain').Supporter => ({
    id: 'x', name: 'פלוני', phone: '', email: '', idNum: '', address: '', cat: '', forWho: '',
    notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...over,
  });

  // 19.8: אחרי תיקון סדר-שם נדרים — שם-מלא זהה (חסין-סדר) **כן** מקבץ להצעת-איחוד
  // (מסך-האיחוד ידני ⇒ בטוח). זה מה שמאפשר לתפוס כפילות "בן צבי רחל"↔"רחל בן צבי".
  it('קיבוץ: טלפון / אימייל / שם-חסין-סדר; שם-בודד לא מקבץ (מיזוג-שווא)', async () => {
    const { findSupporterDupGroups } = await import('../dedup');
    const a = mk({ id: 'a', name: 'משה כהן', phone: '050-1234567' });
    const b = mk({ id: 'b', name: 'מ. כהן', phone: '+972501234567' }); // אותו טלפון מנורמל
    const c = mk({ id: 'c', name: 'כהן משה' }); // אותו שם בסדר הפוך ⇒ מצטרף (חסין-סדר)
    const d = mk({ id: 'd', name: 'רות לוי', email: 'R@x.co' });
    const e = mk({ id: 'e', name: 'רותי', email: 'r@x.co' }); // אותו אימייל lower; שם-בודד ⇒ לא-מקבץ-בשם
    const groups = findSupporterDupGroups([a, b, c, d, e]);
    // a+b (טלפון) + c (שם חסין-סדר "כהן משה"≡"משה כהן") = קבוצה אחת; d+e (אימייל)
    expect(groups.map((g) => [...g].sort())).toEqual(expect.arrayContaining([['a', 'b', 'c'], ['d', 'e']]));
  });

  it('מיזוג: כל התרומות (rid!) וה-hist עוברים, הצבירה מחושבת מחדש, ריק ⇒ מהנמחק', async () => {
    const { mergeSupporterInto } = await import('../dedup');
    const keep = mk({ id: 'k', phone: '', ils: 100, count: 1, donations: [{ rid: 'D-1', date: '2026-01-05', amount: 100, cur: '₪', cat: '' }] });
    const drop = mk({ id: 'd', phone: '050-1111111', notes: 'ותיק', hist: [{ d: '2020-01-01', a: 50 }], donations: [{ rid: 'D-2', date: '2026-03-01', amount: 200, cur: '₪', cat: '' }, { rid: 'D-3', date: '2026-04-01', amount: 30, cur: '$', cat: '' }] });
    const m = mergeSupporterInto(keep, drop);
    expect(m.id).toBe('k');
    expect(m.donations.map((x) => x.rid)).toEqual(['D-1', 'D-2', 'D-3']); // ממוין-תאריך, אף rid לא אבד
    expect([m.count, m.ils, m.usd]).toEqual([3, 300, 30]);
    expect([m.first, m.last]).toEqual(['2026-01-05', '2026-04-01']);
    expect(m.phone).toBe('050-1111111'); // ריק אצל השומר ⇒ מהנמחק
    expect(m.hist).toEqual([{ d: '2020-01-01', a: 50 }]);
    expect(m.notes).toBe('ותיק');
  });
});
