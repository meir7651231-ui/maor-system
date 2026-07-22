/**
 * דעיכת מדד-אמינות (runDecay) ותוספת/גריעה (addCred) — מצבי קצה דרך ה-store:
 * משפחה חדשה לא נדעכת, משפחה ותיקה ולא-פעילה כן, ציון תחום ב-[0,1000],
 * ומקדם המגמה מוחל על זיכויים בלבד.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb, emptyFamily } from '../../types/domain';
import type { Db, Family } from '../../types/domain';

const db = () => useApp.getState().db;
const iso = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const p2 = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
};

function fam(id: string, over: Partial<Family> = {}): Family {
  return { ...emptyFamily(), id, name: id, createdAt: iso(0), members: [], ...over };
}
function seed(...families: Family[]) {
  useApp.getState().setDb(() => ({ ...emptyDb(), families }) as Partial<Db>);
}
const scoreOf = (id: string) => db().families.find((f) => f.id === id)!.cred.score;

beforeEach(() => seed());

describe('🕰️ runDecay — מצבי קצה', () => {
  it('משפחה שהצטרפה היום אינה נדעכת (באג ה-log הריק)', () => {
    seed(fam('new', { createdAt: iso(0), cred: { score: 700, log: [] } }));
    useApp.getState().runDecay();
    expect(scoreOf('new')).toBe(700);
  });

  it('משפחה ותיקה בלי פעילות 14+ ימים — נדעכת ב-2', () => {
    seed(fam('old', { createdAt: iso(60), cred: { score: 700, log: [] } }));
    useApp.getState().runDecay();
    expect(scoreOf('old')).toBe(698);
  });

  it('משפחה עם פעילות לאחרונה (log מהשבוע) — לא נדעכת', () => {
    seed(fam('active', { createdAt: iso(60), cred: { score: 650, log: [{ date: iso(3), delta: 5, reason: 'תשלום' }] } }));
    useApp.getState().runDecay();
    expect(scoreOf('active')).toBe(650);
  });

  it('ציון 0 לא יורד מתחת ל-0', () => {
    seed(fam('zero', { createdAt: iso(60), cred: { score: 0, log: [] } }));
    useApp.getState().runDecay();
    expect(scoreOf('zero')).toBe(0);
  });
});

describe('➕ addCred — חסמים ומקדם מגמה', () => {
  it('ציון לא עולה מעל 1000', () => {
    seed(fam('f1', { cred: { score: 990, log: [] } }));
    useApp.getState().addCred('f1', 100, 'בונוס');
    expect(scoreOf('f1')).toBeLessThanOrEqual(1000);
  });

  it('ציון לא יורד מתחת ל-0', () => {
    seed(fam('f1', { cred: { score: 10, log: [] } }));
    useApp.getState().addCred('f1', -100, 'קנס');
    expect(scoreOf('f1')).toBe(0);
  });

  it('גריעה (delta<0) אינה מושפעת ממקדם המגמה', () => {
    seed(fam('f1', { cred: { score: 500, log: [{ date: iso(1), delta: 5, reason: 'x' }] } }));
    useApp.getState().addCred('f1', -50, 'קנס');
    expect(scoreOf('f1')).toBe(450); // בדיוק -50, בלי מקדם
  });
});
