/**
 * ratchet — 📒 פרנסה׳לע · עיצוב 3: "כל האלפון" ודף-העסק של המקור.
 *  (א) biz.ts טהור: מחיר בפורמט-המקור, "עד D.M", תגי-האמון בסדר-המקור, אריחי-הפרטים (צ'יפי-תשלום), "איך פונים",
 *      הקופה של העסק (מטבע לכל תשובה/תודה, "החודש" מתחילת החודש העברי), ספי-המילוי, טבלת-השבוע (שבת קודש +
 *      חלונות-מוצ״ש של הפורט), שורת-השיתוף, משקל-התמונות.
 *  (ב) envelope.ts: השותפים/הלקוחות/העמיתים/המקומות-הפנויים מהטבלאות של המקור; רק מאושרים; עובדים-לצידו ≤6;
 *      פריסת-הכוכבים בתוך המפה.
 *  (ג) דף-העסק מתרנדר בסקין: כריכה (תמונה/קטיפה, פלטה), לוגו/מונוגרמה, מבצע, תגים, טלפון+העתקה, הדגשה (https),
 *      גלריה, שאלות, המלצות, הקופה, המעטפת (רק מאשר), חסות-השער, הסרגל (וואטסאפ מגודר-הרחבה, חיוג מגודר-
 *      טלפוניה, העתקה, ★), שבת ⇒ "וואטסאפ במוצ״ש"; בקשה שקטה בתחום — בלי זהות.
 *  (ד) "כל האלפון": 16 אריחי-שערים באותיות, כתר לשער-בחסות, המתגים, השערים כבאנרים עם קוד-החיוג, הודעות-הריק,
 *      סינון כל-המילים, "פנויים לעבודה", הייצוא מגודר.
 *  (ה) הגנות-מקור: הגיליון מתחת למודאלי-אורביט (100) והטוסט מעליהם; נעילת-השבת על המסמך (גם לגיליון).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useApp } from '../../../store/useApp';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import { emptyDb, type Db, type PrAd, type PrListing, type PrRequest } from '../../../types/domain';
import { fmtPrice, howtoOf, kupaArt, kupaOf, listingImageLen, offerUntilText, orgImageLen, shareLine, tilesOf, trustOf, weekRows } from '../biz';
import { envInvite, envLayout, envOf, nearOf } from '../envelope';
import { filterListings, matchesAll } from '../lib';
import { BizSheet, type BizCtx } from '../BizSheet';
import { DirectoryTab, type DirCtx } from '../DirectoryTab';
import { clockAt, makeClosureFn, resolveZmanimLoc } from '../zmanimBoard';
import { hebNow } from '../shell';
import type { PrNow } from '../hooks';
import viewSrc from '../ParnasaView.tsx?raw';
import sheetSrc from '../BizSheet.tsx?raw';

const loc = resolveZmanimLoc();
const nowAt = (ms: number): PrNow => {
  const clock = clockAt(ms, loc.tz);
  return { nowMs: ms, loc, clock, todayIso: clock.iso, closureAt: makeClosureFn(loc) };
};
const TUE = Date.UTC(2026, 9, 13, 7, 30); // ג׳ 13.10.2026 10:30 בישראל
const SAT = Date.UTC(2026, 9, 17, 9, 0); // שבת 17.10.2026 12:00
const IMG = 'data:image/jpeg;base64,' + 'A'.repeat(120);

function L(over: Partial<PrListing>): PrListing {
  return {
    id: 'l1', source: 'owner', name: 'אינסטלציה שטרן', title: 'אינסטלטור מוסמך: נזילות וסתימות', category: 'elec', area: 'גוש דן', city: 'בני ברק',
    phone: '050-7771234', phone2: '', whatsapp: '050-7771234', hours: [{ dow: 2, from: '08:00', to: '19:00' }], always: false, hoursNote: '', services: [], languages: ['he'],
    kashrut: '', emergency: false, desc: '', notes: '', status: 'approved', dialCode: '101', featuredUntil: '', recs: [], createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z', ...over,
  };
}
function R(over: Partial<PrRequest>): PrRequest {
  return {
    id: 'r1', text: 'נזילה בכיור', category: 'elec', area: '', urgent: false, quiet: false, job: false, requester: { name: 'שרה כהן', phone: '052-1112233' }, status: 'open', responses: [],
    createdAt: '2026-10-13T05:00:00.000Z', updatedAt: '2026-10-13T05:00:00.000Z', ...over,
  };
}
function A(over: Partial<PrAd>): PrAd {
  return {
    id: 'a1', slot: 'category', kind: 'line', target: 'elec', advertiser: 'חומרי חשמל אור', headline: 'הכול לחשמלאי', body: '', phone: '', from: '', to: '', price: 300, paid: false, paidAt: '',
    active: true, createdAt: '', updatedAt: '', ...over,
  };
}

/* ═══════════════ (א) biz.ts ═══════════════ */

