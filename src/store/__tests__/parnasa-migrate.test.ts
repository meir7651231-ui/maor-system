/**
 * ratchet — שכבת-הנתונים של פרנסה׳לע (אשכול 2, BUILD-ORDER-PARNASA-2026-10-12).
 *
 * תוספת אדיטיבית: DB_VERSION נשאר 6 — גיבוי/ענן ישן בלי ארבעת האוספים נטען עם [].
 * הריפוי (migrate + המיזוג-החי, מודל משותף parnasa/model.ts) מתקן רק שדה שבור:
 *   · מערך מקונן חסר ⇒ [] (hours/services/recs/languages · responses · prayers/days) — בלעדיו
 *     המנוע/הממשק קורס על `.map` של undefined מרשומה פגומה אחת (הלקח של ayin/tasks/events).
 *   · enum זר ⇒ ברירת-מחדל **בטוחה**: סטטוס-עסק ⇒ 'pending' ו-approved ⇒ false (fail-closed —
 *     רשומה פגומה לא "מתפרסמת" בשקט), סוג/משבצת זרים ⇒ ברירת-מחדל.
 *   · רשומה תקינה ⇒ **אותה הפניה** (ביט-זהה ⇒ אין כתיבה-חוזרת לענן / לולאת-הד).
 *   · מפתח לא-מוכר נשמר (תאימות-קדימה — מכשיר ישן לא מוחק שדה של גרסה חדשה).
 * וגם: ארבעת האוספים מסונכרנים (ENTITY_COLLECTIONS ‏23→27), מגובים בלילה (BACKUP_COLLECTIONS),
 * ומתויגים בשחזור/בהסרת-הדמו.
 */
import { describe, expect, it } from 'vitest';
import { migrate } from '../persist';
import { diffDb, ENTITY_COLLECTIONS } from '../../lib/cloud-diff';
import { applyEntityPartial, sanitizeIncoming } from '../../lib/cloud-merge';
import { PURGE_LABELS } from '../../lib/demoPurge';
import {
  DB_VERSION,
  emptyDb,
  type Db,
  type PrAd,
  type PrListing,
  type PrPost,
  type PrRequest,
} from '../../types/domain';
import { healParnasaPrefs, healPrCollection, PR_COLLECTIONS } from '../../components/parnasa/model';
import functionsSrc from '../../../functions/index.js?raw';
import backupSectionSrc from '../../components/settings/BackupSection.tsx?raw';
import modelSrc from '../../components/parnasa/model.ts?raw';

function listing(over: Partial<PrListing> = {}): PrListing {
  return {
    id: 'prl1',
    source: 'owner',
    name: 'אינסטלציה זילברמן',
    title: 'נזילות, סתימות ודודים',
    category: 'elec',
    area: 'גוש דן',
    city: 'בני ברק',
    phone: '050-0000101',
    phone2: '',
    whatsapp: '050-0000101',
    hours: [{ dow: 0, from: '08:00', to: '19:00' }],
    always: false,
    hoursNote: '',
    services: [{ name: 'פתיחת סתימה', price: '250', note: '' }],
    languages: ['he', 'yi'],
    kashrut: '',
    emergency: true,
    desc: '',
    notes: '',
    status: 'approved',
    dialCode: '101',
    featuredUntil: '',
    recs: [],
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
    ...over,
  };
}
function request(over: Partial<PrRequest> = {}): PrRequest {
  return {
    id: 'prq1',
    text: 'נזילה מתחת לכיור',
    category: 'elec',
    area: 'בני ברק',
    urgent: false,
    quiet: false,
    job: false,
    requester: { name: 'ר׳ משה', phone: '052-1111111' },
    status: 'open',
    responses: [],
    createdAt: '2026-10-12T08:00:00.000Z',
    updatedAt: '2026-10-12T08:00:00.000Z',
    ...over,
  };
}
function post(over: Partial<PrPost> = {}): PrPost {
  return {
    id: 'prp1',
    kind: 'minyan',
    title: 'בית המדרש הגדול',
    text: '',
    place: 'רחוב החסידים 2',
    phone: '',
    noticeKind: '',
    prayers: [{ prayer: 'מנחה', times: ['sh-15', '13:30'] }],
    days: [],
    date: '',
    time: '',
    until: '',
    approved: true,
    pinned: false,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
    ...over,
  };
}
function ad(over: Partial<PrAd> = {}): PrAd {
  return {
    id: 'pra1',
    slot: 'booklet',
    kind: 'half',
    target: '',
    advertiser: 'מאפיית אבי',
    headline: 'חלות לשבת',
    body: 'הזמנות עד חמישי',
    phone: '050-0000110',
    from: '2026-10-01',
    to: '2027-09-30',
    price: 550,
    paid: false,
    paidAt: '',
    active: true,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
    ...over,
  };
}
const raw = (over: Record<string, unknown>) => ({ ...emptyDb(), ...over }) as unknown as Record<string, unknown>;

