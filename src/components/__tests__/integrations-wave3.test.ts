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

  it('נדרים-פלוס (matara.pro/nedarimplus): מילוי-מראש ב-Amount/ClientName (PascalCase)', () => {
    const u = payLink('https://www.matara.pro/nedarimplus/online/?mosad=7001532', 180, 'ר׳ לוי')!;
    expect(u).toContain('mosad=7001532');
    expect(u).toContain('Amount=180');
    expect(u).toContain('ClientName=' + encodeURIComponent('ר׳ לוי').replace(/%20/g, '+'));
    // לא הצורה הכללית הקטנה (שנדרים לא קורא)
    expect(u).not.toContain('amount=180');
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
    expect(settingsSrc).toContain('isAdminAuthority(config, cloudUser?.email, isManagerAi)');
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

describe('🖥 ratchet — גל ד׳ "עד-השרת": functions מושלמות + צד-לקוח מחווט', () => {
  it('functions/index.js: 4 הפונקציות קיימות; ה-webhook לא נוגע במוני-קבלות', async () => {
    const fnSrc = (await import('../../../functions/index.js?raw')).default as string;
    for (const fn of ['paymentsWebhook', 'smsOutbox', 'yemotProxy', 'sheetsNightly']) {
      expect(fnSrc).toContain('exports.' + fn);
    }
    // האינווריאנט הרגולטורי: השרת כותב "תשלום-נכנס" לאישור — לעולם לא קבלות
    for (const kw of ['receiptSeq', 'donationSeq', 'shopReceiptSeq']) {
      expect(fnSrc).not.toContain(kw);
    }
    expect(fnSrc).toContain("status: 'pending'");
    // מתאמי-הספקים הושלמו (לא TODO ריק) + גיליון-חי עם googleapis
    expect(fnSrc).toContain('sendSmsVia');
    expect(fnSrc).toContain('uapi.inforu.co.il');
    expect(fnSrc).toContain('019sms.co.il');
    expect(fnSrc).toContain('googleapis');
    expect(fnSrc).toContain('spreadsheetId');
    // ‏org=root ⇒ אוסף-שורש (הלקוח-הקיים) — לא orgs/root (עכשיו דרך incomingCol)
    expect(fnSrc).toContain("org === 'root'");
    expect(fnSrc).toContain('incomingCol');
    // מתאם-נדרים: מיפוי סובלני של שדות ה-CallBack + שמירת המטען-הגולמי
    expect(fnSrc).toContain('mapPaymentCallback');
    expect(fnSrc).toContain('raw:');
    // כיוון-יוצא (משיכה) — מודול נפרד nedarimPull, נטען דרך re-export ב-index.
    expect(fnSrc).toContain("require('./nedarimPull')");
    const pullSrc = (await import('../../../functions/nedarimPull.js?raw')).default as string;
    const histSrc = (await import('../../../functions/nedarimHistory.js?raw')).default as string;
    // משיכת GetHistoryJson קריאה-בלבד.
    expect(pullSrc).toContain('GetHistoryJson');
    expect(pullSrc).toContain('exports.nedarimPull');
    expect(pullSrc).toContain('exports.nedarimSyncHourly');
    // גיבוי-מלא מ-2019: כתיבה **באצוות** עם doc-id דטרמיניסטי (nedarim-<tid>), בלי
    // שאילתת-reference פר-שורה (שגרמה ל-timeout על אלפי עסקאות). הדדופ מול ה-webhook
    // עבר לשלב-הסנכרון (planNedarimSync לפי txnId). timeout מוגדל למשיכה כבדה.
    expect(pullSrc).toContain('batch.set(col.doc(w.id)');
    expect(histSrc).toContain("id: 'nedarim-' + tid"); // doc-id דטרמיניסטי ⇒ אידמפוטנטי
    expect(pullSrc).toContain('timeoutSeconds: 540');
    expect(pullSrc).not.toContain("where('reference', '=='");
    // אינווריאנט רגולטורי: המשיכה כותבת status:'pending' בלבד (הלוגיקה ב-nedarimHistory)
    // ולעולם לא נוגעת במוני-הקבלות — לא ב-pull ולא במיפוי הטהור.
    expect(histSrc).toContain("status: 'pending'");
    for (const kw of ['receiptSeq', 'donationSeq', 'shopReceiptSeq']) {
      expect(pullSrc).not.toContain(kw);
      expect(histSrc).not.toContain(kw);
    }
  });

  it('🛡 צד-לקוח: תשלומים-נכנסים ו-SMS מגודרים הרחבה+ענן; ההגדרות ב-allowlist', () => {
    expect(supViewSrc).toContain('IncomingPaymentsModal');
    expect(supViewSrc).toMatch(/integrationOn\(config, 'payments'\) && cloudOn/);
    expect(supDetailSrc).toContain("integrationOn(config, 'sms') && cloudReady");
    expect(supDetailSrc).toContain('writeSmsOutbox');
    // sheets.spreadsheetId ב-allowlist — הפונקציה-הלילית קוראת מהקונפיג
    const cfg = normalizeConfig({
      slug: 't', orgName: 'א', theme: 'tsohar',
      integrations: { sheets: { enabled: true, spreadsheetId: '1AbC' } },
    })!;
    expect(cfg.integrations?.sheets).toEqual({ enabled: true, spreadsheetId: '1AbC' });
  });
});
