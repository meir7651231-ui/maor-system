/**
 * ratchet — 📒 פרנסה׳לע · עיצוב 5: "לוח בקשות" ו"לוח הקהילה" של המקור.
 *  (א) requests.ts טהור: "מי עוד יכול לעזור לך" (טבלת-האירועים OCC, גבול-מילה עברי), "באלפון יש N", המיון (משרה
 *      מקודמת ← דחוף ← חדש) והקבוצות (דחוף · פתוחות · נמצאו), "יום ג׳ · ב׳ חשוון".
 *  (ב) משרה מקודמת (jobpromo): רק להצעת-עבודה פתוחה, המחיר מהמחירון (90 ₪), שדה-גבאי — שמירת-בקשה לא נוגעת בו,
 *      ריפוי; ה-store — רק למאשר/ת.
 *  (ג) הלוח בסקין: "➕ הוספת בקשה" בקטיפה, הסינון, הקבוצות, הכרטיס הנפתח (תגים · שורת-המסלול · פנייה מגודרת), בשקט
 *      — חתום למי שאינו מאשר; הטופס: "מי עוד יכול לעזור", שורת-ההתאמה, ההערה השקטה, מחיר משרה מקודמת.
 *  (ד) luach.ts טהור: הדוגמאות של המקור, המודעות שעל הלוח (ממתינות — רק למאשר), קיבוץ המניינים, הספירה, התחתית.
 *  (ה) לוח הקהילה בסקין: הקיר (מנורה · "בית המדרש" · המתג), הכתר ושעון-הדפים, נורות המניין הבא, לוחיות-הזמנים,
 *      המניינים, שבת קודש, האירועים, החירום; הלבד: השלט, הסינון, הפתקים לפי סוג; "(דוגמה)" כשריק.
 *  (ו) הגנות-מקור: השכבות בפורטל מתחת למודאלי-אורביט; תליית מודעה חסומה בשבת.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useApp } from '../../../store/useApp';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import { emptyDb, type Db, type PrListing, type PrPost, type PrRequest } from '../../../types/domain';
import { boardRequests, matchCount, PN_OCCASIONS, reqDateText, reqGroupOf, relatedFor } from '../requests';
import { isPromotedJob, saveRequest, setJobPromo } from '../transitions';
import { healPrRequest, PR_PRICE_DEFAULTS } from '../model';
import { LU_EX_EVENTS, LU_EX_NOTES, LU_EX_SHULS, LU_MISHEYAKIR_DEG, luachNotes, luachZmanim, minsUntil, noticeFoot, noteOf, shulRows } from '../luach';
import { pluralOf } from '../labels';
import { RequestsTab } from '../RequestsTab';
import { RequestForm } from '../RequestForm';
import { BoardTab } from '../BoardTab';
import { NoteCard } from '../Luach';
import { buildZmanimBoard, clockAt, dayTimes, dayZmanim, hmToMin, makeClosureFn, resolveZmanimLoc, sunAngleTime } from '../zmanimBoard';
import type { PrNow } from '../hooks';
import boardSrc from '../BoardTab.tsx?raw';
import luSrc from '../Luach.tsx?raw';

const loc = resolveZmanimLoc();
const TUE = Date.UTC(2026, 9, 13, 7, 30); // ג׳ 13.10.2026 10:30 בישראל
const nowAt = (ms: number): PrNow => {
  const clock = clockAt(ms, loc.tz);
  return { nowMs: ms, loc, clock, todayIso: clock.iso, closureAt: makeClosureFn(loc) };
};
const ISO = (h: number): string => new Date(TUE - h * 3600_000).toISOString();

function L(over: Partial<PrListing> = {}): PrListing {
  return {
    id: 'l1', source: 'owner', name: 'אינסטלציה שטרן', title: 'אינסטלטור', category: 'elec', area: '', city: '', phone: '050-7771234', phone2: '', whatsapp: '050-7771234',
    hours: [], always: false, hoursNote: '', services: [], languages: ['he'], kashrut: '', emergency: false, desc: '', notes: '', status: 'approved', dialCode: '101', featuredUntil: '',
    recs: [], createdAt: ISO(300), updatedAt: ISO(300), ...over,
  };
}
function R(over: Partial<PrRequest> = {}): PrRequest {
  return {
    id: 'r1', text: 'נזילה בכיור', category: 'elec', area: '', urgent: false, quiet: false, job: false, requester: { name: 'שרה כהן', phone: '052-1112233' }, status: 'open', responses: [],
    createdAt: ISO(2), updatedAt: ISO(2), ...over,
  };
}
function P(over: Partial<PrPost> = {}): PrPost {
  return {
    id: 'p1', kind: 'notice', title: 'לרגל הולדת הבן', text: 'השלום זכר בליל שב״ק', place: 'רחוב החסידים 14', phone: '', noticeKind: 'simcha', prayers: [], days: [], date: '', time: 'ליל ש״ק',
    until: '2026-10-20', approved: true, pinned: false, createdAt: ISO(5), updatedAt: ISO(5), ...over,
  };
}

/* ═══════════════ (א) requests.ts ═══════════════ */

