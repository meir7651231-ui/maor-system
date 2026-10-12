/**
 * ratchet — חוברת A5 של פרנסה׳לע (אשכול 3, booklet.ts — טהור, מחרוזת בלבד).
 *
 * ננעל: escaping מלא (טקסט-משתמש לא יכול להזריק תגית/מאפיין — XSS בקובץ שמודפס/נשמר/נשלח) ·
 * סדר-הפרקים (כריכה · הקדשה · מפתח · מדריך · חירום · זמנים · מודעות · סוף-דבר) · רק מאושרים ·
 * הערה-פנימית לעולם לא בחוברת · קוד-חיוג ליד כל עסק (הפער שהמקור סימן) · דף מספרי-חירום ·
 * משבצות-מודעה (עמוד/חצי/קטנה + "מקום פנוי") · הערכת-עמודים (נוסחת המקור) · דטרמיניזם.
 */
import { describe, expect, it } from 'vitest';
import { bookletHtml, bookletPlan, escHtml, type PrBookletSnapshot } from '../booklet';
import type { PrAd, PrListing } from '../../../types/domain';

const TODAY = '2026-10-14';

function L(over: Partial<PrListing>): PrListing {
  return {
    id: 'x', source: 'owner', name: '', title: '', category: 'other', area: '', city: '', phone: '', phone2: '', whatsapp: '',
    hours: [], always: false, hoursNote: '', services: [], languages: ['he'], kashrut: '', emergency: false, desc: '', notes: '',
    status: 'approved', dialCode: '', featuredUntil: '', recs: [],
    createdAt: '2026-10-01T08:00:00.000Z', updatedAt: '2026-10-01T08:00:00.000Z', ...over,
  };
}
function AD(over: Partial<PrAd>): PrAd {
  return {
    id: 'ad', slot: 'booklet', kind: 'half', target: '', advertiser: 'מפרסם', headline: '', body: '', phone: '',
    from: '', to: '', price: 0, paid: true, paidAt: '', active: true,
    createdAt: '2026-10-01T08:00:00.000Z', updatedAt: '2026-10-01T08:00:00.000Z', ...over,
  };
}

const EVIL_NAME = '<script>alert(1)</script>';
const EVIL_TITLE = '"><img src=x onerror=alert(1)>';

function snap(over: Partial<PrBookletSnapshot> = {}): PrBookletSnapshot {
  return {
    listings: [
      L({ id: 'p1', name: 'אינסטלציה זילברמן', title: 'נזילות, סתימות ודודים', category: 'elec', city: 'בני ברק', phone: '050-0000101', dialCode: '101', featuredUntil: '2026-12-31', disc: true, hours: [{ dow: 0, from: '08:00', to: '19:00' }] }),
      L({ id: 'e1', name: 'חשמל אור הגנוז', title: 'חשמלאי מוסמך', category: 'elec', phone: '050-0000102', dialCode: '102', emergency: true }),
      L({ id: 'g1', name: 'גינון עדן', title: 'גינון והשקיה', category: 'home', phone: '050-0000112', dialCode: '112', notes: 'סוד פנימי של הגבאי' }),
      L({ id: 'h1', name: 'ניקיון ממתין', title: 'ניקיון', category: 'home', status: 'pending', phone: '050-0000111' }),
      L({ id: 'r1', name: 'עסק נדחה', title: 'נדחה', category: 'home', status: 'rejected' }),
      L({ id: 'z1', name: EVIL_NAME, title: EVIL_TITLE, category: 'other', phone: "050'1", kashrut: 'בד"ץ <b>' }),
    ],
    ads: [
      AD({ id: 'f1', kind: 'full', advertiser: 'מאפיית אבי', headline: 'חלות לשבת', body: 'שורה א\nשורה ב', phone: '050-0000110' }),
      AD({ id: 'h1', kind: 'half', advertiser: 'א-ספר', headline: 'ספרי קודש' }),
      AD({ id: 'h2', kind: 'half', advertiser: 'ב-צילום', headline: 'צלם', paid: false }),
      AD({ id: 'h3', kind: 'half', advertiser: 'ג-הובלות', headline: 'הובלות' }),
      AD({ id: 's1', kind: 'small', advertiser: 'קטנה', headline: 'מודעה קטנה' }),
      AD({ id: 'old', kind: 'full', advertiser: 'פג תוקף', to: '2026-01-01' }),
      AD({ id: 'off', kind: 'full', advertiser: 'כבויה', active: false }),
      AD({ id: 'sp', slot: 'category', kind: 'line', target: 'elec', advertiser: 'חשמל המרכז', headline: 'הכול לחשמל', phone: '03-1234567' }),
      AD({ id: 'bd', slot: 'board', kind: 'line', advertiser: 'שורת-לוח' }),
    ],
    posts: [],
    prefs: { communityName: 'קהילת חסידי בעלזא', contactPhone: '050-1234567', dedication: 'לעילוי נשמת ר׳ יעקב בן אברהם ז״ל' },
    ...over,
  };
}

