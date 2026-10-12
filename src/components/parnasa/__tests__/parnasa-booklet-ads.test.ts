/**
 * ratchet — 📒 פרנסה׳לע 8: חוברת ופרסומות (BUILD-ORDER-PARNASA-2026-10-12, אשכול 8).
 *  (א) סבב-המשבצת (adRotation — המקור §4.5: offset = floor(day) % n): דטרמיניסטי, כל משלם מקבל תור,
 *      מושהות/פגות/עתידיות בחוץ, יעד-שער מסנן. פנקס-הפרסום (adsLedger): נגבה / ממתין / עתידי.
 *  (ב) החוברת: טווחי-שעות בבידוד-LTR (באג-תצוגה: בפסקה RTL "08:00–19:00" הודפס "19:00–08:00"),
 *      escaping נשמר; קוד-החיוג מודפס.
 *  (ג) 🔐 יציאת-המסמך עוברת את שער יציאת-המידע לפני כל נגיעה ב-DOM (core.export כבוי ⇒ אין הדפסה/הורדה);
 *      היומן נרשם רק כשהמסמך יצא; ההפקה מגודרת parnasa.export.
 *  (ד) 💳 כסף = payLink בלבד (מגודר-הרחבה, לא לפרסומת ששולמה); אפס קבלות (סריקת-הבידוד — אשכול 4).
 *  (ה) התצוגה (רינדור-שרת): פנקס + תורנות-היום בלשונית, שורת-החסות בלוח, תיבת-החסות בראש השער.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useApp } from '../../../store/useApp';
import { setExportBlocked } from '../../../lib/exportGate';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import { emptyDb, type Db, type PrAd, type PrListing } from '../../../types/domain';
import { adRotation, adsLedger } from '../lib';
import { bookletHtml, hoursHtml } from '../booklet';
import { downloadHtmlDoc, printHtmlDoc } from '../exportDoc';
import { AdsTab } from '../AdsTab';
import { BoardTab } from '../BoardTab';
import { BookletTab } from '../BookletTab';
import { DirectoryTab } from '../DirectoryTab';
import { clockAt, makeClosureFn, resolveZmanimLoc } from '../zmanimBoard';
import type { PrNow } from '../hooks';
import bookletTabSrc from '../BookletTab.tsx?raw';
import adsTabSrc from '../AdsTab.tsx?raw';
import exportDocSrc from '../exportDoc.ts?raw';

const TODAY = '2026-10-14';

function A(over: Partial<PrAd>): PrAd {
  return {
    id: 'a', slot: 'board', kind: 'line', target: '', advertiser: 'א', headline: '', body: '', phone: '', from: '', to: '',
    price: 300, paid: false, paidAt: '', active: true, createdAt: '', updatedAt: '', ...over,
  };
}
function L(over: Partial<PrListing>): PrListing {
  return {
    id: 'prl1', source: 'owner', name: 'אינסטלציה זילברמן', title: 'נזילות', category: 'elec', area: '', city: 'בני ברק', phone: '050-0000101',
    phone2: '', whatsapp: '', hours: [{ dow: 0, from: '08:00', to: '19:00' }], always: false, hoursNote: '', services: [], languages: ['he'], kashrut: '',
    emergency: false, desc: '', notes: '', status: 'approved', dialCode: '101', featuredUntil: '', recs: [], createdAt: '', updatedAt: '', ...over,
  };
}

/* ═══════════════ (א) סבב + פנקס ═══════════════ */

