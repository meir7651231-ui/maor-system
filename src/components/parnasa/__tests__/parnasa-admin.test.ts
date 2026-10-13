/**
 * ratchet — 📒 פרנסה׳לע · עיצוב 6: "ניהול" של המקור.
 *  (א) admin.ts טהור: revenue() של המקור מעל מודל-הפורט — "הכנסה חודשית קבועה" (מודגשים + חסויות + הקדשה), "חוברת"
 *      (מודעות + שולמו), "צפי לשנה" (×12 + חוברת + משרות מקודמות), "N מתוך 15 · ודף הבית · ומטבע הפלטינה"; הדגשה
 *      "עד שיבוטל" (תאריך-רחוק, isFeatured בלי שינוי); מחיר-ההדגשה מהמחירון כשלא נקבע; "ממתין לגבייה" מ-adsLedger.
 *      אומת מול צילום המקור: 1,490 ₪ לחודש · 1,950 ₪ חוברת · 19,920 ₪ לשנה.
 *  (ב) "אישורים": כרטיסי-הניהול (acard) · "דורש טיפול" · "הוספת איש מקצוע ידנית" (העורך, רק למאשר/ת) · הוזנו ידנית ·
 *      מוסתרים; בלי פרטי-פונה.
 *  (ג) "הכנסות": 4 האריחים, הפנקס, טופס-ההדגשה והרשימה. "חסויות": דף הבית · מטבע הפלטינה · 15 השערים, סבב ו"➕" רק
 *      למאשר/ת. "מודעות וחוברת": אריחי-הסיכום, המד, הטופס בדף והרשימה; "חוברת להדפסה" — כריכה-זעירה וקווי-נקודות.
 *      "הגדרות": שני הטפסים של המקור + המחירון.
 *  (ד) הגנות-מקור: רק 📞 הקו נשאר ברכיבי-אורביט; "הדגשה" מדף-העסק ⇒ טופס-ההדגשה; מטבע-הפלטינה מדף-הבית ⇒ טופס-המטבע;
 *      הסמל של הכריכה בצ'אנק עצל.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useApp } from '../../../store/useApp';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import { emptyDb, type Db, type PrAd, type PrListing, type PrRequest } from '../../../types/domain';
import { adminLists, featuredOpen, featuredPrice, nis, pl, PR_FEATURED_OPEN, revenueOf, sponsorCountText } from '../admin';
import { isFeatured, needsCare } from '../lib';
import { CareTab } from '../CareTab';
import { AdsTab } from '../AdsTab';
import { SpForm } from '../AdForm';
import { BookletTab } from '../BookletTab';
import { SettingsTab } from '../SettingsTab';
import { clockAt, makeClosureFn, resolveZmanimLoc } from '../zmanimBoard';
import type { PrNow } from '../hooks';
import adminTabSrc from '../AdminTab.tsx?raw';
import viewSrc from '../ParnasaView.tsx?raw';
import sheetSrc from '../BizSheet.tsx?raw';
import bookletTabSrc from '../BookletTab.tsx?raw';
import adFormSrc from '../AdForm.tsx?raw';
import careSrc from '../CareTab.tsx?raw';

const TODAY = '2026-10-13';
const loc = resolveZmanimLoc();
const TUE = Date.UTC(2026, 9, 13, 7, 30); // ג׳ 13.10.2026 10:30 בישראל
const now: PrNow = (() => {
  const clock = clockAt(TUE, loc.tz);
  return { nowMs: TUE, loc, clock, todayIso: clock.iso, closureAt: makeClosureFn(loc) };
})();
const AT = '2026-10-01T08:00:00.000Z';

function L(over: Partial<PrListing>): PrListing {
  return {
    id: 'x', source: 'owner', name: '', title: '', category: 'other', area: '', city: '', phone: '050-0000000', phone2: '', whatsapp: '',
    hours: [], always: false, hoursNote: '', services: [], languages: ['he'], kashrut: '', emergency: false, desc: '', notes: '',
    status: 'approved', dialCode: '', featuredUntil: '', recs: [], createdAt: AT, updatedAt: AT, ...over,
  };
}
function A(over: Partial<PrAd>): PrAd {
  return {
    id: 'a', slot: 'booklet', kind: 'half', target: '', advertiser: 'מפרסם', headline: '', body: '', phone: '', from: '', to: '',
    price: 0, paid: false, paidAt: '', active: true, createdAt: AT, updatedAt: AT, ...over,
  };
}
function R(over: Partial<PrRequest>): PrRequest {
  return {
    id: 'r', text: 'דרוש/ה עובד/ת', category: 'food', area: '', urgent: false, quiet: false, job: true, requester: { name: 'יעקב', phone: '052-1112233' },
    status: 'open', responses: [], createdAt: AT, updatedAt: AT, ...over,
  };
}

/** הנתונים של צילום המקור (seed): שני מודגשים @45 (אחד "עד שיבוטל"), שלוש חסויות @300, הקדשה (500), 3 מודעות, משרה מקודמת. */
const LISTINGS: PrListing[] = [
  L({ id: 'st', name: 'אינסטלציה שטרן', title: 'נזילות, סתימות ודודים', category: 'elec', dialCode: '101', featuredUntil: '2026-11-13', promoPrice: 45, promoLine: 'עשרים שנות ניסיון', promoNote: 'שולם עד כסלו' }),
  L({ id: 'og', name: 'חשמל אור הגנוז', title: 'חשמלאי מוסמך', category: 'elec', dialCode: '102', source: 'gabbai', featuredUntil: PR_FEATURED_OPEN, promoPrice: 45 }),
  L({ id: 'old', name: 'הדגשה שפגה', category: 'home', featuredUntil: '2026-09-01', promoPrice: 45 }),
  L({ id: 'pd', name: 'גינון עדן', category: 'home', status: 'pending' }),
  L({ id: 'hd', name: 'עסק מוסתר', category: 'home', status: 'rejected' }),
];
const ADS: PrAd[] = [
  A({ id: 'sp-elec', slot: 'category', kind: 'line', target: 'elec', advertiser: 'חומרי חשמל אור', price: 300 }),
  A({ id: 'sp-home', slot: 'board', kind: 'line', advertiser: 'משפחת גולדברג', price: 300 }),
  A({ id: 'sp-coin', slot: 'category', kind: 'line', target: 'elec', coin: true, mono: 'א״ש', advertiser: 'אינסטלציה שטרן', price: 300 }),
  A({ id: 'bk-full', kind: 'full', advertiser: 'ספרי קודש אורייתא', price: 1200, paid: true }),
  A({ id: 'bk-half', kind: 'half', advertiser: 'מעדניית הכרם', price: 550 }),
  A({ id: 'bk-small', kind: 'small', advertiser: 'הסעות ברכה', price: 200, paid: true }),
];
const REQS: PrRequest[] = [R({ id: 'job', promoAt: AT, promoPrice: 90 })];
const PREFS = { dedication: 'האלפון החודש מוקדש לעילוי נשמת ר׳ אברהם בן יצחק ז״ל' };

