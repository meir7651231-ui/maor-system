/**
 * ratchet — זיהוי-טלפון: כל ההתאמות, על כל הטלפונים, עם הסוג (בקשת-בעלים 13.10:
 * "זיהוי טלפון מי זה — תורמים או במשפחות", "וגם יגיד מי זה תורם או משפחה").
 *
 * 🐛 1: findCaller עצר בהתאמה הראשונה — מספר של משפחה *וגם* של תורם הציג רק את המשפחה.
 * 🐛 2: תורם הותאם רק על s.phone — מספר מ-phones[] (וואטסאפ/בית/עבודה) לא זוהה.
 * 🐛 3: מספר מ-phones[] של משפחה (הנוספים, 13.10) — לא זוהה.
 */
import { describe, expect, it } from 'vitest';
import { findCaller, findCallers } from '../callerId';
import { emptyDb, type Db, type Family, type Supporter } from '../../types/domain';
import src from '../../components/CallerLookup.tsx?raw';

function db(families: Partial<Family>[], supporters: Partial<Supporter>[]): Db {
  const d = emptyDb();
  d.families = families.map((f) => ({ members: [], phone: '', phone2: '', ...f }) as Family);
  d.supporters = supporters.map((s) => ({ phone: '', donations: [], ...s }) as Supporter);
  return d;
}

describe('📞 findCallers — כל מי שהמספר שייך לו', () => {
  it('משפחה וגם תורם על אותו מספר ⇒ שניהם, משפחה ראשונה, עם הסוג', () => {
    const r = findCallers(db([{ id: 'f1', name: 'כהן', phone: '050-1234567' }], [{ id: 's1', name: 'ישראל כהן', phone: '050-1234567' }]), '0501234567');
    expect(r.map((c) => [c.kind, c.id])).toEqual([['family', 'f1'], ['supporter', 's1']]);
  });

  it('מספר מ-phones[] של תורם ⇒ מזוהה, עם התווית וה"ממי זה"', () => {
    const r = findCallers(db([], [{ id: 's1', name: 'לוי', phone: '052-0000001', phones: [{ id: 'p', num: '054-7777777', label: 'עבודה', note: 'של הבן' }] }]), '+972547777777');
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ kind: 'supporter', id: 's1', phone: '054-7777777', phoneNote: 'עבודה · של הבן' });
  });

  it('מספר מ-phones[] של משפחה ⇒ מזוהה', () => {
    const r = findCallers(db([{ id: 'f1', name: 'אברהם', phones: [{ id: 'p', num: '053-5555555', label: 'סבתא' }] }], []), '053-5555555');
    expect(r[0]).toMatchObject({ kind: 'family', id: 'f1', phone: '053-5555555', phoneNote: 'סבתא' });
  });

  it('אותה ישות פעם אחת גם כשהמספר מופיע אצלה פעמיים', () => {
    const r = findCallers(db([], [{ id: 's1', name: 'א', phone: '050-1111111', phones: [{ id: 'p', num: '+972501111111' }] }]), '0501111111');
    expect(r).toHaveLength(1);
    expect(r[0].phoneNote).toBeUndefined(); // התאמה על הראשי ⇒ בלי הערת-מספר-נוסף
  });

  it('מספר קצר/לא-מוכר ⇒ ריק', () => {
    expect(findCallers(db([{ id: 'f1', name: 'א', phone: '050-1234567' }], []), '123')).toEqual([]);
    expect(findCallers(db([{ id: 'f1', name: 'א', phone: '050-1234567' }], []), '058-9999999')).toEqual([]);
  });
});

describe('🛡 חוזה היסטורי — findCaller = הראשון בעדיפות', () => {
  it('משפחה קודמת לתורם (כמו תמיד)', () => {
    const c = findCaller(db([{ id: 'f1', name: 'כהן', phone: '050-1234567' }], [{ id: 's1', name: 'כפול', phone: '050-1234567' }]), '050-1234567');
    expect(c?.kind).toBe('family');
  });
});

describe('🛡 הגנת-מקור — כרטיס-השיחה מציג את כל ההתאמות', () => {
  it('משתמש ב-findCallers ומציג "המספר שייך גם ל:" עם הסוג לכל אחד', () => {
    expect(src).toContain('findCallers(db, num)');
    expect(src).toContain('המספר שייך גם ל:');
    expect(src).toContain('callerKindLabel(config, c.kind)');
  });
});
