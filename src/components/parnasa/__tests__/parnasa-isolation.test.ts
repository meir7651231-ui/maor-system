/**
 * ratchet — 📒 פרנסה׳לע 4: פעולות-ה-store + בידוד (BUILD-ORDER-PARNASA-2026-10-12, הכרעות 4 ו-6).
 *
 * הכללים שננעלים:
 *  (א) בידוד — סריקת-מקור: גוש-הפעולות של פרנסה׳לע ב-store וכל קבצי-המודול (מנוע + רכיבים,
 *      כולל עתידיים — glob) לא נוגעים ב-receiptSeq/donationSeq/shopReceiptSeq/donations/
 *      events/upsertEvent, ולא מייבאים מעולם התרומות/הקבלות. פרסום/חסות = payLink בלבד.
 *      + התנהגותית: זרימה מלאה של כל הפעולות לא מזיזה מונה-קבלות ולא נוגעת בתורמים/בלוח-הראשי.
 *  (ב) בנדל-ראשי: ה-store מייבא מהמודול רק את transitions.ts + model.ts — לא את המנוע הכבד
 *      (lib/zmanimBoard/booklet: מילון-מושגים, זמנים, חוברת), שנשאר בצ'אנק-העצל של המסך.
 *  (ג) מכונת-האישור נאכפת ב-store, לא רק בממשק: לא-מאשר שעורך תוכן של עסק מאושר ⇒ ממתין; לא-מאשר
 *      לא משנה הדגשה/קוד-חיוג/מקור; אישור/דחייה/מחיקה/הגדרות — רק למנהל/בעלים או לעובד/ת שהודלק/ה
 *      (prCan = featureOn ∧ canGrantedAction). מודול כבוי (opt-in, חסר) ⇒ אין סמכויות-גבאי בכלל.
 *  (ד) 🛡 פרטיות-שקט ב-store: סגירת בקשה שקטה מוחקת אותה עם כל התשובות; שקטה לעולם לא הצעת-עבודה;
 *      לוג-הפעולות לעולם לא מכיל טקסט/שם/טלפון של מבקש; תצוגת-העסקים של הרשומה השמורה — בלי זהות.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../../../store/useApp';
import { DEFAULT_CONFIG, type OrgConfig } from '../../../types/config';
import { emptyDb, type Db, type PrAd, type PrListing, type PrPost, type PrRequest } from '../../../types/domain';
import { businessView, pendingApprovals } from '../lib';
import storeSrc from '../../../store/useApp.ts?raw';
import transitionsSrc from '../transitions.ts?raw';

/* ═══════════════ (א)+(ב) סריקת-מקור ═══════════════ */