describe('📣 (א) סבב-המשבצת ופנקס-הפרסום', () => {
  const three = [A({ id: 'c', advertiser: 'גימל' }), A({ id: 'a', advertiser: 'אלף' }), A({ id: 'b', advertiser: 'בית' })];

  it('סבב-יומי: כל אחת מקבלת תור ב-3 ימים רצופים; אותו יום ⇒ אותה תורנית', () => {
    const days = ['2026-10-14', '2026-10-15', '2026-10-16'].map((d) => adRotation(three, 'board', d).today?.advertiser);
    expect(new Set(days).size).toBe(3);
    expect(adRotation(three, 'board', '2026-10-14').today?.id).toBe(adRotation(three, 'board', '2026-10-14').today?.id);
    expect(adRotation(three, 'board', '2026-10-17').today?.id).toBe(adRotation(three, 'board', '2026-10-14').today?.id); // מחזור של 3
    expect(adRotation(three, 'board', TODAY).active.map((a) => a.advertiser)).toEqual(['אלף', 'בית', 'גימל']);
  });

  it('מושהית / פגה / עתידית — לא בסבב; יעד-שער מסנן; אין ⇒ null', () => {
    const ads = [
      A({ id: 'on', advertiser: 'פעילה' }),
      A({ id: 'off', advertiser: 'מושהית', active: false }),
      A({ id: 'old', advertiser: 'פגה', to: '2026-10-13' }),
      A({ id: 'fut', advertiser: 'עתידית', from: '2026-10-15' }),
      A({ id: 'cat', slot: 'category', target: 'elec', advertiser: 'חסות-חשמל' }),
    ];
    expect(adRotation(ads, 'board', TODAY).active.map((a) => a.id)).toEqual(['on']);
    expect(adRotation(ads, 'category', TODAY, 'elec').today?.id).toBe('cat');
    const none = adRotation(ads, 'category', TODAY, 'food');
    expect(none.today).toBeNull();
    expect(none.index).toBe(-1);
  });

  it('פנקס: נגבה / ממתין לגבייה (התחילו) / עתידי; מושהות ופגות לא נספרות; מחיר פגום = 0', () => {
    const l = adsLedger(
      [
        A({ id: '1', price: 1200, paid: true }),
        A({ id: '2', price: 550 }),
        A({ id: '3', price: 200, from: '2026-11-01' }),
        A({ id: '4', price: 999, to: '2026-01-01' }),
        A({ id: '5', price: 999, active: false }),
        A({ id: '6', price: Number.NaN }),
      ],
      TODAY,
    );
    expect(l).toEqual({ count: 4, paidCount: 1, total: 1950, paid: 1200, due: 550, upcoming: 200 });
  });
});

/* ═══════════════ (ב) החוברת ═══════════════ */

describe('📖 (ב) החוברת — טווחי-שעות בבידוד-LTR, escaping, קוד-חיוג', () => {
  it('hoursHtml: כל טווח עטוף ב-dir="ltr"; שאר הטקסט מקודד', () => {
    const h = hoursHtml('א׳–ה׳ 08:00–19:00 · ו׳ 08:00–12:00 <b>');
    expect(h).toContain('<span dir="ltr">08:00–19:00</span>');
    expect(h).toContain('<span dir="ltr">08:00–12:00</span>');
    expect(h).toContain('&lt;b&gt;');
    expect(h).not.toContain('<b>');
    expect(hoursHtml('22:00–חצות')).toBe('<span dir="ltr">22:00–חצות</span>');
  });

  it('בחוברת: שעות-העסק בבידוד-LTR לצד קוד-החיוג', () => {
    const html = bookletHtml({ listings: [L({})], ads: [], posts: [] }, { todayIso: TODAY });
    expect(html).toContain('<span dir="ltr">08:00–19:00</span>');
    expect(html).toContain('☎ קוד 101');
  });
});

/* ═══════════════ (ג) שער יציאת-המידע ═══════════════ */

