/**
 * ratchet — 📒 פרנסה׳לע · עיצוב 4: "העסק שלי" של המקור — עורך-הדף בן 8 החלקים.
 *  (א) editor.ts טהור: 8 החלקים בנוסח המקור; אחוז-ההשלמות במשקלי המקור + 3 הצעדים הבאים (הכבדים ראשונים);
 *      ✓ וסיכום לכל חלק; לוח-הזמנים (ימים + משעה/עד) מעל חלונות-הפורט — הלוך-ושוב בלי אובדן (יום קצר, מוצ״ש);
 *      מד-הגודל; מיזוג-שלושה מול הרשומה החיה (המלצה/קוד-חיוג שנוספו בינתיים לא נדרסים בטיוטה ישנה).
 *  (ב) שער-התמונות ב-store (listingImagesWhy): data:image בלבד, תקרות המקור (לוגו 25KB, 4×45KB), דף ≤240KB,
 *      תקציב-התמונות של הארגון; שמירה שלא הוסיפה משקל — לא נחסמת; {ok:false} + טוסט, בלי לצרוך מזהה.
 *  (ג) "העסק שלי" מתרנדר בסקין: בורר "הדף שבעריכה" + ➕, גלולת-המצב (טיוטה/באוויר/ממתין/מוסתר), הכרטיס-המיני,
 *      הבאנר "כך תופיעו", טבעת-ההשלמות עם "+N%", הקופה, האריחים, ההמלצות, המעטפת (רק מאושר), העורך ("פרטים
 *      בסיסיים" פתוח לעסק חדש; תוויות-השמירה של המקור); "שדות הגבאי" והסרה — רק למורשה.
 *  (ד) התצוגה-המקדימה: סרט "תצוגה מקדימה", בלי ★/טופס-המלצה/קופה; "כאן יופיעו ההמלצות שתקבלו".
 *  (ה) הגנות-מקור: הקטנה דרך photoGallery (fitDimensions/isDataImage) בתקרות PR_IMG; הטיוטה שורדת מעבר-לשונית
 *      ונשמרת במיזוג מול הרשומה החיה; אין innerHTML.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useApp } from '../../../store/useApp';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import { emptyDb, type Db, type PrListing, type PrRequest } from '../../../types/domain';
import { completeness, composeHours, kb, PN_SECS, rebaseDraft, schedOf, secDone, secSum, sizeState } from '../editor';
import { listingImagesWhy } from '../transitions';
import { PR_IMG } from '../model';
import { MeTab } from '../MeTab';
import { BizSheet, type BizCtx } from '../BizSheet';
import { clockAt, dateWords, makeClosureFn, resolveZmanimLoc } from '../zmanimBoard';
import type { PrNow } from '../hooks';
import editorSrc from '../Editor.tsx?raw';
import meSrc from '../MeTab.tsx?raw';
import shrinkSrc from '../imageShrink.ts?raw';

const loc = resolveZmanimLoc();
const nowAt = (ms: number): PrNow => {
  const clock = clockAt(ms, loc.tz);
  return { nowMs: ms, loc, clock, todayIso: clock.iso, closureAt: makeClosureFn(loc) };
};
const TUE = Date.UTC(2026, 9, 13, 7, 30); // ג׳ 13.10.2026 10:30 בישראל
const img = (n: number): string => 'data:image/webp;base64,' + 'A'.repeat(Math.max(0, n - 23));

function L(over: Partial<PrListing> = {}): PrListing {
  return {
    id: 'l1', source: 'owner', name: 'אינסטלציה שטרן', title: 'אינסטלטור מוסמך', category: 'elec', area: '', city: '', phone: '050-7771234', phone2: '', whatsapp: '050-7771234',
    hours: [], always: false, hoursNote: '', services: [], languages: ['he'], kashrut: '', emergency: false, desc: '', notes: '', status: 'approved', dialCode: '101', featuredUntil: '',
    recs: [], createdAt: '2026-10-01T08:00:00.000Z', updatedAt: '2026-10-01T08:00:00.000Z', ...over,
  };
}
const EMPTY = L({ id: '', name: '', title: '', category: '', phone: '', whatsapp: '', languages: [], status: 'pending', dialCode: '' });
const FULL = L({
  desc: 'עשרים שנה בשכונה: נזילות, סתימות, דודי שמש וצנרת. מגיעים בזמן, עובדים נקי ונותנים אחריות.',
  tagline: 'כל נזילה נגמרת אצלנו',
  logo: img(500),
  palette: 'tekhelet',
  services: [
    { name: 'פתיחת סתימה', price: '250', note: '' },
    { name: 'איתור נזילה', price: 'מ300', note: '' },
  ],
  photos: [img(400)],
  hours: [0, 1, 2, 3, 4].map((dow) => ({ dow, from: '08:00', to: '19:00' })),
  faq: [{ q: 'יש אחריות?', a: 'שנה' }],
  pay: ['cash', 'bit'],
  city: 'בני ברק',
});

/* ═══════════════ (א) editor.ts ═══════════════ */

