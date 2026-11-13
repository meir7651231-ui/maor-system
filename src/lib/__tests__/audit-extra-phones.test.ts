/**
 * ratchet (לילה 13.11.2026) — בדיקת-התקינות מכירה את **כל** הטלפונים של המשפחה.
 *
 * 🐛 הבאג: ב-13.10 נוספו "טלפונים נוספים" למשפחות (`Family.phones[]`), אך `runAudit`
 * המשיך לבדוק רק phone/phone2. שלוש תוצאות:
 *   1. התרעת-שווא "אין שום פרט קשר" למשפחה שהטלפון היחיד שלה שמור כנוסף.
 *   2. טלפון משותף לשתי משפחות לא זוהה ככפילות כשהוא יושב ב-phones[]
 *      (בדיוק המקום שאליו מיזוג-כפולים מעביר מספרים עודפים).
 *   3. מספר-נוסף שגוי (קצר/חסר 0) לא דווח.
 * מספר בינ"ל מפורש (+… / 00…) בנוספים **לא** מדווח — phoneIssue מכיר רק תבנית ישראלית.
 */
import { describe, expect, it } from 'vitest';
import { runAudit } from '../audit';
import { emptyDb, emptyFamily } from '../../types/domain';
import type { Db, Family } from '../../types/domain';

const fam = (over: Partial<Omit<Family, 'createdAt' | 'id'>> & { id: string }): Family => ({
  ...emptyFamily(), createdAt: '2020-01-01', city: 'בני ברק', address: 'רח 1', ...over,
});
const db = (families: Family[]): Db => ({ ...emptyDb(), families });
const titles = (d: Db, cat: string) => runAudit(d).filter((i) => i.cat === cat).map((i) => i.title);

describe('📞 בדיקת-תקינות · טלפונים-נוספים (phones[])', () => {
  it('טלפון יחיד ב-phones[] ⇒ אין התרעת "אין שום פרט קשר"', () => {
    const d = db([fam({ id: 'a', name: 'כהן', phone: '', phone2: '', phones: [{ id: 'p', num: '050-1234567' }] })]);
    expect(titles(d, 'קשר')).toEqual([]);
  });

  it('באמת בלי שום טלפון/מייל ⇒ ההתרעה נשארת', () => {
    const d = db([fam({ id: 'a', name: 'כהן', phone: '', phone2: '', phones: [{ id: 'p', num: '  ' }] })]);
    expect(titles(d, 'קשר')).toHaveLength(1);
  });

  it('טלפון משותף דרך phones[] מזוהה ככפילות', () => {
    const d = db([
      fam({ id: 'a', name: 'לוי', phone: '050-9999999' }),
      fam({ id: 'b', name: 'מזרחי', phone: '052-1111111', phones: [{ id: 'p', num: '050 999 9999', label: 'עבודה' }] }),
    ]);
    const dup = titles(d, 'כפילות').filter((t) => t.includes('טלפון'));
    expect(dup).toHaveLength(1);
    expect(dup[0]).toContain('0509999999');
  });

  it('אותו מספר פעמיים באותה משפחה (ראשי + נוסף) ⇒ לא כפילות', () => {
    const d = db([fam({ id: 'a', name: 'לוי', phone: '050-9999999', phones: [{ id: 'p', num: '0509999999' }] })]);
    expect(titles(d, 'כפילות')).toEqual([]);
  });

  it('מספר-נוסף שגוי מדווח; בינ"ל מפורש (+/00) לא', () => {
    const d = db([
      fam({
        id: 'a', name: 'כהן', phone: '050-1234567',
        phones: [
          { id: 'p1', num: '12345' },
          { id: 'p2', num: '+1 718 555 0100', note: 'הבן בחו"ל' },
          { id: 'p3', num: '0044 20 7946 0958' },
        ],
      }),
    ]);
    const t = titles(d, 'טלפון');
    expect(t).toHaveLength(1);
    expect(t[0]).toMatch(/קצר מדי: 12345/);
  });

  it('בלי phones[] ⇒ תוצאה זהה לרשומה עם phones ריק/פגום (אפס-רגרסיה)', () => {
    const base = { id: 'a', name: 'כהן', phone: '52123456', phone2: '050-7654321' };
    const plain = runAudit(db([fam(base)]));
    expect(runAudit(db([fam({ ...base, phones: [] })]))).toEqual(plain);
    expect(runAudit(db([fam({ ...base, phones: 'garbage' as unknown as Family['phones'] })]))).toEqual(plain);
    expect(plain.filter((i) => i.cat === 'טלפון')).toHaveLength(1);
  });
});
