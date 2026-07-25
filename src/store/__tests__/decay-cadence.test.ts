/**
 * רצ'ט — קצב דעיכת מדד-אמינות (פאס-3 של הנחיל). runDecay גזר "פעילות אחרונה"
 * מ-log[0], אך runDecay עצמו מוסיף רשומת דעיכה מתוארכת היום — כך שרשומת הדעיכה
 * נחשבה "פעילות" ומנעה דעיכה נוספת ל-14 יום → הדעיכה איטית פי ~15. הרשומות של
 * הדעיכה עצמה (reason 'דעיכה — חוסר פעילות') אינן פעילות ואסור שיאפסו את השעון.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb, emptyFamily } from '../../types/domain';
import type { Db, Family } from '../../types/domain';

const iso = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const p2 = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
};
const fam = (id: string, over: Partial<Family> = {}): Family => ({
  ...emptyFamily(), id, name: id, createdAt: iso(60), members: [], ...over,
});
const scoreOf = (id: string) => useApp.getState().db.families.find((f) => f.id === id)!.cred.score;

beforeEach(() => useApp.getState().setDb(() => ({ ...emptyDb() }) as Partial<Db>));

describe('🕰️ ratchet — רשומת דעיכה אינה נחשבת "פעילות"', () => {
  it('משפחה ותיקה שהרשומה היחידה שלה היא דעיכה ישנה — עדיין נדעכת', () => {
    // רשומת דעיכה ישנה (לא מהיום) אינה נחשבת "פעילות" ולכן אינה מאפסת את שעון
    // 14 הימים → המשפחה נדעכת שוב. (דעיכה מהיום דווקא כן חוסמת — אידמפוטנטיות.)
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      families: [fam('old', { cred: { score: 700, log: [{ date: iso(20), delta: -2, reason: 'דעיכה — חוסר פעילות' }] } })],
    }) as Partial<Db>);
    useApp.getState().runDecay();
    expect(scoreOf('old')).toBe(698); // הדעיכה הישנה לא "מאפסת את השעון"
  });

  it('פעילות אמיתית מהשבוע כן מונעת דעיכה (לא נשבר)', () => {
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      families: [fam('active', { cred: { score: 700, log: [{ date: iso(3), delta: 5, reason: 'תשלום' }] } })],
    }) as Partial<Db>);
    useApp.getState().runDecay();
    expect(scoreOf('active')).toBe(700);
  });

  it('🔁 ratchet (פאס-5) — runDecay אידמפוטנטי: שתי ריצות ביום = דעיכה אחת', () => {
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      families: [fam('idle', { cred: { score: 700, log: [] } })],
    }) as Partial<Db>);
    useApp.getState().runDecay();
    expect(scoreOf('idle')).toBe(698);
    useApp.getState().runDecay(); // טעינה חוזרת / סנכרון — אסור לדעוך שוב היום
    expect(scoreOf('idle')).toBe(698);
  });
});
