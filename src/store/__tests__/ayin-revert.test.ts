/**
 * רצ'ט — revert של מעקב-טיפול (עי"ן) מוחק את אירועי-הלוח של המעברים המבוטלים
 * (פאס-6 של הנחיל). לפני התיקון, ayinRevert רק החזיר את השלב אך השאיר את
 * אירועי-הלוח שנוצרו במעברים — כך נשארו תזכורות יתומות, ו-re-advance יצר
 * אירוע כפול. כאן: revert מוחק את האירועים המבוטלים ושומר את המוקדמים,
 * ו-re-advance מייצר אירוע אחד בלבד.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb, emptyAyin } from '../../types/domain';
import type { Db, Supporter } from '../../types/domain';

const sup = (): Supporter =>
  ({
    id: 'sp1', name: 'כהן', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '',
    notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [],
    ayin: { ...emptyAyin(), stage: 'new', names: [{ id: 'an1', name: 'שם', eyes: '', done: false }] },
  }) as Supporter;

const st = () => useApp.getState();
const events = () => st().db.events;
const ayin = () => st().db.supporters[0].ayin!;

beforeEach(() => {
  st().setDb(() => ({ ...emptyDb(), supporters: [sup()] }) as Partial<Db>);
});

describe('🔁 ratchet — ayinRevert מנקה אירועי-לוח (פאס-6)', () => {
  it('advance→revert→re-advance: אירוע אחד בלבד, בלי יתום/כפילות', () => {
    st().ayinAdvance('sp1'); // new→lead, אירוע A
    expect(events()).toHaveLength(1);
    expect(ayin().stage).toBe('lead');

    st().ayinRevert('sp1', 'new'); // ביטול המעבר → מחיקת האירוע
    expect(events()).toHaveLength(0);
    expect(ayin().stage).toBe('new');

    st().ayinAdvance('sp1'); // שוב new→lead — אירוע יחיד, לא שניים
    expect(events()).toHaveLength(1);
  });

  it('revert לאמצע השרשרת מוחק רק את המעברים שבוטלו ושומר את המוקדמים', () => {
    st().ayinAdvance('sp1'); // new→lead (אירוע A, key new)
    st().ayinAdvance('sp1'); // lead→eyes (אירוע B, key lead)
    expect(events()).toHaveLength(2);
    expect(ayin().stage).toBe('eyes');

    st().ayinRevert('sp1', 'lead'); // חוזר ל-lead → מוחק את B, שומר את A
    expect(events()).toHaveLength(1);
    expect(ayin().stage).toBe('lead');

    st().ayinAdvance('sp1'); // lead→eyes שוב — אירוע יחיד חדש (סה"כ 2, לא 3)
    expect(events()).toHaveLength(2);
  });
});