describe('📒 ratchet — פרנסה׳לע 2: מיגרציה אדיטיבית (DB_VERSION נשאר 6)', () => {
  it('(א) גיבוי ישן בלי ארבעת האוספים — נטען עם [] לכולם, v=6', () => {
    const old = { ...emptyDb(), v: DB_VERSION } as Record<string, unknown>;
    for (const col of PR_COLLECTIONS) delete old[col];
    const out = migrate(old)!;
    for (const col of PR_COLLECTIONS) expect(out[col]).toEqual([]);
    expect(out.v).toBe(6);
    expect(DB_VERSION).toBe(6);
    expect(out.ui.parnasa).toBeUndefined(); // ui בלי parnasa — ללא נגיעה
  });

  it('(ב) נתונים תקינים — ביט-זהים: אותה הפניה לרשומה (ולמערך) — אין כתיבה-חוזרת לענן', () => {
    const L = listing();
    const R = request();
    const P = post();
    const A = ad();
    const lists = { prListings: [L], prRequests: [R], prPosts: [P], prAds: [A] };
    const out = migrate(raw(lists))!;
    expect(out.prListings[0]).toBe(L);
    expect(out.prRequests[0]).toBe(R);
    expect(out.prPosts[0]).toBe(P);
    expect(out.prAds[0]).toBe(A);
    for (const col of PR_COLLECTIONS) expect(healPrCollection(col, lists[col])).toBe(lists[col]);
  });

  it('(ג) עסק פגום — status/category/source זרים ⇒ pending/other/owner; מערכים ⇒ []; dialCode מספרי ⇒ מחרוזת', () => {
    const bad = {
      ...listing(),
      status: 'live',
      category: 'plumbing',
      source: 'robot',
      hours: null,
      services: 'פתיחת סתימה',
      recs: undefined,
      languages: ['he', 7],
      dialCode: 102,
      featuredUntil: 'מחר',
      name: undefined,
      aud: 'kids',
      futureField: 'נשמר',
    };
    const out = migrate(raw({ prListings: [bad, null, 'x'] }))!;
    expect(out.prListings).toHaveLength(1); // null/'x' נזרקים
    const l = out.prListings[0];
    expect(l.status).toBe('pending'); // fail-closed — לא מתפרסם בשקט
    expect(l.category).toBe('other');
    expect(l.source).toBe('owner');
    expect(l.hours).toEqual([]);
    expect(l.services).toEqual([]);
    expect(l.recs).toEqual([]);
    expect(l.languages).toEqual(['he']);
    expect(l.dialCode).toBe('102');
    expect(l.featuredUntil).toBe('');
    expect(l.name).toBe('');
    expect(l.aud).toBe('all');
    expect((l as unknown as Record<string, unknown>).futureField).toBe('נשמר'); // תאימות-קדימה
    expect(l.title).toBe('נזילות, סתימות ודודים'); // שדה תקין לא נגע
  });

  it('(ד) רשומה בלי מזהה מקבלת מזהה-חירום ייחודי (prlx<i>) — לא נעלמת', () => {
    const { id: _drop, ...noId } = listing({ name: 'בלי מזהה' });
    const out = migrate(raw({ prListings: [listing(), noId] }))!;
    expect(out.prListings.map((x) => x.id)).toEqual(['prl1', 'prlx1']);
    // ריצה חוזרת — יציב (המזהה כבר קיים)
    const again = migrate(out as unknown as Record<string, unknown>)!;
    expect(again.prListings.map((x) => x.id)).toEqual(['prl1', 'prlx1']);
  });

  it('(ה) בקשה פגומה — status זר ⇒ open; responses ⇒ []; requester חסר ⇒ {name,phone}; quiet+job ⇒ job=false', () => {
    const bad = { ...request(), status: 'pending', responses: null, requester: 'ר׳ משה', quiet: true, job: true, category: 'xyz' };
    const out = migrate(raw({ prRequests: [bad] }))!;
    const r = out.prRequests[0];
    expect(r.status).toBe('open');
    expect(r.responses).toEqual([]);
    expect(r.requester).toEqual({ name: '', phone: '' });
    expect(r.quiet).toBe(true);
    expect(r.job).toBe(false); // בקשה שקטה לעולם אינה הצעת-עבודה
    expect(r.category).toBe(''); // "לא משנה"
    const partial = { ...request(), requester: { name: 'א' } };
    expect(migrate(raw({ prRequests: [partial] }))!.prRequests[0].requester).toEqual({ name: 'א', phone: '' });
  });

  it('(ה2) עיצוב 5 — משרה מקודמת (promoAt/promoPrice) ומחיר "משרה מקודמת" (job): תקין ⇒ אותה הפניה; זר ⇒ נמחק', () => {
    const ok = { ...request(), job: true, promoAt: '2026-10-12T09:00:00.000Z', promoPrice: 90 };
    const out = migrate(raw({ prRequests: [ok] }))!;
    expect(out.prRequests[0]).toBe(ok as unknown as PrRequest);
    const bad = { ...request(), job: true, promoAt: 5, promoPrice: -1 };
    const fixed = migrate(raw({ prRequests: [bad] }))!.prRequests[0];
    expect(fixed.promoAt).toBeUndefined();
    expect(fixed.promoPrice).toBeUndefined();
    expect(healParnasaPrefs({ prices: { job: 120 } })).toEqual({ prices: { job: 120 } });
    expect(healParnasaPrefs({ prices: { job: -5 } })).toEqual({ prices: {} });
  });

  it('(ו) מודעה פגומה — kind זר ⇒ notice; approved לא-בוליאני ⇒ false; prayers/days מתוקנים', () => {
    const bad = {
      ...post(),
      kind: 'ad',
      approved: 'yes',
      prayers: [{ prayer: 'שחרית', times: null }, null, { prayer: 'מעריב', times: ['tz+0', 5] }],
      days: [1, 9, 'x', 6],
      noticeKind: 'party',
      until: '31/12',
    };
    const p = migrate(raw({ prPosts: [bad] }))!.prPosts[0];
    expect(p.kind).toBe('notice');
    expect(p.approved).toBe(false); // fail-closed — לא נתלה בלוח בלי אישור
    expect(p.prayers).toEqual([
      { prayer: 'שחרית', times: [] },
      { prayer: 'מעריב', times: ['tz+0'] },
    ]);
    expect(p.days).toEqual([1, 6]);
    expect(p.noticeKind).toBe('');
    expect(p.until).toBe('');
  });

  it('(ז) פרסומת פגומה — slot זר ⇒ booklet+half; kind לא-עקבי מתוקן; מחיר שלילי ⇒ 0; active חסר ⇒ true', () => {
    const { active: _a, ...noActive } = ad();
    const out = migrate(
      raw({
        prAds: [
          { ...noActive, slot: 'banner', kind: 'giant', price: -5 },
          { ...ad({ id: 'pra2' }), slot: 'category', kind: 'full', target: 'food' },
          { ...ad({ id: 'pra3' }), slot: 'booklet', kind: 'line' },
        ],
      }),
    )!;
    const [a1, a2, a3] = out.prAds;
    expect([a1.slot, a1.kind, a1.price, a1.active]).toEqual(['booklet', 'half', 0, true]);
    expect([a2.slot, a2.kind]).toEqual(['category', 'line']); // חסות-שער = שורה, לא עמוד
    expect([a3.slot, a3.kind]).toEqual(['booklet', 'half']);
  });

  it('(ח) db.ui.parnasa — מחוטא רק כשקיים; מפתח-ידוע לא-תקין נמחק; מפתח לא-מוכר נשמר; תקין ⇒ אותה הפניה', () => {
    const good = { communityName: 'קהילת בעלזא', requireApproval: true, zmanim: { city: 'bneibrak', candleMin: 22 } };
    const outGood = migrate(raw({ ui: { famView: 'list', crsView: 'grid', parnasa: good } }))!;
    expect(outGood.ui.parnasa).toBe(good);
    const messy = {
      communityName: 'א'.repeat(100),
      requireApproval: 'כן',
      dedication: 42,
      prices: { featured: 50, sponsor: -1, half: 'זול', future: 9 },
      zmanim: { lat: 95, lon: 34.8, tz: 'Mars/Olympus', candleMin: 18.6, tzeisMin: 500, label: 7, elevation: 50 },
      futureKey: { x: 1 },
    };
    const p = migrate(raw({ ui: { famView: 'list', crsView: 'grid', parnasa: messy } }))!.ui.parnasa!;
    expect(p.communityName).toHaveLength(60);
    expect(p.requireApproval).toBeUndefined();
    expect(p.dedication).toBeUndefined();
    expect(p.prices).toEqual({ featured: 50, future: 9 });
    expect(p.zmanim).toEqual({ lon: 34.8, candleMin: 19, elevation: 50 });
    expect((p as Record<string, unknown>).futureKey).toEqual({ x: 1 });
    expect(healParnasaPrefs('garbage')).toEqual({});
    expect(healParnasaPrefs({ zmanim: { tz: 'Asia/Jerusalem' } })).toEqual({ zmanim: { tz: 'Asia/Jerusalem' } });
  });

  it('(ט) cloud-diff מזהה set ו-delete בכל אחד מארבעת האוספים', () => {
    const prev: Db = { ...emptyDb(), prListings: [listing(), listing({ id: 'prl2' })], prRequests: [request(), request({ id: 'prq2' })], prPosts: [post(), post({ id: 'prp2' })], prAds: [ad(), ad({ id: 'pra2' })] };
    const next: Db = { ...emptyDb(), prListings: [listing({ name: 'שונה' })], prRequests: [request({ status: 'closed' })], prPosts: [post({ title: 'שונה' })], prAds: [ad({ paid: true })] };
    const d = diffDb(prev, next);
    for (const [col, id1, id2] of [
      ['prListings', 'prl1', 'prl2'],
      ['prRequests', 'prq1', 'prq2'],
      ['prPosts', 'prp1', 'prp2'],
      ['prAds', 'pra1', 'pra2'],
    ]) {
      expect(d.sets.some((s) => s.col === col && s.id === id1), col + ' set').toBe(true);
      expect(d.deletes.some((x) => x.col === col && x.id === id2), col + ' delete').toBe(true);
    }
  });

  it('(י) המיזוג-החי (applyEntityPartial) מרפא מערכים מקוננים ו-enum-ים — כמו migrate', () => {
    let db: Db = { ...emptyDb() };
    db = applyEntityPartial(db, 'prListings', [{ id: 'prl9', data: { name: 'מיזוג קרליבך', status: 'weird' }, deleted: false }]);
    const l = db.prListings.find((x) => x.id === 'prl9')!;
    expect(l.hours).toEqual([]);
    expect(l.services).toEqual([]);
    expect(l.recs).toEqual([]);
    expect(l.languages).toEqual([]);
    expect(l.status).toBe('pending');
    expect(l.category).toBe('other');
    db = applyEntityPartial(db, 'prRequests', [{ id: 'prq9', data: { text: 'דחוף חשמלאי', quiet: true, job: true }, deleted: false }]);
    const r = db.prRequests.find((x) => x.id === 'prq9')!;
    expect(r.responses).toEqual([]);
    expect(r.requester).toEqual({ name: '', phone: '' });
    expect(r.job).toBe(false);
    db = applyEntityPartial(db, 'prPosts', [{ id: 'prp9', data: { kind: 'minyan', title: 'שטיבל' }, deleted: false }]);
    const p = db.prPosts.find((x) => x.id === 'prp9')!;
    expect(p.prayers).toEqual([]);
    expect(p.days).toEqual([]);
    expect(p.approved).toBe(false);
    db = applyEntityPartial(db, 'prAds', [{ id: 'pra9', data: { slot: 'board' }, deleted: false }]);
    expect(db.prAds.find((x) => x.id === 'pra9')!.kind).toBe('line');
    // רשומה תקינה מהענן — נשארת ביט-זהה אחרי sanitizeIncoming
    const ok = listing({ id: 'prl8' }) as unknown as Record<string, unknown>;
    expect(sanitizeIncoming('prListings', ok)).toBe(ok);
    const okReq = request({ id: 'prq8' }) as unknown as Record<string, unknown>;
    expect(sanitizeIncoming('prRequests', okReq)).toBe(okReq);
    // מחיקה מרוחקת מוחלת
    db = applyEntityPartial(db, 'prListings', [{ id: 'prl9', data: null, deleted: true }]);
    expect(db.prListings.some((x) => x.id === 'prl9')).toBe(false);
  });

  it('(יא) סנכרון-סכמה: 27⇒30 אוספים (+3 של אירוח, 12.10) · emptyDb · BACKUP-השרת (רשומה בלבד, בלי פריסה) · תוויות שחזור/דמו', () => {
    expect(ENTITY_COLLECTIONS).toHaveLength(30);
    for (const col of PR_COLLECTIONS) {
      expect(ENTITY_COLLECTIONS).toContain(col);
      expect(emptyDb()[col]).toEqual([]);
      expect(functionsSrc, col + ' חסר ב-BACKUP_COLLECTIONS').toContain("'" + col + "'");
      expect(PURGE_LABELS[col], col + ' בלי תווית בהסרת-הדמו').toBeTruthy();
      expect(backupSectionSrc, col + ' בלי תווית בשחזור').toMatch(new RegExp('\\b' + col + ": '"));
    }
  });

  it('🛡 בידוד (הכרעה 4): מודל-הנתונים לא נוגע בקבלות/תרומות/מונים/לוח-ראשי', () => {
    for (const kw of ['receiptSeq', 'donationSeq', 'shopReceiptSeq', 'donations', 'upsertEvent', 'OrgEvent']) {
      expect(modelSrc, 'parnasa/model.ts מזכיר ' + kw).not.toContain(kw);
    }
    // 'events' כאן הוא מפתח שער-המקצוע (שמחות) — אסור רק האוסף db.events של הלוח הראשי
    expect(modelSrc).not.toMatch(/\bdb\.events\b|\bevents:\s*\[/);
  });
});
