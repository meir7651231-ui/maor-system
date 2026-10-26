/**
 * רצ'ט — "כל כפתור מחובר לנתוני-אמת" באתר-הציבורי (26.10.2026, בדיקת-בעלים ב-meorhachessed.com).
 *
 * מה נמצא באתר החי:
 *  🔴 "נאספו ₪342,417 · מתעדכן חי" — מונה שעלה לבד כל 3 שניות (setInterval + Math.random) מול תורמים.
 *  🔴 טופס-הקשר הציג "התקבל! נחזור אליכם" כשלא היה לאן לשלוח ⇒ הפנייה אבדה. הניוזלטר — "נרשמת!" בלי לשמור.
 *  🔴 כל כפתורי-התרומה ⇒ #donate (אין קישור-תשלום).
 *  🟠 טענות קשיחות בקוד לכל ארגון: "1,204 סלים יצאו השבוע", "₪9 לארוחה / ₪90 לסל", יעד 500,000, עקומת-צמיחה.
 *  🟠 קמפיין שהסתיים הוצג "נסגר בעוד 0 ימים"; פרטי-בנק/ע.ר. לדוגמה (000 / XXX) מוצגים לציבור.
 * התיקון: כל מספר/טענה מגיע רק מ-config.site (נערך באשף); מה שלא הוזן ⇒ מוסתר, לא מומצא.
 */
import { describe, expect, it } from 'vitest';
import { normalizeConfig } from '../../../lib/config';
import { campaignProgress, donateLinkFor } from '../../../lib/publicSite';
import siteSrc from '../PublicSite.tsx?raw';
import wizardSrc from '../../builder/BuilderWizard.tsx?raw';
import maor from '../../../../public/c/maor-hachesed/config.json';
import type { OrgConfig } from '../../../types/config';

// קוד בלבד — ההערות מתעדות את הבאג במילותיו ("מתעדכן חי" וכו'), לכן מסירים אותן לפני הבדיקה
const code = siteSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const norm = (site: unknown) => (normalizeConfig({ slug: 'x', orgName: 'א', theme: 'or-rishon', site }) as OrgConfig).site;

describe('🧾 אמת באתר-הציבורי — מנוע', () => {
  it('קמפיין שתאריכו עבר ⇒ ended + לא מוצג; היום-האחרון עדיין פתוח', () => {
    const NOW = Date.parse('2026-10-26T12:00:00');
    expect(campaignProgress({ goal: 100, end: '2026-09-14' }, NOW)).toMatchObject({ ended: true, show: false, daysLeft: 0 });
    expect(campaignProgress({ goal: 100, end: '2026-10-26' }, NOW)).toMatchObject({ ended: false, show: true });
    expect(campaignProgress({ goal: 100 }, NOW)).toMatchObject({ ended: false, show: true });
    expect(campaignProgress({ title: 'x' } as never, NOW).show).toBe(false); // אין יעד ⇒ אין פס
  });

  it('שדות-האשף החדשים שורדים חיטוי; קישור-תשלום https בלבד', () => {
    const s = norm({
      heroCaption: 'מהשטח',
      amounts: [180, 500, -3, 'x', 1000],
      calc: { unitAmount: 500, unit: 'חודשי אימוץ', unit2Amount: 1000, unit2: 'חודשי החזקה' },
      paymentMethods: [
        { label: 'א', detail: 'ב', url: 'https://secure.cardknox.com/x', icon: '🌍' },
        { label: 'ג', detail: 'ד', url: 'javascript:alert(1)' },
        { label: 'ה', detail: 'ו', url: 'http://plain.example' },
      ],
    });
    expect(s?.heroCaption).toBe('מהשטח');
    expect(s?.amounts).toEqual([180, 500, 1000]);
    expect(s?.calc).toMatchObject({ unit2Amount: 1000, unit2: 'חודשי החזקה' });
    expect(s?.paymentMethods?.[0]).toMatchObject({ url: 'https://secure.cardknox.com/x', icon: '🌍' });
    expect(s?.paymentMethods?.[1].url).toBeUndefined();
    expect(s?.paymentMethods?.[2].url).toBeUndefined();
  });
});

