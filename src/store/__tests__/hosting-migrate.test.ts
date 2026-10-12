/**
 * ratchet — שכבת-הנתונים של "אירוח משפחתי" (אשכול 2, BUILD-ORDER-HOSTING-2026-10-12).
 *
 * תוספת אדיטיבית: DB_VERSION נשאר 6 — גיבוי/ענן ישן בלי שלושת האוספים נטען עם [].
 * הריפוי (migrate + המיזוג-החי, מודל משותף hosting/model.ts) מתקן רק שדה שבור:
 *   · מערך מקונן חסר ⇒ [] (subRooms · roomIds/charges/payments · diners/items/seatPlan · ingredients/steps) —
 *     בלעדיו המנוע/הממשק קורס על `.reduce` של undefined (תיק-השהייה!) מרשומה פגומה אחת.
 *   · סטטוס/סוג זר ⇒ ברירת-מחדל בטוחה: הזמנה ⇒ 'pending' (חוסמת-זמינות — לא נוצר overbooking בשקט),
 *     חיוב ⇒ 'extra', ארוחה ⇒ 'new', קריאה ⇒ 'open'/P3, שולחן ⇒ 'round'.
 *   · רשומה תקינה ⇒ **אותה הפניה** (ביט-זהה ⇒ אין כתיבה-חוזרת לענן / לולאת-הד).
 *   · מפתח לא-מוכר נשמר; רשומה מסוג לא-מוכר נשמרת כמות-שהיא (תאימות-קדימה); kind חסר ⇒ נזרקת.
 * וגם: שלושת האוספים מסונכרנים (ENTITY_COLLECTIONS ‏27→30), מגובים בלילה (BACKUP_COLLECTIONS),
 * ומתויגים בשחזור/בהסרת-הדמו; והמודל לא נוגע בכסף/קבלות/לוח-ראשי/חדרי-חוגים.
 */
import { describe, expect, it } from 'vitest';
import { migrate } from '../persist';
import { diffDb, ENTITY_COLLECTIONS } from '../../lib/cloud-diff';
import { applyEntityPartial, sanitizeIncoming } from '../../lib/cloud-merge';
import { PURGE_LABELS } from '../../lib/demoPurge';
import { DB_VERSION, emptyDb, type Db, type HostBooking, type HostGuest, type HostMeal, type HostUnit } from '../../types/domain';
import { healHostCollection, healHostingPrefs, HOST_COLLECTIONS } from '../../components/hosting/model';
import functionsSrc from '../../../functions/index.js?raw';
import backupSectionSrc from '../../components/settings/BackupSection.tsx?raw';
import modelSrc from '../../components/hosting/model.ts?raw';

const AT = '2026-10-12T08:00:00.000Z';

function unit(over: Partial<HostUnit> = {}): HostUnit {
  return {
    id: 'hu1',
    name: 'צימר הגפן',
    type: 'צימר',
    beds: 4,
    cap: 6,
    rate: 800,
    status: 'free',
    subRooms: [{ id: 'r1', name: 'חדר הורים', beds: 2, rate: 450 }],
    createdAt: AT,
    updatedAt: AT,
    ...over,
  };
}
function booking(over: Partial<HostBooking> = {}): HostBooking {
  return {
    id: 'hb1',
    guestId: 'hr1',
    unitId: 'hu1',
    roomIds: ['r1'],
    checkIn: '2026-10-14',
    checkOut: '2026-10-16',
    adults: 2,
    kids: 3,
    status: 'confirmed',
    charges: [
      { id: 'c1', kind: 'stay', label: 'לינה · 2 לילות · חדר הורים', amount: 900 },
      { id: 'c2', kind: 'cleaning', label: 'דמי ניקיון', amount: 150 },
      { id: 'c3', kind: 'tax', label: 'מע״מ 17%', amount: 179 },
    ],
    payments: [{ id: 'p1', amount: 500, date: '2026-10-12', note: 'מקדמה' }],
    notes: '',
    shabbat: false,
    createdAt: AT,
    updatedAt: AT,
    ...over,
  };
}
function guest(over: Partial<HostGuest> = {}): HostGuest {
  return { id: 'hr1', kind: 'guest', name: 'משפחת כהן', phone: '050-1234567', email: '', adults: 2, kids: 3, notes: 'אלרגיה לבוטנים', createdAt: AT, updatedAt: AT, ...over };
}
function meal(over: Partial<HostMeal> = {}): HostMeal {
  return {
    id: 'hr2',
    kind: 'meal',
    mealName: 'ארוחת ערב שבת',
    bookingId: 'hb1',
    unitId: 'hu1',
    guestId: 'hr1',
    diners: [{ guestId: 'hr1', adults: 2, kids: 3 }],
    dinerCount: 5,
    date: '2026-10-16',
    time: '19:00',
    cook: '',
    server: '',
    clearer: '',
    tableSetter: '',
    items: [{ name: 'עוף בתנור', price: 60, qty: 5, alg: '', by: '' }],
    status: 'new',
    allergens: '',
    notes: '',
    seatPlan: { people: [], tables: [] },
    createdAt: AT,
    updatedAt: AT,
    ...over,
  };
}
const raw = (over: Record<string, unknown>) => ({ ...emptyDb(), ...over }) as unknown as Record<string, unknown>;