describe('📒 (א) דף-העסק — הליבה הטהורה', () => {
  it('מחיר כמו במקור: אלפים עם פסיק, "מ־", טקסט חופשי כמות-שהוא; "עד D.M"', () => {
    expect(fmtPrice('1500')).toBe('1,500 ₪');
    expect(fmtPrice('250 ₪')).toBe('250 ₪');
    expect(fmtPrice('מ300')).toBe('מ־300 ₪');
    expect(fmtPrice('החל מ-1,200')).toBe('מ־1,200 ₪');
    expect(fmtPrice('לפי הצעה')).toBe('לפי הצעה');
    expect(fmtPrice('')).toBe('');
    expect(offerUntilText('2026-11-01')).toBe('עד 1.11');
    expect(offerUntilText('')).toBe('');
  });

  it('תגי-האמון בסדר של המקור: מומלץ · ותק · ממליצים · תעודה · השגחה · הנחה · גמ״ח · חירום', () => {
    const l = L({ featuredUntil: '2026-12-31', years: 18, recs: [{ by: '', text: 'מעולה', at: '' }, { by: '', text: 'אמין', at: '' }], cert: 'אינסטלטור מוסמך', kashrut: 'בד״ץ', disc: true, free: true, emergency: true });
    expect(trustOf(l, '2026-10-13', 'פרנסה׳לע').map((t) => t.t)).toEqual(['מומלץ פרנסה׳לע', 'ותק 18 שנים', '2 ממליצים', 'אינסטלטור מוסמך', 'השגחה: בד״ץ', 'הנחה לקהילה', 'גמ״ח', '24/7 חירום']);
    expect(trustOf(L({ years: 1, recs: [{ by: '', text: 'x', at: '' }] }), '2026-10-13', 'פ').map((t) => t.t)).toEqual(['ותק של שנה', 'ממליץ אחד']);
    expect(trustOf(L({}), '2026-10-13', 'פ')).toEqual([]);
  });

  it('אריחי-הפרטים: תחום · גר ב · אזור שירות · שפות · מתאים · אמצעי תשלום (צ׳יפים, רק מוכרים)', () => {
    const t = tilesOf(L({ languages: ['he', 'yi'], aud: 'women', pay: ['cash', 'bit', 'zzz'] }));
    expect(t.map((x) => x.k)).toEqual(['תחום', 'גר ב', 'אזור שירות', 'שפות', 'מתאים', 'אמצעי תשלום']);
    expect(t[3].v).toBe('עברית, אידיש');
    expect(t[4].v).toBe('לנשים');
    expect(t[5].chips).toEqual(['מזומן', 'ביט']);
    expect(tilesOf(L({ city: '', area: '', languages: [] })).map((x) => x.k)).toEqual(['תחום']);
  });

  it('"איך פונים": שלושה צעדים — וואטסאפ או מספר', () => {
    expect(howtoOf(true)[0][0]).toBe('שולחים וואטסאפ');
    expect(howtoOf(false)[0]).toEqual(['מתקשרים למספר', 'מעתיקים את המספר בלחיצה ומחייגים.']);
    expect(howtoOf(true).map((x) => x[0])).toEqual(['שולחים וואטסאפ', 'מתאמים מחיר ומועד', 'אחרי העבודה: מילה טובה']);
  });

  it('הקופה: מטבע לכל תשובה של העסק ולכל תודה; "החודש" מתחילת החודש העברי; ספי-המילוי של המקור', () => {
    const l = L({ recs: [{ by: '', text: 'תודה', at: '2026-10-12T10:00:00.000Z' }, { by: '', text: 'ישן', at: '2026-08-01T10:00:00.000Z' }] });
    const reqs = [R({ responses: [{ listingId: 'l1', text: 'זמין', at: '2026-10-13T06:00:00.000Z' }, { listingId: 'other', text: 'x', at: '2026-10-13T06:00:00.000Z' }] })];
    expect(kupaOf(l, reqs, '2026-10-12', loc.tz)).toEqual({ n: 3, ans: 1, th: 2, mo: 2, art: 'fill-02' });
    expect([0, 1, 3, 4, 7, 8, 14, 15, 27, 28, 47, 48, 200].map(kupaArt)).toEqual(['fill-00', 'fill-02', 'fill-02', 'fill-05', 'fill-05', 'fill-10', 'fill-10', 'fill-20', 'fill-20', 'fill-35', 'fill-35', 'fill-60', 'fill-60']);
  });

  it('טבלת-השבוע: היום מסומן, "סגור", "24 שעות", שבת קודש — וחלונות-מוצ״ש של הפורט', () => {
    const rows = weekRows(L({ hours: [{ dow: 2, from: '08:00', to: '19:00' }, { dow: 2, from: '20:00', to: '22:00' }, { dow: 6, from: '20:30', to: '23:00' }] }), 2);
    expect(rows[2]).toMatchObject({ v: '8:00–19:00, 20:00–22:00', today: true, label: 'יום ג׳ · היום' }); // tfmt של המקור — בלי אפס מוביל
    expect(rows[0].v).toBe('סגור');
    expect(rows[6].v).toBe('שבת קודש · מוצ״ש 20:30–23:00');
    expect(weekRows(L({ always: true, hours: [] }), 0).map((r) => r.v)).toEqual(['24 שעות', '24 שעות', '24 שעות', '24 שעות', '24 שעות', '24 שעות', 'שבת קודש']);
  });

  it('שורת-השיתוף (המקור) ומשקל-התמונות לעסק ולארגון', () => {
    expect(shareLine(L({}), 'פרנסה׳לע של אור החיים')).toBe('אינסטלציה שטרן · אינסטלטור מוסמך: נזילות וסתימות · 050-7771234 (מתוך פרנסה׳לע של אור החיים)');
    const a = L({ logo: 'x'.repeat(10), photos: ['y'.repeat(20), 'z'.repeat(5)] });
    expect(listingImageLen(a)).toBe(35);
    expect(orgImageLen([a, L({ id: 'l2', photos: ['q'.repeat(7)] })])).toBe(42);
    expect(orgImageLen([a, L({ id: 'l2', photos: ['q'.repeat(7)] })], 'l1')).toBe(7);
  });
});

