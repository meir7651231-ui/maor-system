/**
 * ratchet — trendFactor על עונשים כדגל (P2 פער 32, מימוש הכרעה 1).
 *
 * מקור האמת: legacy-main-script.js:380-391 (credEvent) — הלגאסי מכפיל את מקדם
 * המגמה על **כל** דלתא (applied = Math.round(delta*tf)); ה-React מכפיל רק
 * זיכויים. הכרעת המשתמש #1 (DECISIONS-2026-07-29): דגל
 * families.cred.trendCreditsOnly — חסר/true = React (זיכויים בלבד);
 * false = הלגאסי (גם עונשים). שני המצבים נעולים כאן.
 *
 * מקדם: last3 (בלי רשומות דעיכה) כולן חיוביות ⇒ tf = 0.8 + 0.4·1 = 1.2.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb, emptyFamily, type CredLogEntry, type Db } from '../../types/domain';
import { DEFAULT_CONFIG } from '../../types/config';

const POS_LOG: CredLogEntry[] = [
  { date: '2026-07-28', delta: 5, reason: 'נוכחות (Check-in)' },
  { date: '2026-07-27', delta: 5, reason: 'נוכחות (Check-in)' },
  { date: '2026-07-26', delta: 15, reason: 'פעולה קהילתית' },
];

function seed(): Db {
  return {
    ...emptyDb(),
    families: [{ ...emptyFamily(), id: 'f1', createdAt: '2026-01-01', name: 'כהן', cred: { score: 700, log: POS_LOG } }],
  };
}

function setFlag(v: boolean | undefined) {
  useApp.setState({
    config: { ...DEFAULT_CONFIG, features: v === undefined ? {} : { 'families.cred.trendCreditsOnly': v } },
  });
}

beforeEach(() => {
  useApp.getState().setDb(() => seed());
  setFlag(undefined);
});

describe('📈 ratchet — families.cred.trendCreditsOnly (הכרעה 1)', () => {
  it('דגל חסר (ברירת מחדל=React): זיכוי מוכפל (5→6), עונש עובר כמות שהוא (-20→-20)', () => {
    useApp.getState().addCred('f1', 5, 'נוכחות (Check-in)');
    let f = useApp.getState().db.families[0];
    expect(f.cred.log[0].delta).toBe(6); // 5·1.2
    expect(f.cred.log[0].reason).toContain('מקדם מגמה');
    useApp.getState().setDb(() => seed());
    useApp.getState().addCred('f1', -20, 'No-Show');
    f = useApp.getState().db.families[0];
    expect(f.cred.log[0].delta).toBe(-20);
    expect(f.cred.log[0].reason).not.toContain('מקדם מגמה');
    expect(f.cred.score).toBe(680);
  });

  it('דגל false (תאימות לגאסי): גם עונש מוכפל — ‎-20·1.2 = ‎-24 (legacy:387)', () => {
    setFlag(false);
    useApp.getState().addCred('f1', -20, 'No-Show');
    const f = useApp.getState().db.families[0];
    expect(f.cred.log[0].delta).toBe(-24);
    expect(f.cred.log[0].reason).toContain('מקדם מגמה');
    expect(f.cred.score).toBe(676);
  });

  it('דגל true מפורש = כמו ברירת המחדל (React)', () => {
    setFlag(true);
    useApp.getState().addCred('f1', -20, 'No-Show');
    expect(useApp.getState().db.families[0].cred.log[0].delta).toBe(-20);
  });
});
