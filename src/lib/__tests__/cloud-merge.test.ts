/**
 * מיזוג צד-הקבלה של סנכרון הענן (applyEntityPartial/applyMetaPartial) — הלוגיקה
 * הרגישה ביותר, שקודם לא הייתה מכוסה כלל. בלי דליפה, בלי כפילות, בלי קריסה על
 * מסמך מרוחק פגום, ו-seq לעולם לא קטן.
 */
import { describe, expect, it } from 'vitest';
import { applyEntityPartial, applyMetaPartial } from '../cloud-merge';
import { allMembers } from '../../store/useApp';
import { emptyDb } from '../../types/domain';
import type { Db } from '../../types/domain';

const fam = (id: string, name: string, members: unknown[] = []) => ({ id, name, members }) as never;

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
    const next = applyEntityPartial(db, 'families', [{ id: 'f1', data: { id: 'f1', name: 'כהן', members: [] }, deleted: false }]);
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