/* ═══════════════ (ב) envelope.ts ═══════════════ */

describe('📒 (ב) המעטפת — טבלאות המקור', () => {
  const plumber = L({ id: 'p', category: 'elec', city: 'בני ברק' });
  const builder = L({ id: 'b', name: 'שיפוצי נאמן', title: 'שיפוצים כלליים', category: 'build', city: 'בני ברק' });
  const cleaner = L({ id: 'c', name: 'ניקיון זוהר', title: 'ניקיון אחרי שיפוץ', category: 'home', city: 'אלעד' });
  const caterer = L({ id: 'k', name: 'קייטרינג טעמים', title: 'קייטרינג לשמחות', category: 'food' });
  const peer = L({ id: 'q', name: 'חשמל אור', title: 'חשמלאי', category: 'elec' });
  const designer = L({ id: 'd', name: 'סטודיו לוגו', title: 'מעצב גרפי', category: 'tech' });
  const pending = L({ id: 'x', name: 'ממתין', title: 'שיפוצים', category: 'build', status: 'pending' });
  const all = [plumber, builder, cleaner, caterer, peer, designer, pending];

  it('שותפים טבעיים (בנייה; ניקיון — רק עם "ניקי"), לקוחות-עסקיים, עמיתים, מקצועי-שיווק; ממתין לא נספר', () => {
    const e = envOf(plumber, all);
    expect(e.g.partners.map((x) => x.e.id)).toEqual(['b', 'c']);
    expect(e.g.partners[0].why).toBe('אחרי תיקון צריך טיח, צבע וריצוף');
    expect(e.g.clients.map((x) => x.e.id)).toEqual(['k']);
    expect(e.g.clients[0].why).toBe('לקוח עסקי · קייטרינג לשמחות');
    expect(e.g.peers.map((x) => x.e.id)).toEqual(['q']);
    expect(e.g.mkt.map((x) => x.e.id)).toEqual(['d']);
    expect(e.miss.map((m) => m.l)).toEqual(['רואה חשבון', 'סוכן ביטוח', 'רב לשאלות הלכה בעסקים', 'צלם', 'דפוס', 'הובלות']);
    // 7 תפקידים (1 מולא) + 3 שערי-שותפים (2 מולאו) ⇒ 3/10
    expect(e.pct).toBe(30);
    expect(JSON.stringify(e.g)).not.toContain('"x"');
  });

  it('עובדים לצידו: שותפים + עמיתים בלי כפילות, עד 6; פריסת-הכוכבים בתוך המפה; הזמנה בלי קישור', () => {
    expect(nearOf(plumber, all).map((x) => x.e.id)).toEqual(['b', 'c', 'q']);
    const lay = envLayout(plumber, all);
    expect(lay.have).toBe(5);
    expect(lay.nodes.filter((n) => n.m).length).toBe(lay.miss > 6 ? 6 : lay.miss);
    for (const n of lay.nodes) {
      expect(n.x).toBeGreaterThan(0);
      expect(n.x).toBeLessThan(100);
      expect(n.y).toBeGreaterThan(0);
      expect(n.y).toBeLessThan(100);
    }
    expect(envInvite('צלם', 'פרנסה׳לע')).toBe('שלום! בקהילה שלנו חסר צלם באלפון פרנסה׳לע. הרבה עסקים מהקהילה צריכים בדיוק אותך. ההצטרפות בחינם.');
  });
});