describe('💳 הסכום עובר לנדרים-פלוס ("למה הסכום לא עובר", 26.10.2026)', () => {
  const NED = 'https://www.matara.pro/nedarimplus/online/?mosad=7001532';
  it('נדרים: Amount + הוראת-קבע/חד-פעמי, mosad נשמר', () => {
    const m = new URL(donateLinkFor(NED, 1000, true)!);
    expect(m.searchParams.get('mosad')).toBe('7001532');
    expect(m.searchParams.get('Amount')).toBe('1000');
    expect(m.searchParams.get('KevaDefault')).toBe('1');
    expect(m.searchParams.get('NormalDefault')).toBeNull();
    const o = new URL(donateLinkFor(NED + '&KevaDefault=1', 180, false)!);
    expect(o.searchParams.get('NormalDefault')).toBe('1');
    expect(o.searchParams.get('KevaDefault')).toBeNull();
  });
  it('ספק אחר ⇒ כמות-שהוא (לא ממציאים פרמטרים); לא-https/ריק ⇒ null', () => {
    expect(donateLinkFor('https://secure.cardknox.com/x', 500, true)).toBe('https://secure.cardknox.com/x');
    expect(donateLinkFor('http://www.matara.pro/nedarimplus/online/', 5, true)).toBeNull();
    expect(donateLinkFor(null, 5, true)).toBeNull();
    expect(donateLinkFor('https://evil-matara.pro.example/nedarimplus', 5, true)).toBe('https://evil-matara.pro.example/nedarimplus');
  });
  it('חיווט: כפתור-הסיום והמסלולים משתמשים בסכום שנבחר', () => {
    expect(siteSrc).toContain("donateLinkFor(donate, amt, mode === 'monthly')");
    expect(siteSrc).toMatch(/donateLinkFor\(donate, tr\.amount, /);
  });
});

describe('🧾 אמת באתר-הציבורי — הגנות-מקור', () => {
  it('אין מונה-מזויף ואין מספרים/טענות קשיחים בקוד', () => {
    expect(code).not.toMatch(/setBump|Math\.random\(\) \* 102/);
    for (const fake of ['342180', '1204', 'סלים יצאו השבוע', 'מתעדכן חי', '₪90 לסל', '|| 500000', '0.15, 0.23, 0.2']) {
      expect(code).not.toContain(fake);
    }
  });

  it('טופס-קשר וניוזלטר רק כשיש ערוץ אמיתי; ההודעה אומרת מה קרה', () => {
    expect(siteSrc).toMatch(/const formOn = site\.contactForm\?\.enabled !== false && hasChannel;/);
    expect(siteSrc).toMatch(/\{!formOn \? \(/);
    expect(siteSrc).toMatch(/ניוזלטר[^\n]*\n\s*\{hasChannel && \(/);
    expect(code).not.toContain('נרשמת! נתראה במייל');
    expect(code).not.toContain('התקבל! נחזור אליכם');
  });

  it('קמפיין/מחשבון/גרף/תווית-וידאו מוצגים רק כשהוזנו', () => {
    expect(siteSrc).toMatch(/\{camp\.show && \(/);
    expect(siteSrc).toMatch(/\{calcOn && \(\n\s*<section id="calc"/);
    expect(siteSrc).toMatch(/\{hasGrowth && \(/);
    expect(siteSrc).toMatch(/\(commercial \|\| t\(site\.heroCaption\)\)/);
  });

  it('טלפונים = קישורי-חיוג (tel:)', () => {
    expect(code).toMatch(/<DialLink href=\{telHref\(p\)!\} locked=\{dialLocked\}/);
    expect(code).toContain('const dialLocked = isDemoSession(config);');
  });

  it('האשף עורך את כל השדות החדשים', () => {
    for (const k of ['unit2Amount', 'unit2', 'heroCaption', 'amounts:', 'set({ url:', 'set({ icon:']) expect(wizardSrc).toContain(k);
  });
});

describe('🧾 מאור החסד — התוכן האמיתי (מ-fsisters.com)', () => {
  const site = (maor as { site: Record<string, unknown> }).site;
  const txt = JSON.stringify(site);

  it('כפתור-התרומה ⇒ נדרים פלוס של העמותה; חו״ל ⇒ Cardknox', () => {
    expect(site.donateUrl).toBe('https://www.matara.pro/nedarimplus/online/?mosad=7001532');
    expect(txt).toContain('https://secure.cardknox.com/meorhachessedlutzkininc');
  });

  it('יש ערוץ-קשר אמיתי (הטופס לא נבלע) + ע״ר אמיתי', () => {
    const c = site.contact as { email?: string; whatsapp?: string };
    expect(c.email).toBe('m9295631794@gmail.com');
    expect(txt).toContain('580651719');
  });

  it('אין פרטים-לדוגמה ואין תוכן מומצא', () => {
    for (const ph of ['000000', 'סניף 000', 'P.O.B 000', '580XXXXXX', 'יוחלפו בנתונים', 'מרים לוצקין', '2,800', '92%', '342']) {
      expect(txt).not.toContain(ph);
    }
    for (const k of ['testimonials', 'events', 'news', 'growth', 'ticker']) expect(site[k]).toBeUndefined();
  });
});