describe('📒 (א) לוח הבקשות — הליבה הטהורה', () => {
  const PHOTO = L({ id: 'ph', name: 'סטודיו אור', title: 'צלם אירועים ווידאו', category: 'events' });
  const CATER = L({ id: 'ca', name: 'קייטרינג השף', title: 'קייטרינג ומגשי אירוח', category: 'events' });
  const WIG = L({ id: 'wg', name: 'שרה פאות', title: 'פאות וסירוק לכלות', category: 'fashion' });

  it('"מי עוד יכול לעזור לך": האירוע שבטקסט ⇒ מה עוד צריך, עד 2 עסקים מאושרים לצורך; מה שכבר מבקשים — מדולג', () => {
    expect(PN_OCCASIONS.map((o) => o.k)).toEqual(['בר מצווה', 'חתונה', 'ברית ולידה', 'מעבר דירה', 'שיפוץ', 'תקלה בבית', 'לימודים', 'שבת וחג', 'אבלות']);
    const r = relatedFor('בר מצווה לבן שלי, מחפשים צלם', [PHOTO, CATER, L({ id: 'x', name: 'ממתין', title: 'קייטרינג', status: 'pending' })]);
    expect(r?.k).toBe('בר מצווה');
    expect(r?.items.some((x) => x.l === 'צלם')).toBe(false); // כבר מבקשים צלם
    const cat = r?.items.find((x) => x.l === 'קייטרינג');
    expect(cat?.who.map((l) => l.id)).toEqual(['ca']); // רק מאושר
    expect(r?.items[0].who.length).toBeGreaterThan(0); // עם-עסק ראשונים
    expect(r?.items.length).toBeLessThanOrEqual(7);
    expect(relatedFor('צריך תיקון שעון', [PHOTO])).toBeNull();
  });

  it('גבול-מילה עברי (‏\\b של המקור לא פועל בעברית): "פאות" נתפס', () => {
    const r = relatedFor('חתונה של הבת בקיץ', [WIG]);
    expect(r?.items.find((x) => x.l === 'פאות')?.who.map((l) => l.id)).toEqual(['wg']);
  });

  it('"באלפון יש N בעלי מקצוע ב…" — המאושרים בשער', () => {
    expect(matchCount('events', [PHOTO, CATER, L({ id: 'y', category: 'events', status: 'pending' })])).toBe(2);
    expect(matchCount('', [PHOTO])).toBe(0);
  });

  it('המיון: משרה מקודמת ← דחוף ← החדשה; הקבוצות דחוף · פתוחות · נמצאו; "הצעות עבודה" — רק פתוחות', () => {
    const rs = [
      R({ id: 'a', createdAt: ISO(3) }),
      R({ id: 'b', urgent: true, createdAt: ISO(5) }),
      R({ id: 'c', status: 'closed', createdAt: ISO(1) }),
      R({ id: 'd', job: true, category: 'food', createdAt: ISO(6) }),
      R({ id: 'e', job: true, category: 'food', promoAt: ISO(1), promoPrice: 90, createdAt: ISO(9) }),
      R({ id: 'f', job: true, status: 'closed', createdAt: ISO(1) }),
    ];
    expect(boardRequests(rs, 'open', TUE).map((r) => r.id)).toEqual(['b', 'e', 'a', 'd']);
    expect(boardRequests(rs, 'all', TUE).map((r) => r.id)).toEqual(['b', 'e', 'a', 'd', 'c', 'f']);
    expect(boardRequests(rs, 'jobs', TUE).map((r) => r.id)).toEqual(['e', 'd']);
    expect(rs.map((r) => reqGroupOf(r, TUE))).toEqual(['open', 'urg', 'done', 'open', 'open', 'done']);
  });

  it('"יום ג׳ · ב׳ חשוון" באזור-הזמן של הקהילה', () => {
    expect(reqDateText(ISO(2), loc.tz)).toBe('יום ג׳ · ב׳ חשוון');
    expect(reqDateText('', loc.tz)).toBe('');
  });
});