describe('📒 (א) העורך — הליבה הטהורה', () => {
  it('8 החלקים בנוסח המקור', () => {
    expect(PN_SECS.map((s) => s[1])).toEqual(['פרטים בסיסיים', 'עיצוב: צבע ולוגו', 'שירותים ומחירים', 'תמונות', 'שעות פעילות', 'שאלות נפוצות', 'תשלום ושפות', 'תעודות, השגחה וותק']);
  });

  it('אחוז-ההשלמות במשקלי המקור; 3 הצעדים הבאים — הכבדים ראשונים', () => {
    const e = completeness(EMPTY);
    expect(e.pct).toBe(0);
    expect(e.next).toEqual([
      [20, 'basic', 'שם, מקצוע וטלפון'],
      [15, 'svc', 'הוסיפו מחירון'],
      [12, 'basic', 'ספרו על העסק'],
    ]);
    expect(completeness(L({})).pct).toBe(20);
    expect(completeness(L({ services: [{ name: 'א', price: '', note: '' }] })).pct).toBe(20); // מחירון = 2 שירותים לפחות
    const f = completeness(FULL);
    expect(f.pct).toBe(100);
    expect(f.next).toEqual([]);
  });

  it('✓ וסיכום לכל חלק — כמו המקור', () => {
    expect(PN_SECS.filter(([k]) => secDone(EMPTY, k))).toEqual([]);
    expect(PN_SECS.filter(([k]) => secDone(FULL, k)).map((s) => s[0])).toEqual(['basic', 'design', 'svc', 'photos', 'hours', 'faq', 'pay']);
    expect(secDone(L({ years: 12 }), 'cert')).toBe(true);
    expect(secDone(L({ hoursNote: 'בתיאום מראש' }), 'hours')).toBe(true);
    expect(secSum(EMPTY, 'basic')).toBe('שם, מקצוע, טלפון ותיאור');
    expect(secSum(FULL, 'basic')).toBe('אינסטלציה שטרן · אינסטלטור מוסמך');
    expect(secSum(FULL, 'design')).toBe('צבע תכלת · לוגו ✓');
    expect(secSum(EMPTY, 'design')).toBe('צבע ברירת מחדל · בלי לוגו');
    expect(secSum(FULL, 'svc')).toBe('2 שירותים');
    expect(secSum(L({ services: [{ name: 'א', price: '', note: '' }] }), 'svc')).toBe('שירות אחד');
    expect(secSum(FULL, 'photos')).toBe('1 מתוך 4');
    expect(secSum(EMPTY, 'photos')).toBe('עד 4 תמונות של עבודות ומוצרים');
    expect(secSum(FULL, 'hours')).toBe('א׳ ב׳ ג׳ ד׳ ה׳ · 8:00–19:00');
    expect(secSum(L({ always: true }), 'hours')).toBe('24/7');
    expect(secSum(L({ hours: [{ dow: 6, from: '20:00', to: '24:00' }] }), 'hours')).toBe('מוצ״ש · 20:00–חצות');
    expect(secSum(L({ hours: [{ dow: 0, from: '08:00', to: '19:00' }, { dow: 5, from: '08:00', to: '12:00' }] }), 'hours')).toBe('2 חלונות שעות');
    expect(secSum(EMPTY, 'hours')).toBe('כדי שידעו מתי להתקשר');
    expect(secSum(FULL, 'faq')).toBe('שאלה אחת');
    expect(secSum(FULL, 'pay')).toBe('מזומן, ביט · עברית');
    expect(secSum(EMPTY, 'pay')).toBe('מזומן, ביט, אשראי…');
    expect(secSum(L({ years: 12, cert: 'אינסטלטור מוסמך', kashrut: 'בד״ץ' }), 'cert')).toBe('ותק 12 · אינסטלטור מוסמך · השגחה');
  });

  it('לוח-הזמנים: ימים + משעה/עד של המקור מעל חלונות-הפורט — הלוך-ושוב בלי אובדן (יום קצר, מוצ״ש)', () => {
    const hours = [
      ...[0, 1, 2, 3, 4].map((dow) => ({ dow, from: '08:00', to: '19:00' })),
      { dow: 5, from: '08:00', to: '12:00' },
      { dow: 6, from: '20:30', to: '23:00' },
    ];
    const s = schedOf(hours);
    expect(s).toEqual({ days: [0, 1, 2, 3, 4], from: '08:00', to: '19:00', extra: [hours[5], hours[6]] });
    expect(composeHours(s)).toEqual(hours);
    expect(schedOf([])).toEqual({ days: [], from: '08:00', to: '19:00', extra: [] });
    // רק מוצ״ש ⇒ אין חלון-ראשי, הכול נשמר כחלון-נוסף
    expect(schedOf([{ dow: 6, from: '20:00', to: '23:00' }]).extra).toEqual([{ dow: 6, from: '20:00', to: '23:00' }]);
  });

  it('בורר-התאריך של המקור (dateFmt): התאריך במילים + התאריך העברי', () => {
    expect(dateWords('2026-11-11')).toBe('יום ד׳, 11 בנובמבר 2026 · א׳ כסלו');
    expect(dateWords('')).toBe('');
  });

  it('מד-הגודל: מעל 240KB ⇒ over; מעל 82% ⇒ warn; "34KB"', () => {
    expect(PR_IMG.doc).toBe(240 * 1024);
    expect(sizeState(PR_IMG.doc + 1)).toBe('over');
    expect(sizeState(Math.round(PR_IMG.doc * 0.9))).toBe('warn');
    expect(sizeState(2000)).toBe('ok');
    expect(kb(34 * 1024)).toBe('34KB');
    expect(kb(10)).toBe('1KB');
  });

  it('🛡 מיזוג-שלושה: רק מה שנערך באמת — מהטיוטה; המלצה/קוד-חיוג/קידום שנוספו בינתיים — מהרשומה החיה', () => {
    const saved = L({ dialCode: '', status: 'pending', tagline: 'ישן' });
    const live = { ...saved, status: 'approved' as const, dialCode: '107', recs: [{ by: 'שכן', text: 'עבודה נקייה', at: '2026-10-12T10:00:00.000Z' }], promoLine: 'מגיעים תוך שעה' };
    const cur = { ...saved, title: 'אינסטלטור ודודי שמש', tagline: undefined };
    const out = rebaseDraft(cur, saved, live);
    expect(out.title).toBe('אינסטלטור ודודי שמש');
    expect(out.tagline).toBeUndefined(); // נוקה בעורך — נשאר מנוקה
    expect(out.dialCode).toBe('107');
    expect(out.status).toBe('approved');
    expect(out.recs).toHaveLength(1);
    expect(out.promoLine).toBe('מגיעים תוך שעה');
    expect(rebaseDraft(saved, saved, live)).toEqual(live); // בלי עריכה ⇒ הרשומה החיה כמות-שהיא
  });
});

