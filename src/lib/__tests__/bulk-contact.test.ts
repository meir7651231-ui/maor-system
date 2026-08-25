/**
 * ratchet · שליחה-מרובה (bulkContact) — מגן על חוזה-הדדופ:
 * - מייל מנורמל (lower+trim); כפולים מקוזזים; ריקים/בלי @ מסוננים.
 * - וואטסאפ ‏מדודדף לפי-‏waDigits; טלפון לא-תקין ל-wa.me = מסונן (לא מתפוצץ).
 * שני-כרטיסים-אותו-מייל/טלפון = **נמען אחד** (המזכירה שולחת פעם-אחת).
 */
import { describe, it, expect } from 'vitest';
import { bulkMailRecipients, bulkWaRecipients, normEmail } from '../bulkContact';

describe('bulkContact · normEmail', () => {
  it('lower + trim', () => {
    expect(normEmail(' Foo@Bar.com ')).toBe('foo@bar.com');
    expect(normEmail('')).toBe('');
  });
});

describe('bulkContact · bulkMailRecipients', () => {
  it('מסנן כתובות ריקות/בלי @', () => {
    const rows = bulkMailRecipients([
      { id: 'a', name: 'א', email: '' },
      { id: 'b', name: 'ב', email: 'bad-address' },
      { id: 'c', name: 'ג', email: 'ok@x.com' },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('c');
  });

  it('דדופ לפי-כתובת מנורמלת (case+trim)', () => {
    const rows = bulkMailRecipients([
      { id: 'a', name: 'א', email: 'foo@bar.com' },
      { id: 'b', name: 'ב', email: 'FOO@bar.com' },
      { id: 'c', name: 'ג', email: ' foo@bar.com ' },
      { id: 'd', name: 'ד', email: 'other@bar.com' },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].id).toBe('a'); // הראשון גובר
    expect(rows[1].id).toBe('d');
  });

  it('משדר את הכתובת-המקורית (טרים) — לא את המנורמלת', () => {
    const rows = bulkMailRecipients([{ id: 'a', name: 'א', email: '  Foo@Bar.COM  ' }]);
    expect(rows[0].email).toBe('Foo@Bar.COM');
  });

  it('שדה email חסר לחלוטין ⇒ מסונן', () => {
    const rows = bulkMailRecipients([{ id: 'a', name: 'א' }]);
    expect(rows).toHaveLength(0);
  });
});

describe('bulkContact · bulkWaRecipients', () => {
  it('מסנן טלפונים לא-תקינים', () => {
    const rows = bulkWaRecipients([
      { id: 'a', name: 'א', phone: '' },
      { id: 'b', name: 'ב', phone: 'not-a-phone' },
      { id: 'c', name: 'ג', phone: '050-1234567' },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('c');
    expect(rows[0].digits).toBe('972501234567');
  });

  it('דדופ לפי-ספרות (‏972…)', () => {
    // כל השלושה מנרמלים לאותם ספרות 972501234567
    const rows = bulkWaRecipients([
      { id: 'a', name: 'א', phone: '050-1234567' },
      { id: 'b', name: 'ב', phone: '972501234567' },
      { id: 'c', name: 'ג', phone: '+972-50-1234567' },
      { id: 'd', name: 'ד', phone: '054-9876543' },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].id).toBe('a'); // הראשון גובר
    expect(rows[1].id).toBe('d');
  });

  it('שדה phone חסר ⇒ מסונן', () => {
    const rows = bulkWaRecipients([{ id: 'a', name: 'א' }]);
    expect(rows).toHaveLength(0);
  });
});

describe('bulkContact · ratchet-חוזה', () => {
  it('אפס-נמענים ⇒ מערך-ריק (לא throw)', () => {
    expect(bulkMailRecipients([])).toEqual([]);
    expect(bulkWaRecipients([])).toEqual([]);
  });
});