/* ═══════════════ רינדור ═══════════════ */

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
function bizCtx(ms = TUE, over: Partial<BizCtx> = {}): BizCtx {
  const now = nowAt(ms);
  return { now, calm: false, reduced: true, quick: { favs: [], recents: [], toggleFav: () => false, touch: () => {} }, monthStartIso: '2026-10-12', toastAct: () => {}, ...over };
}
const sheet = (id = 'l1', ctx = bizCtx(), qtext = '') => renderToStaticMarkup(createElement(BizSheet, { id, qtext, ctx, onClose: () => {}, onOpen: () => {} }));
function dirCtx(ms = TUE): DirCtx {
  const now = nowAt(ms);
  return {
    now,
    heb: hebNow(now.clock, now.loc),
    closure: now.closureAt(now.clock.iso, now.clock.hhmm),
    reduced: true,
    focusTick: 0,
    quick: { favs: [], recents: [], toggleFav: () => false, touch: () => {} },
    toastAct: () => {},
    goReq: () => {},
    goAdmin: () => {},
    goJoin: () => {},
  };
}
const browse = () => renderToStaticMarkup(createElement(DirectoryTab, { ctx: dirCtx(), q: '', setQ: () => {}, selId: null, setSelId: () => {}, onNewRequest: () => {}, initialBrowse: true }));

