/**
 * מיזוג צד-הקבלה של סנכרון הענן (applyEntityPartial/applyMetaPartial) — הלוגיקה
 * הרגישה ביותר, שקודם לא הייתה מכוסה כלל. בלי דליפה, בלי כפילות, בלי קריסה על
 * מסמך מרוחק פגום, ו-seq לעולם לא קטן.
 */
import { describe, expect, it } from 'vitest';
import { applyEntityPartial, applyMetaPartial, mergeDonationsPreserving } from '../cloud-merge';
import { allMembers } from '../../store/useApp';
import { emptyDb } from '../../types/domain';
import type { Db } from '../../types/domain';

// משפחה אמיתית תמיד נושאת מערך docs + status + cred (migrate מבטיח זאת), ולכן גם
// sanitizeIncoming/healRecord מוסיפים אותם (ביקורת-עומק 2.9: משפחה בלי status/cred
// מהענן הקריסה את כל האפליקציה) — הסטאב חייב לשקף זאת כדי שבדיקת ה-no-op
// (echo-loop) תישאר תקפה.
const fam = (id: string, name: string, members: unknown[] = []) =>
  ({ id, name, members, docs: [], status: 'active', cred: { score: 700, log: [] } }) as never;

describe('applyEntityPartial', () => {
  it('הוספה מרוחקת → נכנס, בלי לגעת בקיים', () => {
    const db: Db = { ...emptyDb(), families: [fam('f1', 'כהן')] };
    const next = applyEntityPartial(db, 'families', [{ id: 'f2', data: { name: 'לוי', members: [] }, deleted: false }]);
    expect(next.families.map((f) => f.id).sort()).toEqual(['f1', 'f2']);
  });

  it('עדכון מרוחק → מוחלף במקום, בלי כפילות', () => {
    const db: Db = { ...emptyDb(), families: [fam('f1', 'כהן')] };
    const next = applyEntityPartial(db, 'families', [{ id: 'f1', data: { name: 'כהן-מעודכן', members: [] }, deleted: false }]);
    expect(next.families.length).toBe(1);
    expect(next.families[0].name).toBe('כהן-מעודכן');
  });

  it('מחיקה מרוחקת → יוצא', () => {
    const db: Db = { ...emptyDb(), families: [fam('f1', 'כהן'), fam('f2', 'לוי')] };
    const next = applyEntityPartial(db, 'families', [{ id: 'f1', data: null, deleted: true }]);
    expect(next.families.map((f) => f.id)).toEqual(['f2']);
  });

  it('מסמך זהה → אותו object (no-op, מונע לולאת הד)', () => {
    const db: Db = { ...emptyDb(), families: [fam('f1', 'כהן')] };
    // גוף המסמך ב-Firestore כולל id (pushDiff כותב את הישות המלאה) — כמו בפרודקשן
    const next = applyEntityPartial(db, 'families', [{ id: 'f1', data: { id: 'f1', name: 'כהן', members: [], docs: [], status: 'active', cred: { score: 700, log: [] } }, deleted: false }]);
    expect(next).toBe(db);
  });

  it('אוסף לא מוכר → ללא שינוי', () => {
    const db: Db = { ...emptyDb(), families: [fam('f1', 'כהן')] };
    expect(applyEntityPartial(db, 'not_a_collection', [{ id: 'x', data: {}, deleted: false }])).toBe(db);
  });

  it('🛡️ מסמך משפחה מרוחק בלי members → לא קורס; allMembers עובד', () => {
    const db: Db = { ...emptyDb(), families: [] };
    // מסמך פגום (גרסה ישנה / עריכה ידנית ב-Firestore) — בלי members כלל
    const next = applyEntityPartial(db, 'families', [{ id: 'f1', data: { name: 'כהן' }, deleted: false }]);
    expect(Array.isArray(next.families[0].members)).toBe(true);
    expect(() => allMembers(next)).not.toThrow();
    expect(allMembers(next)).toEqual([]);
  });
});