/* ═══════════════ (ב) שער-התמונות ═══════════════ */

describe('📒 (ב) שער-התמונות (store)', () => {
  it('data:image בלבד ובתקרות המקור: לוגו ≤25KB, עד 4 תמונות ≤45KB', () => {
    expect(PR_IMG.logo).toBe(25 * 1024);
    expect(PR_IMG.photo).toBe(45 * 1024);
    expect(PR_IMG.photos).toBe(4);
    expect(listingImagesWhy(null, L({ logo: 'https://evil.example/x.png' }), [])).toContain('הלוגו');
    expect(listingImagesWhy(null, L({ logo: img(PR_IMG.logo + 1) }), [])).toContain('הלוגו');
    expect(listingImagesWhy(null, L({ photos: [1, 2, 3, 4, 5].map(() => img(100)) }), [])).toBe('עד 4 תמונות, כל אחת עד 45KB');
    expect(listingImagesWhy(null, L({ photos: [img(PR_IMG.photo + 1)] }), [])).toBe('עד 4 תמונות, כל אחת עד 45KB');
    expect(listingImagesWhy(null, L({ photos: ['javascript:alert(1)'] }), [])).toBe('עד 4 תמונות, כל אחת עד 45KB');
    expect(listingImagesWhy(null, L({ logo: img(PR_IMG.logo), photos: [img(PR_IMG.photo)] }), [])).toBe('');
  });

  it('משקל שעלה ⇒ דף ≤240KB ותקציב-הארגון; שמירה שלא הוסיפה משקל — לא נחסמת', () => {
    const big = L({ desc: 'א'.repeat(30_000), logo: img(PR_IMG.logo), photos: [1, 2, 3].map(() => img(PR_IMG.photo)) });
    const more = { ...big, photos: [...(big.photos ?? []), img(PR_IMG.photo)] };
    expect(listingImagesWhy(big, more, [big])).toBe('הדף גדול מדי. הסירו תמונה או קצרו טקסט');
    expect(listingImagesWhy(more, { ...more, title: 'אחר' }, [more])).toBe(''); // לא הוסיף משקל — עובר גם מעל התקרה
    const heavy = (i: number): PrListing => L({ id: 'h' + i, logo: img(PR_IMG.logo), photos: [1, 2, 3, 4].map(() => img(PR_IMG.photo)) });
    const others = Array.from({ length: 31 }, (_, i) => heavy(i));
    expect(listingImagesWhy(null, L({ id: '', photos: [img(1000)] }), others)).toBe('תקציב-התמונות של האלפון מלא — הסירו תמונות מדפים אחרים');
    // העסק הנערך לא נספר פעמיים (הגרסה הקודמת שלו מוחרגת מהסכום)
    const mine = heavy(99);
    expect(listingImagesWhy(mine, { ...mine, logo: img(PR_IMG.logo - 10) }, [mine])).toBe('');
  });

  it('ה-store: תמונה לא-תקינה ⇒ {ok:false} + טוסט, שום רשומה ושום מזהה לא נצרכו', () => {
    const toasts: string[] = [];
    useApp.setState({ config: { ...DEFAULT_CONFIG, modules: { parnasa: true }, features: {} }, db: emptyDb(), toast: (m: string) => toasts.push(m) } as never);
    const seq0 = useApp.getState().db.seq;
    const r = useApp.getState().upsertPrListing(L({ id: '', dialCode: '', logo: 'data:text/html;base64,PHNjcmlwdD4=' }));
    expect(r.ok).toBe(false);
    expect(toasts.at(-1)).toContain('הלוגו');
    expect(useApp.getState().db.prListings).toHaveLength(0);
    expect(useApp.getState().db.seq).toBe(seq0);
    const ok = useApp.getState().upsertPrListing(L({ id: '', dialCode: '', logo: img(800), photos: [img(900)] }));
    expect(ok.ok).toBe(true);
    expect(ok.listing?.photos).toHaveLength(1);
  });
});

