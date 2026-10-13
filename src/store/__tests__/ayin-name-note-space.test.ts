/**
 * 🐛 ratchet — הערת-שם במעקב-הטיפול (ayinSetNameNote) לא בולעת רווח.
 *
 * באג-שטח (בקשת-בעלים 30.8): "יש באג בהערות של מעקב טיפול שאי אפשר לעשות רווח".
 * השדה controlled (value={n.note}), וה-setter עשה `note.trim()` בכל תו — רווח-סופי
 * נחתך מיד ⇒ אי-אפשר להקליד רווח (בין-מילים ובסוף). התיקון: שומרים raw; רק
 * ריק/רווחים-בלבד ⇒ undefined. שדה זה משותף ל-AyinCard ול-DialerModal.
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
const note0 = () => st().db.supporters[0].ayin!.names[0].note;

beforeEach(() => {
  st().setDb(() => ({ ...emptyDb(), supporters: [sup()] }) as Partial<Db>);
});

describe('🐛 ratchet — ayinSetNameNote שומר רווחים (בלי trim-חי)', () => {
  it('רווח-סופי נשמר (הקלדה תוך-כדי) — לא נחתך', () => {
    st().ayinSetNameNote('sp1', 'an1', 'אבא ');
    expect(note0()).toBe('אבא '); // הרווח הסופי שרד ⇒ אפשר להמשיך למילה הבאה
  });

  it('רווח בין-מילים נשמר', () => {
    st().ayinSetNameNote('sp1', 'an1', 'אבא של יוסי');
    expect(note0()).toBe('אבא של יוסי');
  });

  it('ריק/רווחים-בלבד ⇒ undefined (ניקוי-שדה נשמר)', () => {
    st().ayinSetNameNote('sp1', 'an1', 'טקסט');
    expect(note0()).toBe('טקסט');
    st().ayinSetNameNote('sp1', 'an1', '   ');
    expect(note0()).toBeUndefined();
    st().ayinSetNameNote('sp1', 'an1', '');
    expect(note0()).toBeUndefined();
  });
});
