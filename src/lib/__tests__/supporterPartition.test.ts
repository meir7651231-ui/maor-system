/**
 * ratchet — אכיפת-הרשאה בשכבת-הנתונים · פאזה-1 (פירוק-תומכים, טהור).
 * המנוע מקביל ל-donationPartition: skey=forWho (ריק=משותף), ערכי-שאילתה ≤30,
 * וקילוף-skey מגוף-מסמך. האינווריאנט: כשהאכיפה כבויה אין נגיעה — נבדק בפאזה-2.
 */
import { describe, expect, it } from 'vitest';
import type { Supporter } from '../../types/domain';
import { SHARED_SUP_KEY, docSkey, supAllowedKeys, supKeyMapOf, supKeyOf, stripSupKey } from '../supporterPartition';

describe('supKeyOf — מפתח-הפירוק פר-תורם (forWho)', () => {
  it('forWho קיים ⇒ הערך המנוקה', () => {
    expect(supKeyOf({ forWho: 'חתונות' })).toBe('חתונות');
    expect(supKeyOf({ forWho: '  קמחא דפסחא  ' })).toBe('קמחא דפסחא');
  });
  it('forWho ריק/רווחים/חסר ⇒ משותף', () => {
    expect(supKeyOf({ forWho: '' })).toBe(SHARED_SUP_KEY);
    expect(supKeyOf({ forWho: '   ' })).toBe(SHARED_SUP_KEY);
    expect(supKeyOf({} as Pick<Supporter, 'forWho'>)).toBe(SHARED_SUP_KEY);
  });
});

describe('supAllowedKeys — ערכי-שאילתה לעובד/ת מוגבל/ת', () => {
  it('הייעודים המותרים + המשותף, מנוקים ומדודפים', () => {
    expect(supAllowedKeys(['חתונות', 'כללי'])).toEqual(['חתונות', 'כללי', SHARED_SUP_KEY]);
    expect(supAllowedKeys([' א ', 'א', ''])).toEqual(['א', SHARED_SUP_KEY]);
  });
  it('חסום ל-30 (29 ייעודים + המשותף) — מגבלת Firestore in', () => {
    const many = Array.from({ length: 40 }, (_, i) => 'p' + i);
    const keys = supAllowedKeys(many);
    expect(keys.length).toBe(30);
    expect(keys[29]).toBe(SHARED_SUP_KEY);
    expect(keys.slice(0, 29)).toEqual(many.slice(0, 29));
  });
});

describe('docSkey — מפתח פר-אוסף (תומכים/אירועים)', () => {
  const map = supKeyMapOf([
    { id: 'sp1', forWho: 'חתונות' },
    { id: 'sp2', forWho: '' },
  ]);
  it('supporters ⇒ forWho של המסמך עצמו', () => {
    expect(docSkey('supporters', { forWho: 'קמחא' }, map)).toBe('קמחא');
    expect(docSkey('supporters', { forWho: '' }, map)).toBe(SHARED_SUP_KEY);
  });
  it('events מקושר-תומך ⇒ מפתח-התומך; ללא-קישור/תומך-משותף ⇒ משותף', () => {
    expect(docSkey('events', { spId: 'sp1' }, map)).toBe('חתונות'); // תומך-חתונות
    expect(docSkey('events', { spId: 'sp2' }, map)).toBe(SHARED_SUP_KEY); // תומך בלי ייעוד
    expect(docSkey('events', { spId: 'ghost' }, map)).toBe(SHARED_SUP_KEY); // תומך לא-קיים
    expect(docSkey('events', {}, map)).toBe(SHARED_SUP_KEY); // אירוע כללי (בלי spId)
  });
  it('אוסף לא-נאכף ⇒ מחרוזת-ריקה (בלי הזרקת skey)', () => {
    expect(docSkey('families', { forWho: 'x' }, map)).toBe('');
  });
});

describe('stripSupKey — קילוף skey מגוף-מסמך שנמשך', () => {
  it('מסיר את skey ומשאיר את השאר ביט-זהה', () => {
    expect(stripSupKey({ skey: 'חתונות', id: 'sp1', name: 'כהן' })).toEqual({ id: 'sp1', name: 'כהן' });
  });
  it('בלי skey ⇒ אותו אובייקט (אין נגיעה)', () => {
    const d = { id: 'sp1', name: 'כהן' };
    expect(stripSupKey(d)).toBe(d);
  });
});