/** כל קבצי-המודול (מנוע + רכיבים) — גם רכיבים שיתווספו באשכולות הבאים נסרקים אוטומטית. */
const MODULE_SRC = import.meta.glob(['../*.ts', '../*.tsx'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const BLOCK_START = '// ── פרנסה׳לע (מודול parnasa — opt-in ומבודד; BUILD-ORDER-PARNASA אשכול 4) ──';
const BLOCK_END = '// ── סוף פרנסה׳לע ──';

function storeBlock(): string {
  const start = storeSrc.indexOf(BLOCK_START);
  const end = storeSrc.indexOf(BLOCK_END);
  expect(start, 'סמן-הפתיחה של גוש פרנסה׳לע ב-store').toBeGreaterThan(0);
  expect(end, 'סמן-הסיום אחרי הפתיחה').toBeGreaterThan(start);
  return storeSrc.slice(start, end);
}

/** מילות-כסף/לוח-ראשי אסורות (substring — קפדני במכוון). */
const MONEY_WORDS = ['receiptSeq', 'donationSeq', 'shopReceiptSeq', 'donations', 'upsertEvent', 'deleteEvent', 'addDonation', 'addPayment', 'OrgEvent'];

describe('📒 (א) בידוד — סריקת-מקור', () => {
  it('גוש-הפעולות ב-store: כל 12 הפעולות בפנים, ואפס נגיעה בקבלות/תרומות/לוח-ראשי', () => {
    const block = storeBlock();
    for (const fn of [
      'upsertPrListing(l)', 'deletePrListing(id)', 'setPrStatus(kind, id, status)', 'upsertPrRequest(r)', 'addPrResponse(requestId, resp)',
      'closePrRequest(id)', 'deletePrRequest(id)', 'upsertPrPost(p)', 'deletePrPost(id)', 'upsertPrAd(a)', 'deletePrAd(id)', 'setParnasaPrefs(patch)',
    ]) {
      expect(block, 'הפעולה ' + fn + ' חייבת לשבת בגוש המבודד').toContain(fn);
    }
    for (const kw of MONEY_WORDS) expect(block, 'גוש פרנסה׳לע מזכיר ' + kw).not.toContain(kw);
    expect(block, 'events — הלוח הראשי').not.toMatch(/\bevents\b/);
    // הכתיבות עצמן — רק לאוספי-המודול ול-ui (setDb((db) => ({ <key>: …)))
    const keys = [...block.matchAll(/setDb\(\(db\) => \(\{\s*([A-Za-z]+):/g)].map((m) => m[1]);
    expect(keys.length).toBeGreaterThan(8);
    for (const k of keys) expect(['prListings', 'prRequests', 'prPosts', 'prAds', 'ui'], 'כתיבה לאוסף זר: ' + k).toContain(k);
  });

  it('כל קבצי-המודול (מנוע + רכיבים): אפס מילות-כסף, אפס db.events, אפס ייבוא מעולם התרומות/הקבלות', () => {
    const files = Object.entries(MODULE_SRC);
    expect(files.length, 'ה-glob חי (מגן מפני סורק-ריק)').toBeGreaterThanOrEqual(6);
    for (const [path, src] of files) {
      for (const kw of MONEY_WORDS) expect(src, path + ' מזכיר ' + kw).not.toContain(kw);
      // הלוח-הראשי (db.events). 'events' לבדו הוא גם מפתח-השער "שמחות, קייטרינג וצילום" — לכן
      // נסרקות צורות-הגישה: ‎.events · מפתח-כתיבה events: · צפייה useDbWatch('events').
      expect(src, path + ' — גישה ל-.events').not.toMatch(/\.events\b/);
      expect(src, path + ' — כתיבת events:').not.toMatch(/[{,]\s*events\s*:/);
      expect(src, path + " — useDbWatch('events')").not.toMatch(/useDbWatch\([^)]*'events'/);
      expect(src, path + ' — ייבוא מ-supporters').not.toMatch(/from '[^']*supporters/);
      expect(src, path + ' — ייבוא מ-receipt').not.toMatch(/from '[^']*receipt/);
      expect(src, path + ' — downloadReceipt/printReceipt').not.toMatch(/downloadReceipt|printReceipt/);
    }
  });

  it('transitions.ts טהור: בלי store/DOM/Date.now — "עכשיו" מוזרק', () => {
    expect(transitionsSrc).not.toContain('useApp');
    expect(transitionsSrc).not.toMatch(/Date\.now\(|new Date\(\)/);
    expect(transitionsSrc).not.toMatch(/\bdocument\.|\bwindow\./);
  });
});

describe('📒 (ב) בנדל-ראשי — ה-store לא גורר את המנוע הכבד', () => {
  it('ה-store מייבא מהמודול רק transitions + model', () => {
    const fromParnasa = [...storeSrc.matchAll(/from '\.\.\/components\/parnasa\/([\w.]+)'/g)].map((m) => m[1]);
    expect(fromParnasa.length).toBeGreaterThan(0);
    for (const f of fromParnasa) expect(['transitions', 'model'], 'ייבוא כבד מהמודול לבנדל-הראשי: ' + f).toContain(f);
  });

  it('transitions.ts לא מייבא את המנוע הכבד (lib/zmanimBoard/booklet/search/hebrew/telephony)', () => {
    expect(transitionsSrc).not.toMatch(/from '\.\/(lib|zmanimBoard|booklet)'/);
    expect(transitionsSrc).not.toMatch(/from '[^']*\/(search|hebrew|telephony\/engine|payLink)'/);
  });
});

/* ═══════════════ store — עזרי-בדיקה ═══════════════ */

const GABBAI = 'gabbai@kehila.org';
const STAFF = 'staff@kehila.org';
const NOW = '2026-10-12T09:00:00.000Z';

function cfg(opts: { features?: Record<string, boolean>; moduleOn?: boolean } = {}): OrgConfig {
  return {
    ...DEFAULT_CONFIG,
    adminEmails: [GABBAI],
    modules: opts.moduleOn === false ? {} : { parnasa: true },
    features: { ...opts.features },
  };
}

let toasts: string[] = [];

/** מי מחובר: מייל (null = אופליין) + דגלים + מנהל-ארגון. */
function as(email: string | null, opts: { features?: Record<string, boolean>; moduleOn?: boolean; isManager?: boolean } = {}): void {
  const st = useApp.getState();
  useApp.setState({
    config: cfg(opts),
    cloud: { ...st.cloud, user: email ? { uid: 'u-' + email, email } : null, isManager: opts.isManager === true },
    toast: (m: string) => {
      toasts.push(m);
    },
  } as never);
}

function L(over: Partial<PrListing> = {}): PrListing {
  return {
    id: '', source: 'owner', name: 'אינסטלציה זילברמן', title: 'נזילות וסתימות', category: 'elec', area: 'בני ברק', city: 'בני ברק',
    phone: '050-0000101', phone2: '', whatsapp: '050-0000101', hours: [], always: false, hoursNote: '', services: [], languages: ['he'],
    kashrut: '', emergency: false, desc: '', notes: '', status: 'pending', dialCode: '', featuredUntil: '', recs: [], createdAt: '', updatedAt: '', ...over,
  };
}
function R(over: Partial<PrRequest> = {}): PrRequest {
  return {
    id: '', text: 'צריך אינסטלטור דחוף', category: 'elec', area: '', urgent: false, quiet: false, job: false,
    requester: { name: 'יעקב כהן', phone: '052-1234567' }, status: 'open', responses: [], createdAt: '', updatedAt: '', ...over,
  };
}
function P(over: Partial<PrPost> = {}): PrPost {
  return {
    id: '', kind: 'notice', title: 'שיעור חדש בשולחן ערוך', text: '', place: '', phone: '', noticeKind: 'shiur', prayers: [], days: [],
    date: '', time: '', until: '', approved: false, pinned: false, createdAt: '', updatedAt: '', ...over,
  };
}
function A(over: Partial<PrAd> = {}): PrAd {
  return {
    id: '', slot: 'booklet', kind: 'half', target: '', advertiser: 'מאפיית השכונה', headline: 'חלות לשבת', body: '', phone: '', from: '', to: '',
    price: 550, paid: false, paidAt: '', active: true, createdAt: '', updatedAt: '', ...over,
  };
}

function seed(over: Partial<Db> = {}): void {
  useApp.getState().setDb(() => ({ ...emptyDb(), ...over }));
  // setDb ממזג (audit/delLog שרדו מבדיקה קודמת) ומטביע מצבות לרשומות שהוחלפו — איפוס ישיר
  useApp.setState((s) => ({ db: { ...s.db, audit: [], delLog: [] } }));
}

const db = (): Db => useApp.getState().db;

beforeEach(() => {
  toasts = [];
  seed();
  as(GABBAI);
});

/* ═══════════════ (ג) מכונת-האישור ב-store ═══════════════ */

describe('📒 (ג) מכונת-האישור נאכפת ב-store', () => {
  it('עסק חדש של עובד/ת (לא-מאשר) ⇒ ממתין; שדות-גבאי (הדגשה/קוד/מקור) שנשלחו — נזרקים', () => {
    as(STAFF);
    const res = useApp.getState().upsertPrListing(L({ featuredUntil: '2027-01-01', dialCode: '555', source: 'gabbai' }));
    expect(res.ok).toBe(true);
    const l = db().prListings[0];
    expect(l.status).toBe('pending');
    expect(l.featuredUntil).toBe('');
    expect(l.dialCode).toBe('');
    expect(l.source).toBe('owner');
    expect(l.id).toMatch(/^prl/);
  });

  it('עסק חדש של הגבאי ⇒ מאושר מיד + קוד-החיוג הבא (101, לא ממחזר)', () => {
    const r = useApp.getState().upsertPrListing(L());
    expect(r.listing?.status).toBe('approved');
    expect(r.listing?.dialCode).toBe('101');
    const r2 = useApp.getState().upsertPrListing(L({ name: 'חשמל אור הגנוז' }));
    expect(r2.listing?.dialCode).toBe('102');
  });

  it('🛡 עריכת-תוכן של עסק מאושר ע"י לא-מאשר ⇒ חוזר לממתין; שינוי לא-תוכני (המלצה) ⇒ נשאר מאושר', () => {
    seed({ prListings: [L({ id: 'prl1', status: 'approved', dialCode: '101', createdAt: NOW, updatedAt: NOW })] });
    as(STAFF);
    const cur = db().prListings[0];
    useApp.getState().upsertPrListing({ ...cur, recs: [{ by: 'שכן', text: 'עבודה נקייה', at: NOW }] });
    expect(db().prListings[0].status).toBe('approved');
    useApp.getState().upsertPrListing({ ...db().prListings[0], title: 'נזילות, סתימות ודודי שמש' });
    expect(db().prListings[0].status).toBe('pending');
    expect(db().prListings[0].dialCode).toBe('101'); // הקוד נשמר — לא-מאשר לא נוגע
    expect(pendingApprovals(db(), '2026-10-12').listings.map((x) => x.id)).toEqual(['prl1']);
  });

  it('אישור-כבוי בהגדרות ⇒ עריכת לא-מאשר משאירה מאושר (כמו המקור)', () => {
    seed({ prListings: [L({ id: 'prl1', status: 'approved', createdAt: NOW, updatedAt: NOW })], ui: { ...emptyDb().ui, parnasa: { requireApproval: false } } });
    as(STAFF);
    useApp.getState().upsertPrListing({ ...db().prListings[0], title: 'כותרת חדשה' });
    expect(db().prListings[0].status).toBe('approved');
  });

  it('setPrStatus: עובד/ת בלי הרשאה ⇒ נדחה בלי שינוי ובלי לוג; גבאי ⇒ מאושר + חותמת + לוג; הדלקה-פר-עובד ⇒ מותר', () => {
    seed({ prListings: [L({ id: 'prl1', status: 'pending', createdAt: NOW, updatedAt: NOW })] });
    as(STAFF);
    expect(useApp.getState().setPrStatus('listing', 'prl1', 'approved')).toBe(false);
    expect(db().prListings[0].status).toBe('pending');
    expect(db().audit ?? []).toHaveLength(0);
    expect(toasts.join(' ')).toContain('גבאי');

    as(GABBAI);
    expect(useApp.getState().setPrStatus('listing', 'prl1', 'approved')).toBe(true);
    const l = db().prListings[0];
    expect(l.status).toBe('approved');
    expect(l.reviewedBy).toBe(GABBAI);
    expect(l.dialCode).toBe('101'); // אושר בלי קוד ⇒ הוקצה
    expect((db().audit ?? []).some((e) => e.act.startsWith('✓ אישור') && e.what === l.name)).toBe(true);

    as(STAFF, { features: { 'parnasa.approve': true } });
    expect(useApp.getState().setPrStatus('listing', 'prl1', 'rejected')).toBe(true);
    expect(db().prListings[0].status).toBe('rejected');
  });

  it('מנהל-ארגון (isManager) מאשר גם בלי להופיע ב-adminEmails; false מפורש מכבה גם לו', () => {
    seed({ prListings: [L({ id: 'prl1', status: 'pending' })] });
    as('boss@kehila.org', { isManager: true });
    expect(useApp.getState().setPrStatus('listing', 'prl1', 'approved')).toBe(true);
    as('boss@kehila.org', { isManager: true, features: { 'parnasa.approve': false } });
    expect(useApp.getState().setPrStatus('listing', 'prl1', 'rejected')).toBe(false);
    expect(db().prListings[0].status).toBe('approved');
  });

  it('מודול כבוי (opt-in — המפתח חסר) ⇒ אין סמכויות-גבאי בכלל, גם לגבאי', () => {
    seed({ prListings: [L({ id: 'prl1', status: 'pending' })] });
    as(GABBAI, { moduleOn: false });
    expect(useApp.getState().setPrStatus('listing', 'prl1', 'approved')).toBe(false);
    expect(useApp.getState().deletePrListing('prl1')).toBe(false);
    expect(useApp.getState().setParnasaPrefs({ communityName: 'x' })).toBe(false);
    expect(db().prListings).toHaveLength(1);
  });

  it('מחיקת עסק: עובד/ת בלי parnasa.delete ⇒ נדחה; גבאי ⇒ נמחק + מצבה + פרסומת-מקושרת מתנתקת', () => {
    seed({
      prListings: [L({ id: 'prl1', status: 'approved' })],
      prAds: [A({ id: 'pra1', slot: 'board', kind: 'line', target: 'prl1' }), A({ id: 'pra2', slot: 'category', kind: 'line', target: 'elec' })],
    });
    as(STAFF);
    expect(useApp.getState().deletePrListing('prl1')).toBe(false);
    expect(db().prListings).toHaveLength(1);
    as(GABBAI);
    expect(useApp.getState().deletePrListing('prl1')).toBe(true);
    expect(db().prListings).toHaveLength(0);
    expect((db().delLog ?? []).some((d) => d.col === 'prListings' && d.id === 'prl1')).toBe(true);
    expect(db().prAds.find((a) => a.id === 'pra1')?.target).toBe('');
    expect(db().prAds.find((a) => a.id === 'pra2')?.target).toBe('elec'); // חסות-שער — יעד הוא השער, לא העסק
  });

  it('קוד-חיוג של גבאי: לא-תקין / תפוס ⇒ נדחה בלי לצרוך מזהה', () => {
    seed({ prListings: [L({ id: 'prl1', status: 'approved', dialCode: '101' })] });
    const seq = db().seq;
    expect(useApp.getState().upsertPrListing(L({ dialCode: '99' })).ok).toBe(false);
    expect(useApp.getState().upsertPrListing(L({ dialCode: '101' })).ok).toBe(false);
    expect(db().seq).toBe(seq);
    expect(useApp.getState().upsertPrListing(L({ dialCode: '250' })).listing?.dialCode).toBe('250');
  });

  it('מודעות-לוח: של עובד/ת ⇒ ממתינה; של גבאי ⇒ נתלית; הורדה ⇒ לא-מאושרת ופגה (יוצאת גם מתור-הממתינים)', () => {
    as(STAFF);
    const a = useApp.getState().upsertPrPost(P());
    expect(a.post?.approved).toBe(false);
    as(GABBAI);
    const b = useApp.getState().upsertPrPost(P({ title: 'מניין ותיקין', kind: 'minyan', noticeKind: '' }));
    expect(b.post?.approved).toBe(true);
    const today = '2026-10-12';
    expect(pendingApprovals(db(), today).posts.map((p) => p.id)).toEqual([a.post!.id]);
    expect(useApp.getState().setPrStatus('post', b.post!.id, 'rejected')).toBe(true);
    const down = db().prPosts.find((p) => p.id === b.post!.id)!;
    expect(down.approved).toBe(false);
    expect(down.until).not.toBe('');
    expect(pendingApprovals(db(), '2999-01-01').posts.map((p) => p.id)).not.toContain(b.post!.id);
  });

  it('הגדרות המודול: עובד/ת ⇒ נדחה; גבאי ⇒ נשמר ומחוטא (תקרת-אורך), undefined מוחק מפתח', () => {
    as(STAFF);
    expect(useApp.getState().setParnasaPrefs({ requireApproval: false })).toBe(false);
    expect(db().ui.parnasa?.requireApproval).toBeUndefined();
    as(GABBAI);
    expect(useApp.getState().setParnasaPrefs({ communityName: 'א'.repeat(80), requireApproval: false })).toBe(true);
    expect(db().ui.parnasa?.communityName).toHaveLength(60);
    expect(db().ui.parnasa?.requireApproval).toBe(false);
    useApp.getState().setParnasaPrefs({ requireApproval: undefined });
    expect(db().ui.parnasa && 'requireApproval' in db().ui.parnasa!).toBe(false);
  });
});

/* ═══════════════ (ד) פרטיות-שקט ב-store ═══════════════ */

describe('📒 (ד) 🛡 פרטיות בקשה-שקטה ב-store', () => {
  it('שקטה לעולם לא הצעת-עבודה; פרטי-הפונה נשמרים לגבאי, ותצוגת-העסקים של הרשומה השמורה — בלי זהות', () => {
    const res = useApp.getState().upsertPrRequest(R({ quiet: true, job: true, text: 'מחפשת יועץ זוגי. אפשר 052-1234567' }));
    const r = res.request!;
    expect(r.job).toBe(false);
    expect(r.requester.name).toBe('יעקב כהן'); // אצל הגבאי (ניתוב אישי)
    const v = businessView(db().prRequests[0], Date.parse(NOW));
    expect(v.contact).toBeNull();
    expect(JSON.stringify(v)).not.toContain('יעקב');
    expect(v.text).not.toContain('1234567');
  });

  it('סגירת שקטה ⇒ נמחקת עם כל התשובות (מצבה = אוסף+מזהה בלבד); רגילה ⇒ נשמרת כסגורה', () => {
    seed({
      prListings: [L({ id: 'prl1', status: 'approved' })],
      prRequests: [
        R({ id: 'prq1', quiet: true, text: 'נושא רגיש', createdAt: NOW, updatedAt: NOW }),
        R({ id: 'prq2', createdAt: NOW, updatedAt: NOW }),
      ],
    });
    expect(useApp.getState().addPrResponse('prq1', { listingId: 'prl1', text: 'מטפלת מוסמכת, פגישה ראשונה בחינם' })).toBe(true);
    expect(db().prRequests.find((r) => r.id === 'prq1')?.responses).toHaveLength(1);
    expect(useApp.getState().closePrRequest('prq1')).toBe(true);
    expect(db().prRequests.find((r) => r.id === 'prq1')).toBeUndefined();
    const tomb = (db().delLog ?? []).find((d) => d.id === 'prq1');
    expect(tomb).toBeTruthy();
    expect(Object.keys(tomb!).sort()).toEqual(['at', 'col', 'id']);

    expect(useApp.getState().closePrRequest('prq2')).toBe(true);
    const closed = db().prRequests.find((r) => r.id === 'prq2')!;
    expect(closed.status).toBe('closed');
    expect(closed.closedAt).toBeTruthy();
    // נסגרה ⇒ מענה חדש נדחה
    expect(useApp.getState().addPrResponse('prq2', { listingId: 'prl1', text: 'מאוחר' })).toBe(false);
  });

  it('לוג-הפעולות לעולם לא מכיל טקסט/שם/טלפון של מבקש (יצירה, סגירה, מחיקה)', () => {
    const quiet = useApp.getState().upsertPrRequest(R({ quiet: true, text: 'בירורים לשידוך על משפחת לוי' })).request!;
    const reg = useApp.getState().upsertPrRequest(R({ text: 'מחפש מלמד לגמרא' })).request!;
    useApp.getState().closePrRequest(quiet.id);
    useApp.getState().deletePrRequest(reg.id);
    const log = JSON.stringify(db().audit ?? []);
    expect((db().audit ?? []).length).toBeGreaterThanOrEqual(3);
    for (const secret of ['יעקב', 'כהן', '1234567', 'שידוך', 'לוי', 'מלמד', 'גמרא']) expect(log, 'דליפה ללוג: ' + secret).not.toContain(secret);
  });

  it('עריכת בקשה לא נוגעת במחזור-החיים (סטטוס/תשובות) — רק addPrResponse/closePrRequest', () => {
    seed({
      prListings: [L({ id: 'prl1', status: 'approved' })],
      prRequests: [R({ id: 'prq1', createdAt: NOW, updatedAt: NOW })],
    });
    useApp.getState().addPrResponse('prq1', { listingId: 'prl1', text: 'זמין' });
    const cur = db().prRequests[0];
    expect(cur.status).toBe('answered');
    useApp.getState().upsertPrRequest({ ...cur, status: 'open', responses: [], text: 'צריך אינסטלטור היום' });
    const after = db().prRequests[0];
    expect(after.status).toBe('answered');
    expect(after.responses).toHaveLength(1);
    expect(after.text).toBe('צריך אינסטלטור היום');
  });
});

/* ═══════════════ (א) בידוד — התנהגותי ═══════════════ */

describe('📒 (א) בידוד — זרימה מלאה לא נוגעת במוני-הקבלות, בתורמים ובלוח-הראשי', () => {
  it('כל הפעולות יחד: receiptSeq/donationSeq/shopReceiptSeq לא זזים; supporters/events באותה הפניה', () => {
    seed({ receiptSeq: 41, donationSeq: 17, shopReceiptSeq: 9 });
    const before = db();
    const s = useApp.getState();
    const l = s.upsertPrListing(L()).listing!;
    s.setPrStatus('listing', l.id, 'rejected');
    s.setPrStatus('listing', l.id, 'approved');
    const r = s.upsertPrRequest(R()).request!;
    s.addPrResponse(r.id, { listingId: l.id, text: 'זמין' });
    s.closePrRequest(r.id);
    const p = s.upsertPrPost(P()).post!;
    s.setPrStatus('post', p.id, 'approved');
    const ad = s.upsertPrAd(A({ price: 1200, kind: 'full' })).ad!;
    s.upsertPrAd({ ...ad, paid: true });
    s.setParnasaPrefs({ contactPhone: '03-5555555' });
    s.deletePrAd(ad.id);
    s.deletePrPost(p.id);
    s.deletePrListing(l.id);
    const after = db();
    expect(after.receiptSeq).toBe(41);
    expect(after.donationSeq).toBe(17);
    expect(after.shopReceiptSeq).toBe(9);
    expect(after.supporters).toBe(before.supporters);
    expect(after.events).toBe(before.events);
    expect(after.enrollments).toBe(before.enrollments);
  });

  it('פרסומת: מחיר שלילי / חסות-שער בלי שער ⇒ נדחה; סימון-תשלום חותם paidAt וביטולו מנקה (רישום בלבד)', () => {
    expect(useApp.getState().upsertPrAd(A({ price: -5 })).ok).toBe(false);
    expect(useApp.getState().upsertPrAd(A({ slot: 'category', kind: 'line', target: 'nope' })).ok).toBe(false);
    expect(db().prAds).toHaveLength(0);
    const ad = useApp.getState().upsertPrAd(A({ slot: 'category', kind: 'full', target: 'elec' })).ad!;
    expect(ad.kind).toBe('line'); // חסות-שער ⇒ שורה (עקביות משבצת/גודל)
    const paid = useApp.getState().upsertPrAd({ ...ad, paid: true }).ad!;
    expect(paid.paidAt).not.toBe('');
    const again = useApp.getState().upsertPrAd({ ...paid, headline: 'שורה חדשה' }).ad!;
    expect(again.paidAt).toBe(paid.paidAt); // עריכה חוזרת לא מזיזה את חותמת-התשלום
    expect(useApp.getState().upsertPrAd({ ...again, paid: false }).ad!.paidAt).toBe('');
  });
});