/* ═══════════════ רינדור ═══════════════ */

const INIT = useApp.getInitialState() as unknown as Record<string, unknown>;
const ORIG = { config: INIT.config, db: INIT.db, cloud: INIT.cloud };
const GABBAI = 'gabbai@kehila.org';
const STAFF = 'staff@kehila.org';
const ON = (extra: Partial<OrgConfig> = {}): OrgConfig => ({ ...DEFAULT_CONFIG, modules: { parnasa: true }, features: {}, ...extra });
function setup(cfg: OrgConfig, db: Partial<Db> = {}, email: string | null = null): void {
  const st = useApp.getState();
  const patch = { config: cfg, db: { ...emptyDb(), ...db }, cloud: { ...st.cloud, user: email ? { uid: 'u', email } : null, isManager: false } };
  useApp.setState(patch as never);
  Object.assign(INIT, patch);
}
beforeEach(() => {
  useApp.setState({ toast: () => {} } as never);
});
afterEach(() => {
  Object.assign(INIT, ORIG);
  useApp.setState({ config: DEFAULT_CONFIG, db: emptyDb() } as never);
});
function bizCtx(): BizCtx {
  return { now: nowAt(TUE), calm: false, reduced: true, quick: { favs: [], recents: [], toggleFav: () => false, touch: () => {} }, monthStartIso: '2026-10-12', toastAct: () => {} };
}
const me = (sel: string | null) => renderToStaticMarkup(createElement(MeTab, { ctx: bizCtx(), sel, setSel: () => {}, onOpen: () => {}, onPreview: () => {} }));