const RICH = L({
  palette: 'tekhelet',
  logo: IMG,
  photos: [IMG, IMG, IMG, IMG],
  tagline: 'כל נזילה נגמרת אצלנו',
  offer: { text: '10% הנחה לקהילה', until: '2026-11-11' },
  faq: [
    { q: 'מגיעים בשבת?', a: 'לא, רק במוצ״ש' },
    { q: 'יש אחריות?', a: 'שנה על כל עבודה' },
  ],
  pay: ['cash', 'transfer'],
  years: 18,
  cert: 'אינסטלטור מוסמך',
  desc: 'עשרים שנה בשכונה.',
  services: [{ name: 'פתיחת סתימה', price: '250', note: '' }],
  featuredUntil: '2026-12-31',
  promoLine: 'מגיעים תוך שעה',
  promoUrl: 'http://stern.example.org',
  recs: [{ by: 'יוסי', text: 'הגיע בזמן', at: '2026-10-10T10:00:00.000Z' }],
});

describe('📒 (ג) דף-העסק בסקין של המקור', () => {
  it('כריכה (תמונת-המקצוע, פלטת-הדף), לוגו, שם, משפט-מפתח, מבצע "עד 11.11", מקצוע · שער · אזור', () => {
    setup(ON(), { prListings: [RICH] });
    const h = sheet();
    expect(h).toContain('class="pn-sheet"');
    expect(h).toContain('data-pal="tekhelet"');
    expect(h).toContain('data-ph="plumb"');
    expect(h).toContain('./parnasa/photos/plumb.jpg');
    expect(h).toContain('alt="הלוגו של אינסטלציה שטרן"');
    expect(h).toContain('<h2 id="pn-sname">אינסטלציה שטרן</h2>');
    expect(h).toContain('כל נזילה נגמרת אצלנו');
    expect(h).toMatch(/class="pn-bpof">[\s\S]*10% הנחה לקהילה[\s\S]*עד 11\.11/);
    expect(h).toContain('חשמל, אינסטלציה ומיזוג');
  });

  it('בלי לוגו ⇒ מונוגרמת-המקצוע; בלי תמונה ⇒ קטיפת-הפלטה (pn-brand); בלי פלטה ⇒ velvet', () => {
    setup(ON(), { prListings: [L({ title: 'מלמד', category: 'edu', name: 'ר׳ משה' })] });
    const h = sheet();
    expect(h).toContain('pn-bplogo pn-mono');
    expect(h).toContain('data-pal="velvet"');
  });

  it('תגים, טלפון + "העתקה", בלוק-ההדגשה (https בלבד), סיפור, מחירון, גלריה (4), שעות, פרטים (תשלום), שאלות (הראשונה פתוחה), המלצות', () => {
    setup(ON(), { prListings: [RICH] });
    const h = sheet();
    expect(h).toContain('מומלץ פרנסה׳לע');
    expect(h).toContain('ותק 18 שנים');
    expect(h).toContain('קוד חיוג 101');
    expect(h).toMatch(/class="pn-bpcall"[\s\S]*050-7771234[\s\S]*העתקה/);
    expect(h).toContain('טלפון · וואטסאפ');
    expect(h).toContain('מגיעים תוך שעה');
    expect(h).toContain('href="https://stern.example.org/"');
    expect(h).not.toContain('http://stern');
    expect(h).toContain('עשרים שנה בשכונה.');
    expect(h).toContain('250 ₪');
    expect(h).toContain('המחירים להמחשה. סופי בתיאום');
    expect(h).toContain('pn-gal pn-n4');
    expect(h).toContain('4 תמונות');
    expect(h).toContain('שבת קודש');
    expect(h).toContain('<span>מזומן</span><span>העברה בנקאית</span>');
    expect(h).toMatch(/<details class="pn-faq" open="">[\s\S]*מגיעים בשבת\?/);
    expect(h).toContain('הגיע בזמן');
    expect(h).not.toContain('איך פונים');
  });

  it('דף ריק ⇒ "איך פונים" + "עוד אין המלצות"; "פרטי העסק"', () => {
    setup(ON(), { prListings: [L({})] });
    const h = sheet();
    expect(h).toContain('איך פונים');
    expect(h).toContain('מתקשרים למספר'); // וואטסאפ כבוי (הרחבה) ⇒ צעד-המספר
    expect(h).toContain('עוד אין המלצות');
    expect(h).toContain('פרטי העסק');
  });

  it('הסרגל: וואטסאפ רק בהרחבה ("וואטסאפ עכשיו" + ההודעה המוכנה); בלי — העתקת המספר; טלפוניה ⇒ חיוג', () => {
    setup(ON(), { prListings: [L({})] });
    const off = sheet();
    expect(off).not.toContain('wa.me');
    expect(off).toMatch(/class="pn-bpwa pn-tel"[^>]*data-act="copy"/);
    expect(off).toContain('העתקת המספר');
    setup(ON({ integrations: { whatsapp: { enabled: true } } } as Partial<OrgConfig>), { prListings: [L({})] });
    const on = sheet('l1', bizCtx(), 'נזילה בכיור');
    expect(on).toContain('וואטסאפ עכשיו');
    expect(on).toContain('ההודעה מוכנה: ״נזילה בכיור״');
    expect(on).toContain(encodeURIComponent('שלום, הגעתי אליך דרך פרנסה׳לע. צריך עזרה: נזילה בכיור'));
    expect(on).not.toContain('pn-bpib pn-call');
    setup(ON({ integrations: { whatsapp: { enabled: true } }, telephony: { enabled: true } } as unknown as Partial<OrgConfig>), { prListings: [L({})] });
    expect(sheet()).toContain('pn-bpib pn-call');
    setup(ON({ telephony: { enabled: true } } as unknown as Partial<OrgConfig>), { prListings: [L({})] });
    expect(sheet()).toMatch(/class="pn-bpwa pn-tel" href="tel:/);
  });

  it('בשבת: "וואטסאפ במוצ״ש" והמצב "חוזר במוצ״ש" בכריכה; ★ לחוץ כשהעסק בחיוג-המהיר', () => {
    setup(ON({ integrations: { whatsapp: { enabled: true } } } as Partial<OrgConfig>), { prListings: [L({})] });
    const h = sheet('l1', bizCtx(SAT, { calm: true, quick: { favs: ['l1'], recents: [], toggleFav: () => true, touch: () => {} } }));
    expect(h).toContain('וואטסאפ במוצ״ש');
    expect(h).toContain('חוזר ב');
    expect(h).toContain('aria-pressed="true" aria-label="חיוג מהיר"');
  });

  it('הקופה של העסק, עובדים לצידו, חסות-השער, הקולופון; המעטפת — רק למאשר', () => {
    const builder = L({ id: 'b', name: 'שיפוצי נאמן', title: 'שיפוצים', category: 'build' });
    const data = { prListings: [RICH, builder], prRequests: [R({ responses: [{ listingId: 'l1', text: 'זמין', at: '2026-10-13T06:00:00.000Z' }] })], prAds: [A({})] };
    setup(ON(), data);
    const h = sheet();
    expect(h).toContain('הקופה של העסק');
    expect(h).toContain('./parnasa/kupa/fill-02.webp');
    expect(h).toContain('פעמים עזר לקהילה');
    expect(h).toContain('עובדים לצידו');
    expect(h).toContain('שיפוצי נאמן');
    expect(h).toContain('שער ״חשמל, אינסטלציה ומיזוג״ בחסות <b>חומרי חשמל אור</b>');
    expect(h).toContain('חבר בפרנסה׳לע');
    expect(h).toContain('העתקת הפרטים כטקסט');
    expect(h).toContain('המעטפת של העסק'); // מקומי = מאשר
    setup(ON({ adminEmails: ['gabbai@x.org'] } as Partial<OrgConfig>), data, 'staff@x.org');
    expect(sheet()).not.toContain('המעטפת של העסק');
  });

  it('מה מבקשים בתחום: בקשה שקטה — בלי שם/טלפון ("בשקט, לא יודעים מי ביקש"), "שליחת תשובה"; רגילה — "אני זמין"; ענה — "סימנת שאתה זמין"', () => {
    setup(ON(), { prListings: [L({})], prRequests: [R({ quiet: true, category: 'elec', text: 'צריך עזרה דיסקרטית 052-9998887' })] });
    const h = sheet();
    expect(h).toContain('מה מבקשים בתחום');
    expect(h).toContain('בשקט, לא יודעים מי ביקש');
    expect(h).toContain('שליחת תשובה'); // qReplyUI של המקור
    expect(h).not.toContain('שרה כהן');
    expect(h).not.toContain('9998887');
    setup(ON(), { prListings: [L({})], prRequests: [R({ id: 'r1' }), R({ id: 'r2', text: 'קצר בלוח', responses: [{ listingId: 'l1', text: 'זמין', at: '2026-10-13T06:00:00.000Z' }] })] });
    const h2 = sheet();
    expect(h2).toContain('אני זמין');
    expect(h2).toContain('עוד 30 דקות רק אצל העסקים'); // נוצרה 2.5 שעות לפני — 3 שעות רק לעסקים
    expect(h2).toContain('סימנת שאתה זמין'); // availBtn "done" של המקור
  });

  it('הגנת-מקור: אין innerHTML ישיר בגיליון; וואטסאפ/חיוג דרך usePnContact', () => {
    expect(sheetSrc).not.toContain('dangerouslySetInnerHTML');
    expect(sheetSrc).toContain('usePnContact()');
    expect(sheetSrc).toContain('contact.wa(l.whatsapp');
    expect(sheetSrc).toContain('contact.tel(l.phone)');
  });
});

/* ═══════════════ (ד) כל האלפון ═══════════════ */

describe('📒 (ד) "כל האלפון" של המקור', () => {
  it('הכותרת, שדה-הסינון, 16 אריחי-שערים באותיות-גימטריה, כתר לשער-בחסות, המתגים', () => {
    setup(ON(), { prListings: [L({}), L({ id: 'l2', name: 'ר׳ משה', category: 'edu', dialCode: '102' })], prAds: [A({})] });
    const h = browse();
    expect(h).toContain('לשאלה');
    expect(h).toContain('2 אנשי מקצוע');
    expect(h).toContain('placeholder="סינון לפי שם, מקצוע או עיר"');
    expect(h.match(/class="pn-ix[ "]/g)?.length).toBe(16);
    expect(h).toContain('<span class="pn-ix-l">הכול</span><span class="pn-ix-t">כל השערים</span>');
    expect(h).toContain('<span class="pn-ix-l">טו</span>');
    expect(h).toContain('title="בחסות חומרי חשמל אור"');
    for (const t of ['הנחה לקהילה', 'גמ״ח', 'פנויים לעבודה', 'פנוי עכשיו', 'חירום 24/7', 'מתאים ל:', 'כולל ממתינים ומוסתרים']) expect(h).toContain(t);
  });

  it('השערים: אות ענקית + "כרטיס אחד", חסות-השער, באנרים עם קוד-החיוג; רמז-ההחלקה', () => {
    setup(ON(), { prListings: [L({}), L({ id: 'l2', name: 'ר׳ משה', category: 'edu', dialCode: '102' })], prAds: [A({})] });
    const h = browse();
    expect(h).toMatch(/class="pn-grp-h"><span class="pn-L pn-gold-t" aria-hidden="true">ב<\/span><h2>חשמל, אינסטלציה ומיזוג<\/h2><span class="pn-n">כרטיס אחד<\/span>/);
    expect(h).toContain('class="pn-spn"');
    expect(h).toContain('☎ 101');
    expect(h).toContain('class="pn-bn pn-pbn');
    expect(h).toContain('החליקו באנר ימינה לוואטסאפ · שמאלה לחיוג');
  });

  it('הודעות-הריק של המקור: אלפון ריק; גבאי עם "הוספת הכרטיס שלי"', () => {
    setup(ON(), { prListings: [] });
    const h = browse();
    expect(h).toContain('האלפון מחכה לכרטיס הראשון');
    expect(h).toContain('הוספת הכרטיס שלי');
  });

  it('סינון כל-המילים (matches במקור, + קוד-החיוג); "פנויים לעבודה" (seek)', () => {
    const a = L({ desc: 'פתיחת סתימות בלחץ' });
    expect(matchesAll(a, 'סתימות בני')).toBe(true);
    expect(matchesAll(a, 'סתימות ירושלים')).toBe(false);
    expect(matchesAll(a, '101')).toBe(true);
    expect(matchesAll(a, '')).toBe(true);
    const ls = [L({ id: 's', seek: true }), L({ id: 'n' })];
    expect(filterListings(ls, { seek: true, todayIso: '2026-10-13' }).map((l) => l.id)).toEqual(['s']);
  });

  it('הייצוא לאקסל רק בשער-הייצוא', () => {
    setup(ON(), { prListings: [L({})] });
    expect(browse()).toContain('הורדת האלפון לאקסל (CSV)');
    expect(browse()).toContain('להדפסה, לבית המדרש ולמי שיש לו טלפון כשר.');
    setup(ON({ features: { 'parnasa.export': false } }), { prListings: [L({})] });
    expect(browse()).not.toContain('הורדת האלפון לאקסל');
  });
});