const sections = (html: string): string[] => [...html.matchAll(/data-sec="(\w+)"/g)].map((m) => m[1]);

describe('📖 החוברת — מבנה', () => {
  const html = bookletHtml(snap(), { todayIso: TODAY });
  it('HTML עצמאי, RTL, A5, מספור-עמודים עברי, בלי סקריפט/קישור/גופן חיצוני', () => {
    expect(html.startsWith('<!doctype html><html lang="he" dir="rtl">')).toBe(true);
    expect(html).toContain('@page{size:A5');
    expect(html).toContain('counter(page,hebrew)');
    expect(html).not.toMatch(/<script|<link|<iframe|https?:\/\//i);
  });
  it('סדר-הפרקים: כריכה · הקדשה · מפתח · מדריך · חירום · זמנים · מודעות · סוף-דבר', () => {
    const order = sections(html).filter((s, i, a) => a.indexOf(s) === i);
    expect(order).toEqual(['cover', 'dedication', 'index', 'directory', 'emergency', 'zmanim', 'ads', 'end']);
  });
  it('כריכה: שם-הקהילה, הפסוק, שנה עברית; title עם המותג', () => {
    expect(html).toContain('<title>פרנסה׳לע · קהילת חסידי בעלזא תשפ״ז</title>');
    expect(html).toContain('קהילת חסידי בעלזא');
    expect(html).toContain('דברים ט״ו, י״ח');
    expect(html).toContain('שנת תשפ״ז');
  });
  it('הקדשה עם ת.נ.צ.ב.ה. (מכילה "נשמ"); בלי נוסח ⇒ אין דף-הקדשה', () => {
    expect(html).toContain('ת.נ.צ.ב.ה.');
    const noDed = bookletHtml(snap(), { todayIso: TODAY, dedication: '' });
    expect(sections(noDed)).not.toContain('dedication');
  });
  it('מפתח: שער בגימטריה + חסות; מדריך: מודגש, קוד-חיוג, הנחה, סימון-חסות לשער', () => {
    expect(html).toMatch(/<td class="n">ב׳<\/td><td>חשמל, אינסטלציה ומיזוג <span class="sp">· בחסות חשמל המרכז<\/span><\/td><td class="c">2<\/td>/);
    expect(html).toContain('השער בחסות חשמל המרכז · הכול לחשמל · 03-1234567');
    expect(html).toContain('👑 מומלץ');
    expect(html).toContain('☎ קוד 101');
    expect(html).toContain('☎ קוד 112');
    expect(html).toContain('הנחה לקהילה');
    expect(html).not.toContain('שורת-לוח'); // שורת-חסות של הלוח — לא בחוברת
  });
  it('🛡 רק מאושרים; הערה-פנימית לעולם לא נכנסת', () => {
    expect(html).not.toContain('ניקיון ממתין');
    expect(html).not.toContain('עסק נדחה');
    expect(html).not.toContain('סוד פנימי');
  });
  it('דף-חירום: ברירות-המחדל (מד״א 101 · הצלה 1221 · משטרה 100 · כיבוי 102) + בעלי-מקצוע לחירום', () => {
    const em = html.slice(html.indexOf('data-sec="emergency"'), html.indexOf('data-sec="zmanim"'));
    for (const s of ['מד״א', '101', 'איחוד הצלה', '1221', 'משטרה', '100', 'כיבוי אש', '102']) expect(em).toContain(s);
    expect(em).toContain('בעלי מקצוע לקריאות חירום');
    expect(em).toContain('חשמל אור הגנוז');
  });
  it('זמני השבוע עם הערת-אופק ואמון; zmanimDays=0 ⇒ בלי הדף', () => {
    expect(html).toContain('זמני השבוע');
    expect(html).toContain('לפי אופק בני ברק');
    expect(html).toContain('לשאלות הלכה');
    expect(sections(bookletHtml(snap(), { todayIso: TODAY, zmanimDays: 0 }))).not.toContain('zmanim');
  });
  it('סוף-דבר: טלפון-קשר, הסתייגות, תאריך עברי', () => {
    const end = html.slice(html.indexOf('data-sec="end"'));
    expect(end).toContain('050-1234567');
    expect(end).toContain('אין בהופעה בחוברת המלצה או אחריות');
    expect(end).toContain('קהילת חסידי בעלזא · ג׳ חשוון תשפ״ז'); // 14.10.2026 = ג׳ חשוון
  });
});

describe('📣 מודעות בחוברת', () => {
  it('עמוד=דף · 2 חצאים לדף · 6 קטנות לדף; משבצות-חסר = "מקום פנוי"; פגה/כבויה — לא', () => {
    const html = bookletHtml(snap(), { todayIso: TODAY });
    expect(sections(html).filter((s) => s === 'ads')).toHaveLength(1 + 2 + 1);
    expect(html.match(/מקום זה שמור לפרסום/g)).toHaveLength(1 + 5);
    expect(html).not.toContain('פג תוקף');
    expect(html).not.toContain('כבויה');
    expect(html).toContain('שורה א\nשורה ב'); // שורות נשמרות (white-space:pre-line)
  });
  it('רק-ששולמו / בלי-מודעות', () => {
    const paid = bookletHtml(snap(), { todayIso: TODAY, paidAdsOnly: true });
    expect(paid).not.toContain('ב-צילום');
    expect(paid).toContain('א-ספר');
    expect(sections(bookletHtml(snap(), { todayIso: TODAY, includeAds: false }))).not.toContain('ads');
  });
  it('הערכת-עמודים (נוסחת המקור + חירום + זמנים) והמקום הפנוי עד כפולת-4', () => {
    const plan = bookletPlan(snap(), { todayIso: TODAY });
    expect(plan.listings).toBe(4);
    expect(plan.gates.map((g) => g.key + ':' + g.count + ':' + g.sponsor)).toEqual(['elec:2:חשמל המרכז', 'home:1:', 'other:1:']);
    expect([plan.ads.full.length, plan.ads.half.length, plan.ads.small.length]).toEqual([1, 3, 1]);
    // כריכה 1 + הקדשה 1 + מפתח 1 + מדריך 1 + חירום 1 + זמנים 1 + מודעות (1+2+1) + סוף 1 = 11
    expect(plan.pages).toBe(11);
    expect(plan.spareFullPages).toBe(1);
  });
});

describe('🛡 escaping / XSS', () => {
  const html = bookletHtml(snap(), { todayIso: TODAY, communityName: 'קהילה <i>"מיוחדת"</i>' });
  it('שם/כותרת/השגחה/קהילה זדוניים ⇒ טקסט מוברח, לא תגיות ולא מאפיינים', () => {
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<i>');
    expect(html).not.toContain('<b>');
    expect(html).toContain('השגחה: בד&quot;ץ &lt;b&gt;');
    expect(html).not.toMatch(/<[^>]*\son\w+\s*=/i);
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&quot;&gt;&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('קהילה &lt;i&gt;&quot;מיוחדת&quot;&lt;/i&gt;');
    expect(html).toContain('050&#39;1');
  });
  it('escHtml מבריח & < > " \'', () => {
    expect(escHtml(`<a href="x" title='y'>&</a>`)).toBe('&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
    expect(escHtml(null)).toBe('');
  });
});

describe('⚙️ אפשרויות ודטרמיניזם', () => {
  it('אותו קלט ⇒ אותה מחרוזת; מותג מותאם; חיסכון-בדיו', () => {
    expect(bookletHtml(snap(), { todayIso: TODAY })).toBe(bookletHtml(snap(), { todayIso: TODAY }));
    const branded = bookletHtml(snap(), { todayIso: TODAY, brand: 'מדריך השכונה', ink: true });
    expect(branded).toContain('<title>מדריך השכונה ·');
    expect(branded).toContain('<body class="ink">');
  });
  it('🧯 תאריכים פגומים לא מפילים את ההפקה (zmanimFrom ריק ⇒ היום)', () => {
    expect(bookletHtml(snap(), { todayIso: TODAY, zmanimFrom: '' })).toContain('ג׳ חשוון תשפ״ז');
    expect(() => bookletHtml(snap(), { todayIso: '' })).not.toThrow();
  });
  it('מדריך ריק ⇒ "המדריך עדיין ריק." ועדיין חירום+סוף-דבר', () => {
    const html = bookletHtml({ listings: [], ads: [], posts: [] }, { todayIso: TODAY });
    expect(html).toContain('המדריך עדיין ריק.');
    expect(html).toContain('אנשי המקצוע שלנו');
    expect(sections(html)).toEqual(['cover', 'index', 'directory', 'emergency', 'zmanim', 'end']);
  });
});