describe('🔐 (ג) יציאת-המסמך — שער לפני DOM', () => {
  afterEach(() => {
    setExportBlocked(false);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function fakeDom(): string[] {
    const created: string[] = [];
    const el = { style: {}, setAttribute() {}, click() {}, remove() {}, href: '', download: '', srcdoc: '', onload: null as unknown };
    vi.stubGlobal('document', { createElement: (t: string) => (created.push(t), el), body: { appendChild() {} } });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    return created;
  }

  it('core.export חסום ⇒ אין iframe/קישור, מחזיר false, ההתרעה רצה', () => {
    const created = fakeDom();
    let warned = 0;
    setExportBlocked(true, () => warned++);
    expect(printHtmlDoc('<p>x</p>')).toBe(false);
    expect(downloadHtmlDoc('b.html', '<p>x</p>')).toBe(false);
    expect(created).toEqual([]);
    expect(warned).toBe(2);
  });

  it('מותר ⇒ הדפסה דרך iframe והורדה דרך קישור, מחזיר true', () => {
    const created = fakeDom();
    expect(printHtmlDoc('<p>x</p>')).toBe(true);
    expect(downloadHtmlDoc('b.html', '<p>x</p>')).toBe(true);
    expect(created).toEqual(['iframe', 'a']);
  });

  it('הגנת-מקור: השער ראשון בכל פונקציה; הטאב רושם ליומן רק אחרי הצלחה ומגודר parnasa.export', () => {
    for (const fn of ['printHtmlDoc', 'downloadHtmlDoc', 'downloadTextDoc' /* 6ב — תסריט-הקו */]) {
      const body = exportDocSrc.slice(exportDocSrc.indexOf('export function ' + fn));
      expect(body.indexOf('if (!guardExport()) return false;'), fn).toBeGreaterThan(0);
      expect(body.indexOf('if (!guardExport()) return false;'), fn + ' — שער לפני document').toBeLessThan(body.indexOf('document.'));
    }
    expect(bookletTabSrc).toMatch(/if \(!ok\) return;[\s\S]{0,120}logAccess\(/);
    expect(bookletTabSrc).toContain("const exportOn = featureOn(config, 'parnasa.export');");
    expect(bookletTabSrc).toMatch(/\{exportOn \? \(/);
  });
});

/* ═══════════════ (ד) כסף = payLink בלבד ═══════════════ */

describe('💳 (ד) תשלום = קישור-סליקה בלבד', () => {
  it('הגנת-מקור: adPayLink רק מתוך payUrl מגודר-הרחבה, ולא לפרסומת ששולמה; סבב+פנקס מהמנוע', () => {
    expect(adsTabSrc).toContain("const payUrl = integrationOn(config, 'payments') ? integrationSetting(config, 'payments', 'payUrl') : '';");
    expect(adsTabSrc).toContain('const href = payUrl && !a.paid && a.price > 0 ? adPayLink(a, payUrl) : null;');
    expect(adsTabSrc).toContain('adRotation(');
    expect(adsTabSrc).toContain('adsLedger(');
    expect(adsTabSrc).toContain('אינו מנפיק קבלה');
  });
});

/* ═══════════════ (ה) תצוגה — רינדור-שרת ═══════════════ */

/** רינדור-שרת קורא את getInitialState של zustand (getServerSnapshot) — מיישרים אותו ומשחזרים. */
const INIT = useApp.getInitialState() as unknown as Record<string, unknown>;
const ORIG = { config: INIT.config, db: INIT.db, cloud: INIT.cloud };
function setup(cfg: OrgConfig, db: Partial<Db>): void {
  const st = useApp.getState();
  const patch = { config: cfg, db: { ...emptyDb(), ...db }, cloud: { ...st.cloud, user: null, isManager: false } };
  useApp.setState(patch as never);
  Object.assign(INIT, patch);
}
const ON = (features: Record<string, boolean> = {}, extra: Partial<OrgConfig> = {}): OrgConfig => ({ ...DEFAULT_CONFIG, modules: { parnasa: true }, features, ...extra });
const NOW_MS = Date.UTC(2026, 9, 14, 9, 0);
function nowOf(): PrNow {
  const loc = resolveZmanimLoc();
  const clock = clockAt(NOW_MS, loc.tz);
  return { nowMs: NOW_MS, loc, clock, todayIso: clock.iso, closureAt: makeClosureFn(loc) };
}
const ADS: PrAd[] = [
  A({ id: 'bd', slot: 'board', advertiser: 'מאפיית השכונה', headline: 'חלות לשבת', price: 300 }),
  A({ id: 'sp', slot: 'category', target: 'elec', advertiser: 'חשמל אור הגנוז', price: 300, paid: true, paidAt: '2026-10-01T10:00:00.000Z' }),
  A({ id: 'bk', slot: 'booklet', kind: 'full', advertiser: 'ספרי קודש', price: 1200 }),
];

describe('📣 (ה) התצוגה', () => {
  const now = nowOf();
  afterEach(() => {
    Object.assign(INIT, ORIG);
    useApp.setState({ config: DEFAULT_CONFIG, db: emptyDb() } as never);
  });

  it('לשונית הפרסומות: פנקס, תורנות-היום, שערים פנויים/בחסות; קישור-סליקה רק בהרחבה ורק ללא-שולם', () => {
    setup(ON(), { prAds: ADS, prListings: [L({})] });
    const off = renderToStaticMarkup(createElement(AdsTab, { now }));
    expect(off).toContain('ממתין לגבייה');
    expect(off).toContain('1,500 ₪'); // לוח 300 + חוברת 1200 שלא שולמו
    expect(off).toContain('מאפיית השכונה'); // התורנית בלוח
    expect(off).toContain('בחסות חשמל אור הגנוז');
    expect(off).toContain('פנוי לחסות');
    expect(off).not.toContain('💳 קישור-תשלום'); // הרחבת התשלומים כבויה
    setup(ON({}, { integrations: { payments: { enabled: true, payUrl: 'https://pay.example.org/kehila' } } } as Partial<OrgConfig>), { prAds: ADS, prListings: [L({})] });
    const on = renderToStaticMarkup(createElement(AdsTab, { now }));
    expect((on.match(/💳 קישור-תשלום/g) ?? []).length).toBe(2); // הלוח והחוברת — לא החסות ששולמה
    expect(on).toContain('https://pay.example.org/kehila?amount=1200');
  });

  it('שורת-החסות בלוח ותיבת-החסות בראש השער — רק כשמשבצות-הפרסום דלוקות', () => {
    setup(ON(), { prAds: ADS, prListings: [L({})] });
    expect(renderToStaticMarkup(createElement(BoardTab, { now, onSearch: null }))).toContain('📌 הלוח בחסות');
    const dir = renderToStaticMarkup(createElement(DirectoryTab, { now, q: '', setQ: () => {}, selId: null, setSelId: () => {}, onNewRequest: null }));
    expect(dir).toContain('👑 השער בחסות');
    setup(ON({ 'parnasa.ads': false }), { prAds: ADS, prListings: [L({})] });
    expect(renderToStaticMarkup(createElement(BoardTab, { now, onSearch: null }))).not.toContain('הלוח בחסות');
    expect(renderToStaticMarkup(createElement(DirectoryTab, { now, q: '', setQ: () => {}, selId: null, setSelId: () => {}, onNewRequest: null }))).not.toContain('השער בחסות');
  });

  it('לשונית החוברת: כפתורי-ההפקה רק ב-parnasa.export (וכשיש עסקים); כבוי ⇒ הסבר', () => {
    setup(ON(), { prAds: ADS, prListings: [L({})] });
    const html = renderToStaticMarkup(createElement(BookletTab, { now }));
    expect(html).toContain('🖨 הדפסה / שמירה כ-PDF');
    expect(html).toContain('⬇ הורדת החוברת (קובץ HTML)');
    setup(ON({ 'parnasa.export': false }), { prAds: ADS, prListings: [L({})] });
    const off = renderToStaticMarkup(createElement(BookletTab, { now }));
    expect(off).not.toContain('🖨 הדפסה');
    expect(off).toContain('הפקת החוברת כבויה');
  });
});