const INIT = useApp.getInitialState() as unknown as Record<string, unknown>;
const ORIG = { config: INIT.config, db: INIT.db, cloud: INIT.cloud };
const ON = (extra: Partial<OrgConfig> = {}): OrgConfig => ({ ...DEFAULT_CONFIG, modules: { parnasa: true }, features: {}, ...extra });
function setup(cfg: OrgConfig, db: Partial<Db> = {}, email: string | null = null): void {
  const st = useApp.getState();
  const patch = { config: cfg, db: { ...emptyDb(), ...db }, cloud: { ...st.cloud, user: email ? { uid: 'u', email } : null, isManager: false } };
  useApp.setState(patch as never);
  Object.assign(INIT, patch);
}
afterEach(() => {
  Object.assign(INIT, ORIG);
  useApp.setState({ config: DEFAULT_CONFIG, db: emptyDb() } as never);
});
const DATA = (): Partial<Db> => ({ prListings: LISTINGS, prAds: ADS, prRequests: REQS, ui: { ...emptyDb().ui, parnasa: PREFS } });
const STAFF = (): void => setup(ON({ adminEmails: ['gabbai@x.org'] } as Partial<OrgConfig>), DATA(), 'staff@x.org');
const noop = (): void => {};
const html = (el: ReturnType<typeof createElement>): string => renderToStaticMarkup(el);