const REQ: PrRequest = {
  id: 'r1', text: 'נזילה בכיור', category: 'elec', area: '', urgent: false, quiet: false, job: false, requester: { name: 'שרה', phone: '052-1112233' }, status: 'open',
  responses: [{ listingId: 'l1', text: 'מגיע תוך שעה', at: '2026-10-13T06:00:00.000Z' }], createdAt: '2026-10-13T05:00:00.000Z', updatedAt: '2026-10-13T05:00:00.000Z',
};
const QUIET: PrRequest = { ...REQ, id: 'r2', text: 'צריך מישהו לטפל בנזילה, בדיסקרטיות', quiet: true, requester: { name: 'רחל לוי', phone: '053-9998877' }, responses: [] };
const OLD: PrRequest = { ...REQ, id: 'r3', text: 'בקשה ישנה מלפני שלושה שבועות', responses: [], createdAt: '2026-09-20T05:00:00.000Z', updatedAt: '2026-09-20T05:00:00.000Z' };
const DATA: Partial<Db> = {
  prListings: [
    { ...FULL, recs: [{ by: 'יוסי', text: 'הגיע בזמן', at: '2026-10-10T10:00:00.000Z' }] },
    L({ id: 'l2', name: 'גינון עדן', title: 'גינון ותחזוקה', category: 'garden', status: 'pending', dialCode: '' }),
    L({ id: 'l3', name: 'הובלות הצפון', title: 'הובלות', category: 'move', status: 'rejected', dialCode: '' }),
  ],
  prRequests: [REQ, QUIET, OLD],
};