describe('🏡 ratchet — אירוח 2: מיגרציה אדיטיבית (DB_VERSION נשאר 6)', () => {
  it('(א) גיבוי ישן בלי שלושת האוספים — נטען עם [] לכולם, v=6, ui בלי hosting', () => {
    const old = { ...emptyDb(), v: DB_VERSION } as Record<string, unknown>;
    for (const col of HOST_COLLECTIONS) delete old[col];
    const out = migrate(old)!;
    for (const col of HOST_COLLECTIONS) expect(out[col]).toEqual([]);
    expect(out.v).toBe(6);
    expect(DB_VERSION).toBe(6);
    expect(out.ui.hosting).toBeUndefined();
  });

  it('(ב) נתונים תקינים — ביט-זהים: אותה הפניה לרשומה ולמערך (אין כתיבה-חוזרת לענן)', () => {
    const U = unit();
    const B = booking();
    const G = guest();
    const M = meal();
    const lists = { hostUnits: [U], hostBookings: [B], hostRecords: [G, M] };
    const out = migrate(raw(lists))!;
    expect(out.hostUnits[0]).toBe(U);
    expect(out.hostBookings[0]).toBe(B);
    expect(out.hostRecords[0]).toBe(G);
    expect(out.hostRecords[1]).toBe(M);
    for (const col of HOST_COLLECTIONS) expect(healHostCollection(col, lists[col])).toBe(lists[col]);
  });

  it('(ג) יחידה פגומה — status זר ⇒ free; מספרים ⇒ 0/עיגול; חדר בלי מזהה ⇒ מזהה-מקומי; מפתח לא-מוכר נשמר', () => {
    const bad = { ...unit(), status: 'inspection', beds: -2, cap: 5.6, rate: 'יקר', subRooms: [{ name: 'חדר ילדים', beds: 3 }, null, 'x'], name: undefined, futureField: 'נשמר' };
    const out = migrate(raw({ hostUnits: [bad, null, 'x'] }))!;
    expect(out.hostUnits).toHaveLength(1);
    const u = out.hostUnits[0];
    expect(u.status).toBe('free');
    expect(u.beds).toBe(0);
    expect(u.cap).toBe(6);
    expect(u.rate).toBe(0);
    expect(u.name).toBe('');
    expect(u.subRooms).toEqual([{ id: 'rx0', name: 'חדר ילדים', beds: 3, rate: 0 }]);
    expect((u as unknown as Record<string, unknown>).futureField).toBe('נשמר');
    expect(migrate(raw({ hostUnits: [{ ...unit(), subRooms: undefined }] }))!.hostUnits[0].subRooms).toEqual([]);
  });

  it('(ד) רשומה בלי מזהה מקבלת מזהה-חירום ייחודי (hrx<i>) — יציב בריצה חוזרת', () => {
    const { id: _drop, ...noId } = guest({ name: 'בלי מזהה' });
    const out = migrate(raw({ hostRecords: [guest(), noId] }))!;
    expect(out.hostRecords.map((x) => x.id)).toEqual(['hr1', 'hrx1']);
    const again = migrate(out as unknown as Record<string, unknown>)!;
    expect(again.hostRecords.map((x) => x.id)).toEqual(['hr1', 'hrx1']);
  });

  it('(ה) הזמנה פגומה — status זר ⇒ pending (חוסם-זמינות); תאריך לא-ISO ⇒ ""; חיובים/תשלומים מתוקנים', () => {
    const bad = {
      ...booking(),
      status: 'checked-in',
      checkIn: '14/10/2026',
      roomIds: ['r1', 7],
      charges: [{ kind: 'vip', label: 'שדרוג', amount: 'מאה' }, null, { id: 'c9', kind: 'meal', label: 'מטבח', amount: 300, mealId: 'hr2' }],
      payments: 'מזומן',
      shabbat: 'כן',
      adults: '2',
    };
    const b = migrate(raw({ hostBookings: [bad] }))!.hostBookings[0];
    expect(b.status).toBe('pending');
    expect(b.checkIn).toBe('');
    expect(b.checkOut).toBe('2026-10-16');
    expect(b.roomIds).toEqual(['r1']);
    expect(b.charges).toEqual([
      { id: 'cx0', kind: 'extra', label: 'שדרוג', amount: 0 },
      { id: 'c9', kind: 'meal', label: 'מטבח', amount: 300, mealId: 'hr2' },
    ]);
    expect(b.payments).toEqual([]);
    expect(b.shabbat).toBe(false);
    expect(b.adults).toBe(0);
  });

  it('(ו) רשומות פר-סוג: אורח/ניקיון/ארוחה/מנה/קריאה/טמפ׳ מתוקנים; סוג לא-מוכר נשמר; kind חסר ⇒ נזרקת', () => {
    const recs = [
      { ...guest(), adults: -1, kids: 'שלושה' },
      { id: 'hr3', kind: 'clean', unitId: 'hu1', type: 'ניקיון יומי', status: 'dirty', date: 'היום' },
      { ...meal(), status: 'burnt', diners: [{ guestId: 'hr1', adults: 'x' }, 5], items: [{ name: 'סלט', price: -3, qty: 0 }], seatPlan: { people: [{ name: 'אבא' }], tables: [{ id: 't1', name: 'ראשי', cap: 0, shape: 'oval', seated: ['sp1', 2] }] } },
      { id: 'hr4', kind: 'dish', name: 'חלה', baseServings: 0, ingredients: 'קמח', steps: ['ללוש', 4] },
      { id: 'hr5', kind: 'fault', desc: 'נזילה', priority: 9, status: 'closed', blocked: 'yes' },
      { id: 'hr6', kind: 'temp', device: 'מקרר', temp: 'קר', ok: 1 },
      { id: 'hr7', kind: 'hologram', anything: { a: 1 } },
      { id: 'hr8', name: 'בלי kind' },
    ];
    const out = migrate(raw({ hostRecords: recs }))!.hostRecords;
    expect(out.map((r) => r.id)).toEqual(['hr1', 'hr3', 'hr2', 'hr4', 'hr5', 'hr6', 'hr7']);
    const g = out[0] as HostGuest;
    expect([g.adults, g.kids]).toEqual([0, 0]);
    const c = out[1] as unknown as Record<string, unknown>;
    expect([c.status, c.date]).toEqual(['open', '']);
    const m = out[2] as HostMeal;
    expect(m.status).toBe('new');
    expect(m.diners).toEqual([{ guestId: 'hr1', adults: 0, kids: 0 }]);
    expect(m.items).toEqual([{ name: 'סלט', price: 0, qty: 1, alg: '', by: '' }]);
    expect(m.seatPlan.people).toEqual([{ id: 'spx0', name: 'אבא' }]);
    expect(m.seatPlan.tables[0]).toMatchObject({ id: 't1', cap: 8, shape: 'round', seated: ['sp1'], head: false, chair: '', note: '' });
    const d = out[3] as unknown as Record<string, unknown>;
    expect([d.baseServings, d.ingredients, d.steps, d.price]).toEqual([4, [], ['ללוש'], 0]);
    const f = out[4] as unknown as Record<string, unknown>;
    expect([f.priority, f.status, f.blocked, f.unitId]).toEqual([3, 'open', false, '']);
    const t = out[5] as unknown as Record<string, unknown>;
    expect([t.temp, t.ok]).toEqual([0, false]);
    expect(out[6]).toBe(recs[6]); // סוג לא-מוכר — כמות-שהוא (תאימות-קדימה)
    // ארוחה בלי seatPlan ⇒ תוכנית ריקה (הממשק מניח people/tables)
    expect((migrate(raw({ hostRecords: [{ ...meal(), seatPlan: undefined }] }))!.hostRecords[0] as HostMeal).seatPlan).toEqual({ people: [], tables: [] });
  });

  it('(ז) db.ui.hosting — מחוטא רק כשקיים; מפתח-ידוע לא-תקין נמחק; לא-מוכר נשמר; תקין ⇒ אותה הפניה', () => {
    const good = { businessName: 'צימרי הגליל', checkin: '14:00', cleaningFee: 120, shabbat: { mode: 'prep' as const, candle: '17:42' }, shopGot: { 'ing:קמח': true as const } };
    const outGood = migrate(raw({ ui: { famView: 'list', crsView: 'grid', hosting: good } }))!;
    expect(outGood.ui.hosting).toBe(good);
    const messy = {
      businessName: 'א'.repeat(90),
      checkin: '25:00',
      checkout: '11:00',
      cleaningFee: -5,
      taxPct: 117,
      orderLeadDays: 2.6,
      familyTerm: 'כן',
      shabbat: { mode: 'yomtov', candle: '7pm', havdalah: '', level: 'מהדרין'.repeat(20), extra: 1 },
      shopGot: { a: true, b: false, c: 'yes' },
      shopEmoji: { a: '🍞', b: '', c: 'x'.repeat(40) },
      futureKey: { x: 1 },
    };
    const p = migrate(raw({ ui: { famView: 'list', crsView: 'grid', hosting: messy } }))!.ui.hosting!;
    expect(p.businessName).toHaveLength(60);
    expect(p.checkin).toBeUndefined();
    expect(p.checkout).toBe('11:00');
    expect(p.cleaningFee).toBeUndefined();
    expect(p.taxPct).toBeUndefined();
    expect(p.orderLeadDays).toBe(3);
    expect(p.familyTerm).toBeUndefined();
    expect(p.shabbat).toEqual({ havdalah: '', level: 'מהדרין'.repeat(20).slice(0, 60), extra: 1 });
    expect(p.shopGot).toEqual({ a: true });
    expect(p.shopEmoji).toEqual({ a: '🍞' });
    expect((p as Record<string, unknown>).futureKey).toEqual({ x: 1 });
    expect(healHostingPrefs('garbage')).toEqual({});
    expect(healHostingPrefs({ taxPct: 0 })).toEqual({ taxPct: 0 });
  });

  it('(ח) cloud-diff מזהה set ו-delete בכל אחד משלושת האוספים', () => {
    const prev: Db = { ...emptyDb(), hostUnits: [unit(), unit({ id: 'hu2' })], hostBookings: [booking(), booking({ id: 'hb2' })], hostRecords: [guest(), guest({ id: 'hr9' })] };
    const next: Db = { ...emptyDb(), hostUnits: [unit({ status: 'dirty' })], hostBookings: [booking({ status: 'in' })], hostRecords: [guest({ name: 'שונה' })] };
    const d = diffDb(prev, next);
    for (const [col, id1, id2] of [
      ['hostUnits', 'hu1', 'hu2'],
      ['hostBookings', 'hb1', 'hb2'],
      ['hostRecords', 'hr1', 'hr9'],
    ]) {
      expect(d.sets.some((s) => s.col === col && s.id === id1), col + ' set').toBe(true);
      expect(d.deletes.some((x) => x.col === col && x.id === id2), col + ' delete').toBe(true);
    }
  });

  it('(ט) המיזוג-החי (applyEntityPartial) מרפא מערכים מקוננים וסטטוסים — כמו migrate', () => {
    let db: Db = { ...emptyDb() };
    db = applyEntityPartial(db, 'hostUnits', [{ id: 'hu9', data: { name: 'וילה', status: 'weird' }, deleted: false }]);
    const u = db.hostUnits.find((x) => x.id === 'hu9')!;
    expect(u.subRooms).toEqual([]);
    expect(u.status).toBe('free');
    db = applyEntityPartial(db, 'hostBookings', [{ id: 'hb9', data: { unitId: 'hu9', status: 'gone', checkIn: '2026-10-20', checkOut: '2026-10-22' }, deleted: false }]);
    const b = db.hostBookings.find((x) => x.id === 'hb9')!;
    expect(b.charges).toEqual([]);
    expect(b.payments).toEqual([]);
    expect(b.roomIds).toEqual([]);
    expect(b.status).toBe('pending');
    db = applyEntityPartial(db, 'hostRecords', [{ id: 'hr9', data: { kind: 'meal', mealName: 'בוקר' }, deleted: false }]);
    const m = db.hostRecords.find((x) => x.id === 'hr9') as HostMeal;
    expect(m.items).toEqual([]);
    expect(m.diners).toEqual([]);
    expect(m.seatPlan).toEqual({ people: [], tables: [] });
    expect(m.status).toBe('new');
    // רשומה תקינה מהענן — ביט-זהה אחרי sanitizeIncoming
    const okU = unit({ id: 'hu8' }) as unknown as Record<string, unknown>;
    expect(sanitizeIncoming('hostUnits', okU)).toBe(okU);
    const okB = booking({ id: 'hb8' }) as unknown as Record<string, unknown>;
    expect(sanitizeIncoming('hostBookings', okB)).toBe(okB);
    const okM = meal({ id: 'hr8' }) as unknown as Record<string, unknown>;
    expect(sanitizeIncoming('hostRecords', okM)).toBe(okM);
    // מחיקה מרוחקת מוחלת
    db = applyEntityPartial(db, 'hostBookings', [{ id: 'hb9', data: null, deleted: true }]);
    expect(db.hostBookings.some((x) => x.id === 'hb9')).toBe(false);
  });

  it('(י) סנכרון-סכמה: 30 אוספים · emptyDb · BACKUP-השרת (רשומה בלבד, בלי פריסה) · תוויות שחזור/דמו', () => {
    expect(ENTITY_COLLECTIONS).toHaveLength(30);
    for (const col of HOST_COLLECTIONS) {
      expect(ENTITY_COLLECTIONS).toContain(col);
      expect(emptyDb()[col]).toEqual([]);
      expect(functionsSrc, col + ' חסר ב-BACKUP_COLLECTIONS').toContain("'" + col + "'");
      expect(PURGE_LABELS[col], col + ' בלי תווית בהסרת-הדמו').toBeTruthy();
      expect(backupSectionSrc, col + ' בלי תווית בשחזור').toMatch(new RegExp('\\b' + col + ": '"));
    }
  });

  it('🛡 בידוד (הכרעה 2): המודל לא נוגע בקבלות/תרומות/מונים/לוח-ראשי/חדרי-החוגים', () => {
    for (const kw of ['receiptSeq', 'donationSeq', 'shopReceiptSeq', 'donations', 'upsertEvent', 'OrgEvent']) {
      expect(modelSrc, 'hosting/model.ts מזכיר ' + kw).not.toContain(kw);
    }
    expect(modelSrc).not.toMatch(/\bdb\.events\b|\bevents:\s*\[/);
    expect(modelSrc, 'חדרי-החוגים (db.rooms) — ליחידות יש subRooms').not.toMatch(/\.rooms\b|\brooms:/);
  });
});