/* ═══════════════ (א) admin.ts ═══════════════ */

describe('📒 (א) ההכנסות — revenue() של המקור', () => {
  it('הנתונים של צילום המקור ⇒ 1,490 ₪ לחודש · 1,950 ₪ חוברת · 19,920 ₪ לשנה', () => {
    const r = revenueOf({ listings: LISTINGS, ads: ADS, requests: REQS, prefs: PREFS }, TODAY);
    expect([r.featAct.length, r.featSum]).toEqual([2, 90]);
    expect([r.spons.length, r.spSum, r.gatesOn, r.homeOn, r.coinOn]).toEqual([3, 900, 1, true, true]);
    expect([r.ded, r.dedSum]).toEqual([true, 500]);
    expect(r.monthly).toBe(1490);
    expect([r.adSum, r.adPaid, r.adDue]).toEqual([1950, 1400, 550]);
    expect([r.jobs.length, r.jobSum]).toEqual([1, 90]);
    expect(r.year).toBe(1490 * 12 + 1950 + 90); // 19,920 — כמו המקור
    // הפורט עוקב גם אחרי תשלום-החסויות: 550 מודעה + 900 חסויות שלא סומנו "שולם"
    expect(r.due).toBe(1450);
    expect(sponsorCountText(r)).toBe('1 מתוך 15 · ודף הבית · ומטבע הפלטינה');
  });

  it('🛡 תיקון מול המקור: חסות "דף הבית" לא נספרת כשער "בית, ניקיון וגינון" (במקור sponsors/home התנגש במפתח-השער home)', () => {
    const r = revenueOf({ listings: [], ads: ADS, requests: [], prefs: {} }, TODAY);
    expect(r.gatesOn).toBe(1); // elec בלבד; המטבע ודף הבית — לא שערים
  });

  it('הדגשה: "עד שיבוטל" = תאריך-רחוק (isFeatured בלי שינוי); פגה ⇒ ברשימה, לא בסכום; מחיר חסר ⇒ מהמחירון', () => {
    const r = revenueOf({ listings: LISTINGS, ads: [], requests: [], prefs: {} }, TODAY);
    expect(r.feats.map((l) => l.id)).toEqual(['st', 'og', 'old']); // פעילים ראשונים
    expect(featuredOpen(LISTINGS[1])).toBe(true);
    expect(isFeatured(LISTINGS[1], '2099-01-01')).toBe(true);
    expect(featuredPrice(L({ featuredUntil: TODAY }), { prices: { featured: 60 } })).toBe(60);
    expect(featuredPrice(L({ featuredUntil: TODAY }), null)).toBe(45);
    expect(featuredPrice(L({ featuredUntil: TODAY, promoPrice: 0 }), null)).toBe(0); // חינם — נשמר
    // "הדגשה שמסתיימת" לא קופצת על "עד שיבוטל"
    expect(needsCare({ prListings: [LISTINGS[1]], prRequests: [], prAds: [] }, TODAY, TUE, ON()).some((c) => c.kind === 'featuredEnding')).toBe(false);
  });

  it('pl / nis / רשימות-הניהול', () => {
    expect([pl(1, 'מודעה אחת', 'מודעות'), pl(3, 'מודעה אחת', 'מודעות')]).toEqual(['מודעה אחת', '3 מודעות']);
    expect(nis(19920)).toBe('19,920 ₪');
    const { pend, man, hid } = adminLists(LISTINGS);
    expect([pend.map((l) => l.id), man.map((l) => l.id), hid.map((l) => l.id)]).toEqual([['pd'], ['og'], ['hd']]);
  });
});