/* ═══════════════ (ב) משרה מקודמת ═══════════════ */

describe('📒 (ב) משרה מקודמת (jobpromo)', () => {
  it('רק להצעת-עבודה פתוחה; המחיר מהמחירון (ברירת-מחדל 90 ₪, כמו המקור); ביטול מוחק את השדות', () => {
    expect(PR_PRICE_DEFAULTS.job).toBe(90);
    const job = R({ job: true });
    const on = setJobPromo(job, true, null, ISO(0));
    expect(on && isPromotedJob(on)).toBe(true);
    expect(on?.promoPrice).toBe(90);
    expect(setJobPromo(job, true, { prices: { job: 120 } }, ISO(0))?.promoPrice).toBe(120);
    expect(setJobPromo(R(), true, null, ISO(0))).toBeNull(); // לא הצעת-עבודה
    expect(setJobPromo(R({ job: true, status: 'closed' }), true, null, ISO(0))).toBeNull();
    const off = on && setJobPromo(on, false, null, ISO(0));
    expect(off && 'promoAt' in off).toBe(false);
    expect(off && 'promoPrice' in off).toBe(false);
    expect(isPromotedJob(R({ job: true, status: 'closed', promoAt: ISO(1) }))).toBe(false);
  });

  it('🛡 שדה-גבאי: שמירת-בקשה לוקחת את הקידום מהקודם ולא מהטיוטה; ריפוי מפיל ערכים זרים', () => {
    const prev = R({ job: true, promoAt: ISO(4), promoPrice: 90 });
    expect(saveRequest(prev, { ...prev, text: 'נערך', promoAt: undefined, promoPrice: 1 }, ISO(0))).toMatchObject({ promoAt: ISO(4), promoPrice: 90, text: 'נערך' });
    const fresh = saveRequest(null, R({ id: 'n', job: true, promoAt: ISO(0), promoPrice: 0 }), ISO(0));
    expect('promoAt' in fresh || 'promoPrice' in fresh).toBe(false);
    const healed = healPrRequest({ ...R({ job: true }), promoAt: 7, promoPrice: -3 });
    expect(healed?.promoAt).toBeUndefined();
    expect(healed?.promoPrice).toBeUndefined();
  });

  it('ה-store: רק מאשר/ת מקדם/ת; עובד/ת — לא', () => {
    const job = R({ id: 'prq1', job: true, category: 'food' });
    useApp.setState({ config: { ...DEFAULT_CONFIG, adminEmails: ['g@k.org'], modules: { parnasa: true }, features: {} }, db: { ...emptyDb(), prRequests: [job] }, toast: () => {} } as never);
    useApp.setState((s) => ({ cloud: { ...s.cloud, user: { uid: 'u', email: 's@k.org' }, isManager: false } }) as never);
    expect(useApp.getState().setPrJobPromo('prq1', true)).toBe(false);
    useApp.setState((s) => ({ cloud: { ...s.cloud, user: { uid: 'u', email: 'g@k.org' }, isManager: false } }) as never);
    expect(useApp.getState().setPrJobPromo('prq1', true)).toBe(true);
    expect(isPromotedJob(useApp.getState().db.prRequests[0])).toBe(true);
    expect(useApp.getState().setPrJobPromo('prq1', false)).toBe(true);
    expect(useApp.getState().db.prRequests[0].promoAt).toBeUndefined();
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
const noop = (): void => {};
const board = (now = nowAt(TUE)) => renderToStaticMarkup(createElement(RequestsTab, { now, focusId: null, onFocusConsumed: noop, draft: null, onDraftConsumed: noop, onOpenListing: noop, toast: noop }));

const REQS: PrRequest[] = [
  R({ id: 'r1', responses: [{ listingId: 'l1', text: 'זמין', at: ISO(1) }] }),
  R({ id: 'r2', text: 'צריך עזרה בטיפולי פוריות, בדיסקרטיות', category: 'health', quiet: true, requester: { name: 'רחל לוי', phone: '053-9998877' } }),
  R({ id: 'r3', text: 'דרוש/ה עובד/ת למאפייה', category: 'food', job: true, promoAt: ISO(1), promoPrice: 90 }),
  R({ id: 'r4', text: 'דחוף: חשמלאי לקצר בלוח', urgent: true, createdAt: ISO(1) }),
];

describe('📒 (ג) "לוח בקשות" בסקין של המקור', () => {
  it('"➕ הוספת בקשה" בקטיפה, הסינון "פתוחות · הצעות עבודה · הכול", הקבוצות עם המונים', () => {
    setup(ON(), { prListings: [L()], prRequests: REQS });
    const html = board();
    expect(html).toMatch(/<button class="pn-reqnew" type="button" aria-expanded="false"><span class="pn-pl" aria-hidden="true">＋<\/span><span><b>➕ הוספת בקשה<\/b><small>מחפשים בעל מקצוע או עובד\? הקהילה תעזור<\/small>/);
    expect(html).toContain('<button type="button" aria-pressed="true">פתוחות</button>');
    expect(html).toContain('<div class="pn-rq-grp pn-urg"><b>דחוף</b><span>צריך היום</span><i>1</i></div>');
    expect(html).toContain('<div class="pn-rq-grp pn-open"><b>פתוחות</b><span>מחכות למישהו שיכיר</span><i>3</i></div>');
  });

  it('הכרטיס: תחום · שתי שורות · "יום ג׳ · ב׳ חשוון · לפני …"; תגים — דחוף, משרה מקודמת (חותם-זהב), בשקט; שורת-המסלול', () => {
    setup(ON(), { prListings: [L()], prRequests: REQS });
    const html = board();
    expect(html).toContain('<details class="pn-req pn-urgent" data-rid="r4">');
    expect(html).toContain('<details class="pn-req pn-promo" data-rid="r3">');
    expect(html).toMatch(/<span class="pn-seal"><svg[\s\S]*?<\/svg>משרה מקודמת<\/span>/);
    expect(html).toContain('<span class="pn-rq-date">יום ג׳ · ב׳ חשוון · לפני שעתיים</span>');
    expect(html).toContain('עסק אחד זמין');
    expect(html).toContain('אינסטלציה שטרן'); // שבב העסק שענה
    expect(html).toContain('class="pn-rq-route pn-quiet"');
  });

  it('🛡 בשקט: לעובד/ת — "בקשה חסויה · פתחו כדי לקרוא", בלי זהות, בלי החלקה ובלי חשיפה; למאשר/ת — הטקסט המושחר + חשיפה', () => {
    setup(ON({ adminEmails: ['g@k.org'] }), { prListings: [L()], prRequests: REQS }, 's@k.org');
    const staff = board();
    expect(staff).toContain('בקשה חסויה · פתחו כדי לקרוא');
    expect(staff).not.toContain('רחל לוי');
    expect(staff).not.toContain('053-9998877');
    expect(staff).not.toContain('👁 הצגת פרטי הפונה');
    expect(staff).not.toContain('קידום המשרה'); // קידום — רק למאשר
    setup(ON(), { prListings: [L()], prRequests: REQS });
    const gab = board();
    expect(gab).toContain('👁 הצגת פרטי הפונה');
    expect(gab).not.toContain('רחל לוי');
    expect(gab).toContain('ביטול הקידום');
  });

  it('פנייה למבקש/ת: וואטסאפ רק בהרחבה, חיוג רק בטלפוניה, העתקה תמיד; החלקה (rsw) רק כשיש כפתור', () => {
    setup(ON(), { prListings: [L()], prRequests: [R({ id: 'r1' })] });
    const bare = board();
    expect(bare).toContain('העתקת המספר');
    expect(bare).not.toContain('data-act="wa"');
    expect(bare).not.toContain('class="pn-rsw"');
    setup(ON({ integrations: { whatsapp: { enabled: true } } } as unknown as Partial<OrgConfig>), { prListings: [L()], prRequests: [R({ id: 'r1' })] });
    const wa = board();
    expect(wa).toContain('data-act="wa"');
    expect(wa).toContain('class="pn-rsw"');
  });

  it('הטופס: "מי עוד יכול לעזור לך", "באלפון יש…" + "לראות אותם", ההערה השקטה, מחיר משרה מקודמת', () => {
    setup(ON(), { prListings: [L({ id: 'ph', name: 'סטודיו אור', title: 'צלם אירועים', category: 'events' }), L({ id: 'ca', name: 'קייטרינג השף', title: 'קייטרינג', category: 'events' })] });
    const f = (draft: Partial<PrRequest>) =>
      renderToStaticMarkup(createElement(RequestForm, { memKey: 't' + (draft.text ?? ''), request: null, draft, onClose: noop, toast: noop, onOpenListing: noop, onSeeCat: noop }));
    const occ = f({ text: 'בר מצווה לבן, מחפשים צלם', category: 'events' });
    expect(occ).toContain('מי עוד יכול לעזור לך');
    expect(occ).toContain('בר מצווה: מי שמחפש את זה צריך בדרך כלל גם');
    expect(occ).toContain('<b>קייטרינג השף</b>');
    expect(occ).toContain('באלפון יש 2 בעלי מקצוע בשמחות, קייטרינג וצילום');
    expect(occ).toContain('לראות אותם');
    expect(occ).toContain('פרסום בלוח');
    const quiet = f({ text: 'צריך עזרה בטיפולי פוריות' });
    expect(quiet).toContain('זיהינו נושא רגיש (פוריות).');
    expect(quiet).toContain('שליחה בשקט');
    const job = f({ text: 'דרוש עובד', job: true });
    expect(job).toContain('משרה מקודמת: <b>90 ₪</b>');
  });
});

/* ═══════════════ (ד) luach.ts ═══════════════ */

describe('📒 (ד) לוח הקהילה — הליבה הטהורה', () => {
  it('הדוגמאות של המקור: 3 בתי-כנסת, 4 אירועים, 8 פתקים', () => {
    expect(LU_EX_SHULS.map((s) => s.title)).toEqual(['בית המדרש הגדול', 'שטיבל רבי זושא', 'קלויז אהל משה']);
    expect(LU_EX_SHULS.every((s) => s.approved && s.kind === 'minyan')).toBe(true);
    expect(LU_EX_EVENTS.map((e) => e.t)).toEqual(['טיש של הרבי', 'מלווה מלכה ושיחה', 'שיעור בשו״ע אורח חיים', 'שעות המקווה לגברים']);
    expect(LU_EX_NOTES.map((n) => n.k)).toEqual(['simcha', 'avel', 'shiur', 'refuah', 'gemach', 'mosad', 'lost', 'kiddush']);
  });

  it('המודעות על הלוח: מאושרות ושלא ירדו; ממתינות — רק למאשר/ת; נעוצות ראשונות; ריק ⇒ הדוגמאות', () => {
    const posts = [P({ id: 'a' }), P({ id: 'b', approved: false, createdAt: ISO(1) }), P({ id: 'c', until: '2026-10-01' }), P({ id: 'd', pinned: true, createdAt: ISO(50) }), P({ id: 'e', kind: 'event' })];
    expect(luachNotes(posts, '2026-10-13', false).xs.map((n) => n.id)).toEqual(['d', 'a']);
    expect(luachNotes(posts, '2026-10-13', true).xs.map((n) => n.id)).toEqual(['d', 'b', 'a']);
    expect(luachNotes(posts, '2026-10-13', true).xs.find((n) => n.id === 'b')?.st).toBe('pending');
    const empty = luachNotes([], '2026-10-13', true);
    expect(empty.ex).toBe(true);
    expect(empty.xs).toHaveLength(8);
  });

  it('המניינים לפי בית-כנסת ← תפילה ← שעות (עבר / הבא); הספירה; שורת-התחתית', () => {
    const now = nowAt(TUE);
    const b = buildZmanimBoard(now.clock, now.loc, LU_EX_SHULS);
    const rows = shulRows(b.minyanim, b.nextMinyan, now.clock.hhmm, LU_EX_SHULS.map((p) => p.id));
    // סדר ההגדרה (S.settings.shuls במקור) — לא סדר המניין הראשון ביום (קלויז אהל משה, 05:45, היה קופץ ראשון)
    expect(rows.map((r) => r.shul)).toEqual(['בית המדרש הגדול', 'שטיבל רבי זושא', 'קלויז אהל משה']);
    expect(shulRows(b.minyanim, b.nextMinyan, now.clock.hhmm)[0].shul).toBe('קלויז אהל משה'); // בלי סדר — ההופעה הראשונה
    const big = rows.find((r) => r.shul === 'בית המדרש הגדול');
    expect(big?.prayers.find((p) => p.prayer === 'שחרית')?.times.every((t) => t.past)).toBe(true); // 10:30 — שחרית עברה
    expect(rows.flatMap((r) => r.prayers.flatMap((p) => p.times)).filter((t) => t.next)).toHaveLength(1);
    expect(minsUntil('10:55', '10:30')).toEqual({ n: '25', unit: 'דקות' });
    expect(minsUntil('13:30', '10:30')).toEqual({ n: '3:00', unit: 'שעות' });
    expect(noticeFoot(3, true, 'גבאי', 'מודעה')).toBe('3 מודעות ממתינות לאישור שלך. לחיצה על מודעה פותחת את האישור');
    expect(noticeFoot(1, true, 'גבאי', 'מודעה')).toBe('מודעה אחת ממתינה לאישור שלך. לחיצה על מודעה פותחת את האישור');
    expect(noticeFoot(3, false, 'גבאי', 'מודעה')).toBe('כל מודעה עוברת אצל הגבאי לפני שהיא נתלית, ויורדת לבד אחרי האירוע.');
    expect(pluralOf('בקשה')).toBe('בקשות');
  });

  it('12 הלוחיות של המקור: "זמן ציצית ותפילין · משיכיר" (11.5°) אחרי עלות-השחר — רק בלוח; זווית-השמש = מנוע-NOAA', () => {
    // אותו אלגוריתם של המנוע: בזווית הנץ/השקיעה (0.833°) — בדיוק הנץ והשקיעה של dayTimes, בכמה עונות ומקומות
    const ny = { ...loc, lat: 40.7128, lon: -74.006, tz: 'America/New_York' };
    for (const l of [loc, ny])
      for (const iso of ['2026-10-13', '2026-06-21', '2026-12-21', '2027-03-28']) {
        expect(sunAngleTime(iso, l, 0.833, true)).toBe(dayTimes(iso, l).sunrise);
        expect(sunAngleTime(iso, l, 0.833, false)).toBe(dayTimes(iso, l).sunset);
      }
    // בני ברק, ג׳ 13.10.2026 — המקור מראה 05:51 (luSun הפשוט שלו); עיגול לחומרא כלפי מעלה (זמן-התחלה)
    const mis = sunAngleTime('2026-10-13', loc, LU_MISHEYAKIR_DEG, true, 'ceil');
    expect(Math.abs((hmToMin(mis) ?? 0) - (hmToMin('05:51') ?? 0))).toBeLessThanOrEqual(1);
    const rows = luachZmanim(dayZmanim('2026-10-13', loc), '2026-10-13', loc);
    expect(rows).toHaveLength(12);
    expect(rows.slice(0, 3).map((z) => z.label + '|' + z.sub)).toEqual(['עלות השחר|' + rows[0].sub, 'זמן ציצית ותפילין|משיכיר', 'נץ החמה|']);
    expect(rows.map((z) => hmToMin(z.time) ?? -1)).toEqual(rows.map((z) => hmToMin(z.time) ?? -1).slice().sort((a, b) => a - b)); // כרונולוגי
    expect(dayZmanim('2026-10-13', loc).some((z) => z.key === 'misheyakir')).toBe(false); // הקו והחוברת — בלי שינוי
    // קיץ צפוני (השמש לא יורדת 11.5°) ⇒ בלי השורה, בלי קריסה; קלט פגום ⇒ ''
    const north = { ...loc, lat: 69.65, lon: 18.96, tz: 'Europe/Oslo' };
    expect(luachZmanim(dayZmanim('2026-06-21', north), '2026-06-21', north).some((z) => z.key === 'misheyakir')).toBe(false);
    expect(sunAngleTime('2026-13-45', loc, 11.5, true)).toBe('');
  });
});

/* ═══════════════ (ה) לוח הקהילה בסקין ═══════════════ */

describe('📒 (ה) "לוח הקהילה" בסקין של המקור', () => {
  it('הקיר והזמנים: מנורה, "בית המדרש · פרנסה׳לע", המתג; הכתר, התאריכים, שעון-הדפים, נורות המניין הבא; דוגמאות כשריק', () => {
    setup(ON(), {});
    const html = renderToStaticMarkup(createElement(BoardTab, { now: nowAt(TUE), onSearch: noop, toast: noop }));
    expect(html).toContain('<div class="pn-luHost pl">');
    expect(html).toContain('<svg class="pl-lampsvg"');
    expect(html).toContain('<span class="pl-k">בית המדרש · פרנסה׳לע</span>');
    expect(html).toContain('<h1>לוח הקהילה</h1>');
    expect(html).toMatch(/<button role="tab" type="button" id="pl-tZ" aria-selected="true"/);
    expect(html).toContain('<span class="pl-hd">יום שלישי, ב׳ חשוון תשפ״ז</span>');
    expect(html).toContain('13 באוקטובר 2026');
    expect(html).toMatch(/<div class="pl-clock" aria-label="השעה 10:30" role="img"><span class="pl-flip" data-v="1">/);
    expect(html).toContain('<small>המניין הבא</small>');
    expect(html).toContain('לפי אופק');
    expect(html).toContain('(דוגמה)');
    expect(html).toContain('טיש של הרבי');
    expect(html).toContain('<h3>מספרי חירום</h3>');
    expect(html).toContain('המניינים והאירועים כאן לדוגמה.');
    // שבת קודש: "ו׳ חשוון" כמו המקור (בלי השנה); בתי-הכנסת בסדר ההגדרה
    expect(html).toMatch(/<small>השבת הקרובה<\/small><b>שבת קודש<\/b><span>ו׳ חשוון<\/span>/);
    expect(html.indexOf('<b>בית המדרש הגדול</b>')).toBeLessThan(html.indexOf('<b>קלויז אהל משה</b>'));
    expect(html).toMatch(/<span class="pl-n">זמן ציצית ותפילין<small>משיכיר<\/small><\/span>/);
    const plates = html.slice(html.indexOf('<h3>זמני היום</h3>'), html.indexOf('<h3>מניינים בשכונה</h3>'));
    expect(plates.match(/<div class="pl-z( pl-past| pl-now)*"><span class="pl-n">/g)?.length).toBe(12); // 12 הלוחיות של המקור
  });

  it('לוח המודעות: השלט, הסינון לפי סוג, הפתקים לפי סוג (נעיצה/סלוטייפ), "ממתין לאישור הגבאי"; "➕ הוספת מודעה"', () => {
    setup(ON({ features: { 'parnasa.zmanim': false } }), {
      prPosts: [P({ id: 'a' }), P({ id: 'b', noticeKind: 'kiddush', title: 'קידושא רבה', approved: false }), P({ id: 'c', noticeKind: 'lost', title: 'נמצא שטריימל' })],
    });
    const html = renderToStaticMarkup(createElement(BoardTab, { now: nowAt(TUE), onSearch: noop, toast: noop }));
    expect(html).toContain('<div class="pl-plaque">לוח המודעות · קהילת השכונה</div>');
    expect(html).toContain('<button type="button" aria-pressed="true">הכול</button>');
    expect(html).toContain('<button type="button" aria-pressed="false">קידושא</button>');
    expect(html).toMatch(/<button type="button" class="pl-note pl-simcha" style="--pl-rot:-3deg"/);
    expect(html).toContain('<span class="pl-mt">מזל טוב</span>');
    expect(html).toContain('<span class="pl-tape pl-l"></span><span class="pl-tape pl-r"></span><span class="pl-pend">ממתין לאישור הגבאי</span>');
    expect(html).toContain('<div class="pl-tabs">');
    expect(html).toContain('➕ הוספת מודעה');
    expect(html).toContain('מודעה אחת ממתינה לאישור שלך');
  });

  it('כל סוגי-הפתקים של המקור מתרנדרים (דוגמאות): אבלות · לרפואה · מוסדות · קידושא · גמ״ח', () => {
    setup(ON(), {});
    const card = (k: string) => renderToStaticMarkup(createElement(NoteCard, { n: LU_EX_NOTES.find((n) => n.k === k)!, i: 0, gabbai: 'גבאי' }));
    expect(card('avel')).toContain('<span class="pl-bdh">ברוך דיין האמת</span>');
    expect(card('avel')).toContain('המקום ינחם');
    expect(card('refuah')).toContain('<span class="pl-nm">ישראל בן שרה (דוגמה)</span>');
    expect(card('refuah')).toContain('אמרתי פרק תהילים');
    expect(card('mosad')).toContain('<b>תלמוד תורה (דוגמה)</b><small>הודעה לציבור</small>');
    expect(card('kiddush')).toContain('class="pl-wine"');
    expect(card('gemach')).toContain('<span class="pl-stamp">גמ״ח</span>');
    expect(card('simcha')).toContain('שליחת מזל טוב');
    expect(renderToStaticMarkup(createElement(NoteCard, { n: noteOf(P({ phone: '052-1234567' })), i: 1, gabbai: 'גבאי' }))).toContain('<bdi dir="ltr">052-1234567</bdi>');
  });
});

/* ═══════════════ (ו) הגנות-מקור ═══════════════ */

describe('📒 (ו) שכבות ושבת', () => {
  it('הפתק הפתוח וטופס-התלייה בפורטל, מתחת למודאלי-אורביט (100) ומעל הכרום; תליית מודעה חסומה בשבת', () => {
    const css = readFileSync(fileURLToPath(new URL('../parnasa.css', import.meta.url)), 'utf8');
    const zs = [...css.matchAll(/\.pl \.pl-ov\{[^}]*z-index:(\d+)/g)].map((m) => Number(m[1]));
    expect(zs[zs.length - 1]).toBeGreaterThan(95);
    expect(zs[zs.length - 1]).toBeLessThan(100);
    expect(luSrc.match(/<PnPortal>/g)?.length).toBe(2);
    expect(boardSrc).toContain("if (props.calm) return toast('שבת קודש. אפשר לתלות ' + word + ' במוצאי שבת');");
  });
});