/* ═══════════════ (ה) הגנות-מקור ═══════════════ */

describe('📒 (ה) שכבות ונעילת-השבת', () => {
  const css = readFileSync(fileURLToPath(new URL('../parnasa.css', import.meta.url)), 'utf8');
  const z = (sel: string): number => {
    const all = [...css.matchAll(new RegExp('\\.pn \\.' + sel + '\\{[^}]*z-index:(\\d+)', 'g'))];
    return Number(all[all.length - 1]?.[1] ?? NaN);
  };

  it('הגיליון מעל כרום אורביט (≤95) ומתחת למודאלים שלו (100); לייטבוקס/מעטפת מעל הגיליון; הטוסט מעל המודאלים', () => {
    expect(z('pn-scrim')).toBeGreaterThan(95);
    expect(z('pn-sheet')).toBeGreaterThan(z('pn-scrim'));
    expect(z('pn-sheet')).toBeLessThan(100);
    expect(z('pn-lbox')).toBeGreaterThan(z('pn-sheet'));
    expect(z('pn-lbox')).toBeLessThan(100);
    expect(z('pn-ev-ov')).toBeLessThan(100);
    expect(z('pn-toast')).toBeGreaterThan(100);
    expect(z('pn-toast')).toBeLessThan(200);
  });

  it('נעילת-השבת על המסמך (הגיליון בפורטל) — רק בתוך הסקין; הגיליון נפתח מכל לשונית', () => {
    expect(viewSrc).toContain("document.addEventListener('click', onClick, true)");
    expect(viewSrc).toContain("if (!t || !t.closest('.pn')) return;");
    expect(viewSrc).toMatch(/<BizSheet\s+id=\{selListing\}/);
    expect(viewSrc).toMatch(/<BizSheet draft=\{prevDraft\}/); // עיצוב 4: התצוגה-המקדימה של העורך
    expect(viewSrc).toContain('<MeTab ctx={bizCtx} sel={meSel} setSel={setMeSel} addTick={meAdd} onAddConsumed={meAddDone} onOpen={directoryOn ? (id) => openBiz(id) : null} onPreview={setPrevDraft} />');
  });
});