describe('📒 (ג) "העסק שלי" בסקין של המקור', () => {
  it('עסק חדש: בורר + ➕, "טיוטה · עוד לא נשמר", טבעת 0% עם "+20%", "פרטים בסיסיים" פתוח, "הוספה לאלפון"', () => {
    setup(ON(), DATA);
    const html = me(null);
    expect(html).toContain('<option value="" selected="">➕ עסק חדש</option>');
    expect(html).toContain('אינסטלציה שטרן · ☎ 101');
    expect(html).toContain('גינון עדן · ממתין');
    expect(html).toContain('הובלות הצפון · מוסתר');
    expect(html).toContain('טיוטה · עוד לא נשמר');
    expect(html).toContain('aria-label="הדף מלא ב־0 אחוז"');
    expect(html).toContain('בואו נבנה את הדף שלכם');
    expect(html).toMatch(/שם, מקצוע וטלפון <b>\+20%<\/b>/);
    expect(html).toContain('כך תופיעו בתוצאות החיפוש');
    expect(html).toContain('לתצוגה המלאה');
    expect(html).toContain('0 מתוך 8 חלקים');
    expect(html).toMatch(/class="pn-eds pn-open" data-sec="basic"/);
    expect(html).toContain('data-f="name"');
    expect(html).toContain('קיבלתי את הסכמתו להופיע באלפון');
    expect(html).toContain('הוספה לאלפון');
    // "בתוקף עד" — בורר-התאריך של המקור (כפתור במילים + ✕), לא השדה הטבעי הגלוי
    expect(html).toMatch(/<span class="pn-dpick"><input class="pn-dhid" type="date" tabindex="-1" aria-label="המבצע בתוקף עד"/);
    expect(html).toContain('<button type="button" class="pn-dbtn pn-empty">');
    expect(html).not.toContain('הקופה שלך'); // לוח-המצב רק לעסק שמור
    expect(html).not.toContain('הסרת העסק');
  });

  it('עסק מאושר: "באוויר באלפון", 100%, הקופה, אריחים (בקשות בתחום · המלצות), ההמלצות, המעטפת, "שמירת הדף"', () => {
    setup(ON(), DATA);
    const html = me('l1');
    expect(html).toContain('באוויר באלפון');
    expect(html).toContain('aria-label="הדף מלא ב־100 אחוז"');
    expect(html).toContain('הדף שלכם מושלם');
    expect(html).toContain('<section class="pn-bps pn-kupa pn-own"');
    expect(html).toContain('הקופה שלך'); // kupaRow(e, own) של המקור — בגוף-שני כמו כל הלוח
    expect(html).toMatch(/<b class="pn-kp-n">2<\/b><span class="pn-kp-l">פעמים עזרת לקהילה<\/span>/); // תשובה אחת + תודה אחת
    expect(html).toContain('בקשות בתחום');
    expect(html).toContain('המלצות שקיבלתם');
    expect(html).toContain('הגיע בזמן');
    expect(html).toContain('לדף ולשיתוף');
    expect(html).toContain('aria-label="המעטפת שלי"');
    expect(html).toContain('7 מתוך 8 חלקים');
    expect(html).toContain('שמירת הדף');
    expect(html).toContain('הסרת העסק');
    expect(html).not.toContain('data-f="name"'); // חלקים סגורים בפתיחה
  });

  it('"בקשות בתחום שלך" (renderMeReqs): 14 יום, "סימנת שאתה זמין" אחרי מענה; בשקט — "שליחת תשובה", בלי זהות', () => {
    setup(ON(), DATA);
    const html = me('l1');
    expect(html).toContain('aria-label="בקשות בתחום שלך"');
    expect(html).toContain('<h2>בקשות בתחום שלך</h2>');
    expect(html).toContain('חשמל, אינסטלציה ומיזוג · מגיעות אליכם לפני כל הקהילה');
    expect(html).toContain('סימנת שאתה זמין'); // r1 — העסק כבר ענה
    expect(html).toContain('בשקט, לא יודעים מי ביקש');
    expect(html).toContain('שליחת תשובה');
    expect(html).not.toContain('רחל לוי');
    expect(html).not.toContain('053-9998877');
    expect(html).not.toContain('בקשה ישנה מלפני שלושה שבועות'); // מעבר ל-14 יום
    expect(html).toMatch(/בקשות בתחום<\/span><b>2<\/b>/); // האריח סופר את אותן שתיים
    expect(me('l2')).not.toContain('בקשות בתחום שלך'); // ממתין — לא מקבל ניתוב
  });

  it('ממתין / מוסתר: גלולת-המצב של המקור; בלי מעטפת', () => {
    setup(ON(), DATA);
    const p = me('l2');
    expect(p).toContain('ממתין לאישור הגבאי');
    expect(p).not.toContain('aria-label="המעטפת שלי"');
    expect(me('l3')).toContain('מוסתר ע״י הגבאי');
  });

  it('"שדות הגבאי" (מקור · קוד-חיוג · הדגשה · הערה) והסרה — רק למורשה; עובד/ת ⇒ "שליחה לאישור"', () => {
    setup(ON({ adminEmails: [GABBAI] }), DATA, GABBAI);
    expect(me(null)).toContain('שדות הגבאי');
    setup(ON({ adminEmails: [GABBAI] }), DATA, STAFF);
    const staffNew = me(null);
    expect(staffNew).not.toContain('שדות הגבאי');
    expect(staffNew).toContain('שליחה לאישור');
    const staffOld = me('l1');
    expect(staffOld).not.toContain('הסרת העסק');
    expect(staffOld).toContain('שמירת הדף');
  });

  it('הכרטיס-המיני: בלי כותרת-מיני ובלי מזהה-כותרת כפול; הבאנר אינרטי', () => {
    setup(ON(), DATA);
    const html = me('l1');
    const mini = /<div class="pn-bpmini"[\s\S]*?<span class="pn-open">/.exec(html)?.[0] ?? '';
    expect(mini).toContain('<h2>אינסטלציה שטרן</h2>');
    expect(mini).not.toContain('pn-bptop');
    expect(mini).not.toContain('id="pn-sname"');
    expect(html).toMatch(/<div class="pn-bn-list" inert="">/);
  });
});