// ── פריט ח' (19.8): מיזוג-תרומות חסין-אובדן — תרומה מקומית לא נדרסת בסנכרון ──
const don = (rid: string, amount: number) => ({ rid, date: '2026-08-18', amount, cur: '₪', cat: '' });
const sup = (id: string, donations: unknown[], extra: Record<string, unknown> = {}) =>
  ({ id, name: 'תורם ' + id, donations, ...extra }) as never;

describe('mergeDonationsPreserving — פריט ח (חסין-אובדן תרומות)', () => {
  it('תרומה מקומית-בלבד נשמרת כשהענן מביא גרסה ישנה', () => {
    const local = { id: 's1', donations: [don('D-1', 100), don('D-2', 50)] };
    const incoming = { id: 's1', donations: [don('D-1', 100)] }; // ישן — חסר D-2
    const m = mergeDonationsPreserving('supporters', local, incoming);
    expect((m.donations as Array<{ rid: string }>).map((d) => d.rid).sort()).toEqual(['D-1', 'D-2']);
  });

  it('אותו rid שנערך בענן → הענן מנצח (סכום מהמרוחק)', () => {
    const local = { id: 's1', donations: [don('D-1', 100)] };
    const incoming = { id: 's1', donations: [don('D-1', 180)] }; // עריכה בענן
    const m = mergeDonationsPreserving('supporters', local, incoming);
    const d1 = (m.donations as Array<{ rid: string; amount: number }>).find((d) => d.rid === 'D-1');
    expect(d1?.amount).toBe(180);
    expect((m.donations as unknown[]).length).toBe(1);
  });

  it('מונים לא-יורדים (max) גם כשהמרוחק נמוך', () => {
    const local = { id: 's1', donations: [], count: 5, ils: 900, usd: 3 };
    const incoming = { id: 's1', donations: [], count: 3, ils: 400, usd: 0 };
    const m = mergeDonationsPreserving('supporters', local, incoming);
    expect(m.count).toBe(5);
    expect(m.ils).toBe(900);
    expect(m.usd).toBe(3);
  });

  it('אוסף שאינו supporters → המסמך המרוחק כמות-שהוא', () => {
    const local = { id: 'f1', members: [{ id: 'm1' }] };
    const incoming = { id: 'f1', members: [] };
    expect(mergeDonationsPreserving('families', local, incoming)).toBe(incoming);
  });

  it('זהה לחלוטין → אין שינוי (מחזיר את המרוחק, no-op)', () => {
    const local = { id: 's1', donations: [don('D-1', 100)], count: 1, ils: 100, usd: 0 };
    const incoming = { id: 's1', donations: [don('D-1', 100)], count: 1, ils: 100, usd: 0 };
    expect(mergeDonationsPreserving('supporters', local, incoming)).toBe(incoming);
  });

  it('applyEntityPartial משמר תרומה מקומית בעדכון-תומך מרוחק', () => {
    const db: Db = { ...emptyDb(), supporters: [sup('s1', [don('D-1', 100), don('D-2', 50)])] };
    const next = applyEntityPartial(db, 'supporters', [
      { id: 's1', data: { id: 's1', name: 'תורם s1', donations: [don('D-1', 100)] }, deleted: false },
    ]);
    const rids = (next.supporters[0].donations as Array<{ rid: string }>).map((d) => d.rid).sort();
    expect(rids).toEqual(['D-1', 'D-2']); // D-2 המקומית לא אבדה
  });
});

describe('applyMetaPartial', () => {
  it('seq לעולם לא קטן (מונע התנגשות מזהים)', () => {
    const db: Db = { ...emptyDb(), seq: 100 };
    expect(applyMetaPartial(db, { seq: 50 }).seq).toBe(100); // מרוחק נמוך → נשמר הגבוה
    expect(applyMetaPartial(db, { seq: 200 }).seq).toBe(200); // מרוחק גבוה → מתעדכן
  });

  it('שדה meta מרוחק מוחל (orgGoal)', () => {
    const db: Db = { ...emptyDb(), orgGoal: 0 };
    expect(applyMetaPartial(db, { orgGoal: 50000 }).orgGoal).toBe(50000);
  });

  it('אין שינוי → אותו object', () => {
    const db: Db = { ...emptyDb() };
    expect(applyMetaPartial(db, { orgName: db.orgName, seq: db.seq })).toBe(db);
  });
});
