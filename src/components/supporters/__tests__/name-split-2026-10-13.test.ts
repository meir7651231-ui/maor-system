/**
 * ratchet — פיצול שם פרטי/משפחה מרוכז (הכרעת-בעלים 13.10: "כלי שמפצל את כל 16k השמות ומראה לפני שמירה").
 * הבעיה: מנדרים-פלוס השמות בשני סדרים ("כהן ישראל" / "ישראל כהן") ⇒ אין פיצול עיוור.
 * עקרונות: שם-מוכר מכריע ⇒ 'בטוח' · אין הכרעה ⇒ 'ניחוש' לפי הסדר הנפוץ בארגון · גוף/מילה-אחת ⇒ 'דילוג' ·
 * שם-על-הקבלה לא נגע · מי שכבר פוצל לא נגע.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { nameTokens, planNameSplit } from '../nameSplit';
import { emptyDb, type Db, type Supporter } from '../../../types/domain';
import { useApp } from '../../../store/useApp';
import viewSrc from '../SupportersView.tsx?raw';

const one = (name: string) => planNameSplit([{ id: 'x', name }]).rows[0];

describe('🔤 שם בודד', () => {
  it('שני הסדרים מזוהים לפי שם-פרטי מוכר', () => {
    expect(one('ישראל כהן')).toMatchObject({ first: 'ישראל', last: 'כהן', conf: 'sure' });
    expect(one('כהן ישראל')).toMatchObject({ first: 'ישראל', last: 'כהן', conf: 'sure' });
    expect(one('גרינוולד יחיאל')).toMatchObject({ first: 'יחיאל', last: 'גרינוולד', conf: 'sure' });
  });
  it('שם-משפחה מוכר מכריע כשהפרטי לא ברשימה', () => {
    expect(one('שטיינברג אלקנה')).toMatchObject({ first: 'אלקנה', last: 'שטיינברג', conf: 'sure' });
  });
  it('תארים וסיומות יורדים', () => {
    expect(one('הרב יחיאל גרינוולד')).toMatchObject({ first: 'יחיאל', last: 'גרינוולד', conf: 'sure' });
    expect(one('ר׳ משה פרידמן שליט״א')).toMatchObject({ first: 'משה', last: 'פרידמן' });
    expect(one("ר' משה פרידמן")).toMatchObject({ first: 'משה', last: 'פרידמן' });
  });
  it('שמות כפולים: "יוסף חיים כהן" / "כהן יוסף חיים"', () => {
    expect(one('יוסף חיים כהן')).toMatchObject({ first: 'יוסף חיים', last: 'כהן' });
    expect(one('כהן יוסף חיים')).toMatchObject({ first: 'יוסף חיים', last: 'כהן', conf: 'sure' });
  });
  it('מילת-חיבור נדבקת לשם-המשפחה ("בן דוד")', () => {
    expect(nameTokens('משה בן דוד').tokens).toEqual(['משה', 'בן דוד']);
    expect(one('משה בן דוד')).toMatchObject({ first: 'משה', last: 'בן דוד', conf: 'sure' });
  });
  it('🐛 זוג ("יעקב ומרים זילברשטיין") — שני השמות הפרטיים יחד, לא "ומרים זילברשטיין" כמשפחה (נתפס בדפדפן 13.10)', () => {
    expect(one('יעקב ומרים זילברשטיין')).toMatchObject({ first: 'יעקב ומרים', last: 'זילברשטיין', conf: 'sure' });
    expect(one('זילברשטיין יעקב ומרים')).toMatchObject({ first: 'יעקב ומרים', last: 'זילברשטיין', conf: 'sure' });
    expect(one('יעקב ו מרים זילברשטיין')).toMatchObject({ first: 'יעקב ומרים', last: 'זילברשטיין' });
  });
  it('"משפחת X" ⇒ שם משפחה בלבד', () => {
    expect(one('משפחת שטיינברג')).toMatchObject({ first: '', last: 'שטיינברג', conf: 'sure' });
  });
  it('גופים ומילה-אחת ⇒ דילוג', () => {
    expect(one('קרן משפחת שטיינברג').conf).toBe('skip');
    expect(one('עמותת אור החסד').conf).toBe('skip');
    expect(one('אלקטרה בע"מ').conf).toBe('skip');
    expect(one('אנונימי').conf).toBe('skip');
    expect(one('').conf).toBe('skip');
  });
  it('לועזי — פרטי קודם', () => {
    expect(one('Moshe Klein')).toMatchObject({ first: 'Moshe', last: 'Klein', conf: 'sure' });
    expect(one('Shlomo Zalman Auerbach')).toMatchObject({ first: 'Shlomo Zalman', last: 'Auerbach', conf: 'sure' });
  });
  it('אין מילה מוכרת ⇒ ניחוש (לא בטוח)', () => {
    expect(one('פלוני אלמוני').conf).toBe('guess');
  });
});

describe('📊 תוכנית לכל הארגון', () => {
  it('ניחוש מיושר לסדר הנפוץ שנלמד מהבטוחים ("משפחה פרטי")', () => {
    const p = planNameSplit([
      { id: '1', name: 'כהן ישראל' },
      { id: '2', name: 'לוי משה' },
      { id: '3', name: 'פרידמן דוד' },
      { id: '4', name: 'פלוני אלמוני' },
    ]);
    expect(p.majority).toBe('last-first');
    expect(p.rows.find((r) => r.id === '4')).toMatchObject({ first: 'אלמוני', last: 'פלוני', conf: 'guess' });
  });
  it('בלי רוב — ניחוש "פרטי משפחה"', () => {
    const p = planNameSplit([{ id: '4', name: 'פלוני אלמוני' }]);
    expect(p.rows[0]).toMatchObject({ first: 'פלוני', last: 'אלמוני' });
  });
  it('מי שכבר פוצל — לא נכנס לתוכנית, נספר', () => {
    const p = planNameSplit([{ id: '1', name: 'ישראל כהן', lastName: 'כהן' }, { id: '2', name: 'משה לוי' }]);
    expect(p.already).toBe(1);
    expect(p.rows.map((r) => r.id)).toEqual(['2']);
    expect(p.counts).toEqual({ sure: 1, guess: 0, skip: 0 });
  });
  it('ביצועים: 16,000 שמות < 1.5 שניות', () => {
    const names = ['ישראל כהן', 'כהן ישראל', 'הרב משה פרידמן', 'פלוני אלמוני', 'קרן החסד', 'יוסף חיים לוי'];
    const list = Array.from({ length: 16000 }, (_, i) => ({ id: 's' + i, name: names[i % names.length] }));
    const t = performance.now();
    const p = planNameSplit(list);
    expect(performance.now() - t).toBeLessThan(1500);
    expect(p.rows).toHaveLength(16000);
  });
});

describe('💾 store.applyNameSplit — כתיבה אטומית, השם-על-הקבלה לא נגע', () => {
  const sup = (id: string, over: Partial<Supporter> = {}): Supporter =>
    ({ id, name: 'כהן ישראל', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...over }) as unknown as Supporter;
  beforeEach(() => {
    const db: Db = { ...emptyDb(), supporters: [sup('a'), sup('b', { lastName: 'ידני' }), sup('c')] };
    useApp.getState().setDb(() => db);
  });
  it('מעדכן רק מי שלא פוצל; name נשאר; מפתח ריק לא נכתב', () => {
    const n = useApp.getState().applyNameSplit([
      { id: 'a', first: 'ישראל', last: 'כהן' },
      { id: 'b', first: 'X', last: 'Y' },
      { id: 'c', first: '', last: 'כהן' },
    ]);
    expect(n).toBe(2);
    const [a, b, c] = useApp.getState().db.supporters;
    expect(a).toMatchObject({ name: 'כהן ישראל', firstName: 'ישראל', lastName: 'כהן' });
    expect(b.lastName).toBe('ידני');
    expect('firstName' in b).toBe(false);
    expect(c.lastName).toBe('כהן');
    expect('firstName' in c).toBe(false);
  });
});

describe('🛡 חיווט', () => {
  it('בתפריט "עוד" — רק עם הדגל ולמנהל/מנהל-ארגון (canBulkManage, כמו שאר הפעולות-המרובות)', () => {
    expect(viewSrc).toContain("lastNameOn && canBulkManage && { label: '🪪 פיצול שם פרטי / משפחה'");
    expect(viewSrc).toContain('{nameSplitOpen && <NameSplitModal onClose={() => setNameSplitOpen(false)} />}');
  });
});
