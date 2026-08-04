/**
 * ratchet — INTEGRATIONS גל ג׳ "עד-המפתח": ארבע הרחבות עלו ל-live (payments/
 * ai/esign/campaign) — עובדות ברגע שהבעלים מזין מפתח/URL, דורמנטיות עד אז.
 * כאן: המנועים הטהורים + חיטויי-הביטחון + הגנות-מקור לגידור.
 */
import { describe, expect, it } from 'vitest';
import { payLink } from '../../lib/payLink';
import { thanksPrompt, askClaude } from '../../lib/ai';
import { integrationSetting, normalizeConfig, safeHttpsUrl } from '../../lib/config';
import manageSrc from '../courses/ManageModal.tsx?raw';
import supDetailSrc from '../supporters/SupporterDetail.tsx?raw';
import supViewSrc from '../supporters/SupportersView.tsx?raw';
import shop7Src from '../shop7/Shop7View.tsx?raw';
import settingsSrc from '../settings/SettingsView.tsx?raw';
import aiSrc from '../../lib/ai.ts?raw';

describe('💳 ratchet — payLink (קישורי-תשלום, עד-המפתח)', () => {
  it('https בלבד — javascript:/http/ריק ⇒ null (הקונפיג מגיע מהענן!)', () => {
    expect(payLink('javascript:alert(1)', 100)).toBeNull();
    expect(payLink('http://pay.example', 100)).toBeNull();
    expect(payLink('', 100)).toBeNull();
    expect(payLink('לא כתובת', 100)).toBeNull();
  });

  it('URL רגיל: amount+name מתווספים כפרמטרים מקודדים', () => {
    const u = payLink('https://pay.example/page?mosad=7', 250.5, 'משה כהן')!;
    expect(u).toContain('mosad=7');
    expect(u).toContain('amount=250.5');
    expect(u).toContain('name=' + encodeURIComponent('משה כהן').replace(/%20/g, '+') /* URLSearchParams */);
  });

  it('תבנית-מותאמת: {amount}/{name} מוחלפים בתוך ה-URL', () => {
    const u = payLink('https://pay.example/{amount}?client={name}', 100, 'לוי')!;
    expect(u).toContain('/100?');
    expect(u).toContain('client=' + encodeURIComponent('לוי'));
    expect(u).not.toContain('{amount}');
  });

  it('סכום 0 (בקשת-תרומה כללית) — בלי פרמטר amount', () => {
    expect(payLink('https://pay.example/', 0)!).not.toContain('amount=');
  });
});

describe('🤖 ratchet — עוזר-AI (מפתח מקומי-למכשיר)', () => {
  it('thanksPrompt: שם/סכום/ייעוד נשזרים; בלי-ארגון ⇒ "הארגון"', () => {
    const p = thanksPrompt({ orgName: 'מאור', supporterName: 'ר׳ כהן', lastAmount: '₪500', designation: 'אמץ חתן' });
    expect(p).toContain('ר׳ כהן');
    expect(p).toContain('₪500');
    expect(p).toContain('אמץ חתן');
    expect(thanksPrompt({ orgName: '', supporterName: 'א', lastAmount: '₪1' })).toContain('"הארגון"');
  });

  it('askClaude: fetch מוזרק — מסלול-הצלחה מפרסר טקסט; 401 ⇒ שגיאה עברית', async () => {
    const okFetch = async () =>
      new Response(JSON.stringify({ content: [{ type: 'text', text: 'תודה רבה!' }] }), { status: 200 });
    expect(await askClaude('sk-test', 'פרומפט', okFetch)).toBe('תודה רבה!');
    const badFetch = async () => new Response('{}', { status: 401 });
    await expect(askClaude('sk-bad', 'פרומפט', badFetch)).rejects.toThrow('מפתח');
  });

  it('🛡 המפתח לעולם לא בקונפיג: ai.ts שומר דרך nsLsKey בלבד (לא בענן/גיבוי)', () => {
    expect(aiSrc).toContain('nsLsKey');
    expect(aiSrc).not.toContain('setConfig');
    expect(aiSrc).not.toContain('integrations');
  });
});

describe('🔒 ratchet — חיטויי-קונפיג (גל ג׳)', () => {
  it('safeHttpsUrl: https עובר; http/javascript/data/זבל ⇒ null', () => {
    expect(safeHttpsUrl('https://ok.example/x')).toBe('https://ok.example/x');
    expect(safeHttpsUrl('http://no.example')).toBeNull();
    expect(safeHttpsUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpsUrl('data:text/html,x')).toBeNull();
    expect(safeHttpsUrl('  ')).toBeNull();
  });

  it('normalizeConfig: הגדרות-הרחבה מה-allowlist בלבד (payUrl נשמר, שדה-זר נזרק)', () => {
    const cfg = normalizeConfig({
      slug: 't', orgName: 'א', theme: 'tsohar',
      integrations: { payments: { enabled: true, payUrl: 'https://p.example', evil: 'x' }, campaign: { enabled: true, url: 'https://c.example' } },
    })!;
    expect(cfg.integrations?.payments).toEqual({ enabled: true, payUrl: 'https://p.example' });
    expect(cfg.integrations?.campaign).toEqual({ enabled: true, url: 'https://c.example' });
    expect(integrationSetting(cfg, 'payments', 'payUrl')).toBe('https://p.example');
    expect(integrationSetting(cfg, 'payments', 'evil')).toBe('');
  });
});

describe('🛡 ratchet — הגנות-מקור גל ג׳: הכול מגודר, דורמנטי עד-המפתח', () => {
  it('💳 ManageModal/SupporterDetail — payLink רק כשההרחבה דלוקה', () => {
    expect(manageSrc).toContain("integrationOn(cfg, 'payments')");
    expect(manageSrc).toContain('payLink(');
    expect(supDetailSrc).toContain("integrationOn(config, 'payments')");
  });

  it('🤖 SupporterDetail — הכפתור רק עם הרחבה+מפתח; ההגדרה מגודרת-מנהל', () => {
    expect(supDetailSrc).toContain("integrationOn(config, 'ai') && !!readAiKey()");
    expect(settingsSrc).toContain("integrationOn(config, 'ai')");
    expect(settingsSrc).toContain('isAdminUser(config, cloudUser?.email)');
  });

  it('✍️ Shop7 — לוח-חתימה רק עם esign; חתימה נשמרת על המסירה', () => {
    expect(shop7Src).toContain("integrationOn(config, 'esign')");
    expect(shop7Src).toContain('setDeliverySignature');
    expect(shop7Src).toContain('SignaturePad');
  });

  it('📣 SupportersView — קישור-קמפיין רק דרך safeHttpsUrl (חיטוי-ענן)', () => {
    expect(supViewSrc).toContain("integrationOn(config, 'campaign')");
    expect(supViewSrc).toContain('safeHttpsUrl(');
  });
});