describe('📒 (ד) התצוגה-המקדימה של העורך', () => {
  it('סרט "תצוגה מקדימה", בלי ★/טופס-המלצה/קופה; "כאן יופיעו ההמלצות שתקבלו"', () => {
    setup(ON(), DATA);
    const draft = { ...EMPTY, name: 'השם שלכם', title: 'במה אתם עובדים', phone: '050-000-0000', category: 'other', status: 'approved' as const };
    const html = renderToStaticMarkup(createElement(BizSheet, { draft, qtext: '', ctx: bizCtx(), onClose: () => {}, onOpen: () => {} }));
    expect(html).toContain('תצוגה מקדימה');
    expect(html).toContain('כאן יופיעו ההמלצות שתקבלו');
    expect(html).not.toContain('pn-star');
    expect(html).not.toContain('pn-rec-form');
    expect(html).not.toContain('הקופה של העסק');
  });
});

/* ═══════════════ (ה) הגנות-מקור ═══════════════ */

describe('📒 (ה) הגנות-מקור', () => {
  it('הקטנה בדפדפן דרך photoGallery (fitDimensions + isDataImage) בתקרות PR_IMG; לוגו שקוף', () => {
    expect(shrinkSrc).toContain("import { fitDimensions, isDataImage } from '../../lib/photoGallery';");
    expect(shrinkSrc).toContain('u.length <= budget && isDataImage(u)');
    expect(editorSrc).toContain("shrinkImage(f, kind === 'logo' ? PR_LOGO_DIM : PR_PHOTO_DIM, kind === 'logo' ? PR_IMG.logo : PR_IMG.photo, kind === 'logo')");
  });

  it('הטיוטה שורדת מעבר-לשונית (במקור הטופס נשאר בדף) ונשמרת במיזוג מול הרשומה החיה', () => {
    for (const k of ['d', 'sched', 'wa', 'consent', 'open', 'saved']) expect(editorSrc, k).toMatch(new RegExp("useKept<[^(]+>\\(mk \\+ '" + k + "'"));
    expect(editorSrc).toContain('upsertPrListing(live ? rebaseDraft(cur, saved, live) : cur)');
    expect(editorSrc).toMatch(/\{dirty \? \(\s*<button className="pn-btn" type="button" onClick=\{revert\}>\s*ביטול עריכה/); // "ביטול עריכה" של המקור
    expect(meSrc).toContain('memKey={edKey}');
    expect(meSrc).toContain("useRemembered('parnasa.me.newN', 0)");
    expect(meSrc).toContain('forgetEditorDraft(lastEdKey)');
  });

  it('שורת-השמירה: בזרימה (לא מכסה את השדה האחרון כמו במקור); דביקה עם שינויים — מעל הפס, ובטלפון גם מעל ניווט-אורביט', () => {
    const css = readFileSync(fileURLToPath(new URL('../parnasa.css', import.meta.url)), 'utf8');
    const tail = css.slice(css.lastIndexOf('.pn .pn-edsave{bottom:auto}'));
    expect(tail.startsWith('.pn .pn-edsave{bottom:auto}')).toBe(true);
    expect(tail).toContain('.pn form.pn-ed.pn-dirty .pn-edsave{bottom:calc(86px + env(safe-area-inset-bottom,0px))}');
    expect(tail).toContain('@media (max-width:760px){.pn form.pn-ed.pn-dirty .pn-edsave{bottom:calc(142px + env(safe-area-inset-bottom,0px))}}');
    expect(css).toContain('.pn form.pn-ed.pn-dirty .pn-edsave{position:sticky;');
  });

  it('אין innerHTML בעורך וב"העסק שלי"', () => {
    for (const s of [editorSrc, meSrc]) {
      expect(s).not.toContain('dangerouslySetInnerHTML');
      expect(s).not.toContain('.innerHTML');
    }
  });
});