/* ═══════════════ (ב) אישורים ═══════════════ */

describe('📒 (ב) "אישורים" בעיצוב המקור', () => {
  it('ממתינים · דורש טיפול · הוספה ידנית (העורך) · הוזנו ידנית · מוסתרים — בכרטיסי-הניהול', () => {
    setup(ON(), DATA());
    const h = html(createElement(CareTab, { now, onJump: noop, canJump: () => true, onOpen: noop, onPreview: noop }));
    const groups = [...h.matchAll(/<div class="pn-agrp[^"]*"><h2>([^<]+)/g)].map((m) => m[1].trim());
    expect(groups).toEqual(['ממתינים לאישור', 'דורש טיפול', 'הוספת איש מקצוע ידנית', 'כרטיסים שהוזנו ידנית', 'כרטיסים מוסתרים']);
    expect(h).toContain('למי שאין לו אינטרנט או שיש לו טלפון כשר. רק אחרי שקיבלתם את הסכמתו.');
    expect(h).toContain('<form class="pn-f pn-ed'); // אותו עורך-דף בן 8 החלקים
    expect(h).toContain('הוספה לאלפון');
    // כרטיס-ניהול: מדליון, שם, מקצוע · שער, תגים
    expect(h).toMatch(/<article class="pn-acard"><div class="pn-row1"><span class="pn-med/);
    expect(h).toContain('<span class="pn-badge pn-warn">ממתין לאישור</span>');
    expect(h).toContain('<span class="pn-badge pn-danger">מוסתר</span>');
    expect(h).toContain('<span class="pn-badge">הוזן ע״י הגבאי</span>');
    expect(h).toMatch(/<span class="pn-seal"><svg[\s\S]*?<\/svg>מודגש<\/span>/);
    // פעולות: ידני ⇒ עריכה; ממתין ⇒ אישור · הסתרה; תמיד לדף · מחיקה
    expect(h).toContain('>עריכה</button>');
    expect(h).toContain('>הסתרה</button>');
    expect(h).toContain('>מחיקה</button>');
    expect(h).toContain('לדף</button>');
    expect(h).not.toContain('052-1112233'); // לעולם לא טלפון של מבקש
  });

  it('לא-מאשר/ת: רואה מה ממתין, בלי אישור/הסתרה/מחיקה ובלי העורך', () => {
    STAFF();
    const h = html(createElement(CareTab, { now, onJump: noop, canJump: () => true, onOpen: noop }));
    expect(h).toContain('רק הגבאי מאשר/ת');
    expect(h).not.toContain('pn-admForm');
    expect(h).not.toContain('>הסתרה</button>');
    expect(h).not.toContain('>מחיקה</button>');
  });
});

/* ═══════════════ (ג) הכנסות · חסויות · מודעות וחוברת · הגדרות ═══════════════ */

describe('📒 (ג) אזורי-הכסף והחוברת בעיצוב המקור', () => {
  it('"הכנסות": 4 האריחים (הקטיפה ראשונה), הפנקס עם פסי-הזהב, טופס-ההדגשה והרשימה', () => {
    setup(ON(), DATA());
    const h = html(createElement(AdsTab, { now, section: 'rev' }));
    expect(h).toMatch(/<div class="pn-kpis"><div class="pn-kpi pn-lead"><span>הכנסה חודשית קבועה<\/span><b>1,490 ₪<\/b><small>מודגשים, חסויות והקדשה<\/small><\/div>/);
    expect(h).toContain('<span>חוברת תשפ״ז</span><b>1,950 ₪</b><small>2 מתוך 3 מודעות שולמו</small>');
    expect(h).toContain('<div class="pn-kpi pn-due"><span>ממתין לגבייה</span><b>1,450 ₪</b><small>מודעות וחסויות שעוד לא שולמו</small>');
    expect(h).toContain('<span>צפי לשנה</span><b>19,920 ₪</b><small>לפי המצב היום</small>');
    expect(h).toContain('<div class="pn-lg-h">הכנסה חודשית</div>');
    expect(h).toContain('<div class="pn-t">חסויות<small>1 מתוך 15 שערים · ודף הבית · ומטבע הפלטינה</small></div><div class="pn-amt">900 ₪</div><div class="pn-bar">');
    expect(h).toContain('<div class="pn-lg-row pn-sum"><div class="pn-t">סה״כ לחודש</div><div class="pn-amt">1,490 ₪</div></div>');
    expect(h).toContain('<div class="pn-t">משרות מקודמות<small>פרסום אחד</small></div><div class="pn-amt">90 ₪</div>');
    // הדגשה: הטופס (רק למאשר/ת) + הרשימה (פעיל = זהב, פג = כבוי; "עד שיבוטל", "בתוקף עד 13.11.2026")
    expect(h).toContain('<form class="pn-f pn-ftForm" noValidate="">');
    expect(h).toContain('הדגשת הכרטיס');
    expect(h).toContain('ריק = עד שיבוטל');
    expect(h).toContain('חשמל, אינסטלציה ומיזוג · עד שיבוטל');
    expect(h).toContain('חשמל, אינסטלציה ומיזוג · בתוקף עד 13.11.2026 · שולם עד כסלו');
    expect(h).toMatch(/<div class="pn-ritem pn-off"><div style="min-width:0"><h4>הדגשה שפגה<\/h4><div class="pn-meta2">בית, ניקיון וגינון · פג תוקף ב־ 1.9.2026<\/div>/);
    expect(h).toContain('>חידוש</button>');
    expect(h).toContain('>הסרת ההדגשה</button>');
  });

  it('"חסויות": דף הבית · מטבע הפלטינה · 15 השערים; פנוי/בחסות; סבב; עריכה רק למאשר/ת', () => {
    setup(ON(), { ...DATA(), prAds: [...ADS, A({ id: 'sp-elec2', slot: 'category', kind: 'line', target: 'elec', advertiser: 'אור הגנוז', price: 250 })] });
    const h = html(createElement(AdsTab, { now, section: 'spon' }));
    expect(h).toContain('<h2>חסות על שערים <span class="pn-n">1 מתוך 15 · ודף הבית · ומטבע הפלטינה</span></h2>');
    expect(h.match(/<div class="pn-sprow[^"]*" data-cat=/g)?.length).toBe(17);
    expect(h).toMatch(/<div class="pn-sprow pn-home pn-on" data-cat="home"><span class="pn-L"><svg/);
    expect(h).toContain('שורה אחת בעמוד הפתיחה, לכל מי שנכנס · בחסות <strong>משפחת גולדברג</strong>');
    expect(h).toMatch(/<div class="pn-sprow pn-coin pn-on" data-cat="coin"><span class="pn-L pn-cnw"><span><span class="pn-cn pn-plat pn-cn-m"/);
    expect(h).toContain('בחסות <strong>אינסטלציה שטרן</strong> · חשמל ואינסטלציה');
    expect(h).toMatch(/<span class="pn-L">ב<\/span>/); // אות-השער בלי גרש (gemBare)
    expect(h).toContain(' · 2 בסבב'); // שני נותני-חסות לשער — מתחלפים כל יום
    expect(h).toContain('אין עדיין אנשי מקצוע · פנוי לחסות');
    expect(h).toContain('>הגדרה</button>');
    expect(h).not.toContain('➕ נותן-חסות נוסף לסבב'); // השורה כמו המקור — הוספה-לסבב מתוך הטופס
    expect(h).toContain('<h2>רשימת החסויות <span class="pn-n">4</span></h2>');
    STAFF();
    const s = html(createElement(AdsTab, { now, section: 'spon' }));
    expect(s).not.toContain('>הגדרה</button>');
    expect(s).not.toContain('>עריכה</button>');
  });

  it('טופס-החסות (מתחת לשורה): שדות המקור; במטבע — התחום והמונוגרמה; "➕ נותן-חסות נוסף לסבב" רק בעריכה; הסרה רק בהרשאה', () => {
    setup(ON(), DATA());
    const coin = html(createElement(SpForm, { place: 'coin', ad: ADS[2], onClose: noop, onQueue: noop }));
    for (const l of ['שם נותן החסות', 'מחיר לחודש (₪)', 'שורה קצרה', 'טלפון', 'אתר', 'התחום שהמטבע פותח', 'מונוגרמה']) expect(coin, l).toContain(l);
    expect(coin).toContain('<option value="elec" selected="">חשמל ואינסטלציה</option>');
    expect(coin).toContain('value="א״ש"');
    expect(coin).toContain('שמירת החסות');
    expect(coin).toContain('➕ נותן-חסות נוסף לסבב');
    expect(coin).toContain('>הסרת החסות</button>');
    const gate = html(createElement(SpForm, { place: 'home', ad: null, onClose: noop }));
    expect(gate).not.toContain('התחום שהמטבע פותח');
    expect(gate).not.toContain('➕ נותן-חסות נוסף לסבב');
    expect(gate).toContain('value="300"'); // מחיר מהמחירון (חסות דף הבית)
    STAFF();
    expect(html(createElement(SpForm, { place: 'coin', ad: ADS[2], onClose: noop }))).not.toContain('הסרת החסות');
  });

  it('"מודעות וחוברת": אריחי-הסיכום + המד, הטופס בדף ("➕ הוספת פרסומת"), הרשימה עם הגודל והתשלום', () => {
    setup(ON(), DATA());
    const h = html(createElement(AdsTab, { now, section: 'ads' }));
    expect(h).toContain('<h2>מודעות לחוברת השנתית <span class="pn-n">3</span></h2>');
    expect(h).toContain('<small>עמוד שלם אחד · חצי עמוד אחד · מודעה קטנה אחת</small>');
    expect(h).toContain('<small>72% מהסכום</small>');
    expect(h).toContain('<div class="pn-meter" role="img" aria-label="נגבו 72 אחוז מהסכום"><i style="width:72%"></i></div>');
    expect(h).toContain('<form class="pn-f pn-adForm" noValidate="">');
    expect(h).toContain('<option value="half" selected="">חצי עמוד · 550 ₪</option>');
    expect(h).toContain('<button class="pn-btn pn-primary" type="submit">➕ הוספת פרסומת</button>');
    expect(h).toContain('<span class="pn-badge">עמוד שלם</span><span class="pn-badge pn-ok">שולם</span>');
    expect(h).toContain('<span class="pn-badge">חצי עמוד</span><span class="pn-badge pn-warn">טרם שולם</span>');
    expect(h).toContain('>סימון כשולם</button>');
    expect(h).toContain('>ביטול סימון התשלום</button>');
    setup(ON(), {});
    expect(html(createElement(AdsTab, { now, section: 'ads' }))).toContain('<h3>עוד אין מודעות</h3>');
  });

  it('"חוברת להדפסה": כריכה-זעירה (הפושקע, סימן-המילה, הקהילה, השנה), קווי-הנקודות, "כפולה של 4", "הפקת חוברת להדפסה"', () => {
    setup(ON(), { ...DATA(), ui: { ...emptyDb().ui, parnasa: { ...PREFS, communityName: 'קהילת אור החיים' } } });
    const h = html(createElement(BookletTab, { now }));
    expect(h).toMatch(/<div class="pn-mini" aria-hidden="true"><span class="pn-pm" aria-hidden="true"><\/span><b class="pn-pwm">פרנסה<i class="pn-gm"><\/i>לע<\/b><span>קהילת אור החיים<\/span><em>שנת תשפ״ז<\/em><\/div>/);
    expect(h).toContain('<li><span>כריכה</span><span class="pn-dots"></span><b>עמוד אחד</b></li>');
    expect(h).toContain('<li><span>2 שערים · 3 אנשי מקצוע</span><span class="pn-dots"></span><b>עמוד אחד</b></li>'); // רק מאושרים
    expect(h).toContain('<li><span>מודעות: 1 שלמות · 1 חצאים · 1 קטנות</span><span class="pn-dots"></span><b>3 עמודים</b></li>');
    expect(h).toMatch(/<b>סה״כ כ־\d+ עמודי A5<\/b>/);
    expect(h).toContain('נוסח ההקדשה בחוברת');
    expect(h).toContain('> לכלול את המודעות</label>');
    expect(h).toContain('> חיסכון בדיו (כריכה לבנה)</label>');
    expect(h).toMatch(/<button class="pn-btn pn-primary" type="button"><svg[^>]*><use href="#pn-i-down"><\/use><\/svg>הפקת חוברת להדפסה<\/button>/);
  });

  it('"הגדרות": כללי (שם · אישור · טלפון) + הקדשה בראש האלפון; מחירון עם יחידות; מיקום הזמנים', () => {
    setup(ON(), DATA());
    const h = html(createElement(SettingsTab));
    expect(h).toContain('<div class="pn-sub2">כללי</div>');
    expect(h).toContain('placeholder="למשל: קהילת חסידי … בבית שמש"');
    expect(h).toContain('<div class="pn-sub2">הקדשה בראש האלפון</div>');
    expect(h).toContain('המחיר של ההקדשה נקבע במחירון למטה.');
    expect(h).toContain('שמירת הגדרות');
    expect(h).toContain('<div class="pn-sub2">מחירון</div>');
    expect(h.match(/<label class="pn-pfield">/g)?.length).toBe(8);
    expect(h).toContain('<span>הקדשה בראש האלפון</span><span class="pn-in"><input type="number" min="0" step="1" inputMode="numeric" value="500"/><i>₪ לחודש</i></span>');
    expect(h).toContain('<span>משרה מקודמת</span><span class="pn-in"><input type="number" min="0" step="1" inputMode="numeric" value="90"/><i>₪ לפרסום</i></span>');
    expect(h).toContain('שמירת המחירון');
    expect(h).toContain('מיקום הזמנים');
  });
});

/* ═══════════════ (ד) הגנות-מקור ═══════════════ */

describe('📒 (ד) הגנות-מקור', () => {
  it('רק 📞 הקו (סימולטור, תוספת-הפורט) נשאר ברכיבי-אורביט; שאר האזורים בשפת המקור', () => {
    expect(adminTabSrc.match(/pn-apanel pn-orbit/g)?.length).toBe(1);
    expect(adminTabSrc).toMatch(/<div className="pn-apanel pn-orbit" data-panel="phone">/);
  });
  it('"הדגשה" בדף-העסק ⇒ ניהול · הכנסות עם הטופס ממולא; מטבע-הפלטינה מדף-הבית ⇒ טופס-המטבע פתוח', () => {
    expect(sheetSrc).toContain('onClick={a.feature ?? a.edit}');
    expect(viewSrc).toMatch(/onFeature=\{\s*segOn\('rev'\) && canApprove/);
    expect(viewSrc).toContain('setFtReq({ key: id, n: Date.now() });');
    expect(viewSrc).toContain("if (open) setSpReq({ place: open, n: Date.now() });");
  });
  it('הטפסים בתוך הדף (לא דיאלוגים); הסרה/מחיקה בשתי לחיצות ובהרשאה; הדגשה דרך upsertPrListing (שדות-גבאי)', () => {
    expect(adFormSrc).not.toContain('<Modal');
    expect(adFormSrc).toContain('featuredUntil: f.until || PR_FEATURED_OPEN,');
    expect(adFormSrc).toContain("'ללחוץ שוב להסרה'");
    expect(careSrc).toContain("'ללחוץ שוב למחיקה'");
    expect(careSrc).toContain('seed={{ source: \'gabbai\' }}');
  });
  it('סמל-הכריכה בצ\'אנק עצל (import דינמי) — לא בצ\'אנק של המסך', () => {
    expect(bookletTabSrc).toContain("import('./bookMark')");
    expect(bookletTabSrc).not.toMatch(/^import .*bookMark/m);
  });
});
